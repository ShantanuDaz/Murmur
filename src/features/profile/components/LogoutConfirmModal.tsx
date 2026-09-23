import { LogOut } from "lucide-react";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
}: LogoutConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-secondary border border-border rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-4 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <LogOut className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">
            Confirm Logout
          </h3>
          <p className="text-xs text-muted">
            Are you sure you want to clear your local session and keys? You will
            need your 24-word seed phrase to restore your identity.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Yes, Clear & Logout
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-xs font-medium hover:bg-surface transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
