import { joinRoom, type Room, type MessageAction } from "trystero/nostr";
import useAuth from "../../auth/store/authStore.ts";
import {
  saveMessage,
  markMessageDelivered,
  getPendingOutboxMessages,
  type Message,
} from "../../../services/storage/messages.ts";
import {
  getContact,
  updateContactStatus,
} from "../../../services/storage/contacts.ts";
import { computeDirectRoomId } from "../../../services/storage/rooms.ts";
import { myRoomManager } from "../../engine/myRoom/myRoomManager.ts";
import { useConnectionStore } from "../../engine/store/connectionStore.ts";
import {
  createSignedHandshake,
  verifySignedHandshake,
} from "../../engine/myRoom/handshake.ts";
import { verifyDeviceCertificate } from "../../../services/crypto/device.ts";
import type {
  SignedHandshake,
  ChatMessagePayload,
  ChatMessageAck,
  ConnectionProposal,
  ConnectionProposalAck,
} from "../../engine/types.ts";

class MessageManager {
  private activeRooms = new Map<string, Room>();
  private activeChatActions = new Map<string, MessageAction<string>>();

  constructor() {
    // Automatically flush pending messages whenever a peer connects to our personal inbox
    myRoomManager.onPeerConnect((peerAccountId) => {
      void this.flushPendingForPeer(peerAccountId);
    });
  }

