import { Clock, Check, CheckCheck } from "lucide-react";
import type { Message } from "../../../services/storage/messages.ts";

interface MessageBubbleProps {
  message: Message;
  isOutgoing: boolean;
}

export const MessageBubble = ({ message, isOutgoing }: MessageBubbleProps) => {
  const timeFormatted = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(message.timestamp));

  return (
    <div
      className={`flex flex-col ${isOutgoing ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[70%]`}
    >
      <div
        className={`px-4 py-2.5 rounded-2xl text-xs break-words shadow-xs ${
          isOutgoing
            ? "bg-tertiary text-tertiary-foreground rounded-br-xs"
            : "bg-surface border border-border text-foreground rounded-bl-xs"
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>

      <div
        className={`flex items-center gap-1 mt-1 text-[10px] text-muted ${
          isOutgoing ? "justify-end" : "justify-start"
        }`}
      >
        <span>{timeFormatted}</span>

        {isOutgoing && (
          <span title={message.status}>
            {message.status === "pending" && (
              <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
            )}
            {message.status === "delivered" && (
              <Check className="w-3 h-3 text-emerald-400" />
            )}
            {message.status === "read" && (
              <CheckCheck className="w-3 h-3 text-emerald-400" />
            )}
          </span>
        )}
      </div>
    </div>
  );
};
