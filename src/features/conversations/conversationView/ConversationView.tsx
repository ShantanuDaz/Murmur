import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { getContact } from "../../../services/storage/contacts.ts";
import { useConversationsStore } from "../conversationsStore.ts";

export interface ConversationViewProps {
  contactID?: string;
  onBack?: () => void;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  contactID: propContactID,
  onBack,
}) => {
  const openConversation = useConversationsStore(
    (state) => state.openConversation,
  );
  const closeConversation = useConversationsStore(
    (state) => state.closeConversation,
  );

  const activeContactID = propContactID || openConversation;

  // Reactively fetch contact details from Dexie
  const contact = useLiveQuery(
    () => (activeContactID ? getContact(activeContactID) : undefined),
    [activeContactID],
  );

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      closeConversation();
    }
  };

  if (!activeContactID) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-secondary text-muted">
        <p className="text-xs">No conversation selected</p>
      </div>
    );
  }

  const displayName = contact?.name || `Peer ${activeContactID.slice(0, 8)}...`;
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-secondary overflow-hidden">
      {/* 1. Header */}
      <header className="h-16 px-4 border-b border-border bg-secondary/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 -ml-2 rounded-xl text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer md:hidden"
            title="Back to conversations"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-tertiary/15 text-tertiary border border-border flex items-center justify-center font-bold text-sm overflow-hidden">
              {contact?.profile?.avatar ? (
                <img
                  src={contact.profile.avatar}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-secondary bg-slate-400 dark:bg-slate-600" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-foreground truncate">
              {displayName}
            </h2>
            <p className="text-[11px] text-muted font-mono truncate">
              {activeContactID.startsWith("0x")
                ? `${activeContactID.slice(0, 6)}...${activeContactID.slice(-4)}`
                : activeContactID}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
            title="Conversation Options"
            aria-label="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Messages Canvas (Dummy container ready for subcomponents) */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-center items-center">
        <div className="text-center space-y-2 max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center mx-auto text-lg font-semibold">
            🔒
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Direct Private Room
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            All messages, profile updates, and attachments are transmitted
            directly between peers over encrypted WebRTC.
          </p>
        </div>
      </div>

      {/* 3. Input Bar (Dummy container ready for ChatInput subcomponent) */}
      <footer className="p-3 border-t border-border bg-secondary/80 shrink-0">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface border border-border">
          <input
            type="text"
            placeholder="Type a message..."
            disabled
            className="flex-1 px-3 py-1.5 text-xs bg-transparent text-foreground placeholder:text-muted focus:outline-none disabled:opacity-60"
          />
          <button
            type="button"
            disabled
            className="px-3 py-1.5 rounded-xl bg-tertiary text-white text-xs font-semibold opacity-60 cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ConversationView;
