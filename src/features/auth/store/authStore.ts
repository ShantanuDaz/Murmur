import { create } from "zustand";
import type {
  AuthState,
  UserProfile,
  DeviceKeyring,
  UserSecrets,
} from "../../../types/auth";

// Guard against duplicate simultaneous initialization runs
let initPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  device: null,
  secrets: null,
  isAuthenticated: false,
  isLoading: true,

  /**
   * Probes the local storage/database on cold application boot.
   */
  initialize: async () => {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        // TODO: In Step 1.3, this will call loadLocalIdentity() from Dexie
        // For now, if no credentials stored, we gracefully set unauthenticated
        set({
          profile: null,
          device: null,
          secrets: null,
          isAuthenticated: false,
          isLoading: false,
        });
      } catch (err) {
        console.error("Failed to initialize auth keystore:", err);
        set({
          profile: null,
          device: null,
          secrets: null,
          isAuthenticated: false,
          isLoading: false,
        });
      } finally {
        initPromise = null;
      }
    })();

    return initPromise;
  },

  /**
   * Commits an active authenticated session to memory (and later to Dexie DB).
   */
  login: async (
    profile: UserProfile,
    device: DeviceKeyring,
    secrets?: UserSecrets,
  ) => {
    try {
      // TODO: In Step 1.3, this will call saveLocalIdentity(profile, device, secrets)
      set({
        profile,
        device,
        secrets: secrets ?? null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      console.error("Failed to save session to keystore:", err);
      // Fallback in-memory session
      set({
        profile,
        device,
        secrets: secrets ?? null,
        isAuthenticated: true,
        isLoading: false,
      });
    }
  },

  /**
   * Clears the active session and credentials.
   */
  logout: async () => {
    try {
      // TODO: In Step 1.3, this will call clearLocalIdentity()
    } catch (err) {
      console.warn("Failed to clear local keystore on logout:", err);
    }

    set({
      profile: null,
      device: null,
      secrets: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  /**
   * Updates fields on the active user profile.
   */
  updateProfile: async (updates: Partial<UserProfile>) => {
    const current = get().profile;
    if (!current) return;

    const updated = { ...current, ...updates };
    set({ profile: updated });

    // TODO: In Step 1.3, update in Dexie as well
  },
}));
