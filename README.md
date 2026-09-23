# 🎙️ Murmur

> **100% Serverless, Decentralized, Sovereign Peer-to-Peer Chat & Calling Web Application**  
> _Zero Central Servers • Ephemeral Matchmaking • Local-First Storage • Direct WebRTC_

---

## 📖 Overview & Philosophy

**Murmur** is a private, serverless, decentralized, local-first peer-to-peer web communication platform. It delivers real-time messaging, direct chat, contact requests, and audio/video calling entirely within the browser without requiring central application servers, user accounts databases, or hosted communication middleware.

### Core Invariants:

1. **Zero Central Database & Application Servers**: No backend servers, no hosted PostgreSQL/Redis, and no cloud accounts database.
2. **Ephemeral Signaling Matchmakers**: Public, decentralized relays (Nostr relays via Trystero) are used solely as blind matchmakers to exchange WebRTC coordinates. Once direct WebRTC channels are established, signaling traffic drops to zero.
3. **Local-First Persistence**: All user profile data, credentials, device keys, contacts, rooms, and message histories are persisted locally in the browser's IndexedDB via **Dexie**.
4. **Direct WebRTC Conduits**: Text messages travel over encrypted `RTCDataChannel`s, and audio/video calls stream peer-to-peer via native WebRTC `MediaStream`s.

---

## 🏛️ System Architecture: The Chat-Centric Model

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                            │
│           (React 19 + Tailwind CSS v4 + Lucide Icons)                  │
├──────────────────────────────────┬─────────────────────────────────────┤
│                                  │                                     │
│         ┌────────────────────────┴────────────────────────┐            │
│         ▼                                                 ▼            │
│ ┌───────────────────────────────┐        ┌───────────────────────────┐ │
│ │      AUTH & PROFILE           │        │         CHAT UI           │ │
│ │  - Onboarding & Seed Wizard   │        │  - Sidebar & Contacts     │ │
│ │  - Identity & Certified Device│        │  - Thread, Bubbles, Input │ │
│ │  - Seed Backup & QR Export    │        │  - Real-time P2P Badges   │ │
│ └───────────────┬───────────────┘        └─────────────┬─────────────┘ │
│                 │                                      │               │
│                 ▼                                      ▼               │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │                 STATE MANAGEMENT (Zustand)                         │ │
│ │   - useAuthStore: Local Profile, Device Identity, Private Keys    │ │
│ │   - useConnectionStore: 1:1 Active Peer WebRTC Connections         │ │
│ └───────────────┬──────────────────────────────────────┬─────────────┘ │
│                 │                                      │               │
│                 ▼                                      ▼               │
│ ┌───────────────────────────────────┐  ┌─────────────────────────────┐ │
│ │       STORAGE ENGINE (Dexie)      │  │     P2P ENGINE (Trystero)   │ │
│ │  - identity: Profile, Keys, Seed  │  │  - My Room (Personal Inbox) │ │
│ │  - contacts: Status & Profiles    │  │  - Direct Chat Rooms        │ │
│ │  - rooms: Deterministic 1:1 IDs   │  │  - Ed25519 Handshakes       │ │
│ │  - messages: Pending & Delivered  │  │  - Proposal Rendezvous      │ │
│ └───────────────────────────────────┘  └─────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Identity & Certified Devices

- **Master Identity**: Generated from a 12/24-word BIP-39 mnemonic phrase (`@scure/bip39`). Derives a Master Ed25519 keypair (`@noble/curves/ed25519`). The hexadecimal public key (`0x...`) is the user's permanent **Murmur Number**.
- **Device Identity**: Every browser instance creates its own Ed25519 signing keypair and X25519 encryption keypair, certified by the Master Identity.

### 2. "My Room" (24/7 Personal Inbox)

- Every authenticated user listens 24/7 on `Room(My_Murmur_Number)` via Nostr relays.
- **Star-Topology Peer Filter**: Visitors in a room only talk to the room owner.
- When an external peer connects, they exchange cryptographic Ed25519 device handshakes.
- Upon verification, the peer's WebRTC channel is registered in `useConnectionStore` and routed directly to that user's chat.

### 3. Chat-Centric 1:1 Connection Lifecycle

- **Zero Unnecessary Connections**: Two users browsing the app with nothing to send remain in their own inboxes and do not connect.
- **Send Message**:
  - **Step 1**: Check `useConnectionStore.getState().getPeerConnection(recipient)`. If active, transmits directly across WebRTC (< 15ms).
  - **Step 2**: If no active connection exists, saves message to local Dexie as `pending`, and connects to `Room(recipient)`.
  - **Step 3**: On peer join and handshake, registers the peer in `useConnectionStore`, flushes all pending messages, and keeps the channel open indefinitely.
