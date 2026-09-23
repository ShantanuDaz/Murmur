import { useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { MessageSquare } from "lucide-react";
import type { Contact } from "../../../services/storage/contacts.ts";
import {
  getMessagesForRoom,
  markMessagesReadInRoom,
} from "../../../services/storage/messages.ts";
import {
  computeDirectRoomId,
  markRoomAsRead,
} from "../../../services/storage/rooms.ts";
import { messageManager } from "../services/messageManager.ts";
import useAuth from "../../auth/store/authStore.ts";
import { ChatHeader } from "./ChatHeader.tsx";
import { MessageBubble } from "./MessageBubble.tsx";
import { ChatInput } from "./ChatInput.tsx";

interface ChatThreadProps {
  contact: Contact;
  isOnline: boolean;
}

export const ChatThread = ({ contact, isOnline }: ChatThreadProps) => {
  const currentDevice = useAuth((state) => state.device);
  const myAccountId = currentDevice?.accountId.toLowerCase() || "";
  const peerAccountId = contact.accountId.toLowerCase();

  const roomId = computeDirectRoomId(myAccountId, peerAccountId);

  // Live reactive messages for this room from Dexie
  const messages =
    useLiveQuery(() => getMessagesForRoom(roomId), [roomId]) || [];

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Mark room and incoming messages as read when viewing
  useEffect(() => {
    if (myAccountId && roomId) {
      void markRoomAsRead(roomId);
      void markMessagesReadInRoom(roomId, myAccountId);
    }
  }, [roomId, myAccountId, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSendMessage = async (content: string) => {
    await messageManager.sendMessage(peerAccountId, content);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-primary">
      <ChatHeader contact={contact} isOnline={isOnline} />

      {/* Message List */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2.5 max-w-sm mx-auto">
            <div className="w-10 h-10 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-semibold text-foreground">
              Encrypted Channel Ready
            </h4>
            <p className="text-[11px] text-muted leading-relaxed">
              Messages to{" "}
              <span className="text-foreground font-medium">
                {contact.name}
              </span>{" "}
              travel directly peer-to-peer with local-first outbox delivery.
            </p>
          </div>
        ) : (
          <div className="space-y-3 flex flex-col">
            {messages.map((msg) => {
              const isOutgoing =
                msg.senderAccountId.toLowerCase() === myAccountId;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isOutgoing ? "justify-end" : "justify-start"}`}
                >
                  <MessageBubble message={msg} isOutgoing={isOutgoing} />
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="mt-auto shrink-0">
        {isOnline && (
          <div className="px-6 py-1.5 bg-emerald-500/5 border-t border-emerald-500/10 flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-mono inline-flex items-center gap-1.5 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Direct WebRTC data channel active
            </span>
            <span className="text-[10px] text-muted font-mono">
              Zero hop • Instant delivery
            </span>
          </div>
        )}
        <ChatInput
          onSendMessage={handleSendMessage}
          placeholder={`Message ${contact.name}...`}
        />
      </div>
    </div>
  );
};
