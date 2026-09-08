import {
  generateMnemonic,
  mnemonicToSeedSync,
  validateMnemonic,
} from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { ed25519, x25519 } from "@noble/curves/ed25519.js";
import type { UserSecrets } from "../../../types/auth";

export const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export const hexToBytes = (hex: string): Uint8Array => {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

export interface GeneratedKeyring {
  mnemonic: string;
  seedHex: string;
  ed25519PubHex: string;
  x25519PubHex: string;
  secrets: UserSecrets;
}

export const deriveIdentityFromMnemonic = (
  rawMnemonic: string,
): GeneratedKeyring => {
  const cleanMnemonic = rawMnemonic.trim().replace(/\s+/g, " ");
  const seed = mnemonicToSeedSync(cleanMnemonic);

  // 1. Ed25519 for Identity & Signing (first 32 bytes)
  const ed25519Priv = seed.slice(0, 32);
  const ed25519Pub = ed25519.getPublicKey(ed25519Priv);
  const ed25519PubHex = bytesToHex(ed25519Pub);

  // 2. X25519 for E2E Encryption (second 32 bytes)
  const x25519Priv = seed.slice(32, 64);
  const x25519Pub = x25519.getPublicKey(x25519Priv);
  const x25519PubHex = bytesToHex(x25519Pub);

  const seedHex = bytesToHex(seed);

  return {
    mnemonic: cleanMnemonic,
    seedHex,
    ed25519PubHex,
    x25519PubHex,
    secrets: {
      id: ed25519PubHex,
      mnemonic: cleanMnemonic,
      seedHex,
      ed25519Priv,
      x25519Priv,
    },
  };
};

export const generateIdentity = (): GeneratedKeyring => {
  const mnemonic = generateMnemonic(wordlist, 256);
  return deriveIdentityFromMnemonic(mnemonic);
};

export const isValidMnemonic = (rawMnemonic: string): boolean => {
  const clean = rawMnemonic.trim().replace(/\s+/g, " ");
  const words = clean.split(" ");
  if (words.length !== 24 && words.length !== 12) {
    return false;
  }
  return validateMnemonic(clean, wordlist);
};

export const shortenKey = (key: string, start = 6, end = 4): string => {
  if (!key || key.length <= start + end) return key;
  return `${key.slice(0, start)}...${key.slice(-end)}`;
};
