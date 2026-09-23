import { create } from "zustand";
import type { ActivePeerConnection, MyRoomStatus } from "../types.ts";

export interface ConnectionStoreState {
  // Master map: peerAccountId (lowercase) -> ActivePeerConnection
  activeConnections: Record<string, ActivePeerConnection>;

  // Internal reverse lookup: trysteroPeerId -> peerAccountId
  peerIdLookup: Record<string, string>;

  // Personal "My Room" signaling state
  myRoomStatus: MyRoomStatus;
  myRoomError: string | null;

  // Actions
  setMyRoomStatus: (status: MyRoomStatus, error?: string | null) => void;
  registerPeerConnection: (connection: ActivePeerConnection) => void;
  removePeerConnection: (peerAccountId: string) => void;
  removeByTrysteroPeerId: (trysteroPeerId: string) => void;
  clearAllConnections: () => void;

  // Selectors & Query helpers
  isPeerOnline: (peerAccountId: string) => boolean;
  getPeerConnection: (
    peerAccountId: string,
  ) => ActivePeerConnection | undefined;
  getTotalConnectedPeers: () => number;

  // Backwards compatibility helpers
  registerDeviceConnection: (connection: ActivePeerConnection) => void;
  removeDeviceConnection: (peerAccountId: string, deviceId?: string) => void;
  getPeerDevices: (peerAccountId: string) => ActivePeerConnection[];
  getTotalConnectedDevices: () => number;
}

export const useConnectionStore = create<ConnectionStoreState>((set, get) => ({
  activeConnections: {},
  peerIdLookup: {},
  myRoomStatus: "disconnected",
  myRoomError: null,

  setMyRoomStatus: (status, error = null) => {
    set({ myRoomStatus: status, myRoomError: error });
  },

  registerPeerConnection: (connection: ActivePeerConnection) => {
    const normAccountId = connection.accountId.trim().toLowerCase();
    const { trysteroPeerId } = connection;

    set((state) => ({
      activeConnections: {
        ...state.activeConnections,
        [normAccountId]: {
          ...connection,
          accountId: normAccountId,
        },
      },
      peerIdLookup: {
        ...state.peerIdLookup,
        [trysteroPeerId]: normAccountId,
      },
    }));
  },

  removePeerConnection: (peerAccountId: string) => {
    const normAccountId = peerAccountId.trim().toLowerCase();
    set((state) => {
      const conn = state.activeConnections[normAccountId];
      if (!conn) return state;

      const updatedConnections = { ...state.activeConnections };
      delete updatedConnections[normAccountId];

      const updatedLookup = { ...state.peerIdLookup };
      if (conn.trysteroPeerId) {
        delete updatedLookup[conn.trysteroPeerId];
      }

      return {
        activeConnections: updatedConnections,
        peerIdLookup: updatedLookup,
      };
    });
  },

  removeByTrysteroPeerId: (trysteroPeerId: string) => {
    const accountId = get().peerIdLookup[trysteroPeerId];
    if (!accountId) return;

    get().removePeerConnection(accountId);
  },

  clearAllConnections: () => {
    set({
      activeConnections: {},
      peerIdLookup: {},
    });
  },

  isPeerOnline: (peerAccountId: string) => {
    const norm = peerAccountId.trim().toLowerCase();
    return Boolean(get().activeConnections[norm]);
  },

  getPeerConnection: (peerAccountId: string) => {
    const norm = peerAccountId.trim().toLowerCase();
    return get().activeConnections[norm];
  },

  getTotalConnectedPeers: () => {
    return Object.keys(get().activeConnections).length;
  },

  // Backwards-compatibility aliases
  registerDeviceConnection: (connection: ActivePeerConnection) => {
    get().registerPeerConnection(connection);
  },

  removeDeviceConnection: (peerAccountId: string) => {
    get().removePeerConnection(peerAccountId);
  },

  getPeerDevices: (peerAccountId: string) => {
    const conn = get().getPeerConnection(peerAccountId);
    return conn ? [conn] : [];
  },

  getTotalConnectedDevices: () => {
    return get().getTotalConnectedPeers();
  },
}));
