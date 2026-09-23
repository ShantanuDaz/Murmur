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
      className={`flex flex-col ${isOutgoing ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[70%] group`}
    >
      <div
        className={`px-3 py-1.5 rounded-2xl text-[13px] break-words shadow-xs relative transition-all ${
          isOutgoing
            ? "bg-tertiary text-white rounded-tr-xs"
            : "bg-surface border border-border/80 text-foreground rounded-tl-xs"
        }`}
      >
        <div className="flex items-end gap-2 flex-wrap justify-end">
          <p className="whitespace-pre-wrap leading-relaxed select-text font-normal mr-auto">
            {message.content}
          </p>

          <div
            className={`flex items-center gap-1 text-[10px] select-none shrink-0 self-end -mb-0.5 ${
              isOutgoing ? "text-white/80" : "text-muted"
            }`}
          >
            <span className="tracking-tight">{timeFormatted}</span>

            {isOutgoing && (
              <span title={message.status} className="inline-flex items-center">
                {message.status === "pending" && (
                  <Clock className="w-3 h-3 text-amber-300 animate-pulse" />
                )}
                {message.status === "delivered" && (
                  <Check className="w-3.5 h-3.5 text-white/90" />
                )}
                {message.status === "read" && (
                  <CheckCheck className="w-3.5 h-3.5 text-sky-200" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
