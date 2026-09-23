import { Copy, CheckCheck, ShieldCheck } from "lucide-react";
import type { Contact } from "../../../services/storage/contacts.ts";
import { useCopyToClipboard } from "../../../hooks/useCopyToClipboard.ts";

interface ChatHeaderProps {
  contact: Contact;
  isOnline: boolean;
}

export const ChatHeader = ({ contact, isOnline }: ChatHeaderProps) => {
  const { copy, copied } = useCopyToClipboard();

  return (
    <div className="px-6 py-3.5 border-b border-border bg-secondary/40 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <div
            className={`w-10 h-10 rounded-full bg-secondary border flex items-center justify-center font-bold text-foreground text-xs transition-all ${
              isOnline
                ? "border-emerald-500/40 ring-2 ring-emerald-500/20"
                : "border-border"
            }`}
          >
            {contact.name.slice(0, 1).toUpperCase()}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-secondary transition-colors ${
              isOnline
                ? "bg-emerald-400 ring-2 ring-emerald-400/30"
                : "bg-neutral-500"
            }`}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-foreground truncate">
              {contact.name}
            </h3>
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active WebRTC Link
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface border border-border text-muted text-[10px] font-mono">
                Offline
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-muted font-mono truncate mt-0.5">
            <span>
              {contact.accountId.slice(0, 10)}...{contact.accountId.slice(-6)}
            </span>
            <button
              onClick={() => copy(contact.accountId)}
              className="hover:text-foreground transition-colors p-0.5 cursor-pointer shrink-0"
              title="Copy Murmur Number"
            >
              {copied ? (
                <CheckCheck className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
            <span className="text-muted/40">•</span>
            {isOnline ? (
              <span className="text-emerald-400/90 font-medium">
                Direct P2P session open
              </span>
            ) : (
              <span>Auto-connects on send</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden sm:flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-surface border border-border text-muted font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>E2EE Certified</span>
        </span>
      </div>
    </div>
  );
};
