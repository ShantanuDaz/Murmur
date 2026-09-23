import { useEffect, useRef } from "react";
import useAuth from "../../auth/store/authStore.ts";
import { myRoomManager } from "./myRoomManager.ts";
import { proposalManager } from "../proposal/proposalManager.ts";
import { messageManager } from "../../chat/services/messageManager.ts";
import { useConnectionStore } from "../store/connectionStore.ts";

/**
 * Hook that activates and maintains "My Room" when the user is authenticated.
 * Listens on the user's permanent Murmur Number and manages peer device connections.
 */
export const useMyRoom = () => {
  const isIdentityExists = useAuth((state) => state.isIdentityExists);
  const device = useAuth((state) => state.device);
  const getDeviceKeys = useAuth((state) => state.getDeviceKeys);

  const myRoomStatus = useConnectionStore((state) => state.myRoomStatus);
  const myRoomError = useConnectionStore((state) => state.myRoomError);
  const totalConnectedDevices = useConnectionStore((state) =>
    state.getTotalConnectedDevices(),
  );

  const isStartingRef = useRef(false);

  useEffect(() => {
    if (!isIdentityExists || !device) {
      if (myRoomManager.isActive()) {
        myRoomManager.stopMyRoom();
      }
      proposalManager.stopPendingWatcher();
      void messageManager.teardown();
      return;
    }

    proposalManager.startPendingWatcher();

    const keys = getDeviceKeys();
    if (!keys || !keys.signingPrivateKey) {
      console.warn(
        "[useMyRoom] Local device signing private key not available.",
      );
      return;
    }

    if (isStartingRef.current) return;
    isStartingRef.current = true;

    myRoomManager
      .startMyRoom({
        accountId: device.accountId,
        device,
        signingPrivateKey: keys.signingPrivateKey,
      })
      .finally(() => {
        isStartingRef.current = false;
      });

    return () => {
      // In production / navigation cleanup
      // If user logs out, the next effect run will call stopMyRoom()
    };
  }, [isIdentityExists, device, getDeviceKeys]);

  return {
    status: myRoomStatus,
    error: myRoomError,
    connectedDevicesCount: totalConnectedDevices,
    isListening: myRoomStatus === "connected",
  };
};
