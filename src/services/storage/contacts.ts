import { db } from "./db.ts";

export interface ContactProfile {
  name: string;
  avatar?: string | null;
  bio?: string | null;
  age?: number | null;
}

export interface Contact {
  contactID: string; // Canonical Master Account ID (0x...)
  name: string;
  profile: ContactProfile;
  hasConversation?: boolean;
  isBlocked?: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Saves or updates a contact in the database.
 */
export const saveContact = async (contact: Contact): Promise<string> => {
  const normId = contact.contactID.trim().toLowerCase();
  const name = contact.name || contact.profile?.name || "";
  const profile: ContactProfile = {
    name,
    avatar: contact.profile?.avatar ?? null,
    bio: contact.profile?.bio ?? null,
    age: contact.profile?.age ?? null,
  };

  const record: Contact = {
    ...contact,
    contactID: normId,
    name,
    profile,
    updatedAt: contact.updatedAt || Date.now(),
  };

  return await db.contacts.put(record);
};

/**
 * Retrieves a contact by their canonical contactID.
 */
export const getContact = async (
  contactId: string,
): Promise<Contact | undefined> => {
  const norm = contactId.trim().toLowerCase();
  return await db.contacts.get(norm);
};

/**
 * Retrieves all contacts from local database.
 */
export const getAllContacts = async (): Promise<Contact[]> => {
  return await db.contacts.toArray();
};

/**
 * Updates profile information (name, avatar, bio, age) for a contact.
 */
export const updateContactProfile = async (
  contactId: string,
  updates: Partial<ContactProfile>,
): Promise<number> => {
  const norm = contactId.trim().toLowerCase();
  const existing = await getContact(norm);
  if (!existing) return 0;

  const updatedProfile: ContactProfile = {
    ...existing.profile,
    ...updates,
  };

  return await db.contacts.update(norm, {
    name: updatedProfile.name || existing.name,
    profile: updatedProfile,
    updatedAt: Date.now(),
  });
};

/**
 * Deletes a contact from the database.
 */
export const deleteContact = async (contactId: string): Promise<void> => {
  const norm = contactId.trim().toLowerCase();
  await db.contacts.delete(norm);
};

/**
 * Checks if a specific contact is currently blocked.
 */
export const isContactBlocked = async (contactId: string): Promise<boolean> => {
  const contact = await getContact(contactId);
  return Boolean(contact?.isBlocked);
};

/**
 * Sets whether a contact is blocked.
 */
export const setContactBlocked = async (
  contactId: string,
  isBlocked: boolean,
): Promise<number> => {
  const norm = contactId.trim().toLowerCase();
  return await db.contacts.update(norm, {
    isBlocked,
    updatedAt: Date.now(),
  });
};

/**
 * Sets whether an active conversation thread exists for a contact.
 */
export const setContactHasConversation = async (
  contactId: string,
  hasConversation: boolean,
): Promise<number> => {
  const norm = contactId.trim().toLowerCase();
  return await db.contacts.update(norm, {
    hasConversation,
    updatedAt: Date.now(),
  });
};

/**
 * Retrieves all contacts that have an active conversation thread.
 */
export const getActiveConversationContacts = async (): Promise<Contact[]> => {
  return await db.contacts.filter((c) => Boolean(c.hasConversation)).toArray();
};
