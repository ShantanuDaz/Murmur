import type { DeviceIdentity } from "../../features/auth/authTypes.ts";

export interface MasterAccount {
  accountId: string; // Canonical 0x... master Ed25519 public key
  masterPrivateKey: Uint8Array; // 32-byte Ed25519 private key
  masterPublicKey: Uint8Array; // 32-byte Ed25519 public key
}

export interface DeviceKeypairs {
  // Public keys (shared openly)
  signingPublicKey: string; // 0x... (Ed25519)
  encryptionPublicKey: string; // 0x... (X25519)

  // Private keys (kept strictly local/offline)
  signingPrivateKey: Uint8Array;
  encryptionPrivateKey: Uint8Array;
}

export interface DeviceCreationResult {
  device: DeviceIdentity;
  privateKeys: {
    signingPrivateKey: Uint8Array;
    encryptionPrivateKey: Uint8Array;
  };
}
