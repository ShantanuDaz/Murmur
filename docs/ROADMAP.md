# Murmur MVP: Developer Implementation Roadmap & Mentor Guide

> **A step-by-step master engineering guide for building a 100% serverless, local-first P2P chat and calling application.**
>
> _Written for the self-reliant engineer: You write the code yourself; this document serves as your technical checklist, architectural reference, and implementation guide._

---

## 🏛️ Core Architecture Pillars

Murmur MVP is structured across five core deliverables:

1. **User Identity**: BIP-39 mnemonic root, Master Account ID (`0x...` Ed25519 public key), user profile metadata, and seed phrase backup/restore.
2. **Device Identity**: Clean, isolated local client instance keypairs (Ed25519 + X25519) and metadata bound to the user identity.
3. **One-on-One (1:1) Chat**: Direct peer discovery and persistent messaging over Trystero and IndexedDB.
4. **Group Chat**: Multi-peer WebRTC mesh rooms with presence rosters and broadcast message channels.
5. **Video & Audio Calls (Single & Group)**: Native WebRTC media streams with camera/mic controls and a responsive grid layout.

---

## 🗺️ Implementation Milestones & Checklist

### 🟢 Milestone 1: User & Device Identity

> _Objective: Implement cryptographic key derivation, local keystore persistence, and onboarding flows._

#### Step 1.1: Cryptographic Utilities (`src/services/crypto/index.ts`)

- [ ] **Mnemonic Generation**:
  - Use `@scure/bip39` with English wordlist to generate 12 or 24-word phrases.
  - Implement `validateMnemonic(phrase, wordlist)`.
- [ ] **Seed & Root Derivation**:
  - Convert mnemonic to 512-bit binary seed via `mnemonicToSeedSync(mnemonic)`.
  - Derive Master Ed25519 keypair from first 32 bytes via `@noble/curves/ed25519`.
  - Format public key as hexadecimal string: `0x${bytesToHex(pubKey)}` (Master Account ID).
- [ ] **Device Identity Derivation**:
  - Generate a unique instance `deviceId` (`crypto.randomUUID()`).
  - Derive or generate local device signing keypair (Ed25519) and encryption keypair (X25519).
  - Detect or assign a friendly device name (e.g., `"Chrome on Linux"`).

#### Step 1.2: Local Database Keystore (`src/services/storage/db.ts`)

- [ ] **Dexie Database Setup**:
  - Define tables:
    - `profiles`: `accountId, name, avatar, createdAt`
    - `credentials`: `accountId`
    - `devices`: `deviceId, accountId, deviceName`
    - `rooms`: `roomId, name, type, createdAt, lastActivity`
    - `messages`: `id, roomId, senderAccountId, timestamp`
- [ ] **Storage Helpers**:
  - `saveLocalIdentity(profile, device, secrets)`
  - `loadLocalIdentity()`
  - `clearLocalIdentity()`

#### Step 1.3: Auth Store & UI Integration

- [ ] **`useAuthStore`** (`src/features/auth/store/authStore.ts`):
  - Connect `initialize()` to `loadLocalIdentity()`.
  - Implement `login(profile, device, secrets)`.
  - Implement `logout()` and `updateProfile()`.
- [ ] **Onboarding & Profile UI** (`src/features/auth/`):
  - Create onboarding wizard: Generate seed / Restore seed $\rightarrow$ Choose name & avatar $\rightarrow$ Review & backup seed $\rightarrow$ Enter app.
  - Profile screen displaying Account ID, Device ID, seed backup reveal modal, and logout button.

---

### 🟢 Milestone 2: One-on-One & Group Chat

> _Objective: Establish P2P WebRTC data channels, exchange presence, and persist chat messages._

#### Step 2.1: P2P Room Session Manager (`src/services/p2p/session.ts`)

- [ ] **Trystero Integration**:
  - Initialize room session via `joinRoom({ appId: 'murmur-app' }, roomId)`.
- [ ] **Presence Action (`presence`)**:
  - Broadcast local `UserProfile` and `DeviceIdentity` on `peerJoin`.
  - Handle peer incoming presence and maintain live peer map.
- [ ] **Chat Action (`chat`)**:
  - Implement `sendChatMessage(text)` broadcasting a `ChatPayload`.
  - Handle incoming messages and trigger message callback.
