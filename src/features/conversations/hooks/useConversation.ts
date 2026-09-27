import { useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { joinRoom } from "trystero/nostr";
import useAuth from "../../auth/store/authStore.ts";
import { db } from "../../../services/storage/index.ts";
import { computeDirectRoomId } from "../../../services/storage/rooms.ts";
import type { Contact } from "../../../services/storage/contacts.ts";
import { ringDoorbell } from "../../engine/presence/utils/ringDoorbell.ts";
import { useConversationsStore } from "../conversationsStore.ts";
import { dbSyncEngine } from "../sync/dbSyncEngine.ts";

export interface UseConversationResult {
  roomId: string | null;
  lastMessage: string | null;
  lastTimestamp: number | null;
  unreadCount: number;
  pendingCount: number;
  isOnline: boolean;
  isOpen: boolean;
}

export const useConversation = (contact: Contact): UseConversationResult => {
  const myAccountId = useAuth((state) => state.device?.accountId);
  const openConversation = useConversationsStore(
    (state) => state.openConversation,
  );
  const setPeerOnline = useConversationsStore((state) => state.setPeerOnline);
  const registerRoom = useConversationsStore((state) => state.registerRoom);
  const unregisterRoom = useConversationsStore((state) => state.unregisterRoom);
  const isOnline = useConversationsStore((state) =>
    state.isPeerOnline(contact.contactID),
  );

  const contactID = contact.contactID.trim().toLowerCase();
  const isOpen = Boolean(
    openConversation && openConversation.toLowerCase() === contactID,
  );

  // 1. Compute deterministic 1:1 direct room ID
  const roomId = myAccountId
    ? computeDirectRoomId(myAccountId, contactID)
    : null;

  // 2. Reactive query for room summary (last message preview, timestamp, unread count)
  const roomSummary = useLiveQuery(
    () => (roomId ? db.rooms.get(roomId) : undefined),
    [roomId],
  );

  // 3. Reactive query for pending outbox messages waiting to be sent
  const pendingCount =
    useLiveQuery(
      () =>
        roomId
          ? db.messages
              .where("roomId")
              .equals(roomId)
              .filter((m) => m.status === "pending")
              .count()
          : 0,
      [roomId],
    ) ?? 0;

  const hasPending = pendingCount > 0;
  const shouldConnect = isOpen || hasPending;

  // Track last doorbell knock timestamp to avoid spamming knocks (throttle to 1 knock per 15s)
  const lastKnockRef = useRef<number>(0);

  // 4. Lazy WebRTC Room connection & DB Sync Engine hand-off
  useEffect(() => {
    if (!shouldConnect || !roomId) return;

    console.log(
      `[Conversation] Connecting to private direct room: ${roomId} (isOpen: ${isOpen}, pending: ${pendingCount})`,
    );

    const room = joinRoom({ appId: "loop-app" }, roomId);
    registerRoom(roomId, room);
    dbSyncEngine.registerConnection(roomId, room);

    // Live presence monitoring inside this direct room
    room.onPeerJoin = (peerId) => {
      console.log(`[Conversation] Peer entered room ${roomId}: ${peerId}`);
      setPeerOnline(contactID, true);
    };

    room.onPeerLeave = (peerId) => {
      console.log(`[Conversation] Peer left room ${roomId}: ${peerId}`);
      const remaining = Object.keys(room.getPeers());
      if (remaining.length === 0) {
        setPeerOnline(contactID, false);
      }
    };

    // If we have pending messages waiting and peer is not known to be online yet,
    // ring their doorbell lobby buzzer to wake them up
    if (hasPending && !isOnline) {
      const now = Date.now();
      if (now - lastKnockRef.current > 15_000) {
        lastKnockRef.current = now;
        console.log(`[Conversation] Ringing doorbell for ${contactID}...`);
        void ringDoorbell(contactID);
      }
    }

    return () => {
      console.log(`[Conversation] Cleaning up room: ${roomId}`);
      dbSyncEngine.unregisterConnection(roomId);
      unregisterRoom(roomId);
      setPeerOnline(contactID, false);
      try {
        void room.leave();
      } catch {
        // Ignore silent cleanup errors
      }
    };
  }, [
    shouldConnect,
    roomId,
    contactID,
    isOpen,
    hasPending,
    isOnline,
    registerRoom,
    unregisterRoom,
    setPeerOnline,
    pendingCount,
  ]);

  return {
    roomId,
    lastMessage: roomSummary?.lastMessageText ?? null,
    lastTimestamp: roomSummary?.lastMessageTimestamp ?? null,
    unreadCount: roomSummary?.unreadCount ?? 0,
    pendingCount,
    isOnline,
    isOpen,
  };
};

export default useConversation;
