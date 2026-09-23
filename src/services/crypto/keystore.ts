import { ed25519, x25519 } from "@noble/curves/ed25519.js";
import { bytesToHex, hexToBytes } from "@noble/curves/utils.js";
import type { DeviceIdentity } from "../../features/auth/authTypes.ts";
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from "../../utils/storage.ts";
import type { LocalDeviceKeys, StoredDeviceKeys } from "./types.ts";

const STORAGE_KEY_DEVICE_KEYS = "device_keys";

/**
 * Type guard ensuring the raw storage object matches StoredDeviceKeys schema.
 */
export const isValidStoredDeviceKeys = (
  data: unknown,
): data is StoredDeviceKeys => {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.deviceId === "string" &&
    typeof d.signingPrivateKey === "string" &&
    typeof d.encryptionPrivateKey === "string" &&
    d.signingPrivateKey.startsWith("0x") &&
    d.encryptionPrivateKey.startsWith("0x")
  );
};

/**
 * Safely encodes and persists local device private keys.
 */
export const storeDeviceKeys = (
  deviceId: string,
  privateKeys: LocalDeviceKeys,
): void => {
  const data: StoredDeviceKeys = {
    deviceId,
    signingPrivateKey: `0x${bytesToHex(privateKeys.signingPrivateKey)}`,
    encryptionPrivateKey: `0x${bytesToHex(privateKeys.encryptionPrivateKey)}`,
  };
  setStorageItem(STORAGE_KEY_DEVICE_KEYS, data);
};

/**
 * Loads and decodes local device private keys into Uint8Array format.
 * Returns null if missing, corrupted, or if the deviceId does not match.
 */
export const getStoredDeviceKeys = (
  expectedDeviceId?: string,
): LocalDeviceKeys | null => {
  const stored = getStorageItem<StoredDeviceKeys>(
    STORAGE_KEY_DEVICE_KEYS,
    isValidStoredDeviceKeys,
  );

  if (!stored) return null;

  if (expectedDeviceId && stored.deviceId !== expectedDeviceId) {
    console.warn(
      `Device key mismatch: stored deviceId (${stored.deviceId}) does not match expected (${expectedDeviceId})`,
    );
    return null;
  }

  try {
    const signingPrivateKey = hexToBytes(
      stored.signingPrivateKey.replace(/^0x/, ""),
    );
    const encryptionPrivateKey = hexToBytes(
      stored.encryptionPrivateKey.replace(/^0x/, ""),
    );

    return {
      signingPrivateKey,
      encryptionPrivateKey,
    };
  } catch (err) {
    console.error("Failed to decode device private keys:", err);
    return null;
  }
};

/**
 * Permanently removes local device private keys from storage.
 */
export const removeStoredDeviceKeys = (): void => {
  removeStorageItem(STORAGE_KEY_DEVICE_KEYS);
};

/**
 * Verifies that a given set of local private keys mathematically matches
 * the public keys certified inside a DeviceIdentity certificate.
 */
export const verifyDeviceKeysMatch = (
  device: DeviceIdentity,
  keys: LocalDeviceKeys,
): boolean => {
  try {
    const derivedSigningPub = `0x${bytesToHex(ed25519.getPublicKey(keys.signingPrivateKey))}`;
    const derivedEncryptionPub = `0x${bytesToHex(x25519.getPublicKey(keys.encryptionPrivateKey))}`;

    return (
      derivedSigningPub.toLowerCase() ===
        device.signingPublicKey.toLowerCase() &&
      derivedEncryptionPub.toLowerCase() ===
        device.encryptionPublicKey.toLowerCase()
    );
  } catch (error) {
    console.error("Failed to verify device keys against certificate:", error);
    return false;
  }
};
