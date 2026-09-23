import { UserPlus, Clock, Check, X } from "lucide-react";
import type { Contact } from "../../../services/storage/contacts.ts";
import { useConnectionStore } from "../../engine/store/connectionStore.ts";

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
    <div className="w-80 sm:w-96 border-r border-border flex flex-col bg-secondary/50 shrink-0">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-bold text-foreground">Direct Chats</h2>
          <p className="text-[11px] text-muted flex items-center gap-1.5">
            <span>
              {acceptedContacts.length}{" "}
              {acceptedContacts.length === 1 ? "contact" : "contacts"}
            </span>
            {activeCount > 0 && (
              <>
                <span className="text-muted/40">•</span>
                <span className="text-emerald-400 font-medium inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {activeCount} active P2P
                </span>
              </>
            )}
          </p>
        </div>

        <button
          onClick={onOpenConnectModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-tertiary text-tertiary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Connect</span>
        </button>
      </div>

      {/* Scrollable Contacts List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* 1. Pending Incoming Requests */}
        {pendingIncoming.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider">
                Connection Requests ({pendingIncoming.length})
              </span>
            </div>

            {pendingIncoming.map((contact) => (
              <div
                key={contact.accountId}
                className="p-3 rounded-2xl bg-surface border border-tertiary/20 shadow-sm space-y-2.5 animate-in fade-in"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-tertiary/15 text-tertiary flex items-center justify-center text-xs font-bold shrink-0">
                    {contact.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-foreground truncate">
                      {contact.name}
                    </div>
                    <div className="text-[10px] text-muted font-mono truncate">
                      {contact.accountId.slice(0, 10)}...
                      {contact.accountId.slice(-6)}
                    </div>
                  </div>
                </div>

                {contact.bio && (
                  <p className="text-[11px] text-muted/90 italic truncate">
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
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Pending Outgoing ({pendingOutgoing.length})
              </span>
            </div>

            {pendingOutgoing.map((contact) => (
              <div
                key={contact.accountId}
                className="p-2.5 rounded-xl bg-surface/50 border border-border/60 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {contact.name}
                    </div>
                    <div className="text-[10px] text-muted font-mono truncate">
                      Awaiting rendezvous...
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDeclineProposal(contact)}
                  className="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface cursor-pointer"
                  title="Cancel request"
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
            <div className="px-1 pb-1">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Contacts
              </span>
            </div>
          )}

          {acceptedContacts.map((contact) => {
            const isSelected =
              selectedAccountId?.toLowerCase() ===
              contact.accountId.toLowerCase();
            const online = isPeerOnline(contact.accountId);

            return (
              <button
                key={contact.accountId}
                onClick={() => onSelectContact(contact.accountId)}
                className={`w-full p-2.5 rounded-2xl flex items-center gap-3 transition-colors text-left cursor-pointer ${
                  isSelected
                    ? "bg-surface border border-border shadow-xs"
                    : "hover:bg-surface/50 border border-transparent"
                }`}
              >
                <div className="relative shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full bg-secondary border flex items-center justify-center font-bold text-foreground text-xs transition-all ${
                      online
                        ? "border-emerald-500/40 ring-2 ring-emerald-500/20"
                        : "border-border"
                    }`}
                  >
                    {contact.name.slice(0, 1).toUpperCase()}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-secondary transition-colors ${
                      online
                        ? "bg-emerald-400 ring-2 ring-emerald-400/30"
                        : "bg-neutral-500"
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {contact.name}
                    </span>
                    {online ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono font-medium shrink-0">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                        P2P Live
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted shrink-0">
                        offline
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted font-mono truncate">
                    {contact.accountId.slice(0, 8)}...
                    {contact.accountId.slice(-6)}
                  </div>
                </div>
              </button>
            );
          })}

          {contacts.length === 0 && (
            <div className="text-center py-10 px-4 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center mx-auto">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  No contacts yet
                </p>
                <p className="text-[11px] text-muted">
                  Click "Connect" to send your first request using a Murmur
                  Number.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
