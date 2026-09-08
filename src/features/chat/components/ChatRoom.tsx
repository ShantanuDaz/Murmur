import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Users,
  ArrowLeft,
  Copy,
  Check,
  Shield,
  Info,
  LogOut,
} from "lucide-react";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../../auth/store/authStore";
import { getAvatarById } from "../../auth/utils/avatars";
import { shortenKey } from "../../auth/utils/crypto";
import { useClipboard } from "../../../hooks/useClipboard";

export const ChatRoom: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeRoomId = useChatStore((state) => state.activeRoomId);
  const status = useChatStore((state) => state.status);
  const peers = useChatStore((state) => state.peers);
  const messages = useChatStore((state) => state.messages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const leaveRoom = useChatStore((state) => state.leaveRoom);

  const profile = useAuthStore((state) => state.profile);
  const { copy, copied } = useClipboard();

  const peerList = Object.values(peers);
  const peerCount = peerList.length;

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText("");
    await sendMessage(text);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-6rem)] max-h-[850px] bg-secondary border border-border rounded-3xl shadow-2xl overflow-hidden">
      {/* Top Room Header */}
      <header className="px-4 sm:px-6 py-3.5 border-b border-border bg-surface/60 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={leaveRoom}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer"
            title="Leave room"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground font-mono flex items-center gap-1.5">
                <span className="text-tertiary">#</span>
                <span>{activeRoomId}</span>
              </h2>

              <button
                type="button"
                onClick={() => copy(activeRoomId || "")}
                className="p-1 rounded-md text-muted hover:text-tertiary hover:bg-surface transition-colors cursor-pointer"
                title="Copy room name"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              {status === "connecting" ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-warning animate-ping" />
                  <span className="text-warning">
                    Discovering peers via Nostr...
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-success font-medium">
                    P2P Mesh Active
                  </span>
                  <span>&bull;</span>
                  <span>Direct RTCDataChannel</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Peer Roster Indicator & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 bg-surface/80 border border-border rounded-full py-1.5 px-3">
            <Users className="w-3.5 h-3.5 text-tertiary" />
            <span className="text-xs font-medium text-foreground-secondary">
              {peerCount === 0
                ? "Waiting for peers"
                : `${peerCount} ${peerCount === 1 ? "peer" : "peers"} connected`}
            </span>

            {/* Active peer avatar pills */}
            {peerList.length > 0 && (
              <div className="flex -space-x-1.5 ml-1">
                {peerList.slice(0, 4).map((p) => {
                  const avatar = getAvatarById(p.profile?.avatar);
                  return (
                    <div
                      key={p.peerId}
                      title={`${p.profile.name} (${shortenKey(p.profile.publicKey)})`}
                      className={`w-5 h-5 rounded-full bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center text-[10px] border border-secondary shadow`}
                    >
                      {avatar.emoji}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={leaveRoom}
            className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 text-xs text-muted hover:text-destructive border border-border hover:border-destructive/40 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </header>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Security / Ephemeral Notice */}
        <div className="bg-surface/40 border border-border/60 rounded-2xl p-3 text-center max-w-md mx-auto space-y-1 text-xs text-muted">
          <div className="flex items-center justify-center gap-1 text-tertiary font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>Zero-Backend Ephemeral Room</span>
          </div>
          <p className="text-[11px]">
            Messages travel directly peer-to-peer over WebRTC. Nothing is stored
            on any server or database. Closing the tab wipes all messages.
          </p>
        </div>

        {messages.map((msg) => {
          if (msg.type === "system") {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/70 border border-border text-[11px] font-mono text-muted">
                  <Info className="w-3 h-3 text-tertiary shrink-0" />
                  <span>{msg.text}</span>
                </div>
              </div>
            );
          }

          const isSelf = msg.isSelf;
          const senderAvatar = getAvatarById(msg.sender.avatar);
          const senderName =
            msg.sender.name || (isSelf ? profile?.name : "Anonymous Peer");
          const senderKey = msg.sender.publicKey
            ? shortenKey(msg.sender.publicKey)
            : null;

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 ${isSelf ? "justify-end" : "justify-start"}`}
            >
              {!isSelf && (
                <div
                  className={`w-8 h-8 rounded-2xl bg-gradient-to-br ${senderAvatar.bgGradient} flex items-center justify-center text-sm shrink-0 shadow border border-border/80`}
                >
                  {senderAvatar.emoji}
                </div>
              )}

              <div
                className={`max-w-[75%] sm:max-w-[65%] rounded-3xl p-3.5 space-y-1 shadow-md ${
                  isSelf
                    ? "bg-tertiary text-tertiary-foreground rounded-br-xs"
                    : "bg-surface border border-border text-foreground rounded-bl-xs"
                }`}
              >
                {/* Message Header (Name + Key + Time) */}
                <div
                  className={`flex items-center gap-2 text-[10px] ${
                    isSelf
                      ? "text-tertiary-foreground/80 font-medium"
                      : "text-muted"
                  }`}
                >
                  <span className="font-semibold">{senderName}</span>
                  {senderKey && (
                    <span className="font-mono text-[9px] opacity-70">
                      ({senderKey})
                    </span>
                  )}
                  <span className="ml-auto opacity-70">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>

                {/* Message Text */}
                <p className="text-sm break-words whitespace-pre-wrap leading-relaxed select-text">
                  {msg.text}
                </p>
              </div>

              {isSelf && (
                <div
                  className={`w-8 h-8 rounded-2xl bg-gradient-to-br ${senderAvatar.bgGradient} flex items-center justify-center text-sm shrink-0 shadow border border-border/80`}
                >
                  {senderAvatar.emoji}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <footer className="p-3 sm:p-4 border-t border-border bg-surface/60 backdrop-blur-md shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              peerCount === 0
                ? "Send a message (waiting for peers to join)..."
                : `Message #${activeRoomId}...`
            }
            className="flex-1 bg-surface border border-border focus:border-tertiary rounded-2xl py-3 px-4 text-sm text-foreground placeholder:text-muted/60 focus:outline-none transition-colors"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 rounded-2xl bg-tertiary hover:bg-tertiary/90 disabled:opacity-40 disabled:cursor-not-allowed text-tertiary-foreground font-semibold transition-all shadow-md shadow-tertiary/20 cursor-pointer shrink-0"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
};
