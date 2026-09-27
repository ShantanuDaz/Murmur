import type { DoorbellSignal } from "../type.ts";
import {
  getContact,
  isContactBlocked,
  saveContact,
  setContactHasConversation,
} from "../../../../services/storage/contacts.ts";

const SIGNAL_FRESHNESS_WINDOW_MS = 30_000;

export const handleKnock = async (signal: DoorbellSignal): Promise<void> => {
  if (!signal || !signal.accountId || !signal.timestamp) {
    return;
  }

  // 1. Freshness check: drop replayed or stale signals older than 30s
  if (Math.abs(Date.now() - signal.timestamp) > SIGNAL_FRESHNESS_WINDOW_MS) {
    console.warn(`[Presence] Dropped stale signal from ${signal.accountId}`);
    return;
  }

  const accountId = signal.accountId.trim().toLowerCase();

  // 2. Blocklist check: ignore if user is blocked
  const isBlocked = await isContactBlocked(accountId);
  if (isBlocked) {
    console.warn(`[Presence] Ignored knock from blocked contact: ${accountId}`);
    return;
  }

  // 3. Ensure contact record exists in local Dexie store and hasConversation is true
  const existingContact = await getContact(accountId);
  if (!existingContact) {
    const now = Date.now();
    const shortId = accountId.startsWith("0x")
      ? accountId.slice(2, 8)
      : accountId.slice(0, 6);

    await saveContact({
      contactID: accountId,
      name: `User 0x${shortId}`,
      profile: {
        name: `User 0x${shortId}`,
        avatar: null,
        bio: null,
      },
      hasConversation: true,
      createdAt: now,
      updatedAt: now,
    });
  } else if (!existingContact.hasConversation) {
    await setContactHasConversation(accountId, true);
  }

  console.log(`[Presence] ✅ Verified knock from: ${accountId}`);
  // Chat session / private room rendezvous will hook in here
};
