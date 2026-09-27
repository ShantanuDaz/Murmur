import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { MessageSquare } from "lucide-react";
import {
  getActiveConversationContacts,
  type Contact,
} from "../../services/storage/index.ts";
import { Conversation } from "./Conversation.tsx";
import { ConversationView } from "./conversationView/index.ts";
import { useConversationsStore } from "./conversationsStore.ts";

export const ConversationTab: React.FC = () => {
  const openConversation = useConversationsStore(
    (state) => state.openConversation,
  );
  const conversationContacts: Contact[] =
    useLiveQuery(() => getActiveConversationContacts(), []) ?? [];

  return (
    <div className="flex-1 flex overflow-hidden h-full w-full bg-secondary">
      {/* 1. Conversations List Sidebar (Full-width on mobile when no chat is open; fixed column on desktop) */}
      <div
        className={`${
          openConversation ? "hidden md:flex" : "flex"
        } w-full md:w-80 lg:w-96 shrink-0 h-full flex-col border-r border-border bg-secondary/60 relative`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-semibold text-foreground tracking-tight">
              Conversations
            </h1>
            <p className="text-xs text-muted mt-0.5">
              {conversationContacts.length}{" "}
              {conversationContacts.length === 1 ? "chat" : "chats"}
            </p>
          </div>
        </div>

        {/* Scrollable Conversations List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {conversationContacts.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center mx-auto text-lg font-semibold">
                💬
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  No conversations yet
                </p>
                <p className="text-[11px] text-muted max-w-[220px] mx-auto leading-relaxed">
                  Incoming knocks or newly started chats will automatically
                  appear here.
                </p>
              </div>
            </div>
          ) : (
            conversationContacts.map((contact) => (
              <Conversation key={contact.contactID} contact={contact} />
            ))
          )}
        </div>
      </div>

      {/* 2. Active Conversation Pane (Full-width on mobile when open; right pane on desktop) */}
      <div
        className={`${
          openConversation ? "flex" : "hidden md:flex"
        } flex-1 flex-col min-w-0 h-full bg-secondary`}
      >
        {openConversation ? (
          <ConversationView />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-secondary">
            <div className="w-14 h-14 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center mx-auto mb-3 shadow-sm shadow-tertiary/15">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">
              Select a conversation
            </h2>
            <p className="text-xs text-muted mt-1 max-w-xs leading-relaxed">
              Choose a contact from the list to connect directly to their
              private 1:1 room.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationTab;
