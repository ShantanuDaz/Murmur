import useAuth from "../../auth/store/authStore.ts";
import {
  createOutgoingContact,
  getContact,
  getPendingOutgoingContacts,
} from "../../../services/storage/contacts.ts";
import { messageManager } from "../../chat/services/messageManager.ts";
import { useConnectionStore } from "../store/connectionStore.ts";

const WATCHER_INTERVAL_MS = 25_000;

class ProposalManager {
  private activeAttempts = new Set<string>();
  private watcherTimer: ReturnType<typeof setInterval> | null = null;
  private isWatcherRunning = false;

  /**
   * Validates a Loop ID / Murmur Number (0x + 64 hex characters).
   */
  public isValidMurmurNumber(id: string): boolean {
    if (!id || typeof id !== "string") return false;
    const trimmed = id.trim().toLowerCase();
    return /^0x[0-9a-f]{64}$/.test(trimmed);
  }

  public isValidLoopId(id: string): boolean {
    return this.isValidMurmurNumber(id);
  }

  /**
   * Initiates a new connection request to a target Chat ID:
   * 1. Validates account ID format & checks not self.
   * 2. Saves contact to Dexie as 'pending_outgoing'.
   * 3. Immediately fires an outgoing rendezvous attempt.
   */
  public async sendConnectionRequest(
    targetAccountId: string,
    nickname?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const normTarget = targetAccountId.trim().toLowerCase();

    if (!this.isValidMurmurNumber(normTarget)) {
      return {
        success: false,
        error: "Invalid Chat ID. Must be a 66-character hex ID (0x...).",
      };
    }

    const { device } = useAuth.getState();
    if (!device) {
      return {
        success: false,
        error: "Your device identity is not initialized.",
      };
    }

    if (device.accountId.toLowerCase() === normTarget) {
      return {
        success: false,
        error: "You cannot connect with your own Chat ID.",
      };
    }

    const existing = await getContact(normTarget);
    if (existing?.status === "accepted") {
      return {
        success: false,
        error: "This user is already in your contacts.",
      };
    }

    // 1. Persist as pending_outgoing locally (offline-first)
    await createOutgoingContact(normTarget, nickname);

    // 2. Fire immediate connection attempt (async in background)
    void this.attemptProposalRendezvous(normTarget);

    return { success: true };
  }

  /**
   * Attempts a persistent connection to the target's personal room
   * to deliver the connection proposal and maintain the session.
   */
  public async attemptProposalRendezvous(
    targetAccountId: string,
  ): Promise<boolean> {
    const normTarget = targetAccountId.trim().toLowerCase();

    const auth = useAuth.getState();
    const { device } = auth;
    const keys = auth.getDeviceKeys();

    if (!device || !keys?.signingPrivateKey) {
      return false;
    }

    try {
      const room = await messageManager.connectToPeer(normTarget);
      return Boolean(room);
    } catch (err) {
      console.error(`[Proposal] Failed to connect to ${normTarget}:`, err);
      return false;
    }
  }

  /**
   * Starts the background pending proposal watcher.
   * Periodically queries Dexie for pending_outgoing contacts and knocks on their rooms.
   */
  public startPendingWatcher(): void {
    if (this.isWatcherRunning) return;
    this.isWatcherRunning = true;

    const runCheck = async () => {
      try {
        const pending = await getPendingOutgoingContacts();
        if (pending.length === 0) return;

        // Attempt connection for each pending contact not currently online
        for (const contact of pending) {
          if (!useConnectionStore.getState().isPeerOnline(contact.accountId)) {
            void this.attemptProposalRendezvous(contact.accountId);
          }
        }
      } catch (err) {
        console.error("[ProposalWatcher] Error in watcher cycle:", err);
      }
    };

    // Initial check
    void runCheck();

    // Periodic interval
    this.watcherTimer = setInterval(() => {
      void runCheck();
    }, WATCHER_INTERVAL_MS);
  }

  /**
   * Stops the background pending proposal watcher.
   */
  public stopPendingWatcher(): void {
    if (this.watcherTimer) {
      clearInterval(this.watcherTimer);
      this.watcherTimer = null;
    }
    this.isWatcherRunning = false;
    this.activeAttempts.clear();
  }
}

export const proposalManager = new ProposalManager();
