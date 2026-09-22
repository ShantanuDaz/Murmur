import { ed25519 } from "@noble/curves/ed25519.js";
import { bytesToHex } from "@noble/curves/utils.js";
import { mnemonicToSeed } from "./mnemonic.ts";
import type { MasterAccount } from "./types.ts";

/**
 * Derives the Master Ed25519 keypair and permanent accountId from a 24-word phrase.
 * This derivation is 100% deterministic.
 */
export const deriveMasterAccount = (mnemonic: string): MasterAccount => {
  const seed = mnemonicToSeed(mnemonic);

  // Take the first 32 bytes as the master Ed25519 private key
  const masterPrivateKey = seed.slice(0, 32);

  // Derive the 32-byte master public key
  const masterPublicKey = ed25519.getPublicKey(masterPrivateKey);

  // Format canonical Account ID (0x...)
  const accountId = `0x${bytesToHex(masterPublicKey)}`;

  return {
    accountId,
    masterPrivateKey,
    masterPublicKey,
  };
};

/**
 * Signs arbitrary data bytes using the Master Private Key.
 */
export const signWithMaster = (
  masterPrivateKey: Uint8Array,
  message: Uint8Array,
): Uint8Array => {
  return ed25519.sign(message, masterPrivateKey);
};
