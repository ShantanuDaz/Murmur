# Ephemeral P2P Web Chat (MVP Spec)

A zero-backend, zero-install, serverless peer-to-peer web chat application running entirely inside modern web browsers.

---

## 1. Scope & Priorities (Stage 1: Core Foundation)

### In Scope for MVP

- **Deterministic Cryptographic Identity:** 24-word BIP-39 mnemonic seed phrase.
- **Zero-Backend Discovery & Handshake:** Automated WebRTC handshake via public decentralized couriers (Nostr relays / BitTorrent web-trackers) with zero copy-pasting of SDP/ICE strings.
- **Direct P2P DataPipe:** Ephemeral text communication via WebRTC `RTCDataChannel`.
- **In-Memory State:** Ephemeral chat messages held strictly in local browser RAM (tab closed = data vanished).

### Explicitly Out of Scope (Deferred to Future Stages)

- Persistent storage (IndexedDB / OPFS / `navigator.storage.persist`).
- State-sync and CRDT conflict resolution (Yjs / Automerge).
- Media streaming (Audio / Video calls).
- Binary file chunking and transfers.
- Self-hosted or metered TURN relay fallbacks.

---

## 2. Core Architectural Roles

[Browser A] [Browser B]
| |
+--- 1. Derives 24-Word Seed (BIP-39) |
| Derives ephemeral display identity +--- 1. Derives 24-Word Seed (BIP-39)
| Derives ephemeral display identity
| |
+=== 2. Public Signaling Courier (Trystero via Nostr) +
| Exchanges WebRTC SDP Offer / Answer & ICE |
| (Relays drop out once handshake succeeds) |
| |
+<============ 3. Direct WebRTC Pipe >+
| (Encrypted RTCDataChannel) |
| |
+--- 4. RAM-only Chat State <============>+--- 4. RAM-only Chat State
