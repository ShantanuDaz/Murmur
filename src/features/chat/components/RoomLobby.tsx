import React, { useState } from "react";
import {
  Hash,
  Sparkles,
  Radio,
  Shield,
  Zap,
  ArrowRight,
  Dices,
} from "lucide-react";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../../auth/store/authStore";

const RANDOM_ADJECTIVES = [
  "amber",
  "toasted",
  "golden",
  "stealth",
  "cyber",
  "cosmic",
  "velvet",
  "solar",
  "cryptic",
  "lunar",
];

const RANDOM_NOUNS = [
  "chai",
  "murmur",
  "falcon",
  "haven",
  "matrix",
  "orbit",
  "nexus",
  "beacon",
  "echo",
  "pulse",
];

export const RoomLobby: React.FC = () => {
  const [roomInput, setRoomInput] = useState("");
  const profile = useAuthStore((state) => state.profile);
  const joinRoom = useChatStore((state) => state.joinRoom);

  const generateRandomRoom = () => {
    const adj =
      RANDOM_ADJECTIVES[Math.floor(Math.random() * RANDOM_ADJECTIVES.length)];
    const noun = RANDOM_NOUNS[Math.floor(Math.random() * RANDOM_NOUNS.length)];
    const num = Math.floor(Math.random() * 90) + 10;
    setRoomInput(`${adj}-${noun}-${num}`);
  };

  const handleJoin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanRoom = roomInput
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-");
    if (!cleanRoom || !profile) return;
    joinRoom(cleanRoom, profile);
  };

  const quickRooms = ["general", "crypto-lounge", "dev-talk"];

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <div className="bg-secondary border border-border rounded-3xl p-6 sm:p-8 shadow-xl text-left relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              P2P Room Connect
            </h2>
            <p className="text-xs text-muted">
              Serverless discovery via Nostr &bull; Direct WebRTC DataPipe
            </p>
          </div>
        </div>

        <form onSubmit={handleJoin} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="room-name-input"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
            >
              Room Identifier
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-muted">
                <Hash className="w-4 h-4" />
              </span>
              <input
                id="room-name-input"
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="enter-room-name (e.g. rooftop-cafe)"
                className="w-full bg-surface border border-border focus:border-tertiary rounded-2xl py-3 pl-10 pr-24 text-sm text-slate-100 placeholder-muted/60 focus:outline-none transition-colors font-mono"
                autoFocus
              />
              <button
                type="button"
                onClick={generateRandomRoom}
                className="absolute right-2 px-2.5 py-1.5 rounded-xl text-xs text-muted hover:text-tertiary bg-secondary hover:bg-tertiary/10 border border-border transition-colors flex items-center gap-1 cursor-pointer"
                title="Generate random room name"
              >
                <Dices className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Random</span>
              </button>
            </div>
          </div>

          {/* Quick suggestions */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-[11px] text-muted font-medium">
              Quick suggestions:
            </span>
            {quickRooms.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setRoomInput(q);
                  if (profile) joinRoom(q, profile);
                }}
                className="text-xs font-mono text-tertiary hover:underline px-2 py-0.5 rounded-lg bg-tertiary/10 border border-tertiary/20 cursor-pointer"
              >
                #{q}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={!roomInput.trim()}
            className="w-full mt-2 py-3.5 px-5 rounded-2xl bg-tertiary hover:bg-tertiary/90 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-sm shadow-lg shadow-tertiary/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Enter Room</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Informational badges */}
        <div className="grid grid-cols-3 gap-2.5 mt-6 pt-6 border-t border-border/80">
          <div className="p-2.5 rounded-xl bg-surface/50 border border-border/60 text-left">
            <Shield className="w-4 h-4 text-emerald-400 mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">
              Zero Server
            </div>
            <div className="text-[10px] text-muted">
              No database or server stores your chat
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-surface/50 border border-border/60 text-left">
            <Zap className="w-4 h-4 text-amber-400 mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">
              Direct WebRTC
            </div>
            <div className="text-[10px] text-muted">
              Encrypted P2P RTCDataChannel
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-surface/50 border border-border/60 text-left">
            <Sparkles className="w-4 h-4 text-cyan-400 mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">
              RAM-Only
            </div>
            <div className="text-[10px] text-muted">
              Messages vanish on tab close
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
