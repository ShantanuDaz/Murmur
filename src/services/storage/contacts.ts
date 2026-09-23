import { db } from "./db.ts";

export type ContactStatus =
  | "accepted"
  | "pending_incoming"
  | "pending_outgoing"
  | "blocked";

export interface Contact {
  accountId: string; // Canonical Master Account ID (0x...)
  name: string;
  avatar?: string | null;
  bio?: string | null;
  status: ContactStatus;
  createdAt: number;
  updatedAt: number;
}

/**
 * Saves or updates a contact in the database.
 */
export const saveContact = async (contact: Contact): Promise<string> => {
  return await db.contacts.put(contact);
};

/**
 * Retrieves a contact by their account ID (Murmur Number).
 */
export const getContact = async (
  accountId: string,
): Promise<Contact | undefined> => {
  return await db.contacts.get(accountId.toLowerCase());
};

/**
 * Retrieves all contacts, optionally filtered by status.
 */
export const getAllContacts = async (
  status?: ContactStatus,
): Promise<Contact[]> => {
  if (status) {
    return await db.contacts.where("status").equals(status).toArray();
  }
  return await db.contacts.toArray();
};

/**
 * Retrieves all pending incoming connection requests.
 */
export const getPendingIncomingContacts = async (): Promise<Contact[]> => {
  return await db.contacts.where("status").equals("pending_incoming").toArray();
};

/**
 * Retrieves all pending outgoing connection requests (waiting for peer rendezvous).
 */
export const getPendingOutgoingContacts = async (): Promise<Contact[]> => {
  return await db.contacts.where("status").equals("pending_outgoing").toArray();
};

/**
 * Retrieves all accepted mutual contacts.
 */
export const getAcceptedContacts = async (): Promise<Contact[]> => {
  return await db.contacts.where("status").equals("accepted").toArray();
};

/**
 * Creates or prepares a pending outgoing contact.
 */
export const createOutgoingContact = async (
  accountId: string,
  nickname?: string,
): Promise<Contact> => {
  const normalizedId = accountId.trim().toLowerCase();
  const existing = await getContact(normalizedId);

  const contact: Contact = {
    accountId: normalizedId,
    name:
      nickname?.trim() ||
      existing?.name ||
      `User ${normalizedId.slice(0, 8)}...`,
    avatar: existing?.avatar || null,
    bio: existing?.bio || null,
    status: "pending_outgoing",
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  await saveContact(contact);
  return contact;
};

/**
 * Updates the relationship status of a contact.
 */
export const updateContactStatus = async (
  accountId: string,
  status: ContactStatus,
): Promise<number> => {
  return await db.contacts.update(accountId.toLowerCase(), {
    status,
    updatedAt: Date.now(),
  });
};

/**
 * Updates profile information (name, avatar, bio) for a contact.
 */
export const updateContactProfile = async (
  accountId: string,
  updates: Partial<Pick<Contact, "name" | "avatar" | "bio">>,
): Promise<number> => {
  return await db.contacts.update(accountId.toLowerCase(), {
    ...updates,
    updatedAt: Date.now(),
  });
};

/**
 * Deletes a contact from the database.
 */
export const deleteContact = async (accountId: string): Promise<void> => {
  await db.contacts.delete(accountId.toLowerCase());
};

/**
 * Checks if a specific account is currently blocked.
 */
export const isContactBlocked = async (accountId: string): Promise<boolean> => {
  const contact = await getContact(accountId);
  return contact?.status === "blocked";
};
