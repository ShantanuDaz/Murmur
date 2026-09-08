import Dexie, { type Table } from "dexie";
import type { UserProfile, UserSecrets } from "../types/auth";

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
}

export class MurmurDatabase extends Dexie {
  profiles!: Table<UserProfile, string>;
  credentials!: Table<UserSecrets, string>;
  messages!: Table<ChatMessage, string>;

  constructor() {
    super("MurmurDatabase");
    this.version(1).stores({
      profiles: "id, name, createdAt",
      credentials: "id",
      messages: "id, roomId, senderId, timestamp",
    });
  }
}

export const db = new MurmurDatabase();

/**
 * Saves the active user profile and private credentials to IndexedDB.
 */
export async function saveLocalIdentity(
  profile: UserProfile,
  secrets: UserSecrets,
): Promise<void> {
  await db.transaction("rw", db.profiles, db.credentials, async () => {
    await db.profiles.put(profile);
    await db.credentials.put(secrets);
  });
}

/**
 * Loads the most recently saved identity from IndexedDB.
 */
export async function loadLocalIdentity(): Promise<{
  profile: UserProfile;
  secrets: UserSecrets;
} | null> {
  const profile = await db.profiles.orderBy("createdAt").last();
  if (!profile) return null;

  const secrets = await db.credentials.get(profile.id);
  if (!secrets) return null;

  // Ensure Uint8Array instances are preserved (e.g. if loaded via structured clone)
  const normalizedSecrets: UserSecrets = {
    ...secrets,
    ed25519Priv:
      secrets.ed25519Priv instanceof Uint8Array
        ? secrets.ed25519Priv
        : new Uint8Array(Object.values(secrets.ed25519Priv)),
    x25519Priv:
      secrets.x25519Priv instanceof Uint8Array
        ? secrets.x25519Priv
        : new Uint8Array(Object.values(secrets.x25519Priv)),
  };

  return { profile, secrets: normalizedSecrets };
}

/**
 * Updates profile fields in IndexedDB.
 */
export async function updateLocalProfile(
  id: string,
  updates: Partial<UserProfile>,
): Promise<void> {
  await db.profiles.update(id, updates);
}

/**
 * Clears all identity data from IndexedDB on logout.
 */
export async function clearLocalIdentity(): Promise<void> {
  await db.transaction("rw", db.profiles, db.credentials, async () => {
    await db.profiles.clear();
    await db.credentials.clear();
  });
}
