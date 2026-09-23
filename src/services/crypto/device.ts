import { ed25519, x25519 } from "@noble/curves/ed25519.js";
import { bytesToHex, hexToBytes } from "@noble/curves/utils.js";
import type { DeviceIdentity } from "../../features/auth/authTypes.ts";
import type { DeviceCreationResult, DeviceKeypairs } from "./types.ts";
import { v4 as uuidv4 } from "uuid";

/**
 * Generates fresh, random Ed25519 (signing) and X25519 (encryption) keypairs
 * for a local client device.
 */
export const generateDeviceKeypairs = (): DeviceKeypairs => {
  // 1. Ed25519 Signing Keypair (for message & presence signatures)
  const signingPrivateKey = ed25519.utils.randomSecretKey();
  const signingPublicKeyBytes = ed25519.getPublicKey(signingPrivateKey);
  const signingPublicKey = `0x${bytesToHex(signingPublicKeyBytes)}`;

  // 2. X25519 Encryption Keypair (for Diffie-Hellman E2EE)
  const encryptionPrivateKey = x25519.utils.randomSecretKey();
  const encryptionPublicKeyBytes = x25519.getPublicKey(encryptionPrivateKey);
  const encryptionPublicKey = `0x${bytesToHex(encryptionPublicKeyBytes)}`;

  return {
    signingPublicKey,
    encryptionPublicKey,
    signingPrivateKey,
    encryptionPrivateKey,
  };
};

export interface DevicePayloadToSign {
  deviceId: string;
  accountId: string;
  deviceName: string;
  signingPublicKey: string;
  encryptionPublicKey: string;
  createdAt: number;
  isPrimary: boolean;
}

/**
 * Deterministically serializes device data into bytes to be signed or verified.
 * Guarantees identical byte output regardless of object key order.
 */
export const serializeDevicePayload = (
  payload: DevicePayloadToSign,
): Uint8Array => {
  const canonicalString = JSON.stringify({
    deviceId: payload.deviceId,
    accountId: payload.accountId,
    deviceName: payload.deviceName,
    signingPublicKey: payload.signingPublicKey,
    encryptionPublicKey: payload.encryptionPublicKey,
    createdAt: payload.createdAt,
    isPrimary: Boolean(payload.isPrimary),
  });
  return new TextEncoder().encode(canonicalString);
};

/**
 * Creates and signs a new Device Certificate using the Master Private Key.
 * Returns the public DeviceIdentity along with the local private keys.
 */
export const createDeviceCertificate = (params: {
  masterPrivateKey: Uint8Array;
  accountId: string;
  deviceName?: string;
  isPrimary?: boolean;
}): DeviceCreationResult => {
  const keypairs = generateDeviceKeypairs();
  const deviceId = uuidv4();
  const deviceName = params.deviceName?.trim() || "Default Device";
  const createdAt = Date.now();
  const isPrimary = params.isPrimary ?? true;

  const payload: DevicePayloadToSign = {
    deviceId,
    accountId: params.accountId,
    deviceName,
    signingPublicKey: keypairs.signingPublicKey,
    encryptionPublicKey: keypairs.encryptionPublicKey,
    createdAt,
    isPrimary,
  };

  const payloadBytes = serializeDevicePayload(payload);
  const signatureBytes = ed25519.sign(payloadBytes, params.masterPrivateKey);
  const badgeSignature = `0x${bytesToHex(signatureBytes)}`;

  const device: DeviceIdentity = {
    ...payload,
    badgeSignature,
  };

  return {
    device,
    privateKeys: {
      signingPrivateKey: keypairs.signingPrivateKey,
      encryptionPrivateKey: keypairs.encryptionPrivateKey,
    },
  };
};

/**
 * Verifies that a DeviceIdentity was legitimately signed by the Master Account ID.
 * Returns true if mathematically valid, false otherwise.
 */
export const verifyDeviceCertificate = (device: DeviceIdentity): boolean => {
  try {
    const payloadBytes = serializeDevicePayload(device);
    const signatureBytes = hexToBytes(device.badgeSignature.replace(/^0x/, ""));
    const masterPublicKeyBytes = hexToBytes(
      device.accountId.replace(/^0x/, ""),
    );

    return ed25519.verify(signatureBytes, payloadBytes, masterPublicKeyBytes);
  } catch (error) {
    console.error("Failed to verify device certificate:", error);
    return false;
  }
};
