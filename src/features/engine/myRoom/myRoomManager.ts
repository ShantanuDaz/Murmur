import { joinRoom, type Room, type MessageAction } from "trystero/nostr";
import type { DeviceIdentity } from "../../auth/authTypes.ts";
import { useConnectionStore } from "../store/connectionStore.ts";
import { createSignedHandshake, verifySignedHandshake } from "./handshake.ts";
import type {
  SignedHandshake,
  ConnectionProposal,
  ConnectionProposalAck,
  ChatMessagePayload,
  ChatMessageAck,
} from "../types.ts";
import {
  getContact,
  saveContact,
  updateContactStatus,
  updateContactProfile,
} from "../../../services/storage/contacts.ts";
import {
  saveMessage,
  markMessageDelivered,
  type Message,
} from "../../../services/storage/messages.ts";
import { verifyDeviceCertificate } from "../../../services/crypto/device.ts";

export interface StartMyRoomParams {
  accountId: string;
  device: DeviceIdentity;
  signingPrivateKey: Uint8Array;
}

class MyRoomManager {
  private currentRoom: Room | null = null;
  private currentAccountId: string | null = null;
  private currentDevice: DeviceIdentity | null = null;
  private currentSigningPrivateKey: Uint8Array | null = null;
  private proposalAckAction: MessageAction<string> | null = null;
  private chatAction: MessageAction<string> | null = null;
  private chatAckAction: MessageAction<string> | null = null;
  private peerConnectListeners = new Set<(peerAccountId: string) => void>();
  private isInitializing = false;

  /**
   * Subscribes a listener to be notified whenever a verified peer connects.
   * Returns an unsubscribe function.
   */
  public onPeerConnect(listener: (peerAccountId: string) => void): () => void {
    this.peerConnectListeners.add(listener);
    return () => {
      this.peerConnectListeners.delete(listener);
    };
  }

