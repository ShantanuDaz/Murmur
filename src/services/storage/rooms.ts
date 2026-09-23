import { db } from "./db.ts";

export interface Room {
  roomId: string; // Primary Key: deterministic identifier (direct:0xAlice:0xBob)
  peerAccountId: string; // Canonical Murmur Number of the contact
  lastMessageText?: string | null;
  lastMessageTimestamp?: number | null;
  unreadCount: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Computes a deterministic 1:1 direct room ID from two Murmur Numbers.
 * Guarantees identical roomId regardless of which participant calls it.
 */
export const computeDirectRoomId = (
  accountA: string,
  accountB: string,
): string => {
  const [first, second] = [
    accountA.trim().toLowerCase(),
    accountB.trim().toLowerCase(),
  ].sort();

  return `direct:${first}:${second}`;
};

/**
 * Retrieves a room by its deterministic roomId.
 */
export const getRoom = async (roomId: string): Promise<Room | undefined> => {
  return await db.rooms.get(roomId);
};

/**
 * Retrieves or creates a 1:1 conversation room between the user and a peer.
 */
export const getOrCreateRoom = async (
  myAccountId: string,
  peerAccountId: string,
): Promise<Room> => {
  const roomId = computeDirectRoomId(myAccountId, peerAccountId);
  const existing = await getRoom(roomId);
  if (existing) return existing;

  const newRoom: Room = {
    roomId,
    peerAccountId: peerAccountId.trim().toLowerCase(),
    lastMessageText: null,
    lastMessageTimestamp: null,
    unreadCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await db.rooms.put(newRoom);
  return newRoom;
};

/**
 * Retrieves all rooms sorted by most recent activity.
 */
export const getAllRooms = async (): Promise<Room[]> => {
  return await db.rooms.orderBy("lastMessageTimestamp").reverse().toArray();
};

/**
 * Updates a room's latest message preview and timestamp atomically.
 */
export const updateRoomLastMessage = async (
  roomId: string,
  messageText: string,
  timestamp: number,
  incrementUnread = false,
): Promise<void> => {
  const room = await getRoom(roomId);
  if (!room) return;

  await db.rooms.update(roomId, {
    lastMessageText: messageText,
    lastMessageTimestamp: timestamp,
    unreadCount: incrementUnread ? room.unreadCount + 1 : room.unreadCount,
    updatedAt: Date.now(),
  });
};

/**
 * Resets unread counter for a room when opened by the user.
 */
export const markRoomAsRead = async (roomId: string): Promise<void> => {
  await db.rooms.update(roomId, {
    unreadCount: 0,
    updatedAt: Date.now(),
  });
};

/**
 * Deletes a conversation room and cascades deletion to its messages.
 */
export const deleteRoom = async (roomId: string): Promise<void> => {
  await db.transaction("rw", [db.rooms, db.messages], async () => {
    await db.messages.where("roomId").equals(roomId).delete();
    await db.rooms.delete(roomId);
  });
};
