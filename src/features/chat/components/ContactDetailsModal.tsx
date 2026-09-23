import { X, Copy, Check, ShieldCheck, User } from "lucide-react";
import type { Contact } from "../../../services/storage/contacts.ts";
import { useCopyToClipboard } from "../../../hooks/useCopyToClipboard.ts";

interface ContactDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  isOnline: boolean;
}

export const ContactDetailsModal = ({
  isOpen,
  onClose,
  contact,
  isOnline,
}: ContactDetailsModalProps) => {
  const { copy, copied } = useCopyToClipboard();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-secondary border border-border rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-surface cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Profile Header in Modal */}
        <div className="flex flex-col items-center text-center pt-2">
          {/* Avatar with presence */}
          <div className="relative">
            <div
              className={`w-20 h-20 rounded-3xl bg-tertiary/15 text-tertiary border-2 flex items-center justify-center font-bold text-2xl shadow-inner transition-all ${
                isOnline
                  ? "border-emerald-500 shadow-md shadow-emerald-500/20"
                  : "border-tertiary/30"
              }`}
            >
              {contact.name.slice(0, 1).toUpperCase()}
            </div>
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-secondary transition-colors ${
                isOnline ? "bg-emerald-500" : "bg-slate-500"
              }`}
            />
          </div>

          <h3 className="text-lg font-bold text-foreground mt-3 tracking-tight">
            {contact.name}
          </h3>

          <div className="mt-1">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                online
              </span>
            ) : (
              <span className="text-xs text-muted font-medium bg-surface px-2.5 py-0.5 rounded-full border border-border">
                offline
              </span>
            )}
          </div>

          {contact.bio && (
            <p className="text-xs text-muted mt-2 max-w-xs leading-relaxed">
              {contact.bio}
            </p>
          )}
        </div>

        {/* Contact ID Card */}
        <div className="space-y-2 pt-2 border-t border-border/80">
          <div className="flex items-center justify-between text-xs font-semibold text-muted px-1">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Chat ID</span>
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-surface border border-border/80 flex items-center justify-between gap-3 group">
            <span className="font-mono text-xs text-foreground break-all select-all font-medium">
              {contact.accountId}
            </span>
            <button
              onClick={() => copy(contact.accountId)}
              className="p-2 rounded-xl bg-secondary text-muted hover:text-foreground hover:bg-surface border border-border/60 transition-all cursor-pointer shrink-0"
              title="Copy Chat ID"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Encryption badge */}
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-surface/50 border border-border/60 text-xs text-muted">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>All messages with this peer are end-to-end encrypted.</span>
        </div>
      </div>
    </div>
  );
};
