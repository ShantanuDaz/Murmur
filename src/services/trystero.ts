import {
  joinRoom,
  type Room,
  type MessageAction,
  type DataPayload,
  type MessageContext,
} from "trystero";
import type { UserProfile } from "../types/auth";
import type { ChatPayload, PresencePayload } from "../types/chat";

export interface RoomEventHandlers {
  onPeerJoin: (peerId: string) => void;
  onPeerLeave: (peerId: string) => void;
  onPeerPresence: (peerId: string, profile: UserProfile) => void;
  onChatMessage: (payload: ChatPayload, peerId: string) => void;
}

export class P2PRoomSession {
  private room: Room;
  private presenceAction: MessageAction;
  private chatAction: MessageAction;
  private localProfile: UserProfile;
  public readonly roomId: string;

  constructor(
    roomId: string,
    localProfile: UserProfile,
    handlers: RoomEventHandlers,
  ) {
    this.roomId = roomId;
    this.localProfile = localProfile;

    // Connect to room using decentralized Nostr signaling
    this.room = joinRoom(
      {
        appId: "murmur-p2p-chat",
      },
      roomId,
    );

    // Setup action channels with message handlers
    this.presenceAction = this.room.makeAction("presence", {
      kind: "message",
      onMessage: (data: DataPayload, context: MessageContext) => {
        if (data && typeof data === "object" && "profile" in data) {
          const rec = data as Record<string, unknown>;
          handlers.onPeerPresence(context.peerId, rec.profile as UserProfile);
        }
      },
    });

    this.chatAction = this.room.makeAction("chat", {
      kind: "message",
      onMessage: (data: DataPayload, context: MessageContext) => {
        if (data && typeof data === "object" && "text" in data) {
          handlers.onChatMessage(
            data as unknown as ChatPayload,
            context.peerId,
          );
        }
      },
    });

    // Handle peer discovery
    this.room.onPeerJoin = (peerId: string) => {
      handlers.onPeerJoin(peerId);

      // Immediately introduce ourselves to the new peer
      const presence: PresencePayload = {
        profile: this.localProfile,
        clientTimestamp: Date.now(),
      };

      this.presenceAction
        .send(presence as unknown as DataPayload, { target: peerId })
        .catch((err: unknown) => {
          console.warn(`Failed to send presence to peer ${peerId}:`, err);
        });
    };

    // Handle peer disconnection
    this.room.onPeerLeave = (peerId: string) => {
      handlers.onPeerLeave(peerId);
    };

    // Broadcast initial presence
    setTimeout(() => {
      this.broadcastPresence();
    }, 500);
  }

  public broadcastPresence(): void {
    const presence: PresencePayload = {
      profile: this.localProfile,
      clientTimestamp: Date.now(),
    };

    this.presenceAction
      .send(presence as unknown as DataPayload)
      .catch((err: unknown) => {
        console.warn("Failed to broadcast presence:", err);
      });
  }

  public async sendChatMessage(text: string): Promise<ChatPayload> {
    const payload: ChatPayload = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      text,
      timestamp: Date.now(),
      sender: this.localProfile,
    };

    await this.chatAction.send(payload as unknown as DataPayload);
    return payload;
  }

  public async leave(): Promise<void> {
    try {
      await this.room.leave();
    } catch (err) {
      console.warn("Error leaving Trystero room:", err);
    }
  }
}
