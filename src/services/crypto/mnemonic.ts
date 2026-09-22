import {
  generateMnemonic,
  validateMnemonic,
  mnemonicToSeedSync,
} from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";

/**
 * Generates a fresh, cryptographically secure 24-word BIP-39 mnemonic phrase.
 * (256 bits of entropy = 24 words)
 */
export const generateNewMnemonic = (): string => {
  return generateMnemonic(wordlist, 256);
};

/**
 * Validates whether a given phrase consists of valid BIP-39 words and correct checksum.
 */
export const isValidMnemonic = (phrase: string): boolean => {
  return validateMnemonic(phrase.trim(), wordlist);
};

/**
 * Converts a 24-word phrase into a 512-bit (64-byte) binary master seed.
 */
export const mnemonicToSeed = (mnemonic: string): Uint8Array => {
  if (!isValidMnemonic(mnemonic)) {
    throw new Error("Invalid 24-word seed phrase");
  }
  return mnemonicToSeedSync(mnemonic.trim());
};
