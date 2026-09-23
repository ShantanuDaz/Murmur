import { bytesToHex, hexToBytes } from "@noble/curves/utils.js";
import { db } from "./db.ts";
import type {
  DeviceIdentity,
  LocalDeviceKeys,
  Profile,
} from "../../features/auth/authTypes.ts";
import { getStorageItem, removeStorageItem } from "../../utils/storage.ts";
import { isValidStoredDeviceKeys } from "../crypto/keystore.ts";
import type { StoredDeviceKeys } from "../crypto/types.ts";
import { isValidDevice, isValidProfile } from "../../features/auth/utils.ts";
import { verifyDeviceKeysMatch } from "../crypto/index.ts";

export const ACTIVE_IDENTITY_ID = "active";

export interface StoredLocalIdentity {
  id: string; // "active"
  accountId: string;
  profile: Profile;
  device: DeviceIdentity;
  deviceKeys: {
    signingPrivateKey: string; // 0x... hex
    encryptionPrivateKey: string; // 0x... hex
  };
  mnemonic?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface LoadedIdentityResult {
  profile: Profile;
  device: DeviceIdentity;
  deviceKeys: LocalDeviceKeys;
  mnemonic: string | null;
  isPrimary: boolean;
}

/**
 * Saves the active local identity (profile, certified device, private keys, and optional mnemonic)
 * to Dexie IndexedDB in a single atomic transaction.
 */
export const saveLocalIdentity = async (params: {
  profile: Profile;
  device: DeviceIdentity;
  deviceKeys: LocalDeviceKeys;
  mnemonic?: string | null;
}): Promise<void> => {
  const { profile, device, deviceKeys, mnemonic } = params;

  const storedData: StoredLocalIdentity = {
    id: ACTIVE_IDENTITY_ID,
    accountId: device.accountId,
    profile,
    device,
    deviceKeys: {
      signingPrivateKey: `0x${bytesToHex(deviceKeys.signingPrivateKey)}`,
      encryptionPrivateKey: `0x${bytesToHex(deviceKeys.encryptionPrivateKey)}`,
    },
    mnemonic: mnemonic?.trim() || null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await db.identity.put(storedData);
};

/**
 * Loads the active local identity from Dexie.
 * If legacy credentials exist in localStorage, automatically migrates them to Dexie.
 */
export const loadLocalIdentity =
  async (): Promise<LoadedIdentityResult | null> => {
    // 1. Check Dexie IndexedDB first
    const record = await db.identity.get(ACTIVE_IDENTITY_ID);

    if (record) {
      try {
        const signingPrivateKey = hexToBytes(
          record.deviceKeys.signingPrivateKey.replace(/^0x/, ""),
        );
        const encryptionPrivateKey = hexToBytes(
          record.deviceKeys.encryptionPrivateKey.replace(/^0x/, ""),
        );

        const keys: LocalDeviceKeys = {
          signingPrivateKey,
          encryptionPrivateKey,
        };

        if (!verifyDeviceKeysMatch(record.device, keys)) {
          console.warn(
            "[Identity] Stored private keys do not match device certificate.",
          );
          return null;
        }

        return {
          profile: record.profile,
          device: record.device,
          deviceKeys: keys,
          mnemonic: record.mnemonic || null,
          isPrimary: Boolean(record.mnemonic),
        };
      } catch (err) {
        console.error("[Identity] Failed to decode stored device keys:", err);
        return null;
      }
    }

    // 2. Fallback: Check and migrate legacy localStorage data if present
    const legacyDevice = getStorageItem("device", isValidDevice);
    const legacyKeysData = getStorageItem<StoredDeviceKeys>(
      "device_keys",
      isValidStoredDeviceKeys,
    );

    if (legacyDevice && legacyKeysData) {
      try {
        const signingPrivateKey = hexToBytes(
          legacyKeysData.signingPrivateKey.replace(/^0x/, ""),
        );
        const encryptionPrivateKey = hexToBytes(
          legacyKeysData.encryptionPrivateKey.replace(/^0x/, ""),
        );

        const keys: LocalDeviceKeys = {
          signingPrivateKey,
          encryptionPrivateKey,
        };

        if (verifyDeviceKeysMatch(legacyDevice, keys)) {
          const legacyProfile = getStorageItem("profile", isValidProfile) || {
            name: legacyDevice.deviceName,
            age: null,
            bio: null,
            avatar: null,
          };
          const legacyMnemonic = getStorageItem<string>("mnemonic");

          // Migrate to Dexie
          await saveLocalIdentity({
            profile: legacyProfile,
            device: legacyDevice,
            deviceKeys: keys,
            mnemonic: legacyMnemonic,
          });

          // Clean up legacy localStorage keys
          removeStorageItem("device");
          removeStorageItem("device_keys");
          removeStorageItem("profile");
          removeStorageItem("mnemonic");

          return {
            profile: legacyProfile,
            device: legacyDevice,
            deviceKeys: keys,
            mnemonic: legacyMnemonic || null,
            isPrimary: Boolean(legacyMnemonic),
          };
        }
      } catch (err) {
        console.error("[Identity] Failed to migrate legacy localStorage:", err);
      }
    }

    return null;
  };

/**
 * Updates the local user's profile metadata (display name, avatar, bio).
 */
export const updateLocalProfile = async (profile: Profile): Promise<void> => {
  const record = await db.identity.get(ACTIVE_IDENTITY_ID);
  if (!record) return;

  await db.identity.update(ACTIVE_IDENTITY_ID, {
    profile,
    updatedAt: Date.now(),
  });
};

/**
 * Permanently removes the local identity and cryptographic keys from Dexie.
 */
export const clearLocalIdentity = async (): Promise<void> => {
  await db.identity.delete(ACTIVE_IDENTITY_ID);
};
