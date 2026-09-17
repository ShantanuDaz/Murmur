# Murmur: Sovereign P2P Web Chat Implementation Roadmap

> **A step-by-step master engineering guide for building a 100% serverless, offline-first, pure P2P multi-device chat application powered by Automerge CRDT, Web Crypto API, Trystero BitTorrent blind signaling, Web Push hybrid sync, and OPFS file streaming.**
>
> _Written for the self-reliant engineer: You write 100% of the code yourself; your AI acts strictly as an architectural guide, code reviewer, and technical mentor._

---

## 🤝 The Developer & AI Mentor Operating Contract

This project is your canvas for mastery. To get the maximum educational and engineering value out of building Murmur:

| Role                        | Responsibility                 | What You Do / Ask                                                                                                                                                |
| :-------------------------- | :----------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **You (The Developer)**     | **Author & Implementer**       | You write every line of code, design component trees, configure schemas, debug stack traces, and run test scenarios in the browser.                              |
| **AI (The Mentor & Guide)** | **Architect & Sounding Board** | Explains difficult concepts, validates architectural designs, points out security edge cases, suggests debugging strategies, and conducts thorough code reviews. |

### The 4 Modes of Consulting Your AI Mentor

1. **Architectural Review Mode**: Before writing a complex module (e.g. Automerge custom provider, deterministic HKDF slot derivation, PBKDF2 at-rest encryption), explain your proposed design to the mentor and ask: _"What edge cases, race conditions, or security flaws am I overlooking in this design?"_
2. **Socratic Concept Mode**: When encountering unfamiliar cryptographic or distributed systems topics (e.g., CRDT change logs vs State Vectors, ECDSA P-256 vs Ed25519, HKDF info tags, WebAuthn PRF), ask the mentor to explain the theoretical foundations and tradeoffs.
3. **Debugging Sparring Partner**: When a bug occurs, share the error message, reproduction steps, and your hypothesis. Ask the mentor: _"Here is my hypothesis on why this fails. What diagnostic steps should I take in DevTools to confirm or falsify it?"_ (Do not ask the mentor to just fix it for you).
4. **Post-Implementation Code Review**: After you complete a milestone, paste your code and ask: _"Please review this implementation for memory leaks, unhandled edge cases, and compliance with our offline-first principles."_

---

## 🏛️ Core Architectural Principles

1. **Zero Data on Relays & Blind Discovery (Pure P2P Sovereignty)**:
   - Relays (volunteer WebTorrent WebSocket trackers, with Nostr relays as fallback) are used **strictly as ephemeral matchmakers** for the initial WebRTC SDP offer/answer handshake.
   - Discovery uses **Blind Discovery Keys**: $\text{Room\_Name} = \text{SHA256}(\text{Alice\_Public\_ID})$. Trackers see only an opaque 32-byte hash and have zero knowledge of participant identities, social graphs, or chat payloads.
   - Once peers connect, the relay connection is completely dropped. Zero chat messages, zero database records, and zero metadata ever touch any server or relay.
2. **Native Web Crypto Core**:
   - Asymmetric signing via **ECDSA P-256** and symmetric authenticated encryption via **AES-GCM-256**.
   - Direct-to-C++ browser acceleration via `window.crypto.subtle` with zero third-party pure-JS crypto vulnerabilities.
3. **Local-First & Offline-First (Automerge CRDT + Encrypted IndexedDB)**:
   - Every chat channel is a discrete, independent **Automerge** CRDT document.
   - Mutations are committed to local change logs with sub-millisecond responsiveness.
   - All rows committed to `IndexedDB` are encrypted at-rest using **AES-GCM-256** derived from a user passcode/PIN via **PBKDF2** (600,000 iterations).
4. **Deterministic Pre-Authenticated Device Slots**:
   - Master account derived deterministically from 24-word BIP-39 seed.
   - Fixed array of 10–20 **Device Identity Slots** derived via HKDF and **pre-signed** by the Master Key.
   - Secondary devices are provisioned via offline QR sync packages containing only their assigned slot private key and certificate. The 24-word seed **never touches secondary devices**.
