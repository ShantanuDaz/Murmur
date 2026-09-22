import { create } from "zustand";
import type { AuthState } from "../authTypes.ts";
import { isValidDevice, isValidProfile } from "../utils.ts";
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from "../../../utils/storage.ts";

const useAuth = create<AuthState>((set, get) => ({
  isIdentityExists: null,
  isLoading: true,
  isPrimaryDevice: false,
  device: null,
  profile: null,

  initialize: async () => {
    // If already initialized and not currently loading, skip duplicate work
    if (get().isIdentityExists !== null && !get().isLoading) return;

    try {
      set({ isLoading: true });

      const device = getStorageItem("device", isValidDevice);
      if (!device) {
        set({
          isIdentityExists: false,
          isPrimaryDevice: false,
          device: null,
          profile: null,
        });
        return;
      }

      const profile = getStorageItem("profile", isValidProfile);
      const mnemonic = getStorageItem<string>("mnemonic");

      set({
        isIdentityExists: true,
        isPrimaryDevice: Boolean(mnemonic),
        device,
        profile,
      });
    } catch (error) {
      console.error("Failed to initialize auth store:", error);
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
    setStorageItem("device", device);
    const mnemonic = getStorageItem<string>("mnemonic");
    set({
      device,
      isIdentityExists: Boolean(device),
      isPrimaryDevice: Boolean(mnemonic),
    });
  },

  setProfile: (profile) => {
    setStorageItem("profile", profile);
    set({ profile });
  },

  getMnemonic: () => {
    return getStorageItem<string>("mnemonic");
  },

  logout: () => {
    removeStorageItem("device");
    removeStorageItem("profile");
    removeStorageItem("mnemonic");
    set({
      isIdentityExists: false,
      isPrimaryDevice: false,
      device: null,
      profile: null,
    });
  },
}));

export default useAuth;
