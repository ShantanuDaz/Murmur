export interface UserProfile {
  id: string; // Canonical Ed25519 public key hex
  name: string;
  avatar: string; // Preset avatar identifier
  bio?: string;
  birthday?: string; // Optional (YYYY-MM-DD or MM-DD)
  publicKey: string; // Ed25519 public key hex (for signature verification)
  encryptionKey: string; // X25519 public key hex (for Diffie-Hellman E2EE)
  createdAt: number;
}

export interface UserSecrets {
  id: string; // Matches UserProfile.id
  mnemonic: string; // 24-word recovery seed phrase
  seedHex: string; // 64-byte master seed in hex
  ed25519Priv: Uint8Array; // 32-byte Ed25519 private key
  x25519Priv: Uint8Array; // 32-byte X25519 private key
}

export interface AuthState {
  profile: UserProfile | null;
  secrets: UserSecrets | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  login: (profile: UserProfile, secrets: UserSecrets) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}