5. **Background Push-Payload Synchronization Hybrid**:
   - Web Push API dispatches direct HTTPS POST requests to recipient OS endpoints (Google FCM / Apple APNs) with encrypted 4KB Automerge binary change blocks.
   - Recipient Service Worker wakes for a 10-second window in the background, appends the delta directly to IndexedDB, and fires a native screen notification. Messages are pre-cached before the user even opens the app.
6. **Infinite Large File Chunks via OPFS Direct-to-Disk Streaming**:
   - Web Worker + `ReadableStream` partitions files into sequential 16KB AES-GCM encrypted blobs.
   - Recipient streams chunks directly into an **Origin Private File System (OPFS)** write handle on physical disk, keeping browser tab RAM under 20MB and preventing crashes on multi-gigabyte transfers.

---

## 📊 Current Codebase Status & Milestone Tracker

### Baseline Audit (What is currently in Murmur):

- [x] **Project Foundation**: Vite + React 19 + TypeScript + Tailwind CSS v4.
- [x] **PWA Baseline**: `vite-plugin-pwa` configured with manifest, worker registrations, and icons.
- [x] **Architecture Blueprint**: Complete specification committed in [`ARCHITECTURE.md`](../ARCHITECTURE.md).

### Implementation Phases:

- [ ] **Phase 1: The Sovereign Triad (Identity Slots, Encrypted Automerge DB, Blind Trystero WebRTC Sync)**
  - [ ] _Module A (Identity)_: BIP-39 Master Derivation & 5 Deterministic HKDF Device Slots.
  - [ ] _Module B (Storage)_: Passcode-Encrypted IndexedDB & Automerge CRDT State Store.
  - [ ] _Module C (Network)_: Blinded Trystero BitTorrent Signaling, Zero-Trust Handshake & WebRTC Sync Pump.
- [ ] **Phase 2: Multi-Device Slot Provisioning & QR Transfer** _(Export/import pre-signed slots, QR sync package, WebAuthn Bio-Unlock)_
- [ ] **Phase 3: Background Push-Payload Synchronization Hybrid** _(Direct peer-to-push HTTPS POST to FCM/APNs, Service Worker 10s background IndexedDB ingestion)_
- [ ] **Phase 4: Heavy Engine Web Worker & Large File OPFS Streaming** _(Dedicated Web Worker, 16KB AES-GCM streaming, zero-RAM direct-to-disk OPFS writes)_
- [ ] **Phase 5: Production Hardening, PWA Offline Shell & UI Polish** _(Instant cold offline boot, responsive Tailwind CSS UI, multi-device test lab)_

---

## 🟢 Phase 1: The Sovereign Triad (Core Engine Foundation)

> _Build the three foundational modules of the Sovereign P2P architecture: deterministic identity slots, passcode-encrypted Automerge storage, and blinded WebRTC replication._

### 🎯 The Objective & The "Why"

Traditional web apps rely on central servers to authenticate users, store message histories, and broker connections. Phase 1 proves that a modern browser can perform all three functions autonomously:

1. **Module A (Identity)**: Deterministically derives cryptographic identity slots so multiple devices can participate under one master account without key collisions or seed phrase exposure.
2. **Module B (Storage)**: Guarantees offline local responsiveness via Automerge CRDT and protects data at rest by encrypting IndexedDB records with a passcode-derived key.
3. **Module C (Network)**: Discovers peers over public BitTorrent trackers without leaking metadata (using `SHA256(Alice_Public_ID)`), enforces mutual zero-trust verification, and replicates Automerge binary deltas over WebRTC.

---

### 🧩 Architectural Model: Phase 1 Triad

