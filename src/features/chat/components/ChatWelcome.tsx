import { MessageSquare, UserPlus } from "lucide-react";

interface ChatWelcomeProps {
  onOpenConnectModal: () => void;
}

export const ChatWelcome = ({ onOpenConnectModal }: ChatWelcomeProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-primary">
      <div className="w-16 h-16 rounded-3xl bg-secondary border border-border flex items-center justify-center text-tertiary shadow-sm">
        <MessageSquare className="w-8 h-8" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base font-bold text-foreground">
          Sovereign Peer-to-Peer Communication
        </h3>
        <p className="text-xs text-muted leading-relaxed">
          Connect with friends by entering their Murmur Number. Messages and
          calls travel directly peer-to-peer with local-first persistence.
        </p>
      </div>

      <button
        onClick={onOpenConnectModal}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-tertiary text-tertiary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
      >
        <UserPlus className="w-4 h-4" />
        <span>Connect with Murmur Number</span>
      </button>
    </div>
  );
};