- [ ] **Lifecycle**:
  - Handle `onPeerLeave` and cleanup resources on `leave()`.

#### Step 2.2: Chat Store (`src/features/chat/store/chatStore.ts`)

- [ ] **State Management**:
  - `activeRoomId`: Active room ID or null.
  - `rooms`: List of known rooms (1:1 and group).
  - `messages`: Array of messages for the active room.
  - `peers`: Record of connected peers with profiles and media statuses.
- [ ] **Actions**:
  - `joinRoom(roomId, type, name)`: Initializes P2P session and loads messages from Dexie.
  - `leaveRoom()`: Tears down session and clears active state.
  - `sendMessage(text)`: Broadcasts via P2P and appends to local Dexie database.

#### Step 2.3: Chat Interface (`src/features/chat/`)

- [ ] **Sidebar**:
  - Rooms list with 1:1 direct chats and group rooms.
  - "New Chat" modal to start a 1:1 chat (by Account ID) or create/join a group room.
- [ ] **Conversation Area**:
  - Header with room title, participant avatars, and call buttons.
  - Message list showing sender avatar, name, timestamp, and message bubble.
  - Message input bar with send button.

---

### 🟢 Milestone 3: Audio & Video Calls (Single & Group)

> _Objective: Enable WebRTC media streaming for 1:1 and group calling with intuitive media controls._

#### Step 3.1: WebRTC Media Stream Handling

- [ ] **Local Media Capture**:
  - Request user camera and microphone via `navigator.mediaDevices.getUserMedia({ video: true, audio: true })`.
  - Handle permission denials or fallback to audio-only if camera is unavailable.
- [ ] **Trystero Stream Piping**:
  - Call `room.addStream(localStream)` to broadcast to peers.
  - Handle `room.onPeerStream(stream, peerId)` to store remote peer media streams.
  - On new peer join during an active call, add local stream for the new peer.
- [ ] **Media Status Signaling (`media-status`)**:
  - Broadcast `{ video: boolean, audio: boolean }` when toggling camera or microphone.
  - Update UI indicators when remote peers toggle their camera or mic.

#### Step 3.2: Call Controls & Video Grid UI

- [ ] **In-Call Controls Pill**:
  - **Mic Toggle**: Enable/disable local audio track and broadcast status.
  - **Camera Toggle**: Enable/disable local video track (or re-acquire stream) and broadcast status.
  - **Leave Call**: Stop all tracks (`track.stop()`), remove stream from room, and reset call state.
- [ ] **Video Tile Component (`VideoTile.tsx`)**:
  - `<video>` element with `autoPlay`, `playsInline`, `muted` for self.
  - Display avatar placeholder with pulsing background when video is disabled.
  - Display participant name and mic mute indicator.
- [ ] **Responsive Video Grid (`VideoGrid.tsx`)**:
  - Dynamic CSS grid adjusting to 1 participant (full view), 2 participants (side-by-side / PiP), and 3+ participants (2x2 or auto-fit grid).

---

## 🧪 Self-Verification Testing Lab

1. **Identity & Storage Test**:
   - Create an account, copy the seed phrase, and inspect IndexedDB in DevTools $\rightarrow$ Application.
   - Verify `profiles`, `credentials`, and `devices` tables are populated.
   - Refresh the page: verify the session rehydrates immediately without prompt.
   - Logout, click "Restore", paste the seed phrase: verify the same Account ID is recovered.

2. **1:1 Chat Test**:
   - Open two browser tabs (one regular, one incognito) with different accounts.
   - Start a 1:1 chat between the two accounts.
   - Send messages in both directions: verify immediate delivery and persistence across page reloads.

3. **Group Chat Test**:
   - Create a group room (e.g. `test-group`) in Tab 1.
   - Join `test-group` in Tab 2 and Tab 3.
   - Verify all 3 participants appear in the active member roster.
   - Send a broadcast message: verify all 3 tabs display the message.

4. **Media Call Test**:
   - In the group room with 2 or 3 participants, click "Start Video Call".
   - Allow camera and microphone permissions.
   - Verify video tiles render for all participants.
   - Toggle microphone mute: verify the mute badge updates for remote peers.
   - Toggle camera off: verify the video tile cleanly displays the avatar placeholder.
   - Click "Leave Call": verify media hardware indicator turns off (tracks stopped).
