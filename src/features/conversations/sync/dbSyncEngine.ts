import type { Room } from "trystero/nostr";

export interface SyncSession {
  roomId: string;
  room: Room;
  startedAt: number;
}

/**
 * DbSyncEngine (Dummy / Staging)
 * Responsible for managing database synchronization sessions over active WebRTC rooms.
 * Real DB sync protocol (CRDT / vector clocks / delta exchange) will be plugged in here.
 */
class DbSyncEngine {
  private activeSessions = new Map<string, SyncSession>();

  public registerConnection(roomId: string, room: Room): void {
    if (this.activeSessions.has(roomId)) return;

    console.log(`[DbSyncEngine] 🔄 Registered connection for room: ${roomId}`);
    this.activeSessions.set(roomId, {
      roomId,
      room,
      startedAt: Date.now(),
    });
  }

  public unregisterConnection(roomId: string): void {
    if (!this.activeSessions.has(roomId)) return;
    console.log(
      `[DbSyncEngine] ⏹️ Unregistered connection for room: ${roomId}`,
    );
    this.activeSessions.delete(roomId);
  }

  public getSession(roomId: string): SyncSession | undefined {
    return this.activeSessions.get(roomId);
  }

  public isSyncing(roomId: string): boolean {
    return this.activeSessions.has(roomId);
  }
}

export const dbSyncEngine = new DbSyncEngine();
