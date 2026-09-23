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
  onBack?: () => void;
}

export const ChatThread = ({ contact, isOnline, onBack }: ChatThreadProps) => {
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
      <ChatHeader contact={contact} isOnline={isOnline} onBack={onBack} />

      {/* Message List */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-2.5 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2 max-w-xs mx-auto">
            <div className="w-11 h-11 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">
              Direct Encrypted Chat
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Say hello to{" "}
              <span className="text-foreground font-medium">
                {contact.name}
              </span>
              ! Your messages are sent directly between your devices.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 flex flex-col">
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
        <ChatInput
          onSendMessage={handleSendMessage}
          placeholder={`Message ${contact.name}...`}
        />
      </div>
    </div>
  );
};
