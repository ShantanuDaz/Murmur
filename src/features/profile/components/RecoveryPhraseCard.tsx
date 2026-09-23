import { Lock, Eye } from "lucide-react";

interface RecoveryPhraseCardProps {
  onReveal: () => void;
}

export const RecoveryPhraseCard = ({ onReveal }: RecoveryPhraseCardProps) => {
  return (
    <div className="bg-secondary border border-border rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-tertiary" />
        <h2 className="text-sm font-bold text-foreground tracking-tight">
          Secret Recovery Phrase Backup
        </h2>
      </div>

      <p className="text-xs text-muted">
        This physical client is registered as your{" "}
        <strong>Primary Device</strong> and holds the 24-word root seed. Never
        lose these words.
      </p>

      <button
        onClick={onReveal}
        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-surface border border-border hover:bg-border/40 text-foreground text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <Eye className="w-4 h-4 text-tertiary" />
        <span>Reveal Secret Recovery Phrase</span>
      </button>
    </div>
  );
};
