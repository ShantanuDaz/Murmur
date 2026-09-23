import { useState } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>;
  placeholder?: string;
}

export const ChatInput = ({
  onSendMessage,
  placeholder = "Write a message...",
}: ChatInputProps) => {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    try {
      setIsSending(true);
      setText("");
      await onSendMessage(trimmed);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-3 border-t border-border bg-secondary/90 backdrop-blur-sm shrink-0">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 max-w-4xl mx-auto"
      >
        <div className="flex-1 flex items-center bg-surface border border-border/80 rounded-2xl px-4 py-1.5 focus-within:border-tertiary/60 transition-colors shadow-xs">
          <input
            type="text"
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isSending}
            className="w-full py-1 text-[13px] bg-transparent text-foreground placeholder:text-muted focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={!text.trim() || isSending}
          className="w-9 h-9 rounded-xl bg-tertiary text-white flex items-center justify-center hover:bg-tertiary/90 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shrink-0 shadow-sm shadow-tertiary/20"
          title="Send message"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
    </div>
  );
};
