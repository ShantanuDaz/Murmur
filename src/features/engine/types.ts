import type { DeviceIdentity } from "../auth/authTypes.ts";
import type { Message } from "../../services/storage/messages.ts";

export type MyRoomStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface ActivePeerConnection {
  accountId: string; // Peer's Murmur Number (0x...)
  deviceId: string;
  trysteroPeerId: string; // Ephemeral WebRTC session ID from Trystero
  deviceName: string;
  signingPublicKey: string;
  encryptionPublicKey: string;
  connectedAt: number;
  sendChatMessage: (message: Message) => void; // Direct dispatch over WebRTC
}

export type ActiveDeviceConnection = ActivePeerConnection;

export interface HandshakePayload {
  device: DeviceIdentity;
  targetAccountId: string; // Intended recipient's Murmur Number (prevents relay attacks)
  timestamp: number; // Ephemeral epoch timestamp for freshness check
  nonce: string; // Random nonce for replay resistance
}

export interface SignedHandshake {
  payload: HandshakePayload;
  signature: string; // Hex-encoded Ed25519 signature (0x...)
}

export interface ConnectionProposal {
  senderAccountId: string; // Murmur Number of requester (0x...)
  senderProfile: {
    name: string;
    avatar?: string | null;
    bio?: string | null;
  };
  senderDevice: DeviceIdentity; // Certified Device Identity
  targetAccountId: string; // Murmur Number of recipient (anti-relay)
  timestamp: number;
}

export interface ConnectionProposalAck {
  receiverAccountId: string;
  targetAccountId: string;
  accepted: boolean; // true if already mutual/accepted, false if pending receiver's manual approval
  timestamp: number;
}

export interface ChatMessagePayload {
  id: string; // Unique message UUID
  roomId: string;
  senderAccountId: string;
  recipientAccountId: string;
  content: string;
  timestamp: number;
}

export interface ChatMessageAck {
  messageId: string;
  receiverAccountId: string;
  timestamp: number;
}
