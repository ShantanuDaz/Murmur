import {
  joinRoom,
  type Room,
  type MessageAction,
  type DataPayload,
  type MessageContext,
} from "trystero";
import type { UserProfile } from "../types/auth";
import type {
  ChatPayload,
  PresencePayload,
  MediaStatus,
  MediaStatusPayload,
} from "../types/chat";

export interface RoomEventHandlers {
  onPeerJoin: (peerId: string) => void;
  onPeerLeave: (peerId: string) => void;
  onPeerPresence: (peerId: string, profile: UserProfile) => void;
  onChatMessage: (payload: ChatPayload, peerId: string) => void;
  onPeerStream: (stream: MediaStream, peerId: string) => void;
  onPeerMediaStatus: (peerId: string, status: MediaStatus) => void;
}

export class P2PRoomSession {
  private room: Room;
  private presenceAction: MessageAction;
  private chatAction: MessageAction;
  private mediaStatusAction: MessageAction;
  private localProfile: UserProfile;
  private localStream: MediaStream | null = null;
  private localMediaStatus: MediaStatus = { video: false, audio: false };
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

    this.mediaStatusAction = this.room.makeAction("media-status", {
      kind: "message",
      onMessage: (data: DataPayload, context: MessageContext) => {
        if (data && typeof data === "object" && "video" in data) {
          const rec = data as unknown as MediaStatusPayload;
          handlers.onPeerMediaStatus(context.peerId, {
            video: Boolean(rec.video),
            audio: Boolean(rec.audio),
          });
        }
      },
    });

    // Handle peer incoming media stream
    this.room.onPeerStream = (stream: MediaStream, peerId: string) => {
      handlers.onPeerStream(stream, peerId);
    };

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

      // If we already have an active media stream, add it for this peer
      if (this.localStream && this.localMediaStatus.video) {
        try {
          this.room.addStream(this.localStream, { target: peerId });
          this.mediaStatusAction
            .send(this.localMediaStatus as unknown as DataPayload, {
              target: peerId,
            })
            .catch((err: unknown) => {
              console.warn(
                `Failed to send media status to peer ${peerId}:`,
                err,
              );
            });
        } catch (err) {
          console.warn(`Failed to add stream for new peer ${peerId}:`, err);
        }
      }
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

  public addLocalStream(stream: MediaStream, status: MediaStatus): void {
    this.localStream = stream;
    this.localMediaStatus = status;

    try {
      this.room.addStream(stream);
    } catch (err) {
      console.warn("Failed to add stream to room:", err);
    }

    this.mediaStatusAction
      .send(status as unknown as DataPayload)
      .catch((err: unknown) => {
        console.warn("Failed to broadcast media status:", err);
      });
  }

  public removeLocalStream(): void {
    if (this.localStream) {
      try {
        this.room.removeStream(this.localStream);
      } catch (err) {
        console.warn("Failed to remove stream from room:", err);
      }
      this.localStream = null;
    }

    this.localMediaStatus = { video: false, audio: false };
    this.mediaStatusAction
      .send(this.localMediaStatus as unknown as DataPayload)
      .catch((err: unknown) => {
        console.warn("Failed to broadcast media status disable:", err);
      });
  }

  public updateMediaStatus(status: MediaStatus): void {
    this.localMediaStatus = status;
    this.mediaStatusAction
      .send(status as unknown as DataPayload)
      .catch((err: unknown) => {
        console.warn("Failed to broadcast media status update:", err);
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
    if (this.localStream) {
      try {
        this.room.removeStream(this.localStream);
        this.localStream.getTracks().forEach((t) => t.stop());
      } catch (err) {
        console.warn("Failed to cleanup stream on leave:", err);
      }
      this.localStream = null;
    }

    try {
      await this.room.leave();
    } catch (err) {
      console.warn("Error leaving Trystero room:", err);
    }
  }
}
