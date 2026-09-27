import React from "react";
import type { Contact } from "../../services/storage/index.ts";
import { useConversationsStore } from "./conversationsStore.ts";
import { useConversation } from "./hooks/useConversation.ts";
import { Clock } from "lucide-react";

export interface ConversationProps {
  contact: Contact;
  isSelected?: boolean;
  onClick?: () => void;
}

export const Conversation: React.FC<ConversationProps> = ({
  contact,
  isSelected: isSelectedProp,
  onClick,
}) => {
  const { lastMessage, lastTimestamp, unreadCount, isOnline, pendingCount } =
    useConversation(contact);

  const openConversation = useConversationsStore(
    (state) => state.openConversation,
  );
  const setOpenConversation = useConversationsStore(
    (state) => state.setOpenConversation,
  );

  const contactID = contact.contactID;

  const isSelected =
    isSelectedProp !== undefined
      ? isSelectedProp
      : openConversation?.toLowerCase() === contactID.toLowerCase();

  const handleClick = () => {
    setOpenConversation(contactID);
    onClick?.();
  };

  const initial = (contact.name || "U").slice(0, 1).toUpperCase();
  const avatar = contact.profile?.avatar;

  const formatTime = (ts: number | null) => {
    if (!ts) return "";
    const date = new Date(ts);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all text-left cursor-pointer border ${
        isSelected
          ? "bg-surface border-border shadow-xs"
          : "bg-surface/40 hover:bg-surface/80 border-border/50"
      }`}
    >
      {/* Avatar with status indicator */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full bg-tertiary/15 text-tertiary border border-border flex items-center justify-center font-bold text-sm overflow-hidden">
          {avatar ? (
            <img
              src={avatar}
              alt={contact.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-secondary transition-colors ${
            isOnline
              ? "bg-emerald-500 shadow-xs shadow-emerald-500/50"
              : "bg-slate-400 dark:bg-slate-600"
          }`}
        />
      </div>

      {/* Contact Details & Preview */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-sm font-semibold text-foreground truncate">
            {contact.name}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {lastTimestamp ? (
              <span className="text-[10px] text-muted">
                {formatTime(lastTimestamp)}
              </span>
            ) : isOnline ? (
              <span className="text-[10px] text-emerald-500 font-medium">
                online
              </span>
            ) : (
              <span className="text-[10px] text-muted">offline</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-muted truncate flex-1">
            {lastMessage || (
              <span className="font-mono text-[11px] opacity-75">
                {contactID.startsWith("0x")
                  ? `${contactID.slice(0, 6)}...${contactID.slice(-4)}`
                  : contactID}
              </span>
            )}
          </p>

          <div className="flex items-center gap-1 shrink-0">
            {pendingCount > 0 && (
              <span
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500 text-[10px] font-medium"
                title={`${pendingCount} pending message(s) queued`}
              >
                <Clock className="w-3 h-3 animate-pulse" />
                <span>{pendingCount}</span>
              </span>
            )}
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-tertiary text-white text-[9px] font-bold">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

export default Conversation;