  /**
   * Connects to a peer's public room (Room(peerAccountId)) to establish
   * a direct, long-lived WebRTC link for this chat session.
   */
  public async connectToPeer(peerAccountId: string): Promise<Room | null> {
    const normPeer = peerAccountId.trim().toLowerCase();

    // Fast path: if already connected via WebRTC, reuse it
    if (useConnectionStore.getState().isPeerOnline(normPeer)) {
      return this.activeRooms.get(normPeer) ?? null;
    }

    if (this.activeRooms.has(normPeer)) {
      return this.activeRooms.get(normPeer)!;
    }

    const auth = useAuth.getState();
    const { device } = auth;
    const keys = auth.getDeviceKeys();

    if (!device || !keys?.signingPrivateKey) {
      console.warn("[MessageManager] Cannot connect: device not ready");
      return null;
    }

    try {
      const room = joinRoom({ appId: "murmur-app" }, normPeer);
      this.activeRooms.set(normPeer, room);

      const handshakeAction = room.makeAction<string>("device-handshake");
      const proposalAction = room.makeAction<string>("connection-proposal");
      const proposalAckAction = room.makeAction<string>(
        "connection-proposal-ack",
      );
      const chatAction = room.makeAction<string>("chat-message");
      const chatAckAction = room.makeAction<string>("chat-ack");

      this.activeChatActions.set(normPeer, chatAction);

      const handshakedPeers = new Set<string>();

      const sendLocalHandshake = (peerId: string) => {
        try {
          const signed = createSignedHandshake({
            device,
            targetAccountId: normPeer,
            signingPrivateKey: keys.signingPrivateKey,
          });
          void handshakeAction.send(JSON.stringify(signed), { target: peerId });
          handshakedPeers.add(peerId);
        } catch (err) {
          console.error(`[MessageManager] Handshake error to ${peerId}:`, err);
        }
      };

      // 1. On peer discovered in their room, dispatch our certified handshake
      room.onPeerJoin = (trysteroPeerId: string) => {
        sendLocalHandshake(trysteroPeerId);
      };

      // Also handshake any peer that may already be connected
      for (const peerId of Object.keys(room.getPeers())) {
        sendLocalHandshake(peerId);
      }

      // 2. Verify handshake from host
      handshakeAction.onMessage = async (rawMessage: string, context) => {
        const trysteroPeerId = context.peerId;

        try {
          const incomingData: unknown = JSON.parse(rawMessage);
          const verification = verifySignedHandshake({
            signedHandshake: incomingData,
            expectedTargetAccountId: normPeer,
          });

          if (!verification.isValid) {
            console.warn(
              `[MessageManager] Rejected peer ${trysteroPeerId}: ${verification.reason}`,
            );
            return;
          }

          const peerDevice = (incomingData as SignedHandshake).payload.device;

          // Star topology rule: in Bob's room, we only talk to Bob!
          if (peerDevice.accountId.toLowerCase() !== normPeer) {
            console.warn(
              `[MessageManager] Ignored non-host peer ${peerDevice.accountId} in room ${normPeer}`,
            );
            return;
          }

          if (!verifyDeviceCertificate(peerDevice)) {
            console.warn(
              `[MessageManager] Peer device certificate invalid: ${peerDevice.deviceId}`,
            );
            return;
          }

          if (!handshakedPeers.has(trysteroPeerId)) {
            sendLocalHandshake(trysteroPeerId);
          }

          console.log(`[MessageManager] ✅ Connected to peer: ${normPeer}`);

          // Register in global active connection store -> turns badge GREEN (P2P Live)!
          useConnectionStore.getState().registerPeerConnection({
            deviceId: peerDevice.deviceId,
            accountId: peerDevice.accountId,
            trysteroPeerId,
            deviceName: peerDevice.deviceName,
            signingPublicKey: peerDevice.signingPublicKey,
            encryptionPublicKey: peerDevice.encryptionPublicKey,
            connectedAt: Date.now(),
            sendChatMessage: (message: Message) => {
              this.transmitMessage(chatAction, message, trysteroPeerId);
            },
          });

          // If this contact is pending_outgoing, dispatch our proposal
          const contact = await getContact(normPeer);
          if (contact && contact.status === "pending_outgoing") {
            const proposal: ConnectionProposal = {
              senderAccountId: device.accountId,
              senderProfile: {
                name: auth.profile?.name || "Murmur User",
                avatar: auth.profile?.avatar || null,
                bio: auth.profile?.bio || null,
              },
              senderDevice: device,
              targetAccountId: normPeer,
              timestamp: Date.now(),
            };
            void proposalAction.send(JSON.stringify(proposal), {
              target: trysteroPeerId,
            });
          }

          // FLUSH: Transmit all pending messages queued for this recipient
          void this.flushPendingForPeer(normPeer);
        } catch (err) {
          console.error("[MessageManager] Handshake processing error:", err);
        }
      };

      // 3. Handle connection proposal acknowledgments
      proposalAckAction.onMessage = async (rawMessage: string) => {
        try {
          const ack: ConnectionProposalAck = JSON.parse(rawMessage);
          if (
            ack.receiverAccountId.toLowerCase() === normPeer &&
            ack.targetAccountId.toLowerCase() === device.accountId.toLowerCase()
          ) {
            if (ack.accepted) {
              await updateContactStatus(normPeer, "accepted");
            }
          }
        } catch (err) {
          console.error("[MessageManager] Proposal ack error:", err);
        }
      };

      // 4. Handle incoming direct chat messages
      chatAction.onMessage = async (rawMessage: string, context) => {
        const trysteroPeerId = context.peerId;

        try {
          const payload: ChatMessagePayload = JSON.parse(rawMessage);

          if (
            payload.recipientAccountId.toLowerCase() !==
            device.accountId.toLowerCase()
          ) {
            return;
          }

          await saveMessage(
            {
              id: payload.id,
              roomId: payload.roomId,
              senderAccountId: payload.senderAccountId,
              recipientAccountId: payload.recipientAccountId,
              content: payload.content,
              status: "delivered",
              timestamp: payload.timestamp,
            },
            device.accountId,
          );

          // Reply with delivery confirmation
          const ack: ChatMessageAck = {
            messageId: payload.id,
            receiverAccountId: device.accountId,
            timestamp: Date.now(),
          };
          void chatAckAction.send(JSON.stringify(ack), {
            target: trysteroPeerId,
          });
        } catch (err) {
          console.error("[MessageManager] Error receiving chat message:", err);
        }
      };

      // 5. Handle chat delivery acknowledgments
      chatAckAction.onMessage = async (rawAck: string) => {
        try {
          const ack: ChatMessageAck = JSON.parse(rawAck);
          await markMessageDelivered(ack.messageId);
        } catch (err) {
          console.error("[MessageManager] Error handling chat ack:", err);
        }
      };

      // 6. On peer leave, clean up
      room.onPeerLeave = (trysteroPeerId: string) => {
        console.log(`[MessageManager] Peer dropped: ${trysteroPeerId}`);
        handshakedPeers.delete(trysteroPeerId);
        useConnectionStore.getState().removeByTrysteroPeerId(trysteroPeerId);
      };

      return room;
    } catch (err) {
      console.error(`[MessageManager] Failed to join room ${normPeer}:`, err);
      return null;
    }
  }

