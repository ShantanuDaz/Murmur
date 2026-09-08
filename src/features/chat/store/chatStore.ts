import { create } from "zustand";
import type { UserProfile } from "../../../types/auth";
import type {
  ChatMessage,
  ConnectionStatus,
  PeerInfo,
} from "../../../types/chat";
import { P2PRoomSession } from "../../../services/trystero";

interface ChatState {
  activeRoomId: string | null;
  status: ConnectionStatus;
  peers: Record<string, PeerInfo>;
  messages: ChatMessage[];
  joinRoom: (roomId: string, localProfile: UserProfile) => void;
  leaveRoom: () => void;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
}

let activeSession: P2PRoomSession | null = null;

export const useChatStore = create<ChatState>((set) => ({
  activeRoomId: null,
  status: "disconnected",
  peers: {},
  messages: [],

  joinRoom: (rawRoomId: string, localProfile: UserProfile) => {
    const roomId = rawRoomId.trim().toLowerCase();
    if (!roomId) return;

    // Teardown any existing session
    if (activeSession) {
      activeSession.leave();
      activeSession = null;
    }

    // Set initial connecting state
    set({
      activeRoomId: roomId,
      status: "connecting",
      peers: {},
      messages: [
        {
          id: `sys-${Date.now()}-init`,
          roomId,
          sender: { name: "System" },
          text: `Joined #${roomId}. Waiting for peers on Nostr relays...`,
          timestamp: Date.now(),
          isSelf: false,
          type: "system",
        },
      ],
    });

    // Create new Trystero P2P Session
    activeSession = new P2PRoomSession(roomId, localProfile, {
      onPeerJoin: (peerId) => {
        set((state) => {
          return {
            status: "connected",
            messages: [
              ...state.messages,
              {
                id: `sys-${Date.now()}-${peerId}`,
                roomId,
                sender: { name: "System" },
                text: `Peer connection established with [${peerId.slice(0, 6)}]. Exchanging cryptographic identity...`,
                timestamp: Date.now(),
                isSelf: false,
                type: "system",
              },
            ],
            // Temporarily register peer until presence arrives
            peers: {
              ...state.peers,
              [peerId]: state.peers[peerId] || {
                peerId,
                profile: {
                  id: peerId,
                  name: `Peer-${peerId.slice(0, 5)}`,
                  avatar: "user",
                  publicKey: peerId,
                  encryptionKey: peerId,
                  createdAt: Date.now(),
                },
                joinedAt: Date.now(),
              },
            },
          };
        });
      },

      onPeerPresence: (peerId, profile) => {
        set((state) => {
          const existingPeer = state.peers[peerId];
          const hasIdentified =
            existingPeer &&
            existingPeer.profile.name !== `Peer-${peerId.slice(0, 5)}`;

          const updatedPeers = {
            ...state.peers,
            [peerId]: {
              peerId,
              profile,
              joinedAt: existingPeer ? existingPeer.joinedAt : Date.now(),
            },
          };

          // If this is the first time we received their named profile, show announcement
          const newMessages = [...state.messages];
          if (!hasIdentified) {
            newMessages.push({
              id: `sys-${Date.now()}-${peerId}-presence`,
              roomId,
              sender: { name: "System" },
              text: `${profile.name} is now connected.`,
              timestamp: Date.now(),
              isSelf: false,
              type: "system",
            });
          }

          return {
            peers: updatedPeers,
            status: "connected",
            messages: newMessages,
          };
        });
      },

      onPeerLeave: (peerId) => {
        set((state) => {
          const peer = state.peers[peerId];
          const peerName = peer?.profile?.name || `Peer-${peerId.slice(0, 5)}`;
          const remainingPeers = { ...state.peers };
          delete remainingPeers[peerId];

          return {
            peers: remainingPeers,
            messages: [
              ...state.messages,
              {
                id: `sys-${Date.now()}-${peerId}-left`,
                roomId,
                sender: { name: "System" },
                text: `${peerName} disconnected.`,
                timestamp: Date.now(),
                isSelf: false,
                type: "system",
              },
            ],
          };
        });
      },

      onChatMessage: (payload) => {
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: payload.id,
              roomId,
              sender: payload.sender,
              text: payload.text,
              timestamp: payload.timestamp,
              isSelf: false,
              type: "chat",
            },
          ],
        }));
      },
    });
  },

  leaveRoom: () => {
    if (activeSession) {
      activeSession.leave();
      activeSession = null;
    }

    set({
      activeRoomId: null,
      status: "disconnected",
      peers: {},
      messages: [],
    });
  },

  sendMessage: async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !activeSession) return;

    try {
      const payload = await activeSession.sendChatMessage(trimmed);
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: payload.id,
            roomId: activeSession!.roomId,
            sender: payload.sender,
            text: payload.text,
            timestamp: payload.timestamp,
            isSelf: true,
            type: "chat",
          },
        ],
      }));
    } catch (err) {
      console.error("Failed to send P2P message:", err);
    }
  },

  clearMessages: () => {
    set({ messages: [] });
  },
}));
