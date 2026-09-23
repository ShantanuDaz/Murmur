import { create } from "zustand";
import useAuth from "../store/authStore.ts";
import {
  generateNewMnemonic,
  isValidMnemonic,
  deriveMasterAccount,
  createDeviceCertificate,
} from "../../../services/crypto/index.ts";
import { saveLocalIdentity } from "../../../services/storage/index.ts";

export type OnboardingStep = "welcome" | "generate" | "restore" | "profile";

export interface OnboardingState {
  step: OnboardingStep;
  mnemonic: string;
  name: string;
  bio: string;
  avatar: string | null;
  deviceName: string;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  setStep: (step: OnboardingStep) => void;
  setMnemonic: (mnemonic: string) => void;
  setName: (name: string) => void;
  setBio: (bio: string) => void;
  setAvatar: (avatar: string | null) => void;
  setDeviceName: (deviceName: string) => void;
  setError: (error: string | null) => void;

  startNewIdentity: () => void;
  startRestoreIdentity: () => void;
  finishOnboarding: () => Promise<boolean>;
  reset: () => void;
}

const getDefaultDeviceName = (): string => {
  if (typeof navigator === "undefined") return "Web Client";
  const userAgent = navigator.userAgent;
  let browser = "Browser";
  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Safari")) browser = "Safari";

  let os = "Desktop";
  if (userAgent.includes("Macintosh") || userAgent.includes("Mac OS"))
    os = "macOS";
  else if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad"))
    os = "iOS";

  return `${browser} on ${os}`;
};

const initialState = {
  step: "welcome" as OnboardingStep,
  mnemonic: "",
  name: "",
  bio: "",
  avatar: null,
  deviceName: getDefaultDeviceName(),
  isSubmitting: false,
  error: null,
};

export const useOnboarding = create<OnboardingState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step, error: null }),
  setMnemonic: (mnemonic) => set({ mnemonic, error: null }),
  setName: (name) => set({ name, error: null }),
  setBio: (bio) => set({ bio }),
  setAvatar: (avatar) => set({ avatar }),
  setDeviceName: (deviceName) => set({ deviceName }),
  setError: (error) => set({ error }),

  startNewIdentity: () => {
    const words = generateNewMnemonic();
    set({
      mnemonic: words,
      step: "generate",
      error: null,
    });
  },

  startRestoreIdentity: () => {
    set({
      mnemonic: "",
      step: "restore",
      error: null,
    });
  },

  finishOnboarding: async () => {
    const { mnemonic, name, bio, avatar, deviceName } = get();

    if (!mnemonic.trim() || !isValidMnemonic(mnemonic.trim())) {
      set({ error: "Please enter a valid 24-word seed phrase." });
      return false;
    }

    if (!name.trim()) {
      set({ error: "Please choose a display name." });
      return false;
    }

    try {
      set({ isSubmitting: true, error: null });

      // 1. Derive Master Ed25519 Account ID & Private Key from 24 words
      const master = deriveMasterAccount(mnemonic.trim());

      // 2. Generate Device Keypairs and Master-Signed Certificate as primary device
      const { device, privateKeys } = createDeviceCertificate({
        masterPrivateKey: master.masterPrivateKey,
        accountId: master.accountId,
        deviceName: deviceName.trim() || getDefaultDeviceName(),
        isPrimary: true,
      });

      const profile = {
        name: name.trim(),
        bio: bio.trim() || null,
        avatar,
        age: null,
      };

      // 3. Persist complete atomic identity directly into Dexie IndexedDB
      await saveLocalIdentity({
        profile,
        device,
        deviceKeys: privateKeys,
        mnemonic: mnemonic.trim(),
      });

      // 4. Update live Auth Store state immediately
      useAuth.getState().setIdentity({
        device,
        profile,
        deviceKeys: privateKeys,
        mnemonic: mnemonic.trim(),
      });

      // 5. Zero out transient onboarding wizard state
      set({ ...initialState });

      return true;
    } catch (err) {
      console.error("Failed to finish onboarding:", err);
      set({
        error:
          err instanceof Error ? err.message : "Failed to create identity.",
        isSubmitting: false,
      });
      return false;
    }
  },

  reset: () => set({ ...initialState }),
}));

export default useOnboarding;