  /**
   * Initializes and starts listening on "My Room" (Room ID = My Account ID).
   */
  public async startMyRoom(params: StartMyRoomParams): Promise<void> {
    const { accountId, device, signingPrivateKey } = params;

    // If already active with the same account, do nothing
    if (this.currentRoom && this.currentAccountId === accountId) {
      return;
    }

    if (this.isInitializing) {
      return;
    }

    this.isInitializing = true;

    try {
      // If previously connected to another account, tear down first
      if (this.currentRoom) {
        await this.stopMyRoom();
      }

      useConnectionStore.getState().setMyRoomStatus("connecting");

      this.currentAccountId = accountId;
      this.currentDevice = device;
      this.currentSigningPrivateKey = signingPrivateKey;

      // Join Trystero room keyed to our canonical Murmur Number
      const room = joinRoom({ appId: "murmur-app" }, accountId);
      this.currentRoom = room;

      const handshakeAction = room.makeAction<string>("device-handshake");
      const proposalAction = room.makeAction<string>("connection-proposal");
      const proposalAckAction = room.makeAction<string>(
        "connection-proposal-ack",
      );
      const chatAction = room.makeAction<string>("chat-message");
      const chatAckAction = room.makeAction<string>("chat-ack");

      this.proposalAckAction = proposalAckAction;
      this.chatAction = chatAction;
      this.chatAckAction = chatAckAction;

      // Track peers we've already sent a handshake to
      const handshakedPeers = new Set<string>();

      const sendLocalHandshake = (peerId: string) => {
        if (!this.currentDevice || !this.currentSigningPrivateKey) return;

        try {
          const signedHandshake = createSignedHandshake({
            device: this.currentDevice,
            targetAccountId: accountId,
            signingPrivateKey: this.currentSigningPrivateKey,
          });

          void handshakeAction.send(JSON.stringify(signedHandshake), {
            target: peerId,
          });
          handshakedPeers.add(peerId);
        } catch (err) {
          console.error(`[MyRoom] Failed to send handshake to ${peerId}:`, err);
        }
      };

      // 1. When an external peer joins our room, dispatch our certified handshake
      room.onPeerJoin = (trysteroPeerId: string) => {
        sendLocalHandshake(trysteroPeerId);
      };

      // Also handshake any peer that may already be connected
      for (const peerId of Object.keys(room.getPeers())) {
        sendLocalHandshake(peerId);
      }

      // 2. When an incoming handshake is received, verify authenticity & register
      handshakeAction.onMessage = (rawMessage: string, context) => {
        const trysteroPeerId = context.peerId;
        if (!this.currentAccountId) return;

        try {
          const incomingData: unknown = JSON.parse(rawMessage);
          const verification = verifySignedHandshake({
            signedHandshake: incomingData,
            expectedTargetAccountId: this.currentAccountId,
          });

          if (!verification.isValid) {
            console.warn(
              `[MyRoom] Rejected unverified device connection from ${trysteroPeerId}: ${verification.reason}`,
            );
            return;
          }

          const peerDevice = (incomingData as SignedHandshake).payload.device;

          // Mutual handshake: If we haven't sent our handshake to this peer yet, send it now
          if (!handshakedPeers.has(trysteroPeerId)) {
            sendLocalHandshake(trysteroPeerId);
          }

          console.log(
            `[MyRoom] ✅ Peer connected & verified: ${peerDevice.accountId}`,
          );

          // Register the verified peer connection globally -> turns badge GREEN (P2P Live)!
          useConnectionStore.getState().registerPeerConnection({
            deviceId: peerDevice.deviceId,
            accountId: peerDevice.accountId,
            trysteroPeerId,
            deviceName: peerDevice.deviceName,
            signingPublicKey: peerDevice.signingPublicKey,
            encryptionPublicKey: peerDevice.encryptionPublicKey,
            connectedAt: Date.now(),
            sendChatMessage: (message: Message) => {
              if (this.chatAction) {
                const payload: ChatMessagePayload = {
                  id: message.id,
                  roomId: message.roomId,
                  senderAccountId: message.senderAccountId,
                  recipientAccountId: message.recipientAccountId,
                  content: message.content,
                  timestamp: message.timestamp,
                };
                void this.chatAction.send(JSON.stringify(payload), {
                  target: trysteroPeerId,
                });
              }
            },
          });

          // Notify peer connect listeners (e.g. chat outbox flusher)
          for (const listener of this.peerConnectListeners) {
            try {
              listener(peerDevice.accountId);
            } catch (err) {
              console.error("[MyRoom] Error in peerConnect listener:", err);
            }
          }
        } catch (err) {
          console.error(
            `[MyRoom] Failed to process handshake from ${trysteroPeerId}:`,
            err,
          );
        }
      };

      // 3. Handle incoming Connection Proposals
      proposalAction.onMessage = async (rawMessage: string, context) => {
        const trysteroPeerId = context.peerId;
        if (!this.currentAccountId) return;

        try {
          const proposal: ConnectionProposal = JSON.parse(rawMessage);

          // Anti-relay: target must be our account
          if (
            proposal.targetAccountId.toLowerCase() !==
            this.currentAccountId.toLowerCase()
          ) {
            console.warn(
              `[MyRoom] Ignored proposal with invalid target: ${proposal.targetAccountId}`,
            );
            return;
          }

          // Replay check
          if (Math.abs(Date.now() - proposal.timestamp) > 120_000) {
            console.warn(
              `[MyRoom] Ignored expired proposal from ${proposal.senderAccountId}`,
            );
            return;
          }

          // Master certificate verification
          if (!verifyDeviceCertificate(proposal.senderDevice)) {
            console.warn(
              `[MyRoom] Ignored proposal with invalid device cert from ${proposal.senderAccountId}`,
            );
            return;
          }

          const senderId = proposal.senderAccountId.toLowerCase();
          const existing = await getContact(senderId);

          if (existing?.status === "blocked") {
            console.warn(
              `[MyRoom] Ignored proposal from blocked user: ${senderId}`,
            );
            return;
          }

          // Case A: Reciprocal match (We previously sent a request to them too)
          if (existing?.status === "pending_outgoing") {
            await updateContactStatus(senderId, "accepted");
            if (proposal.senderProfile.name) {
              await updateContactProfile(senderId, {
                name: proposal.senderProfile.name,
                avatar: proposal.senderProfile.avatar,
                bio: proposal.senderProfile.bio,
              });
            }

            const ack: ConnectionProposalAck = {
              receiverAccountId: this.currentAccountId,
              targetAccountId: senderId,
              accepted: true,
              timestamp: Date.now(),
            };
            void proposalAckAction.send(JSON.stringify(ack), {
              target: trysteroPeerId,
            });
            return;
          }

          // Case B: Already accepted mutual contact
          if (existing?.status === "accepted") {
            if (proposal.senderProfile.name) {
              await updateContactProfile(senderId, {
                name: proposal.senderProfile.name,
                avatar: proposal.senderProfile.avatar,
                bio: proposal.senderProfile.bio,
              });
            }

            const ack: ConnectionProposalAck = {
              receiverAccountId: this.currentAccountId,
              targetAccountId: senderId,
              accepted: true,
              timestamp: Date.now(),
            };
            void proposalAckAction.send(JSON.stringify(ack), {
              target: trysteroPeerId,
            });
            return;
          }

          // Case C: New unknown peer proposal -> save as pending_incoming
          await saveContact({
            accountId: senderId,
            name:
              proposal.senderProfile.name || `User ${senderId.slice(0, 8)}...`,
            avatar: proposal.senderProfile.avatar || null,
            bio: proposal.senderProfile.bio || null,
            status: "pending_incoming",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });

          // Send delivery acknowledgment (awaiting user acceptance)
          const ack: ConnectionProposalAck = {
            receiverAccountId: this.currentAccountId,
            targetAccountId: senderId,
            accepted: false,
            timestamp: Date.now(),
          };
          void proposalAckAction.send(JSON.stringify(ack), {
            target: trysteroPeerId,
          });
        } catch (err) {
          console.error(
            `[MyRoom] Failed to process incoming proposal from ${trysteroPeerId}:`,
            err,
          );
        }
      };

      // 4. Handle incoming direct chat messages
      chatAction.onMessage = async (rawMessage: string, context) => {
        const trysteroPeerId = context.peerId;
        if (!this.currentAccountId) return;

        try {
          const payload: ChatMessagePayload = JSON.parse(rawMessage);

          // Target check
          if (
            payload.recipientAccountId.toLowerCase() !==
            this.currentAccountId.toLowerCase()
          ) {
            return;
          }

          // Persist incoming message to Dexie
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
            this.currentAccountId,
          );

          // Return delivery confirmation to sender
          const ack: ChatMessageAck = {
            messageId: payload.id,
            receiverAccountId: this.currentAccountId,
            timestamp: Date.now(),
          };

          if (this.chatAckAction) {
            void this.chatAckAction.send(JSON.stringify(ack), {
              target: trysteroPeerId,
            });
          }
        } catch (err) {
          console.error(
            `[MyRoom] Error processing chat message from ${trysteroPeerId}:`,
            err,
          );
        }
      };

      // 5. Handle chat delivery acknowledgments
      chatAckAction.onMessage = async (rawMessage: string) => {
        try {
          const ack: ChatMessageAck = JSON.parse(rawMessage);
          await markMessageDelivered(ack.messageId);
        } catch (err) {
          console.error("[MyRoom] Error processing chat ack:", err);
        }
      };

      // 6. When a peer disconnects, drop the device from active connections
      room.onPeerLeave = (trysteroPeerId: string) => {
        handshakedPeers.delete(trysteroPeerId);
        useConnectionStore.getState().removeByTrysteroPeerId(trysteroPeerId);
      };

      useConnectionStore.getState().setMyRoomStatus("connected");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to join My Room";
      console.error("[MyRoom] Error initializing room:", error);
      useConnectionStore.getState().setMyRoomStatus("error", message);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Transmits a chat message over active P2P data channels to a contact's devices.
   */
  public sendChatMessage(message: Message): void {
    if (!this.chatAction || !this.currentAccountId) return;

    const conn = useConnectionStore
      .getState()
      .getPeerConnection(message.recipientAccountId);

    if (!conn) return;

    const payload: ChatMessagePayload = {
      id: message.id,
      roomId: message.roomId,
      senderAccountId: message.senderAccountId,
      recipientAccountId: message.recipientAccountId,
      content: message.content,
      timestamp: message.timestamp,
    };

    void this.chatAction.send(JSON.stringify(payload), {
      target: conn.trysteroPeerId,
    });
  }

  /**
   * Dispatches acceptance acknowledgment to a peer when user clicks Accept.
   */
  public async sendProposalAcceptance(targetAccountId: string): Promise<void> {
    const normId = targetAccountId.toLowerCase();
    await updateContactStatus(normId, "accepted");

    if (!this.proposalAckAction || !this.currentAccountId) return;

    const conn = useConnectionStore.getState().getPeerConnection(normId);
    if (!conn) return;

    const ack: ConnectionProposalAck = {
      receiverAccountId: this.currentAccountId,
      targetAccountId: normId,
      accepted: true,
      timestamp: Date.now(),
    };

    void this.proposalAckAction.send(JSON.stringify(ack), {
      target: conn.trysteroPeerId,
    });
  }

  /**
   * Leaves "My Room" and flushes all active connections.
   */
  public async stopMyRoom(): Promise<void> {
    if (this.currentRoom) {
      try {
        await this.currentRoom.leave();
      } catch (err) {
        console.error("[MyRoom] Error leaving room:", err);
      }
      this.currentRoom = null;
    }

    this.proposalAckAction = null;
    this.chatAction = null;
    this.chatAckAction = null;
    this.currentAccountId = null;
    this.currentDevice = null;
    this.currentSigningPrivateKey = null;

    useConnectionStore.getState().clearAllConnections();
    useConnectionStore.getState().setMyRoomStatus("disconnected");
  }

  /**
   * Returns whether "My Room" is currently active.
   */
  public isActive(): boolean {
    return Boolean(this.currentRoom && this.currentAccountId);
  }

  /**
   * Returns current account ID being listened on.
   */
  public getListeningAccountId(): string | null {
    return this.currentAccountId;
  }
}

export const myRoomManager = new MyRoomManager();
