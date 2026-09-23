import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Clock, Check, X, MessageSquarePlus } from "lucide-react";
import type { Contact } from "../../../services/storage/contacts.ts";
import { useConnectionStore } from "../../engine/store/connectionStore.ts";
import { db } from "../../../services/storage/index.ts";

interface ChatSidebarProps {
  contacts: Contact[];
  selectedAccountId: string | null;
  onSelectContact: (accountId: string) => void;
  onOpenConnectModal: () => void;
  onAcceptProposal: (contact: Contact) => Promise<void>;
  onDeclineProposal: (contact: Contact) => Promise<void>;
  isPeerOnline: (accountId: string) => boolean;
}

export const ChatSidebar = ({
  contacts,
  selectedAccountId,
  onSelectContact,
  onOpenConnectModal,
  onAcceptProposal,
  onDeclineProposal,
  isPeerOnline,
}: ChatSidebarProps) => {
  const rooms = useLiveQuery(() => db.rooms.toArray());

  const roomMap = useMemo(() => {
    const map = new Map<string, NonNullable<typeof rooms>[0]>();
    if (rooms) {
      for (const r of rooms) {
        map.set(r.peerAccountId.toLowerCase(), r);
      }
    }
    return map;
  }, [rooms]);

  const formatMessageTime = (timestamp?: number | null) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const activeConnections = useConnectionStore(
    (state) => state.activeConnections,
  );
  const activeCount = Object.keys(activeConnections).length;

  const acceptedContacts = contacts.filter((c) => c.status === "accepted");
  const pendingIncoming = contacts.filter(
    (c) => c.status === "pending_incoming",
  );
  const pendingOutgoing = contacts.filter(
    (c) => c.status === "pending_outgoing",
  );

  return (
    <div className="w-full h-full border-r border-border flex flex-col bg-secondary/60 shrink-0 relative">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            Chats
          </h2>
          <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
            <span>
              {acceptedContacts.length}{" "}
              {acceptedContacts.length === 1 ? "contact" : "contacts"}
            </span>
            {activeCount > 0 && (
              <>
                <span className="text-muted/40">•</span>
                <span className="text-emerald-500 font-medium inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {activeCount} online
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Scrollable Contacts List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3 pb-20">
        {/* 1. Pending Incoming Requests */}
        {pendingIncoming.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="text-[11px] font-semibold text-tertiary uppercase tracking-wider">
                Chat Requests ({pendingIncoming.length})
              </span>
            </div>

            {pendingIncoming.map((contact) => (
              <div
                key={contact.accountId}
                className="p-3 rounded-xl bg-surface border border-tertiary/25 shadow-xs space-y-2 animate-in fade-in"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-tertiary/15 text-tertiary flex items-center justify-center text-sm font-bold shrink-0">
                    {contact.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-foreground truncate">
                      {contact.name}
                    </div>
                    <div className="text-[11px] text-muted truncate">
                      {contact.bio || "Incoming chat request"}
                    </div>
                  </div>
                </div>

                {contact.bio && (
                  <p className="text-xs text-muted/90 italic truncate">
                    "{contact.bio}"
                  </p>
                )}

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => onAcceptProposal(contact)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => onDeclineProposal(contact)}
                    className="px-3 py-1.5 rounded-lg bg-surface hover:bg-border/60 text-muted hover:text-foreground text-xs font-medium transition-colors cursor-pointer"
                    title="Decline request"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Pending Outgoing Requests */}
        {pendingOutgoing.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Pending Invites ({pendingOutgoing.length})
              </span>
            </div>

            {pendingOutgoing.map((contact) => (
              <div
                key={contact.accountId}
                className="p-2.5 rounded-xl bg-surface/60 border border-border/70 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {contact.name}
                    </div>
                    <div className="text-[11px] text-muted truncate">
                      Invitation sent...
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDeclineProposal(contact)}
                  className="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface cursor-pointer"
                  title="Cancel invite"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 3. Accepted Contacts */}
        <div className="space-y-1">
          {acceptedContacts.length > 0 && (
            <div className="px-2 pb-1">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Contacts
              </span>
            </div>
          )}

          {acceptedContacts.map((contact) => {
            const isSelected =
              selectedAccountId?.toLowerCase() ===
              contact.accountId.toLowerCase();
            const online = isPeerOnline(contact.accountId);
            const room = roomMap.get(contact.accountId.toLowerCase());
            const lastMessage = room?.lastMessageText;
            const timeStr = formatMessageTime(room?.lastMessageTimestamp);

            return (
              <button
                key={contact.accountId}
                onClick={() => onSelectContact(contact.accountId)}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all text-left cursor-pointer ${
                  isSelected
                    ? "bg-surface border border-border/80 shadow-xs"
                    : "hover:bg-surface/50 border border-transparent"
                }`}
              >
                <div className="relative shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full bg-surface border flex items-center justify-center font-bold text-foreground text-sm transition-all ${
                      online ? "border-emerald-500/40" : "border-border"
                    }`}
                  >
                    {contact.name.slice(0, 1).toUpperCase()}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-secondary transition-colors ${
                      online
                        ? "bg-emerald-500"
                        : "bg-slate-400 dark:bg-slate-600"
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {contact.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {timeStr && (
                        <span className="text-[10px] text-muted">
                          {timeStr}
                        </span>
                      )}
                      {online ? (
                        <span className="text-[11px] font-medium text-emerald-500">
                          online
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted">offline</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-[11px] text-muted truncate flex-1">
                      {lastMessage || "No messages yet"}
                    </p>
                    {Boolean(room?.unreadCount && room.unreadCount > 0) && (
                      <span className="px-1.5 py-0.2 rounded-full bg-tertiary text-white text-[9px] font-bold shrink-0">
                        {room?.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {contacts.length === 0 && (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center mx-auto">
                <MessageSquarePlus className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  No chats yet
                </p>
                <p className="text-[11px] text-muted max-w-[200px] mx-auto">
                  Click "New Chat" to connect with a friend using their Chat ID.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button: New Chat */}
      <button
        onClick={onOpenConnectModal}
        className="absolute bottom-5 right-5 z-20 w-13 h-13 rounded-2xl bg-tertiary text-white flex items-center justify-center shadow-lg shadow-tertiary/35 hover:scale-105 active:scale-95 hover:bg-tertiary/90 transition-all cursor-pointer group"
        title="New Chat"
        aria-label="New Chat"
      >
        <MessageSquarePlus className="w-6 h-6 transition-transform group-hover:rotate-6" />
      </button>
    </div>
  );
};