  /**
   * Sends a message:
   * 1. Saves to Dexie as 'pending'.
   * 2. If active connection exists, transmits immediately over WebRTC.
   * 3. If not connected, connects to recipient's room, flushes pending messages upon handshake.
   */
  public async sendMessage(
    recipientAccountId: string,
    content: string,
  ): Promise<Message | null> {
    const text = content.trim();
    if (!text) return null;

    const { device } = useAuth.getState();
    if (!device) {
      console.warn("[MessageManager] Cannot send: device not initialized");
      return null;
    }

    const myAccountId = device.accountId.toLowerCase();
    const recipient = recipientAccountId.trim().toLowerCase();
    const roomId = computeDirectRoomId(myAccountId, recipient);

    const message: Message = {
      id: crypto.randomUUID(),
      roomId,
      senderAccountId: myAccountId,
      recipientAccountId: recipient,
      content: text,
      status: "pending",
      timestamp: Date.now(),
    };

    // Save to local Dexie immediately (offline-first)
    await saveMessage(message, myAccountId);

    // Check if we already have an active WebRTC link for this peer
    const conn = useConnectionStore.getState().getPeerConnection(recipient);
    if (conn && typeof conn.sendChatMessage === "function") {
      conn.sendChatMessage(message);
      return message;
    }

    // No active connection yet: connect to peer's room to deliver!
    void this.connectToPeer(recipient);

    return message;
  }

  /**
   * Flushes all queued pending messages for a given peer over an active WebRTC channel.
   */
  public async flushPendingForPeer(peerAccountId: string): Promise<number> {
    const normPeer = peerAccountId.trim().toLowerCase();
    const pending = await getPendingOutboxMessages(normPeer);
    if (pending.length === 0) return 0;

    const conn = useConnectionStore.getState().getPeerConnection(normPeer);
    if (conn && typeof conn.sendChatMessage === "function") {
      for (const msg of pending) {
        conn.sendChatMessage(msg);
      }
      return pending.length;
    }

    // Connect to peer room to flush
    void this.connectToPeer(normPeer);
    return pending.length;
  }

  /**
   * Helper to serialize and transmit a message payload.
   */
  private transmitMessage(
    chatAction: MessageAction<string>,
    msg: Message,
    targetPeerId?: string,
  ): void {
    const payload: ChatMessagePayload = {
      id: msg.id,
      roomId: msg.roomId,
      senderAccountId: msg.senderAccountId,
      recipientAccountId: msg.recipientAccountId,
      content: msg.content,
      timestamp: msg.timestamp,
    };

    void chatAction.send(
      JSON.stringify(payload),
      targetPeerId ? { target: targetPeerId } : undefined,
    );
  }

  /**
   * Teardown all chat room connections (on logout).
   */
  public async teardown(): Promise<void> {
    for (const [peerId, room] of this.activeRooms.entries()) {
      try {
        await room.leave();
      } catch (err) {
        console.error(`[MessageManager] Error closing room ${peerId}:`, err);
      }
    }
    this.activeRooms.clear();
    this.activeChatActions.clear();
  }
}

export const messageManager = new MessageManager();
