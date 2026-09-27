import { create } from "zustand";
import type { Room } from "trystero/nostr";

export interface ConversationsState {
  // Currently opened conversation peer contact ID (null if none open)
  openConversation: string | null;

  // Live presence state: contactID -> boolean
  onlinePeers: Record<string, boolean>;

  // Active WebRTC rooms: roomId -> Room instance
  activeRooms: Record<string, Room>;

  // Actions
  setOpenConversation: (contactID: string | null) => void;
  closeConversation: () => void;
  setPeerOnline: (contactID: string, isOnline: boolean) => void;
  registerRoom: (roomId: string, room: Room) => void;
  unregisterRoom: (roomId: string) => void;

  // Selectors
  isPeerOnline: (contactID: string) => boolean;
}

export const useConversationsStore = create<ConversationsState>((set, get) => ({
  openConversation: null,
  onlinePeers: {},
  activeRooms: {},

  setOpenConversation: (contactID) => set({ openConversation: contactID }),
  closeConversation: () => set({ openConversation: null }),

  setPeerOnline: (contactID, isOnline) => {
    const norm = contactID.trim().toLowerCase();
    set((state) => ({
      onlinePeers: {
        ...state.onlinePeers,
        [norm]: isOnline,
      },
    }));
  },

  registerRoom: (roomId, room) => {
    set((state) => ({
      activeRooms: {
        ...state.activeRooms,
        [roomId]: room,
      },
    }));
  },

  unregisterRoom: (roomId) => {
    set((state) => {
      const nextRooms = { ...state.activeRooms };
      delete nextRooms[roomId];
      return { activeRooms: nextRooms };
    });
  },

  isPeerOnline: (contactID) => {
    const norm = contactID.trim().toLowerCase();
    return Boolean(get().onlinePeers[norm]);
  },
}));
