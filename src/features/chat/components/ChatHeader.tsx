import { useState } from "react";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import type { Contact } from "../../../services/storage/contacts.ts";
import { ContactDetailsModal } from "./ContactDetailsModal.tsx";

interface ChatHeaderProps {
  contact: Contact;
  isOnline: boolean;
  onBack?: () => void;
}

export const ChatHeader = ({ contact, isOnline, onBack }: ChatHeaderProps) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  return (
    <>
      <div className="px-3 sm:px-4 py-2.5 border-b border-border bg-secondary/80 backdrop-blur-sm flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 -ml-1 text-muted hover:text-foreground rounded-lg hover:bg-surface transition-colors cursor-pointer shrink-0"
              title="Back to chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Clickable Contact Avatar & Name -> Opens Contact Details */}
          <button
            onClick={() => setShowDetailsModal(true)}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group hover:opacity-90 transition-opacity"
            title="View contact info"
          >
            <div className="relative shrink-0">
              <div
                className={`w-9 h-9 rounded-full bg-surface border flex items-center justify-center font-bold text-foreground text-xs transition-all group-hover:scale-105 ${
                  isOnline ? "border-emerald-500/40" : "border-border"
                }`}
              >
                {contact.name.slice(0, 1).toUpperCase()}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-secondary transition-colors ${
                  isOnline ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-600"
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-tertiary transition-colors">
                {contact.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isOnline ? (
                  <span className="text-[11px] font-medium text-emerald-500 inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    online
                  </span>
                ) : (
                  <span className="text-[11px] text-muted">offline</span>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Security badge: compact icon on tight screens, text on wide screens */}
        <div className="flex items-center shrink-0">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border/80 text-muted"
            title="End-to-End Encrypted Peer Connection"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium hidden lg:inline">
              Encrypted
            </span>
          </div>
        </div>
      </div>

      {/* Contact Details Modal */}
      <ContactDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        contact={contact}
        isOnline={isOnline}
      />
    </>
  );
};
