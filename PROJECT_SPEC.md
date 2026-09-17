# Project Specification: Sovereign P2P Web Chat (The Serverless Matrix)

A 100% serverless, decentralized, offline-first peer-to-peer web application delivering a native-feeling messaging experience entirely within the sandboxed runtime of modern web browsers.

---

## 1. Scope & Core Architectural Pillars

### In Scope for Production Specification

- **Deterministic Cryptographic Identity & Device Slots**: 24-word BIP-39 mnemonic generating a 512-bit master seed, deriving Master Public Account ID and ECDSA P-256 signing keys, plus deterministic HKDF derivation of 10–20 pre-authenticated device identity slots.
- **Local-First & Offline-First CRDT Storage**: Per-channel Automerge CRDT documents operating an append-only change log. All rows committed to IndexedDB are encrypted at-rest using AES-GCM-256 derived from a user passcode/PIN via PBKDF2 (600,000 iterations).
- **Blind Signaling & Zero-Trust Traversal**: WebRTC signaling orchestrated across volunteer BitTorrent WebSocket trackers (with Nostr fallback) using blind discovery hashes: $\text{Room\_Name} = \text{SHA256}(\text{Alice\_Public\_ID})$. Sockets enforce mutual zero-trust ECDSA challenge-response upon peer join.
- **Background Push-Payload Synchronization Hybrid**: Direct peer-to-push HTTPS POST to recipient device OS endpoints (Google FCM / Apple APNs) with encrypted 4KB Automerge binary change blocks. Service Worker 10-second background execution window appends incoming deltas directly to IndexedDB.
- **Infinite Large File Streaming via OPFS**: Multi-gigabyte file transfers stream from disk to disk using the Origin Private File System (OPFS) and Web Workers with `ReadableStream` 16KB AES-GCM encrypted chunks, maintaining tab RAM below 20MB.
- **WebAuthn Biometric Bio-Unlock**: Biometric session unlock (Face ID, Touch ID, Windows Hello) protecting local cryptographic keystore.

---

## 2. System Architecture Layers

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                            │
│         (Tailwind CSS v4 + React 19 + WebAuthn Bio-Unlock)             │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌───────────────────────────────┐                   ┌────────────────────┐
│      SERVICE WORKER           │                   │    WEB WORKER      │
│  (Background Push Listener)   │                   │ (The Heavy Engine) │
└────────┬──────────────────────┘                   └────────┬───────────┘
         │                                                   │
         │ (Writes 4KB Encrypted Payloads)                   │ (Streams WebRTC
         │                                                   │  & Chunked Files)
         ▼                                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        LOCAL STORAGE LAYER                             │
│  - IndexedDB (Automerge Change Logs - Encrypted-at-Rest via PIN)       │
│  - OPFS (Direct-to-Disk High-Speed Large Binary File Streaming)        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack Reference

| Layer                     | Technology                                         | Operational Purpose                                                                                                                                       |
| :------------------------ | :------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identity / Seed**       | `@scure/bip39`                                     | Converts 24-word cryptographic mnemonics into a 512-bit master binary seed.                                                                               |
| **Cryptography Core**     | **Web Crypto API**                                 | Native, C++-speed browser functions for asymmetric signing (ECDSA P-256), symmetric data locking (AES-GCM-256), and PBKDF2 / HKDF derivation.             |
| **Data Structure Engine** | **Automerge (CRDT)**                               | Operates an append-only cryptographic change log to merge concurrent, offline mutations with zero central authority conflict.                             |
| **Signaling Adapter**     | **Trystero (BitTorrent Primary + Nostr Fallback)** | Connects to public, volunteer WebTorrent WebSocket trackers solely to swap WebRTC ICE connection coordinates using blind hashes (`SHA256(Target_PubID)`). |
| **Network Pipe**          | **WebRTC `RTCDataChannel`**                        | Direct, raw browser-to-browser data conduits. Fully bypassed after the initial signaling handshake.                                                       |
| **Background Sync**       | **Web Push API**                                   | Dispatches standard JSON notifications to client-device operating system endpoints via direct HTTPS POST requests from peer clients.                      |
| **Database Storage**      | **IndexedDB (`idb` / Dexie)**                      | Client-side, persistent file-system rows fortified at-rest via password-derived key encryption.                                                           |
| **File Storage Pipeline** | **OPFS (Origin Private File System)**              | High-speed, zero-RAM browser file handle streams to disk, bypassing web page execution memory limits.                                                     |

---

## 4. Architectural Blueprint & Implementation Phases

For the complete architectural design, sequence diagrams, and security specifications, refer to:
👉 **[`ARCHITECTURE.md`](./ARCHITECTURE.md)**

For the step-by-step developer checklist and AI mentor guide, refer to:
👉 **[`docs/ROADMAP.md`](./docs/ROADMAP.md)**
