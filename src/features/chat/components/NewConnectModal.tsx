import { useState } from "react";
import { UserPlus, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { proposalManager } from "../../engine/proposal/proposalManager.ts";

interface NewConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewConnectModal = ({ isOpen, onClose }: NewConnectModalProps) => {
  const [murmurNumber, setMurmurNumber] = useState("");
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetId = murmurNumber.trim();
    if (!targetId) {
      setError("Please enter a Chat ID.");
      return;
    }

    if (!proposalManager.isValidMurmurNumber(targetId)) {
      setError("Please enter a valid 66-character Chat ID starting with 0x.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await proposalManager.sendConnectionRequest(
        targetId,
        nickname.trim() || undefined,
      );

      if (!result.success) {
        setError(result.error || "Failed to send chat invite.");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccess(false);
        setMurmurNumber("");
        setNickname("");
        onClose();
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unexpected error sending invite.",
      );
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    setSuccess(false);
    setMurmurNumber("");
    setNickname("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-secondary border border-border rounded-2xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl relative">
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-muted hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-surface cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              New Chat
            </h3>
            <p className="text-xs text-muted">
              Connect with a friend by entering their Chat ID.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Chat invite sent successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Friend's Chat ID <span className="text-tertiary">*</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={murmurNumber}
              onChange={(e) => {
                setMurmurNumber(e.target.value);
                setError(null);
              }}
              disabled={isSubmitting || success}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted/60 text-xs font-mono focus:outline-none focus:border-tertiary transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Name or Nickname{" "}
              <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Alice"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={isSubmitting || success}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted/60 text-xs focus:outline-none focus:border-tertiary transition-colors"
            />
          </div>

          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="flex-1 py-2.5 rounded-xl bg-tertiary text-white text-xs font-semibold hover:bg-tertiary/90 transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-tertiary/20"
            >
              {isSubmitting ? "Sending Invite..." : "Send Chat Invite"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-border text-muted hover:text-foreground text-xs font-medium hover:bg-surface transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
