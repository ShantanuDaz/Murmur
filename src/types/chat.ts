import type { UserProfile } from "./auth";

export type MessageType = "chat" | "system";

export interface ChatMessage {
  id: string;
  roomId: string;
  sender: UserProfile | { name: string; avatar?: string; publicKey?: string };
  text: string;
  timestamp: number;
  isSelf: boolean;
  type: MessageType;
}

export interface PresencePayload {
  [key: string]: unknown;
  profile: UserProfile;
  clientTimestamp: number;
}

export interface ChatPayload {
  [key: string]: unknown;
  id: string;
  text: string;
  timestamp: number;
  sender: UserProfile;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected";

export interface PeerInfo {
  peerId: string;
  profile: UserProfile;
  joinedAt: number;
}
