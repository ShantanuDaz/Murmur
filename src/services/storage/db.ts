import Dexie, { type Table } from "dexie";
import type { Contact } from "./contacts.ts";
import type { StoredLocalIdentity } from "./identity.ts";
import type { Room } from "./rooms.ts";
import type { Message } from "./messages.ts";

export class MurmurDatabase extends Dexie {
  contacts!: Table<Contact, string>;
  identity!: Table<StoredLocalIdentity, string>;
  rooms!: Table<Room, string>;
  messages!: Table<Message, string>;

  constructor() {
    super("MurmurDB");
    this.version(1).stores({
      contacts: "accountId, status, createdAt, updatedAt",
      identity: "id, accountId",
      rooms: "roomId, peerAccountId, lastMessageTimestamp",
      messages:
        "id, roomId, senderAccountId, recipientAccountId, status, timestamp, [roomId+timestamp], [recipientAccountId+status]",
    });
  }

  /**
   * Clears all tables in the local database (used during logout / account purge).
   */
  public async clearAll(): Promise<void> {
    await Promise.all([
      this.contacts.clear(),
      this.identity.clear(),
      this.rooms.clear(),
      this.messages.clear(),
    ]);
  }
}

export const db = new MurmurDatabase();
