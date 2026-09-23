import { ed25519 } from "@noble/curves/ed25519.js";
import { bytesToHex, hexToBytes } from "@noble/curves/utils.js";
import { verifyDeviceCertificate } from "../../../services/crypto/device.ts";
import type { DeviceIdentity } from "../../auth/authTypes.ts";
import type { HandshakePayload, SignedHandshake } from "../types.ts";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_MAX_CLOCK_SKEW_MS = 300_000; // 5 minutes tolerance for system clock differences

/**
 * Deterministically serializes a handshake payload into canonical byte form.
 * Ensures consistent byte output regardless of runtime key ordering.
 */
export const serializeHandshakePayload = (
  payload: HandshakePayload,
): Uint8Array => {
  const canonicalString = JSON.stringify({
    device: {
      deviceId: payload.device.deviceId,
      accountId: payload.device.accountId,
      deviceName: payload.device.deviceName,
      signingPublicKey: payload.device.signingPublicKey,
      encryptionPublicKey: payload.device.encryptionPublicKey,
      createdAt: payload.device.createdAt,
      badgeSignature: payload.device.badgeSignature,
      isPrimary: Boolean(payload.device.isPrimary),
    },
    targetAccountId: payload.targetAccountId.toLowerCase(),
    timestamp: payload.timestamp,
    nonce: payload.nonce,
  });

  return new TextEncoder().encode(canonicalString);
};

export interface CreateHandshakeParams {
  device: DeviceIdentity;
  targetAccountId: string;
  signingPrivateKey: Uint8Array;
}

/**
 * Generates and cryptographically signs a fresh liveness handshake
 * proving ownership of this device's private key.
 */
export const createSignedHandshake = (
  params: CreateHandshakeParams,
): SignedHandshake => {
  const payload: HandshakePayload = {
    device: params.device,
    targetAccountId: params.targetAccountId.trim().toLowerCase(),
    timestamp: Date.now(),
    nonce: uuidv4(),
  };

  const payloadBytes = serializeHandshakePayload(payload);
  const signatureBytes = ed25519.sign(payloadBytes, params.signingPrivateKey);
  const signature = `0x${bytesToHex(signatureBytes)}`;

  return {
    payload,
    signature,
  };
};

export interface VerifyHandshakeParams {
  signedHandshake: unknown;
  expectedTargetAccountId: string;
  maxClockSkewMs?: number;
}

export interface VerifyHandshakeResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Validates an incoming peer's signed handshake:
 * 1. Schema & format validation
 * 2. Target room anti-relay check
 * 3. Timestamp replay & clock-skew freshness
 * 4. Master account certificate signature (Chain of Trust)
 * 5. Device private key proof-of-possession (Liveness)
 */
export const verifySignedHandshake = (
  params: VerifyHandshakeParams,
): VerifyHandshakeResult => {
  const {
    signedHandshake,
    expectedTargetAccountId,
    maxClockSkewMs = DEFAULT_MAX_CLOCK_SKEW_MS,
  } = params;

  if (
    !signedHandshake ||
    typeof signedHandshake !== "object" ||
    !("payload" in signedHandshake) ||
    !("signature" in signedHandshake)
  ) {
    return { isValid: false, reason: "Malformed handshake structure" };
  }

  const { payload, signature } = signedHandshake as SignedHandshake;

  if (
    !payload ||
    !payload.device ||
    typeof payload.targetAccountId !== "string" ||
    typeof payload.timestamp !== "number" ||
    typeof payload.nonce !== "string" ||
    typeof signature !== "string"
  ) {
    return { isValid: false, reason: "Invalid handshake fields" };
  }

  // 1. Anti-Relay Check: Must be explicitly addressed to our account
  if (
    payload.targetAccountId.toLowerCase() !==
    expectedTargetAccountId.toLowerCase()
  ) {
    return {
      isValid: false,
      reason: `Target account mismatch: expected ${expectedTargetAccountId}, received ${payload.targetAccountId}`,
    };
  }

  // 2. Freshness Check: Prevents replay of old handshakes
  const now = Date.now();
  const timeDifference = Math.abs(now - payload.timestamp);
  if (timeDifference > maxClockSkewMs) {
    return {
      isValid: false,
      reason: `Handshake expired or clock skewed (${timeDifference}ms difference)`,
    };
  }

  // 3. Master Authority Check: Did the Master Public Key certify this device?
  const isMasterCertValid = verifyDeviceCertificate(payload.device);
  if (!isMasterCertValid) {
    return {
      isValid: false,
      reason: "Device certificate not authorized by master account ID",
    };
  }

  // 4. Proof of Possession Check: Does the peer possess the device private key?
  try {
    const payloadBytes = serializeHandshakePayload(payload);
    const signatureBytes = hexToBytes(signature.replace(/^0x/, ""));
    const devicePubkeyBytes = hexToBytes(
      payload.device.signingPublicKey.replace(/^0x/, ""),
    );

    const isDeviceKeyValid = ed25519.verify(
      signatureBytes,
      payloadBytes,
      devicePubkeyBytes,
    );

    if (!isDeviceKeyValid) {
      return {
        isValid: false,
        reason: "Device proof-of-possession signature verification failed",
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      reason: `Cryptographic verification error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};
