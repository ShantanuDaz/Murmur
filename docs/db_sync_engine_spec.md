# 🔄 Loop Database Synchronization Engine: Technical Specification

**Version:** 3.0.0 (Unified Gossip Mesh + Handshake Admission Architecture)  
**Status:** Solidified  
**Component:** `src/features/conversations/sync/dbSyncEngine.ts`  
**Reference Document:** `docs/db_sync_engine_spec.md`

---

## 1. Architectural Overview & Design Philosophy

Loop is a local-first, serverless, peer-to-peer web communication platform. Whether operating in **1:1 private direct rooms** or **300+ peer multi-party rooms**, data storage and synchronization follow two foundational principles:

1. **Local-First & Idempotent:** All messages are committed to the local database (`db.messages`) before network transmission.
2. **Gossip Mesh with Bounded Connections:** To prevent mobile browser crashes and battery drain, every client caps its simultaneous WebRTC connections to a maximum of **6 peers ("Neighbors")**. Messages propagate across the entire room via an epidemic gossip protocol.

---

## 2. Layer 1: The Handshake Admission Protocol

Before any peer is admitted to a room, Trystero's native `onPeerHandshake` hook executes admission and security verification.

```
Incoming Peer Knock (WebRTC via Nostr Signaling)
                    │
                    ▼
          onPeerHandshake Hook
                    │
    ┌───────────────┴───────────────┐
    ▼                               ▼
[Check 1: Slot Capacity]     [Check 2: Identity Auth]
Active peers >= MAX_PEERS?   Is peer blocked or uninvited?
    │                               │
    ├── YES ──▶ REJECT!             ├── YES ──▶ REJECT!
    │   (Throw MAX_PEERS_REACHED)   │   (Throw UNAUTHORIZED_PEER)
    │                               │
    └── NO  ────────────────────────┴──▶ ADMIT PEER!
                                         (Activate WebRTC Channel)
```

### Key Handshake Responsibilities:

1. **Connection Cap Guard (`MAX_PEERS = 6`):**
   - If active connections $\ge 6$, rejects incoming handshakes immediately (`throw new Error("MAX_PEERS_REACHED")`).
   - Trystero instantly closes and destroys the WebRTC connection before data channels or audio/video channels activate.
   - Prevents browser OOM crashes and CPU overheating.
2. **Mutual Account Authentication (Bad Actor Defense):**
   - Peers exchange their canonical Master Account IDs (`0x...`) during the handshake.
   - If an account ID is on the local blocklist or fails the room's allowlist, the connection is aborted with `UNAUTHORIZED_PEER`.
3. **Peer Exchange (PEX) Neighbor Redirection:**
   - When a peer is rejected due to room fullness, the local node can optionally send 3 active peer IDs before closing, helping the newcomer find an available neighbor.
4. **Dynamic Slot Management:**
   - When any connected peer disconnects (`room.onPeerLeave`), the active count decrements, immediately opening a slot for new incoming connections.

---

## 3. Layer 2: The 4 Core Message & Sync Functions

The entire messaging and data synchronization pipeline is driven by four cohesive functions:

```
                      ┌─────────────────────────────────┐
                      │        saveMessage(msg)         │
                      └────────────────┬────────────────┘
                                       │
                            Is this a NEW message?
                                       │
                      ┌────────────────┴────────────────┐
                      ▼ YES                             ▼ NO (Already seen)
           ┌──────────────────────┐                     DROP IT (Stops loops)
           │   broadcastMessage   │
           └──────────────────────┘
                      │
           Forward to my 6 neighbors
```

### 3.1 `saveMessage(roomId: string, message: Message): Promise<{ isNew: boolean }>`

- **Role:** The Database Gatekeeper & Deduplication Filter.
- **Responsibilities:**
  1. Checks if `message.id` already exists in Dexie `db.messages`.
  2. If already present: drops the message and returns `{ isNew: false }`.
  3. If new: persists the message into IndexedDB, atomically updates `db.rooms` summary (`lastMessageText`, `lastMessageTimestamp`, `unreadCount`), and returns `{ isNew: true }`.
  4. **Why this matters:** The database itself serves as the loop-prevention filter for the gossip network—no complex in-memory tracking sets required.

### 3.2 `broadcastMessage(roomId: string, message: Message, originPeerId?: string): Promise<void>`

- **Role:** The Gossip Fan-Out Engine.
- **Responsibilities:**
  1. Sends `message` to **all connected neighbors** in the room.
  2. If `originPeerId` is specified (i.e. forwarding a received message), sends to all neighbors **except** `originPeerId`.
  3. Triggered by two events:
     - **Local Write:** When the user types and sends a message.
     - **Gossip Relay:** When a neighbor sends a message and `saveMessage` confirms `{ isNew: true }`.

### 3.3 `sendMessages(roomId: string, targetPeerId: string, messages: Message[]): Promise<void>`

- **Role:** Targeted Point-to-Point Transmission.
- **Responsibilities:**
  1. Transmits a specific array of messages directly to **one target peer** using Trystero's targeted delivery (`sendMessage(payload, targetPeerId)`).
  2. Triggered when fulfilling a catch-up diff requested by `askForLatestMessages`.

### 3.4 `askForLatestMessages(roomId: string, targetPeerId: string): Promise<void>`

- **Role:** The Catch-Up Diff Probe.
- **Responsibilities:**
  1. Triggered when a new neighbor joins or reconnects.
  2. Queries local DB for the latest message timestamp/ID in this room.
  3. Asks the target neighbor: _"What messages do you have after marker X?"_
  4. The neighbor queries their local DB and responds via `sendMessages(myPeerId, missingMessages)`.

---

## 4. End-to-End Scenarios

| Scenario                         | Workflow                                                                                                                     |
| :------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **I hit Send**                   | `saveMessage()` $\rightarrow$ `isNew: true` $\rightarrow$ `broadcastMessage()` dispatches to all 6 neighbors.                |
| **I receive a message from Bob** | `saveMessage()` $\rightarrow$ if new, `broadcastMessage(msg, bobPeerId)` forwards to other 5 neighbors.                      |
| **Charlie joins and is behind**  | Charlie calls `askForLatestMessages(myPeerId)` $\rightarrow$ I call `sendMessages(charliePeerId, delta)`.                    |
| **7th peer attempts to connect** | `onPeerHandshake` detects 6 active slots $\rightarrow$ throws `MAX_PEERS_REACHED` $\rightarrow$ WebRTC connection destroyed. |
| **Bad actor attempts to knock**  | `onPeerHandshake` inspects account ID $\rightarrow$ not on allowlist $\rightarrow$ throws `UNAUTHORIZED_PEER`.               |

---

## 5. Next Implementation Milestones

1. **Step 1:** Implement the Handshake Guard (`onPeerHandshake`) in `src/features/conversations/sync/dbSyncEngine.ts`.
2. **Step 2:** Implement `saveMessage`, `broadcastMessage`, `sendMessages`, and `askForLatestMessages`.
3. **Step 3:** Wire active room lifecycle in `useConversation.ts` and `ConversationView.tsx`.
