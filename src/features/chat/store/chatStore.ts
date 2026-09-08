import { create } from "zustand";
import type { UserProfile } from "../../../types/auth";
import type {
  ChatMessage,
  ConnectionStatus,
  PeerInfo,
  MediaStatus,
} from "../../../types/chat";
import { P2PRoomSession } from "../../../services/trystero";

interface ChatState {
  activeRoomId: string | null;
  status: ConnectionStatus;
  peers: Record<string, PeerInfo>;
  messages: ChatMessage[];
  // Video & Audio state
  localStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  peerStreams: Record<string, MediaStream>;
  peerMediaStatus: Record<string, MediaStatus>;
  mediaError: string | null;

  joinRoom: (roomId: string, localProfile: UserProfile) => void;
  leaveRoom: () => void;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
  toggleVideo: () => Promise<void>;
  toggleAudio: () => void;
  clearMediaError: () => void;
}

let activeSession: P2PRoomSession | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  activeRoomId: null,
  status: "disconnected",
  peers: {},
  messages: [],
  localStream: null,
  isVideoEnabled: false,
  isAudioEnabled: false,
  peerStreams: {},
  peerMediaStatus: {},
  mediaError: null,

  joinRoom: (rawRoomId: string, localProfile: UserProfile) => {
    const roomId = rawRoomId.trim().toLowerCase();
    if (!roomId) return;

    // Teardown any existing session & media
    const currentStream = get().localStream;
    if (currentStream) {
      currentStream.getTracks().forEach((t) => t.stop());
    }

    if (activeSession) {
      activeSession.leave();
      activeSession = null;
    }

    // Set initial connecting state
    set({
      activeRoomId: roomId,
      status: "connecting",
      peers: {},
      localStream: null,
      isVideoEnabled: false,
      isAudioEnabled: false,
      peerStreams: {},
      peerMediaStatus: {},
      mediaError: null,
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
              mediaStatus: state.peerMediaStatus[peerId],
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

      onPeerStream: (stream, peerId) => {
        set((state) => ({
          peerStreams: {
            ...state.peerStreams,
            [peerId]: stream,
          },
          peerMediaStatus: {
            ...state.peerMediaStatus,
            [peerId]: {
              video: true,
              audio: state.peerMediaStatus[peerId]?.audio ?? true,
            },
          },
        }));
      },

      onPeerMediaStatus: (peerId, status) => {
        set((state) => {
          const newStreams = { ...state.peerStreams };
          if (!status.video && newStreams[peerId]) {
            delete newStreams[peerId];
          }
          return {
            peerStreams: newStreams,
            peerMediaStatus: {
              ...state.peerMediaStatus,
              [peerId]: status,
            },
          };
        });
      },

      onPeerLeave: (peerId) => {
        set((state) => {
          const peer = state.peers[peerId];
          const peerName = peer?.profile?.name || `Peer-${peerId.slice(0, 5)}`;
          const remainingPeers = { ...state.peers };
          delete remainingPeers[peerId];

          const remainingStreams = { ...state.peerStreams };
          delete remainingStreams[peerId];

          const remainingMediaStatus = { ...state.peerMediaStatus };
          delete remainingMediaStatus[peerId];

          return {
            peers: remainingPeers,
            peerStreams: remainingStreams,
            peerMediaStatus: remainingMediaStatus,
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
    const currentStream = get().localStream;
    if (currentStream) {
      currentStream.getTracks().forEach((t) => t.stop());
    }

    if (activeSession) {
      activeSession.leave();
      activeSession = null;
    }

    set({
      activeRoomId: null,
      status: "disconnected",
      peers: {},
      messages: [],
      localStream: null,
      isVideoEnabled: false,
      isAudioEnabled: false,
      peerStreams: {},
      peerMediaStatus: {},
      mediaError: null,
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

  toggleVideo: async () => {
    const state = get();
    if (state.isVideoEnabled && state.localStream) {
      // Turn off video
      state.localStream.getTracks().forEach((track) => track.stop());
      if (activeSession) {
        activeSession.removeLocalStream();
      }
      set({
        localStream: null,
        isVideoEnabled: false,
        isAudioEnabled: false,
        mediaError: null,
      });
    } else {
      // Turn on video
      try {
        set({ mediaError: null });
        let stream: MediaStream;
        let hasAudio = true;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: "user",
            },
            audio: true,
          });
        } catch {
          // Fallback to video only if microphone access fails or device has no mic
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: "user",
            },
            audio: false,
          });
          hasAudio = false;
        }

        if (activeSession) {
          activeSession.addLocalStream(stream, {
            video: true,
            audio: hasAudio,
          });
        }

        set({
          localStream: stream,
          isVideoEnabled: true,
          isAudioEnabled: hasAudio,
        });
      } catch (err) {
        console.error("Camera access error:", err);
        const msg =
          err instanceof Error && err.name === "NotAllowedError"
            ? "Camera access was denied. Please allow camera permissions in your browser."
            : "Could not access camera. Please check your device connection.";
        set({ mediaError: msg });
      }
    }
  },

  toggleAudio: () => {
    const state = get();
    if (!state.localStream) return;
    const audioTracks = state.localStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    const newAudioState = !state.isAudioEnabled;
    audioTracks.forEach((t) => {
      t.enabled = newAudioState;
    });

    if (activeSession) {
      activeSession.updateMediaStatus({
        video: state.isVideoEnabled,
        audio: newAudioState,
      });
    }

    set({ isAudioEnabled: newAudioState });
  },

  clearMediaError: () => {
    set({ mediaError: null });
  },

  clearMessages: () => {
    set({ messages: [] });
  },
}));
