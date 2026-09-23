import { create } from "zustand";
import type { AuthState, LocalDeviceKeys } from "../authTypes.ts";
import {
  loadLocalIdentity,
  updateLocalProfile,
  clearLocalIdentity,
  db,
} from "../../../services/storage/index.ts";

let inMemoryKeys: LocalDeviceKeys | null = null;
let inMemoryMnemonic: string | null = null;

const useAuth = create<AuthState>((set, get) => ({
  isIdentityExists: null,
  isLoading: true,
  isPrimaryDevice: false,
  device: null,
  profile: null,

  initialize: async (force = false) => {
    // If already initialized and not currently loading, skip duplicate work unless forced
    if (!force && get().isIdentityExists !== null && !get().isLoading) return;

    try {
      set({ isLoading: true });

      const loaded = await loadLocalIdentity();
      if (!loaded) {
        inMemoryKeys = null;
        inMemoryMnemonic = null;
        set({
          isIdentityExists: false,
          isPrimaryDevice: false,
          device: null,
          profile: null,
        });
        return;
      }

      inMemoryKeys = loaded.deviceKeys;
      inMemoryMnemonic = loaded.mnemonic;

      set({
        isIdentityExists: true,
        isPrimaryDevice: loaded.isPrimary,
        device: loaded.device,
        profile: loaded.profile,
      });
    } catch (error) {
      console.error("Failed to initialize auth store from Dexie:", error);
      inMemoryKeys = null;
      inMemoryMnemonic = null;
      set({
        isIdentityExists: false,
        isPrimaryDevice: false,
        device: null,
        profile: null,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  setDevice: (device) => {
    set({
      device,
      isIdentityExists: Boolean(device),
      isPrimaryDevice: Boolean(inMemoryMnemonic),
    });
  },

  setProfile: (profile) => {
    if (profile) {
      void updateLocalProfile(profile);
    }
    set({ profile });
  },

  setIdentity: (params) => {
    inMemoryKeys = params.deviceKeys;
    inMemoryMnemonic = params.mnemonic;
    set({
      device: params.device,
      profile: params.profile,
      isIdentityExists: true,
      isPrimaryDevice: Boolean(params.mnemonic),
    });
  },

  getMnemonic: () => {
    return inMemoryMnemonic;
  },

  getDeviceKeys: () => {
    return inMemoryKeys;
  },

  logout: () => {
    inMemoryKeys = null;
    inMemoryMnemonic = null;
    void clearLocalIdentity();
    void db.clearAll();
    set({
      isIdentityExists: false,
      isPrimaryDevice: false,
      device: null,
      profile: null,
    });
  },
}));

export default useAuth;
