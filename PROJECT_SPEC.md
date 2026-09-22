# Project Specification: Sovereign P2P Web Chat & Calls (MVP)

A 100% serverless, decentralized, local-first peer-to-peer web application delivering text messaging, direct chat, group rooms, and audio/video calling entirely within the browser.

---

## 1. MVP Scope & Core Deliverables

The MVP focuses on five foundational pillars:

1. **User Identity (Root Account)**:
   - 12/24-word BIP-39 mnemonic generating a 512-bit master seed.
   - Master Account ID derived from Ed25519 root public key.
   - User profile management (display name, avatar, bio).
   - Identity backup and restoration via seed phrase.

2. **Device Identity (Local Client Instance)**:
   - Unique device identifier (`deviceId`) and human-readable label (`deviceName`).
   - Dedicated local signing (Ed25519) and encryption (X25519) keypairs bound to the user identity.
   - Stored securely in local browser IndexedDB.

3. **One-on-One (1:1) Chat**:
   - Direct peer-to-peer messaging between two users.
   - Deterministic direct room topic rendezvous or direct invite code.
   - Message persistence in local IndexedDB.
   - Peer presence and connection status indicators.

4. **Group Chat**:
   - Multi-peer WebRTC mesh rooms with shareable room names and IDs.
   - Live presence rosters showing connected participants with user and device details.
   - Real-time message broadcasting and persistent room history.

5. **Audio & Video Calls (Single & Group)**:
   - P2P WebRTC media streaming for both 1:1 and group calls.
   - Media controls: microphone mute/unmute, camera toggle on/off, call end.
   - Responsive video grid adapting to participant count.
   - Visual status indicators for muted audio and video-off states with avatar fallbacks.

---

## 2. Technical Stack Reference

| Layer                     | Technology        | Operational Purpose                                |
| :------------------------ | :---------------- | :------------------------------------------------- |
| **Framework & UI**        | React 19 + Vite   | Fast client-side rendering                         |
| **Styling**               | Tailwind CSS v4   | Clean, responsive design                           |
| **Icons**                 | Lucide React      | Clean icon set                                     |
| **State Management**      | Zustand           | Reactive client state (`authStore`, `chatStore`)   |
| **Identity / Seed**       | `@scure/bip39`    | BIP-39 mnemonic generation & validation            |
| **Cryptography**          | `@noble/curves`   | Ed25519 & X25519 curves                            |
| **P2P Signaling & Media** | Trystero          | Serverless WebRTC mesh matchmaking & media streams |
| **Storage**               | Dexie (IndexedDB) | Persistent client-side database                    |

---

## 3. Reference Architecture & Implementation Guide

- Complete Architectural Blueprint: 👉 [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Step-by-Step Developer Roadmap: 👉 [`docs/ROADMAP.md`](./docs/ROADMAP.md)