- **Bidirectional Reuse**: If Bob connects to Alice's inbox, Alice's chat with Bob immediately receives the active connection. When Alice replies, she reuses that existing WebRTC link.
- **Peer Drop**: When a peer closes their tab, `room.onPeerLeave` removes the connection, and the UI badge flips to `Offline`.

---

## ✅ What Has Been Achieved

### 1. Cryptography & Identity Management (`src/services/crypto/`)

- [x] BIP-39 mnemonic generation, entropy validation, and master seed derivation.
- [x] Ed25519 master identity keypair derivation.
- [x] Certified device identity key generation (Ed25519 signing + X25519 encryption keypairs).
- [x] Master certificate signing and proof-of-possession verification.
- [x] Secure in-memory keystore for private keys.

### 2. Database & Storage Layer (`src/services/storage/`)

- [x] Atomic Dexie IndexedDB schemas: `identity`, `contacts`, `rooms`, `messages`.
- [x] Compound indices `[roomId+timestamp]` and `[recipientAccountId+status]` for queries.
- [x] Deterministic 1:1 conversation room ID computation: `direct:min(A,B):max(A,B)`.
- [x] Automatic schema migration and backward compatibility.

### 3. P2P Transport & Signaling (`src/features/engine/`)

- [x] Personal listening room (`myRoomManager.ts`) listening on `Room(My_ID)` via `trystero/nostr`.
- [x] Star-topology enforcement (visitor-to-host isolation).
- [x] Cryptographic device handshake (`createSignedHandshake`, `verifySignedHandshake`) with replay and clock skew protection.
- [x] 1:1 active peer connection registry (`connectionStore.ts`) with \(O(1)\) reverse peer lookup.
- [x] Contact proposal dispatch and reciprocal match auto-acceptance (`proposalManager.ts`).

### 4. Dedicated 1:1 Chat Feature (`src/features/chat/`)

- [x] Fully decoupled chat feature (`Chat.tsx`, `ChatSidebar.tsx`, `ChatThread.tsx`, `MessageBubble.tsx`, `ChatHeader.tsx`, `ChatInput.tsx`).
- [x] Local-first message sending with offline queuing (`pending`) and delivery acknowledgments (`delivered`).
- [x] Direct WebRTC message dispatching via `messageManager.ts`.
- [x] Reactive UI indicators:
  - Header active link counter (`2 contacts • 🟢 1 active P2P`).
  - Contact cards with green avatar rings and pulsing **`P2P Live`** badges.
  - Active channel banner above chat input (`🟢 Direct WebRTC data channel active — Zero hop • Instant delivery`).

---

## 🔮 What Is Next (Roadmap)

### 1. 1:1 Audio & Video Calling (Next Up)

- Signaling call proposals (ring, accept, reject, busy) over the existing WebRTC data channel.
- Capturing user media via `navigator.mediaDevices.getUserMedia({ audio: true, video: true })`.
- Streaming peer-to-peer tracks via Trystero's `room.addStream()` and `room.onPeerStream()`.
- Responsive video call overlay UI with camera toggle, microphone mute, audio output selection, and call duration timer.

### 2. Application-Layer E2EE Encryption

- Using the certified `X25519` keypairs already generated in `DeviceIdentity`.
- Diffie-Hellman key exchange per contact session to derive symmetric AES-256-GCM / ChaCha20-Poly1305 session keys.
- Double-encrypting chat message payloads and file metadata before wire transmission.

### 3. P2P Media & File Attachments

- Selecting images, audio clips, and documents.
- Client-side chunking, encryption, and transmission over Trystero's binary data channels.
- Local blob caching in Dexie IndexedDB with thumbnail previews and download triggers.

### 4. Group Chat & Multi-Party Rooms

- Deterministic multi-peer group room topics.
- Mesh WebRTC presence rosters with member discovery and leave/join notifications.
- Group message broadcasting and multi-party video call grid layouts.

---

## 🛠️ Tech Stack Reference

| Layer               | Technology                   | Purpose                                              |
| :------------------ | :--------------------------- | :--------------------------------------------------- |
| **Framework**       | React 19 + TypeScript + Vite | Client-side UI & compilation                         |
| **Styling**         | Tailwind CSS v4              | Dark-first minimalist design                         |
| **Icons**           | Lucide React                 | Clean icon set                                       |
| **State**           | Zustand                      | Client state (`authStore`, `connectionStore`)        |
| **P2P Transport**   | Trystero (`trystero/nostr`)  | Decentralized WebRTC signaling via Nostr relays      |
| **Storage**         | Dexie (IndexedDB)            | Reactive, client-side database (`dexie-react-hooks`) |
| **Identity / Seed** | `@scure/bip39`               | BIP-39 mnemonic generation & validation              |
| **Cryptography**    | `@noble/curves`              | Ed25519 (signatures) & X25519 (encryption) curves    |

---

## 💻 Developer Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build
```
