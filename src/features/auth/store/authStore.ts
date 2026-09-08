import { create } from "zustand";
import type { AuthState, UserProfile, UserSecrets } from "../../../types/auth";
import {
  saveLocalIdentity,
  loadLocalIdentity,
  clearLocalIdentity,
  updateLocalProfile,
} from "../../../db";
import { requestPersistentStorage } from "../../../services/storagePersistence";

let initPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  secrets: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        const stored = await loadLocalIdentity();
        if (stored) {
          set({
            profile: stored.profile,
            secrets: stored.secrets,
            isAuthenticated: true,
            isLoading: false,
          });
          // Secure browser persistent storage in the background
          requestPersistentStorage().catch(console.warn);
        } else {
          set({
            profile: null,
            secrets: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (err) {
        console.error("Failed to initialize auth from IndexedDB:", err);
        set({
          profile: null,
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

  login: async (profile: UserProfile, secrets: UserSecrets) => {
    try {
      await saveLocalIdentity(profile, secrets);
      // Lock persistence with browser
      await requestPersistentStorage();

      set({
        profile,
        secrets,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      console.error("Failed to save auth to IndexedDB:", err);
      // Still allow in-memory login if IndexedDB encounters an issue
      set({
        profile,
        secrets,
        isAuthenticated: true,
        isLoading: false,
      });
    }
  },

  logout: async () => {
    try {
      await clearLocalIdentity();
    } catch (err) {
      console.warn("Failed to clear IndexedDB on logout:", err);
    }
    set({
      profile: null,
      secrets: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const current = get().profile;
    if (!current) return;

    const updated = { ...current, ...updates };
    try {
      await updateLocalProfile(current.id, updates);
    } catch (err) {
      console.warn("Failed to update profile in IndexedDB:", err);
    }

    set({ profile: updated });
  },
}));
