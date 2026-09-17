# The Architecture of Modern Multi-Device, Group-First P2P Chat

> **A Practical Guide for Web Developers**  
> _How to design and build end-to-end encrypted, multi-device, decentralized chat applications without getting lost in academic jargon._

---

## Table of Contents

1. [The Big Picture: From Toy P2P to Production Protocol](#1-the-big-picture)
2. [The Pitfall: Why You Can't Just Share One Key Across Devices](#2-the-pitfall-sharing-one-key)
3. [Architecture Pillar 1: Account Identity vs. Device Identity](#3-pillar-1-account-vs-device-identity)
   - [The Cryptographic Chain of Trust (Cross-Signing)](#the-cryptographic-chain-of-trust)
   - [Code Snippet: Generating Keys and Signing Device Certificates](#code-key-generation--signing)
4. [Architecture Pillar 2: "Every Chat is a Group Chat"](#4-pillar-2-every-chat-is-a-group-chat)
   - [Unified Room Semantics](#unified-room-semantics)
   - [Multi-Recipient Fan-Out & Self-Sync](#multi-recipient-fan-out--self-sync)
5. [Architecture Pillar 3: Device Pairing Flow (Adding a Companion)](#5-pillar-3-device-pairing-flow)
   - [The QR Code Handshake Step-by-Step](#the-qr-handshake-step-by-step)
   - [Code Snippet: Secure Pairing Verification](#code-pairing-verification)
6. [Architecture Pillar 4: Group Cryptography (Why Pairwise Fails)](#6-pillar-4-group-cryptography)
   - [Pairwise vs. Sender Keys (Signal & Matrix Megolm Model)](#pairwise-vs-sender-keys)
   - [How a Symmetric Ratchet Works (Math & Code)](#how-a-symmetric-ratchet-works)
7. [Architecture Pillar 5: Offline Delivery & Message Sync](#7-pillar-5-offline-delivery--sync)
   - [Handling Asynchronous P2P Messages](#handling-asynchronous-p2p-messages)
   - [Ordering Messages (Vector Clocks & Causal DAGs)](#ordering-messages)
8. [Complete TypeScript Data Models](#8-complete-typescript-data-models)
9. [Summary & Implementation Roadmap](#9-summary--roadmap)

---

## 1. The Big Picture

In simple chat tutorials, messaging is modeled as:

```
User A (Key A) ──────[ WebSocket / WebRTC ]──────> User B (Key B)
```

In the real world, users have a laptop, a smartphone, and a browser tab. They join groups with 2, 10, or 100 members. Some devices are online on high-speed fiber; others are asleep in someone's pocket with spotty 4G.

To make a real chat app work, we must satisfy three core requirements:

1. **Multi-Device Support:** Alice can read and write from her phone and laptop seamlessly.
2. **Unified Group Model:** A 1-on-1 direct message is simply a room with 2 members. Group logic handles everything.
3. **End-to-End Encryption & Zero Central Authority:** Messages are encrypted such that no signaling relay or courier can read them.

---

## 2. The Pitfall: Sharing One Key

The intuitive first thought many developers have is:

> _"If Alice has a 24-word seed phrase, why can't she just type that seed phrase into both her phone and her laptop so both share the same private/public key?"_

In a decentralized or P2P mesh network, **this breaks catastrophic invariants**:

### A. WebRTC Signaling Collision (The Race Condition)

In WebRTC (over Nostr relays, BitTorrent trackers, or MQTT), peers discover each other by advertising their public key.
If both Alice's laptop and phone announce: `I am pubkey 0xALICE`, when Bob attempts to connect:

- Bob sends an SDP Offer to `0xALICE`.
- Both devices receive it and send competing SDP Answers.
- WebRTC ICE negotiation collides and fails.

### B. Cryptographic State Desynchronization (The Ratchet Collapse)

Modern encryption protocols use "ratchets" (keys advance forward with every message so old keys are deleted).

- If Phone and Laptop share the same private key:
  1. Phone decrypts Message #1 $\rightarrow$ ratchet advances to state `2`.
  2. Laptop never saw Message #1.
  3. When Message #2 arrives at Laptop, its ratchet is still at state `1`.
  4. Laptop **permanently fails to decrypt** all future messages or commits dangerous cryptographic nonce reuse.

### C. Impossible Device Revocation

If Alice loses her phone in a taxi, she cannot revoke just that phone. Because both devices share the exact same key, she would have to burn her entire identity, change her public address, and ask all her contacts to re-add her.

---

## 3. Pillar 1: Account Identity vs. Device Identity

The industry standard (used by Signal, Matrix, WhatsApp, and Berty) separates **who you are** from **what hardware you are using**.

```
                ┌──────────────────────────────────────────────┐
                │             Account Root Identity            │
                │        (Ed25519 Master Identity Key)         │
                │   • Derived from 24-word BIP-39 Seed         │
                │   • Never connects to network sockets        │
                │   • Acts as a private Certificate Authority  │
                └──────────────────────┬───────────────────────┘
                                       │
                      Signs Delegation Certificates
                                       │
               ┌───────────────────────┴───────────────────────┐
               ▼                                               ▼
  ┌─────────────────────────┐                     ┌─────────────────────────┐
  │    Device 1 (Phone)     │                     │    Device 2 (Laptop)    │
  │ • Device ID: dev_101    │                     │ • Device ID: dev_202    │
  │ • Local Ed25519/X25519  │                     │ • Local Ed25519/X25519  │
  │ • Signed by Master Key  │                     │ • Signed by Master Key  │
  │ • Active P2P Node       │                     │ • Active P2P Node       │
  └─────────────────────────┘                     └─────────────────────────┘
```

### The Cryptographic Chain of Trust

1. **Account Key (Root)**: Derived deterministically from Alice's 24-word seed phrase. This is her permanent public handle (`0xAliceMaster...`).
2. **Device Keypair**: Generated locally in the browser/device (stored in IndexedDB). It is never exported or synced.
3. **Device Certificate (Delegation)**:
   The Master Key signs a small JSON document declaring:
   > _"I (AliceMaster) certify that Device Key `0xDeviceLaptop...` belongs to me and is valid until Timestamp X."_

When Bob receives a message from Alice's laptop, Bob checks:
$$\text{verify}(\text{Signature}, \text{DevicePubkey}, \text{AliceMasterPubkey}) \stackrel{?}{=} \text{valid}$$

Bob only needs to trust Alice's Master Key. The math guarantees that the laptop is authorized.

---

### Code: Key Generation & Signing

Here is how this works using `@noble/curves` (the standard fast crypto library in modern TypeScript):

```typescript
import { ed25519 } from "@noble/curves/ed25519";
import { bytesToHex, hexToBytes } from "./cryptoHelpers";

export interface DeviceCertificate {
  accountId: string; // Master Ed25519 public key hex
  deviceId: string; // Random UUID or slug
  deviceSigningPubHex: string; // Device Ed25519 public key hex
  deviceEncryptPubHex: string; // Device X25519 public key hex
  issuedAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp (or 0 for permanent)
  signatureHex: string; // Master signature of the above payload
}

/**
 * 1. Master signs and authorizes a new device
 */
export function authorizeDevice(
  masterPrivKey: Uint8Array,
  masterPubKeyHex: string,
  deviceId: string,
  deviceSigningPubHex: string,
  deviceEncryptPubHex: string,
  validityDays = 365,
): DeviceCertificate {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + validityDays * 24 * 60 * 60 * 1000;

  // Canonical payload to sign (deterministic string)
  const canonicalPayload = JSON.stringify({
    accountId: masterPubKeyHex,
    deviceId,
    deviceSigningPubHex,
    deviceEncryptPubHex,
    issuedAt,
    expiresAt,
  });

  const payloadBytes = new TextEncoder().encode(canonicalPayload);
  const signature = ed25519.sign(payloadBytes, masterPrivKey);

  return {
    accountId: masterPubKeyHex,
    deviceId,
    deviceSigningPubHex,
    deviceEncryptPubHex,
    issuedAt,
    expiresAt,
    signatureHex: bytesToHex(signature),
  };
}

/**
 * 2. Any peer verifies that this device belongs to the account
 */
export function verifyDeviceCertificate(cert: DeviceCertificate): boolean {
  // Check expiration
  if (cert.expiresAt !== 0 && Date.now() > cert.expiresAt) {
    return false; // Certificate expired
  }

  const canonicalPayload = JSON.stringify({
    accountId: cert.accountId,
    deviceId: cert.deviceId,
    deviceSigningPubHex: cert.deviceSigningPubHex,
    deviceEncryptPubHex: cert.deviceEncryptPubHex,
    issuedAt: cert.issuedAt,
    expiresAt: cert.expiresAt,
  });

  const payloadBytes = new TextEncoder().encode(canonicalPayload);
  const sigBytes = hexToBytes(cert.signatureHex);
  const masterPubBytes = hexToBytes(cert.accountId);

  // Pure Ed25519 verification: 1 line of math
  return ed25519.verify(sigBytes, payloadBytes, masterPubBytes);
}
```

---

## 4. Pillar 2: "Every Chat is a Group Chat"

### Unified Room Semantics

Never write separate code paths for 1-on-1 vs. Group chat.

- **1-on-1 Chat**: A room where `members = [Alice, Bob]`.
- **Group Chat**: A room where `members = [Alice, Bob, Charlie]`.

Each room has:

- A `roomId` (e.g., hash of room creator + timestamp, or deterministic hash of the two participants for a 1:1 room).
- A member roster containing `Account ID`s.

### Multi-Recipient Fan-Out & Self-Sync

When Alice sends a message in a room, she does not message "users". She messages **devices**.

Suppose:

- **Alice** has 2 devices: `Alice-Phone` (sender), `Alice-Laptop`.
- **Bob** has 2 devices: `Bob-Phone`, `Bob-Laptop`.

```
                    ┌─────────────────────────┐
                    │   Alice-Phone (Sender)  │
                    └────────────┬────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           ▼                     ▼                     ▼
┌─────────────────────┐┌─────────────────────┐┌─────────────────────┐
│    Alice-Laptop     ││      Bob-Phone      ││     Bob-Laptop      │
│     (Self-Sync)     ││  (Recipient Dev 1) ││  (Recipient Dev 2) │
└─────────────────────┘└─────────────────────┘└─────────────────────┘
```

> **The Secret to Multi-Device History Sync:**  
> Alice's phone sends the message to her own laptop! Because Alice's other devices are included in the recipient list, all devices automatically receive all incoming and outgoing messages.

---

## 5. Pillar 3: Device Pairing Flow

On the login screen, we offer:

1. **Create Account:** Generates new 24-word seed phrase $\rightarrow$ creates primary device.
2. **Link a Device:** Companion device setup via QR code.
3. **Restore Account:** Enters 24-word seed phrase on a fresh device.

### The QR Handshake Step-by-Step

```
[ New Device: Laptop ]                            [ Primary Device: Phone ]
         │                                                    │
 1. Generates local Device Keypair                            │
    (dev_sign, dev_encrypt)                                   │
 2. Displays QR Code:                                         │
    • Temp Rendezvous Session ID                              │
    • dev_sign_pub, dev_encrypt_pub                           │
         │                                                    │
         │ ────────── 3. Phone Scans QR with Camera ─────────>│
         │                                                    │
         │                                          4. Prompts User:
         │                                             "Authorize MacBook Pro?"
         │                                          5. Master Key signs:
         │                                             DeviceCertificate
         │                                                    │
         │ <───────── 6. P2P Handshake (WebRTC) ──────────────│
         │    Sends: DeviceCertificate + Active Room Roster   │
         │                                                    │
 7. Saves Certificate & Rooms                                 │
    READY TO CHAT!                                            │
```

Notice a crucial security property: **The 24-word seed never touches the laptop!**  
If the laptop gets infected with malware, Alice's root account is still safe on her phone. She can revoke the laptop's certificate at any time.

---

## 6. Pillar 4: Group Cryptography (Why Pairwise Fails)

### Pairwise vs. Sender Keys

If a group has 20 members, and each member has 2 devices, that is 40 endpoints.

- **Naive Pairwise Encryption (1-to-1):**  
  To send "Hello", Alice's device must run encryption 39 times and send 39 distinct encrypted packets over WebRTC. If someone sends a 5MB image, that means transmitting $39 \times 5\text{MB} \approx 195\text{MB}$ of data!

- **The Industry Solution: Sender Keys (Signal & Matrix Megolm):**
  1. Each device creates its own **Sender Chain Key** (a 32-byte secret).
  2. Each device encrypts this key _once_ to each room participant using direct pairwise encryption.
  3. When Alice's phone sends a message, it encrypts the message **once** using its local Sender Key and broadcasts that exact same ciphertext to all 39 devices.
  4. Every recipient uses Alice's phone's public Sender Key state to decrypt.

```
            [ Alice-Phone Sender Ratchet ]
            Chain Key 0 ──(HMAC)──> Chain Key 1 ──(HMAC)──> Chain Key 2
                 │                       │                       │
                 ▼                       ▼                       ▼
            Message Key 0           Message Key 1           Message Key 2
                 │                       │                       │
                 ▼                       ▼                       ▼
            AES-256-GCM             AES-256-GCM             AES-256-GCM
```

### How a Symmetric Ratchet Works (Math & Code)

Every time a message is sent:
$$\text{MessageKey}_i = \text{HMAC-SHA256}(\text{ChainKey}_i, \text{"MessageKey"})$$
$$\text{ChainKey}_{i+1} = \text{HMAC-SHA256}(\text{ChainKey}_i, \text{"AdvanceChain"})$$

Once a message key is used, it is erased. Old messages cannot be decrypted even if the current chain key is compromised (**Forward Secrecy**).

```typescript
import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha256";

export class SenderRatchet {
  private chainKey: Uint8Array;
  public iteration: number;

  constructor(initialChainKey: Uint8Array) {
    this.chainKey = initialChainKey;
    this.iteration = 0;
  }

  /**
   * Steps the ratchet forward and derives a single-use message key
   */
  public step(): { messageKey: Uint8Array; iteration: number } {
    const enc = new TextEncoder();

    // 1. Derive single-use message key
    const messageKey = hmac(sha256, this.chainKey, enc.encode("MessageKey"));

    // 2. Advance the chain key forward (one-way hash)
    this.chainKey = hmac(sha256, this.chainKey, enc.encode("AdvanceChain"));

    const currentIteration = this.iteration;
    this.iteration++;

    return { messageKey, iteration: currentIteration };
  }
}
```

Encrypting the message is standard Web Crypto `AES-GCM-256`:

```typescript
export async function encryptPayload(
  messageKey: Uint8Array,
  plaintext: string,
): Promise<{ ciphertextHex: string; ivHex: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit standard IV
  const key = await crypto.subtle.importKey(
    "raw",
    messageKey,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );

  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  );

  return {
    ciphertextHex: bytesToHex(new Uint8Array(cipherBuffer)),
    ivHex: bytesToHex(iv),
  };
}
```

---

## 7. Pillar 5: Offline Delivery & Sync

In pure P2P (WebRTC), if Bob’s laptop is asleep when Alice sends a message, WebRTC cannot deliver it.

### Practical P2P Strategies

1. **Peer Catch-Up (Local/Group Sync):**
   When Bob's laptop opens up:
   - It establishes WebRTC connections with any online members in the room (or Bob's own phone).
   - It announces: _"My last known message for this room was #42."_
   - Any peer holding messages #43..#50 replies with the encrypted payloads.
2. **Decentralized Ephemeral Mailboxes (Nostr Relays):**
   - Murmur already integrates Trystero/Nostr relays for signaling!
   - Sender publishes the encrypted envelope to a room topic on Nostr relays.
   - Nostr relays retain ephemeral events for a few hours/days.
   - When Bob's laptop wakes up, it queries the relay for messages with timestamps after its last sync.

### Ordering Messages (Causal DAGs & Lamport Clocks)

Clocks on phones and laptops are often off by seconds or minutes. Never sort messages purely by `Date.now()`.
Instead, attach a **Lamport Timestamp** or **Parent Message ID**:

```typescript
export interface RoomMessage {
  id: string; // UUID or hash(sender + counter)
  roomId: string; // Target room
  senderAccountId: string; // Alice Master
  senderDeviceId: string; // Alice Laptop
  lamportCounter: number; // Max(localCounter, incomingCounter) + 1
  parents: string[]; // IDs of the immediately preceding messages (DAG)
  payload: string; // Encrypted payload
}
```

This guarantees that replies always appear after the message they are replying to, regardless of system clock drift!

---

## 8. Complete TypeScript Data Models

Here are the complete data structures to implement this in Murmur:

```typescript
// 1. Account Level (Stored securely or derived on login)
export interface AccountIdentity {
  accountId: string; // Ed25519 Master Public Key (Hex)
  mnemonic?: string; // 24-word seed phrase (only on primary/restore)
  createdAt: number;
}

// 2. Device Level (Stored in local browser IndexedDB)
export interface DeviceIdentity {
  deviceId: string; // e.g. "macbook-air-2026" or UUID
  signingPublicKey: string; // Ed25519 Public Key (Hex)
  signingPrivateKey: Uint8Array; // Ed25519 Private Key
  encryptionPublicKey: string; // X25519 Public Key (Hex)
  encryptionPrivateKey: Uint8Array; // X25519 Private Key
  certificate: DeviceCertificate; // Master signature validating this device
}

// 3. Room Membership
export interface RoomRoster {
  roomId: string;
  name: string;
  isDirect: boolean; // true if 2-person chat, false if multi-user group
  members: {
    accountId: string;
    role: "admin" | "member";
    devices: DeviceCertificate[]; // All known authorized devices for this member
  }[];
}

// 4. Group Message Envelope
export interface GroupMessageEnvelope {
  roomId: string;
  senderAccountId: string;
  senderDeviceId: string;
  iteration: number; // Ratchet counter
  ivHex: string; // AES-GCM IV
  ciphertextHex: string; // Encrypted message text/content
  signatureHex: string; // Device signature authenticating the ciphertext
}
```

---

## 9. Summary & Roadmap

| What                      | Why                                                            | How                                                                             |
| :------------------------ | :------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| **Hierarchical Identity** | Prevents WebRTC collisions and allows revoking single devices. | Master Key (BIP-39) cross-signs local Device Keypairs.                          |
| **Every Chat is a Group** | Code reuse and consistent sync across all chats.               | Model all chats as `Room` with $N$ member account IDs.                          |
| **QR Code Linking**       | Simple UX without exposing seed phrase to laptops/tablets.     | Laptop shows public key in QR; Phone scans, signs certificate, transfers state. |
| **Sender Keys**           | Avoids $O(N^2)$ encryption explosion in groups.                | Each device holds a symmetric ratchet, encrypts once, and broadcasts.           |
| **Self-Sync**             | All your devices see sent and received messages.               | Senders include their own other devices in the recipient roster.                |

This architecture gives Murmur the exact cryptographic foundation used by the world's most secure messaging protocols, while keeping it 100% serverless, peer-to-peer, and running in the browser.
