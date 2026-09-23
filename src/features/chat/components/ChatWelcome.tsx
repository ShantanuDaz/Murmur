import { Plus } from "lucide-react";
import { LoopLogo } from "../../../components/LoopLogo.tsx";

interface ChatWelcomeProps {
  onOpenConnectModal: () => void;
}

export const ChatWelcome = ({ onOpenConnectModal }: ChatWelcomeProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-primary">
      <LoopLogo
        className="w-16 h-16 shadow-lg shadow-tertiary/25"
        variant="squircle"
      />

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-lg font-semibold text-foreground tracking-tight">
          Welcome to Loop
        </h3>
        <p className="text-xs text-muted leading-relaxed">
          Simple, fast, and completely private messaging. Select a contact on
          the left or start a new conversation.
        </p>
      </div>

      <button
        onClick={onOpenConnectModal}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-tertiary text-white text-xs font-medium hover:bg-tertiary/90 transition-all cursor-pointer shadow-sm shadow-tertiary/20"
      >
        <Plus className="w-4 h-4" />
        <span>Start a New Chat</span>
      </button>
    </div>
  );
};