```
┌────────────────────────────────────────────────────────────────────────┐
│               MODULE A: DETERMINISTIC IDENTITY (BIP-39 + HKDF)         │
│  24 Words ──► 512-bit Master Seed ──► Master ECDSA Key (CA)            │
│                                   ──► 5 Deterministic Device Slots     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│               MODULE B: ENCRYPTED LOCAL STORAGE (Automerge + idb)      │
│  User Types ──► Automerge Binary Change ──► PBKDF2 / AES-GCM-256       │
│                                         ──► Encrypted IndexedDB Rows   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│               MODULE C: BLINDED WEBRTC REPLICATION (Trystero)          │
│  Blind Hash = SHA256(Master_Public_ID) ──► BitTorrent WSS Tracker      │
│  ──► WebRTC RTCDataChannel ──► Mutual Zero-Trust Challenge             │
│  ──► Stream Encrypted Automerge Binary Diffs                           │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 🔨 Phase 1 Engineering Deliverables & Step-by-Step Checklist

#### 🚀 Module A: Identity & Deterministic Device Slots

- [ ] **Step 1.A.1: Install & Verify Cryptographic Dependencies**
  - Verify `@scure/bip39` is available for 24-word mnemonic generation and wordlist validation.
  - Utilize browser-native `crypto.subtle` for all ECDSA and HKDF operations.
- [ ] **Step 1.A.2: Implement Master Root Derivation**
  - Create `src/services/crypto/identity.ts`:
    - `generateMasterMnemonic()`: Returns 24-word BIP-39 mnemonic phrase.
    - `mnemonicToMasterSeed(mnemonic)`: Produces a 512-bit master seed buffer.
    - `deriveMasterSigningKey(masterSeed)`: Derives Master ECDSA P-256 keypair for signing certificates.
    - `deriveMasterAccountId(masterPublicKey)`: Computes canonical hexadecimal Master Public Account ID.
- [ ] **Step 1.A.3: Implement Deterministic HKDF Device Slot Derivation**
  - In `src/services/crypto/slots.ts`:
    - `deriveDeviceSlot(masterSeed, slotIndex)`: Uses `HKDF-SHA256` with info string `murmur-device-slot-${slotIndex}` to deterministically derive:
      - Device Slot ECDSA P-256 Keypair (for message and handshake signing).
      - Device Slot AES-GCM-256 Key (for local slot credential protection).
      - Unique deterministic `deviceId` (UUID or slot hash).
- [ ] **Step 1.A.4: Master Key Pre-Signing (Device Slot Certificates)**
  - Implement `createSlotCertificate(masterSigningPrivKey, masterAccountId, slotIndex, slotPublicKey)`:
    - Creates canonical JSON payload:
      ```json
      {
        "accountId": "0xABC...",
        "slotIndex": 0,
        "slotPubHex": "04...",
        "issuedAt": 1740000000000,
        "expiresAt": 0
      }
      ```
    - Master key signs payload via ECDSA P-256.
    - Returns signed `DeviceSlotCertificate`.
- [ ] **Step 1.A.5: Identity Consistency Unit Test**
  - Write test script / verification runner:
    - Input a static 24-word test seed.
    - Run derivation 10 times across isolated executions.
    - Assert that slots 0 through 4 yield **byte-for-byte identical** public keys, private keys, and verifiable signatures every single run.

---

#### 🚀 Module B: Encrypted-at-Rest Automerge Storage Layer

- [ ] **Step 1.B.1: Install Automerge & Database Adapter**
  - Install `@automerge/automerge` and `idb` (or Dexie):
    ```bash
    npm install @automerge/automerge idb
    ```
- [ ] **Step 1.B.2: Implement Passcode PBKDF2 Key Derivation**
  - Create `src/services/crypto/keystore.ts`:
    - `deriveStorageKeyFromPin(pin: string, salt: Uint8Array)`:
      - Uses `crypto.subtle.deriveKey` with `PBKDF2`, SHA-256, 600,000 iterations.
      - Produces an **AES-GCM-256** `CryptoKey`.
- [ ] **Step 1.B.3: Implement Record-Level Cipher Wrapper**
  - `encryptAtRest(data: Uint8Array, key: CryptoKey)`:
    - Generates 12-byte random IV (`crypto.getRandomValues`).
    - Encrypts payload with `AES-GCM-256`.
    - Returns serialized container: `{ iv: Uint8Array, ciphertext: Uint8Array }`.
  - `decryptAtRest(container, key: CryptoKey)`:
    - Decrypts and authenticates ciphertext with `AES-GCM-256`.
- [ ] **Step 1.B.4: Configure IndexedDB Automerge Change Log Storage**
  - Create `src/services/storage/automergeStorage.ts`:
    - Define IndexedDB stores:
      - `channels`: Metadata for chat channels (`channelId`, `name`, `createdAt`).
      - `channel_changes`: Table storing encrypted binary Automerge change chunks (`channelId`, `changeIndex`, `encryptedData`, `iv`).
      - `device_slots`: Local encrypted credentials (`slotIndex`, `encryptedSlotKey`, `certificate`).
- [ ] **Step 1.B.5: Build Automerge Document Lifecycle Controller**
  - Create `src/services/crdt/channelDoc.ts`:
    - `createChannelDoc(channelId)`: Initializes empty `Automerge.init()`.
    - `loadChannelDoc(channelId, storageKey)`: Fetches all encrypted change chunks from IndexedDB, decrypts each chunk, and applies them sequentially via `Automerge.loadIncremental()`.
    - `appendMessage(doc, messageData)`: Applies local mutation via `Automerge.change()`, extracts new binary change vectors via `Automerge.getLastLocalChange()`, encrypts the binary chunk, and saves it immediately to IndexedDB.

---

#### 🚀 Module C: Blind Signaling & WebRTC Synchronization Pump

- [ ] **Step 1.C.1: Blind Discovery Topic Generation**
  - Create `src/services/network/discovery.ts`:
    - `computeBlindRoomHash(publicId: string)`:
      - Calculates $\text{SHA256}(\text{publicId})$.
      - Produces an opaque 64-character hex string used as the Trystero room topic.
- [ ] **Step 1.C.2: Wire Trystero BitTorrent Signaling with Nostr Fallback**
  - In `src/services/network/signaling.ts`:
    - Primary: Connect via `trystero/torrent` joining room `computeBlindRoomHash(targetAccountId)`.
    - Fallback: If torrent trackers fail to establish connection within 4 seconds, connect via `trystero/nostr` on the same blind topic.
- [ ] **Step 1.C.3: Implement Zero-Trust Peer Mutual Authentication Handshake**
  - When `onPeerJoin(peerId)` fires:
    - Local device generates cryptographic nonce `nonce_local = crypto.randomUUID()`.
    - Sends `{ type: 'auth-challenge', nonce: nonce_local, cert: localSlotCert }`.
    - Upon receiving challenge: signs peer's nonce using local Slot Private Key (ECDSA P-256).
    - Responds with `{ type: 'auth-response', signature: sig, timestamp: Date.now() }`.
    - **Gatekeeper Verification**:
      - Verify certificate was signed by the expected Master Account Public Key.
      - Verify signature over the challenge nonce.
      - Check timestamp freshness ($|\Delta t| < 30\text{s}$).
      - **If verification fails**: Instantly call `peer.close()` / drop connection.
- [ ] **Step 1.C.4: Build Automerge WebRTC Binary Sync Pump**
  - Create action channel `syncAction = room.makeAction('crdt-sync')`.
  - **Handshake Sync**:
    - Upon successful authentication, send local Automerge heads: `Automerge.getHeads(doc)`.
    - Peer calculates missing changes: `Automerge.getChanges(doc, peerHeads)`.
    - Peer transmits binary changes across `syncAction`.
  - **Real-Time Replication**:
    - Whenever a new local message is committed via `Automerge.change()`, broadcast the raw binary change chunk to all authenticated peers.
    - Incoming binary chunks are applied via `Automerge.applyChanges()` and simultaneously committed to local encrypted IndexedDB.

---

### 🧠 AI Mentor Consultation Prompts for Phase 1

_Copy and ask these to your AI mentor when coding Phase 1:_

- _"I am implementing HKDF-SHA256 slot derivation from a 512-bit master seed in Web Crypto. How should I structure the salt, info parameters, and key usages to ensure slot keys cannot derive the parent seed or adjacent slots?"_
- _"Can you review my PBKDF2 + AES-GCM-256 IndexedDB wrapper implementation for memory leakage of unencrypted CryptoKey buffers?"_
- _"In Automerge, what is the most efficient way to compute incremental binary deltas for transmission over WebRTC RTCDataChannel without re-serializing the entire document state?"_
- _"How should I structure the zero-trust mutual authentication challenge in Trystero to prevent replay attacks and man-in-the-middle exploits on the blind tracker room?"_

---

### 🧪 Phase 1 Self-Verification & Testing Lab

1. **Seed & Slot Determinism Lab**:
   - Run the derivation script twice with the test seed `"abandon abandon abandon ... about"`.
   - Verify that Slot #0 through Slot #4 private and public keys match bit-for-bit across both runs.
2. **At-Rest Ciphertext Inspection**:
   - Type 5 messages in the chat interface.
   - Open Chrome DevTools $\rightarrow$ Application $\rightarrow$ IndexedDB $\rightarrow$ `MurmurDatabase`.
   - Inspect the `channel_changes` table: confirm that message text (`"Hello world"`) is nowhere in plain text and only exists as random encrypted binary byte arrays.
3. **Two-Window Convergence Lab**:
   - Open Tab 1 and Tab 2 (Incognito) assigned to Slot #0 and Slot #1 under the same account.
   - Disconnect Tab 1 from the network (DevTools $\rightarrow$ Offline).
   - Type 3 messages in Tab 1 ("Offline Msg 1", "Offline Msg 2").
   - Type 2 messages in Tab 2 ("Online Msg A", "Online Msg B").
   - Reconnect Tab 1 to the network.
   - Observe WebRTC reconnection and Automerge sync: within 1 second, both tabs must display the exact same 5 messages in identical causal order.

---

### ⚠️ Common Pitfalls & Gotchas

- **Automerge WebAssembly / Bundler Configuration**: Automerge uses WebAssembly (`@automerge/automerge`). Ensure Vite is configured with `vite-plugin-wasm` and `topLevelAwait` support if running the WASM build.
- **Uint8Array Transfer Across Trystero**: Trystero action handlers natively support `Uint8Array`. Ensure you do not convert Automerge binary change chunks to base64 or JSON strings, as this introduces 33% bandwidth bloat.
- **Passcode Key Eviction**: Never persist the derived `CryptoKey` or plaintext passcode in `localStorage`. The key must exist only in volatile JavaScript heap memory and be cleared on tab lock.

---

### ✅ Phase 1 Definition of Done

You can initialize an account with 24 words, derive deterministic device slots, write messages offline that are saved encrypted in IndexedDB, and have two browser tabs discover each other blindly over BitTorrent trackers, authenticate each other via zero-trust ECDSA signatures, and synchronize Automerge change logs seamlessly over WebRTC.

---

## 🟢 Phase 2: Multi-Device Pre-Authenticated Slot Provisioning & QR Transfer

> _Provision secondary companion devices (laptops, tablets) using offline QR sync packages without typing the 24-word seed phrase, fortified with WebAuthn biometric unlock._

### 🎯 The Objective & The "Why"

Typing a 24-word recovery phrase on secondary devices creates severe attack surfaces (keyloggers, shoulder-surfing, browser extensions). Phase 2 delivers a frictionless, zero-exposure provisioning flow:

- Primary phone displays a **QR sync package** containing only the pre-signed credentials for an unassigned Device Slot (e.g., Slot #1).
- Companion device scans the QR code, activates its isolated slot keypair, and immediately begins syncing.
- The 24-word master mnemonic never touches secondary devices.
- Local access is locked behind **WebAuthn Biometric Bio-Unlock** (Face ID, Touch ID, Windows Hello).

### 🔨 Key Engineering Deliverables

1. **Slot Allocation Manager**:
   - Track slot assignments (`Slot 0: iPhone (Active)`, `Slot 1: MacBook (Available)`, etc.).
2. **Compact QR Sync Package**:
   - Serialize Slot Private Key + Pre-Signed Certificate + Master Account ID into a compact binary QR payload (using `CBOR` or compact protobuf).
3. **Camera Scanner Modal**:
   - Integrate Web Barcode Detection API / `@zxing/browser` to scan QR packages with automatic camera track shutdown upon completion.
4. **WebAuthn Bio-Unlock Hook**:
   - Implement `navigator.credentials.create` and `navigator.credentials.get` using the WebAuthn PRF (Pseudo-Random Function) extension or local encrypted credential storage.

---

## 🟢 Phase 3: Background Push-Payload Synchronization Hybrid

> _Bridge the mobile WebRTC sleep constraint by turning the Web Push API into an end-to-end encrypted 4KB data sync pipe._

### 🎯 The Objective & The "Why"

When a phone is locked, mobile operating systems suspend WebRTC connections. Phase 3 circumvents this without central servers:

- Senders dispatch encrypted 4KB Automerge change chunks directly to recipient OS push notification endpoints (Google FCM / Apple APNs) via HTTPS POST.
- The recipient Service Worker wakes up for a 10-second window in the background.
- The Service Worker appends the Automerge change chunk directly into IndexedDB and renders a native OS notification.
- When the user taps the notification, the message is already waiting in local storage with 0ms fetch latency.

### 🔨 Key Engineering Deliverables

1. **Direct Peer-to-Push Dispatcher**:
   - Generate VAPID authorization headers in the browser using Web Crypto.
   - Format encrypted 4KB Web Push payload containing the Automerge change vector.
   - Execute HTTPS POST directly to the recipient device's push subscription endpoint.
2. **Service Worker Background Ingestion Engine**:
   - In `service-worker.ts`, add the `push` event listener.
   - Decrypt the incoming 4KB payload using the shared session key.
   - Open IndexedDB directly from the Service Worker thread and append the change to `channel_changes`.
   - Call `self.registration.showNotification(title, options)`.

---

## 🟢 Phase 4: Heavy Engine Web Worker & Large File OPFS Streaming

> _Offload heavy cryptography and stream multi-gigabyte media files directly from disk to disk using the Origin Private File System (OPFS), maintaining a flat <20MB RAM footprint._

### 🎯 The Objective & The "Why"

Loading large media files into browser RAM causes tab crashes and freezes the UI. Phase 4 creates a dedicated streaming engine:

- A dedicated **Web Worker** runs Automerge heavy calculations and large file streaming.
- Files are chunked into sequential **16KB binary array blobs** via `ReadableStream`.
- Each chunk is encrypted with AES-GCM-256 and transmitted across raw WebRTC `RTCDataChannel`s.
- Recipient streams incoming chunks directly into an **Origin Private File System (OPFS)** write handle straight to physical disk.

### 🔨 Key Engineering Deliverables

1. **Dedicated Heavy Web Worker**:
   - Instantiate `heavy-worker.ts` with Comlink / structured messaging for crypto offloading.
2. **ReadableStream File Chunker**:
   - Implement sequential 16KB file slicing with WebRTC backpressure flow control (`bufferedAmountLowThreshold`).
3. **Direct-to-Disk OPFS Streaming Pipeline**:
   - Access OPFS directory: `await navigator.storage.getDirectory()`.
   - Obtain a high-speed write handle: `await fileHandle.createSyncAccessHandle()` or `createWritable()`.
   - Pipe decrypted 16KB chunks directly to disk with zero heap accumulation.

---

## 🟢 Phase 5: Production Hardening, PWA Offline Shell & UI Polish

> _Deliver a native-feeling, installable application with zero-network cold boot capability and rigorous end-to-end reliability._

### 🎯 The Objective & The "Why"

Phase 5 ensures Murmur feels as reliable and polished as a native desktop or mobile application:

- 100% of application assets, scripts, fonts, and icons are served from local Cache Storage.
- Instant launch even in airplane mode.
- Fluid, responsive UI designed with Tailwind CSS v4 and full dark mode support.
- Multi-device automated test suites and recovery audits.

---

## 🏁 The North Star Definition of Complete

You will know Murmur is 100% complete when:

1. **Sovereign Multi-Device**: You generate an account with 24 words on your phone, link your laptop by scanning an offline QR code, and both devices sync instantly over direct WebRTC.
2. **True Offline-First**: You can draft messages in an underground subway tunnel; the instant you surface, deltas replicate seamlessly to peer devices with zero merge conflicts.
3. **Zero-Knowledge Background Alerts**: Your phone rings with a native message notification while locked, with the message text already stored in your local database before you even unlock the screen.
4. **Gigabyte Streaming**: You can send a 2GB raw video file to a peer over WebRTC without your browser tab crashing or exceeding 20MB of RAM.
5. **Zero Central Footprint**: Not a single byte of chat text, user profile information, or social graph data exists on any central server or relay.
