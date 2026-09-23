import { useState } from "react";
import { useOnboarding } from "./onboardingStore.ts";
import { useCopyToClipboard, useFileDownload } from "../../../hooks/index.ts";
import {
  Copy,
  Check,
  Download,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export const StepGenerate = () => {
  const { mnemonic, setStep } = useOnboarding();
  const [isSavedConfirmed, setIsSavedConfirmed] = useState(false);

  const { copy, copied } = useCopyToClipboard();
  const { downloadFile, isDownloading } = useFileDownload();

  const words = mnemonic.trim().split(/\s+/);

  const handleCopy = () => {
    copy(mnemonic);
  };

  const handleDownload = () => {
    const backupText = `=====================================================
LOOP ACCOUNT BACKUP PHRASE
Created: ${new Date().toLocaleString()}
=====================================================

YOUR 24-WORD RECOVERY PHRASE:
${mnemonic}

=====================================================
SECURITY WARNING:
- Keep this recovery phrase completely private and stored offline.
- Anyone with these 24 words can access your messages and contacts.
=====================================================`;

    downloadFile(
      backupText,
      "loop-recovery-phrase.txt",
      "text/plain;charset=utf-8",
    );
  };

  return (
    <div className="max-w-lg w-full bg-secondary border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <button
          type="button"
          onClick={() => setStep("welcome")}
          className="p-1.5 -ml-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface transition-colors cursor-pointer flex items-center gap-1 text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="text-[11px] font-mono font-medium text-tertiary bg-tertiary/10 px-2.5 py-0.5 rounded-full">
          Step 2 of 3
        </span>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          Secret Recovery Phrase
        </h2>
        <p className="text-xs text-muted max-w-sm mx-auto">
          These 24 words are the master key to your sovereign account. Write
          them down in order and keep them safe.
        </p>
      </div>

      {/* 24-Word Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-surface rounded-2xl border border-border">
        {words.map((word, index) => (
          <div
            key={index}
            className="flex items-center gap-2 bg-secondary/70 px-2.5 py-1.5 rounded-xl border border-border/60 text-xs font-mono select-all"
          >
            <span className="text-[10px] text-muted w-4 text-right">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="font-semibold text-foreground tracking-tight">
              {word}
            </span>
          </div>
        ))}
      </div>

      {/* Action Buttons: Copy & Download */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="py-2.5 px-3 rounded-xl bg-surface hover:bg-surface/80 border border-border text-xs font-medium text-foreground flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-success" />
              <span className="text-success font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-muted" />
              <span>Copy Phrase</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="py-2.5 px-3 rounded-xl bg-surface hover:bg-surface/80 border border-border text-xs font-medium text-foreground flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-muted" />
          <span>
            {isDownloading ? "Downloading..." : "Download Backup (.txt)"}
          </span>
        </button>
      </div>

      {/* Warning Notice */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-start gap-2.5 text-xs">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          <strong>Do not lose this phrase!</strong> Murmur has no central
          servers and cannot reset your account if you lose your 24 words.
        </p>
      </div>

      {/* Confirmation Checkbox */}
      <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none px-1">
        <input
          type="checkbox"
          checked={isSavedConfirmed}
          onChange={(e) => setIsSavedConfirmed(e.target.checked)}
          className="w-4 h-4 rounded border-border text-tertiary focus:ring-tertiary accent-amber-600 cursor-pointer"
        />
        <span>I have securely backed up my 24 words</span>
      </label>

      {/* Continue Button */}
      <button
        type="button"
        disabled={!isSavedConfirmed}
        onClick={() => setStep("profile")}
        className="w-full py-3 px-4 rounded-xl bg-tertiary text-tertiary-foreground font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        <span>Continue to Profile</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default StepGenerate;
