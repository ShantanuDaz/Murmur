import { joinRoom } from "trystero/nostr";
import useAuth from "../../../auth/store/authStore.ts";
import type { DoorbellSignal } from "../type.ts";

/**
 * Rings a peer's lobby doorbell room (Room(peerAccountId)).
 * Ephemeral connection that transmits a lightweight ~50-byte buzzer packet
 * and then automatically leaves after a brief transmission window.
 */
export const ringDoorbell = async (peerAccountId: string): Promise<boolean> => {
  const myAccountId = useAuth.getState().device?.accountId;
  if (!myAccountId) return false;

  const normPeer = peerAccountId.trim().toLowerCase();
  const normMy = myAccountId.trim().toLowerCase();
  if (normPeer === normMy) return false;

  try {
    const room = joinRoom({ appId: "loop-app" }, normPeer);
    const knockAction = room.makeAction<DoorbellSignal>("knock");

    const signal: DoorbellSignal = {
      accountId: normMy,
      timestamp: Date.now(),
    };

    // 1. Broadcast immediately to any peer listening in the lobby
    void knockAction.send(signal);

    // 2. Also send if peer joins during this buzzer attempt
    room.onPeerJoin = (peerId: string) => {
      void knockAction.send(signal, { target: peerId });
    };

    // 3. Ephemeral cleanup: buzz for 4 seconds then gracefully depart
    setTimeout(() => {
      try {
        void room.leave();
      } catch {
        // Ignore silent cleanup errors
      }
    }, 4000);

    return true;
  } catch (err) {
    console.error(
      `[Presence] Failed to ring doorbell for ${peerAccountId}:`,
      err,
    );
    return false;
  }
};
