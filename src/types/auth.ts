/**
 * Cryptographic delegation certificate proving that a physical device
 * is authorized to act on behalf of a Master Root Account.
 */
export interface DeviceCertificate {
  accountId: string; // Master Ed25519 public key (hex)
  deviceId: string; // Unique hardware/instance UUID
  deviceSigningPubHex: string; // Device Ed25519 public key (hex)
  deviceEncryptPubHex: string; // Device X25519 public key (hex)
  issuedAt: number; // Unix timestamp in milliseconds
  expiresAt: number; // Unix timestamp in ms (0 = permanent / non-expiring)
  signatureHex: string; // Master Ed25519 signature certifying this certificate
}

/**
 * The physical device's local private vault.
 * Stored only on this browser instance and never shared with other peers.
 */
export interface DeviceKeyring {
  deviceId: string;
  deviceName: string; // Human-friendly label (e.g., "Desktop Chrome", "iPhone")
  signingPriv: Uint8Array; // 32-byte Ed25519 private key for signing messages
  signingPubHex: string; // 32-byte Ed25519 public key in hex
  encryptPriv: Uint8Array; // 32-byte X25519 private key for Diffie-Hellman E2EE
  encryptPubHex: string; // 32-byte X25519 public key in hex
  certificate: DeviceCertificate;
}

/**
 * Public profile information visible to other peers in rooms.
 */
export interface UserProfile {
  accountId: string; // Canonical Master Ed25519 public key in hex
  name: string;
  avatar: string;
  bio?: string;
  birthday?: string;
  createdAt: number;
}

/**
 * Root account secrets (Certificate Authority).
 * Present on primary devices; omitted on secondary companion devices linked via QR.
 */
export interface UserSecrets {
  accountId: string;
  mnemonic?: string; // 24-word recovery phrase
  seedHex?: string; // Master seed in hex
  masterSigningPriv?: Uint8Array; // Master Ed25519 private key
}

/**
 * Zustand Auth state and lifecycle actions.
 */
export interface AuthState {
  profile: UserProfile | null;
  device: DeviceKeyring | null;
  secrets: UserSecrets | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  initialize: () => Promise<void>;
  login: (
    profile: UserProfile,
    device: DeviceKeyring,
    secrets?: UserSecrets,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}
