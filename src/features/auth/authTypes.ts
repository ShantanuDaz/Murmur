export interface DeviceIdentity {
  deviceId: string; // Unique device UUID
  accountId: string; // Master Public Key ("0xABC...")
  deviceName: string; // Human-readable label (e.g. "Chrome on Linux")
  signingPublicKey: string; // Device Ed25519 public key (for message signatures)
  encryptionPublicKey: string; // Device X25519 public key (for E2EE encryption)
  createdAt: number; // Authorization timestamp
  badgeSignature: string; // Master Ed25519 signature certifying this device
  isPrimary: boolean; // True if this device holds root signing authority
}

export interface Profile {
  name: string;
  age: number | null;
  bio: string | null;
  avatar: string | null;
}

export interface LocalDeviceKeys {
  signingPrivateKey: Uint8Array;
  encryptionPrivateKey: Uint8Array;
}

export interface AuthState {
  isIdentityExists: boolean | null; // null = uninitialized, true = registered, false = onboarding needed
  isLoading: boolean;
  isPrimaryDevice: boolean; // True if this device possesses the 24-word root seed
  device: DeviceIdentity | null;
  profile: Profile | null;

  initialize: (force?: boolean) => Promise<void>;
  setDevice: (device: DeviceIdentity | null) => void;
  setProfile: (profile: Profile | null) => void;
  setIdentity: (params: {
    device: DeviceIdentity;
    profile: Profile;
    deviceKeys: LocalDeviceKeys;
    mnemonic: string | null;
  }) => void;
  getMnemonic: () => string | null;
  getDeviceKeys: () => LocalDeviceKeys | null;
  logout: () => void;
}
