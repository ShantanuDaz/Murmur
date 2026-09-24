import { useEffect } from "react";
import useAuth from "../../../auth/store/authStore";
import { joinRoom } from "trystero/nostr";
import { handleKnock } from "../utils/handleKnock";
import type { DoorbellSignal } from "../type";
const usePresence = () => {
  const accountId = useAuth((state) => state.device?.accountId);

  useEffect(() => {
    if (!accountId) return;
    const room = joinRoom({ appId: "loop-app" }, `${accountId}`);
    room.onPeerJoin = (peer) => {
      console.log(peer);
    };
    const knock = room.makeAction<DoorbellSignal>("knock");

    knock.onMessage = (data: DoorbellSignal) => {
      if (
        data.accountId.trim().toLowerCase() === accountId.trim().toLowerCase()
      ) {
        return;
      }
      void handleKnock(data);
    };
    return () => {
      void room.leave();
    };
  }, [accountId]);
};

export default usePresence;
