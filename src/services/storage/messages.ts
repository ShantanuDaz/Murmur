import { db } from "./db.ts";
import { getOrCreateRoom, updateRoomLastMessage } from "./rooms.ts";

export type MessageStatus = "pending" | "delivered" | "read";

export interface Message {
  id: string; // UUID primary key
  roomId: string;
  senderAccountId: string;
  recipientAccountId: string;
  content: string;
  status: MessageStatus;
  timestamp: number;
}

/**
 * Saves a message into Dexie and atomically updates the room summary.
 */
export const saveMessage = async (
  message: Message,
  myAccountId?: string,
): Promise<string> => {
  return await db.transaction("rw", [db.messages, db.rooms], async () => {
    // 1. Ensure conversation room exists
    if (myAccountId) {
      const peerAccountId =
        message.senderAccountId.toLowerCase() === myAccountId.toLowerCase()
          ? message.recipientAccountId
          : message.senderAccountId;

      await getOrCreateRoom(myAccountId, peerAccountId);
    }

    // 2. Put message
    await db.messages.put(message);

    // 3. Update room summary
    const isIncoming = Boolean(
      myAccountId &&
      message.senderAccountId.toLowerCase() !== myAccountId.toLowerCase(),
    );

    await updateRoomLastMessage(
      message.roomId,
      message.content,
      message.timestamp,
      isIncoming,
    );

    return message.id;
  });
};

/**
 * Retrieves all messages for a given room sorted chronologically.
 */
export const getMessagesForRoom = async (
  roomId: string,
  limit = 100,
): Promise<Message[]> => {
  const messages = await db.messages
    .where("roomId")
    .equals(roomId)
    .sortBy("timestamp");

  return limit ? messages.slice(-limit) : messages;
};

/**
 * Retrieves pending messages waiting in the local outbox.
 * Optionally filters for a specific recipient (used during outbox flush).
 */
export const getPendingOutboxMessages = async (
  recipientAccountId?: string,
): Promise<Message[]> => {
  if (recipientAccountId) {
    const norm = recipientAccountId.trim().toLowerCase();
    return await db.messages
      .where("[recipientAccountId+status]")
      .equals([norm, "pending"])
      .sortBy("timestamp");
  }

  return await db.messages
    .where("status")
    .equals("pending")
    .sortBy("timestamp");
};

/**
 * Marks a single message as delivered upon peer acknowledgment.
 */
export const markMessageDelivered = async (
  messageId: string,
): Promise<void> => {
  await db.messages.update(messageId, { status: "delivered" });
};

/**
 * Batch updates multiple messages as delivered upon bulk acknowledgment.
 */
export const markMessagesDelivered = async (
  messageIds: string[],
): Promise<void> => {
  await db.transaction("rw", db.messages, async () => {
    for (const id of messageIds) {
      await db.messages.update(id, { status: "delivered" });
    }
  });
};

/**
 * Marks all incoming messages in a room as read when opened.
 */
export const markMessagesReadInRoom = async (
  roomId: string,
  myAccountId: string,
): Promise<void> => {
  const normMyId = myAccountId.trim().toLowerCase();
  await db.transaction("rw", db.messages, async () => {
    const unread = await db.messages
      .where("roomId")
      .equals(roomId)
      .filter(
        (m) =>
          m.recipientAccountId.toLowerCase() === normMyId &&
          m.status !== "read",
      )
      .toArray();

    for (const m of unread) {
      await db.messages.update(m.id, { status: "read" });
    }
  });
};

/**
 * Deletes a specific message.
 */
export const deleteMessage = async (messageId: string): Promise<void> => {
  await db.messages.delete(messageId);
};
