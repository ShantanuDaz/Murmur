import { useState } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>;
  placeholder?: string;
}

export const ChatInput = ({
  onSendMessage,
  placeholder = "Type a message...",
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
    <div className="p-3.5 border-t border-border bg-secondary/30 shrink-0">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 max-w-3xl mx-auto"
      >
        <input
          type="text"
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isSending}
          className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-border text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:border-tertiary transition-colors"
        />
        <button
          type="submit"
          disabled={!text.trim() || isSending}
          className="p-2.5 rounded-xl bg-tertiary text-tertiary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shrink-0"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
