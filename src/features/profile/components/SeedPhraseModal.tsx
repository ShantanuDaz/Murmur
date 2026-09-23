import { useState } from "react";
import { useCopyToClipboard, useFileDownload } from "../../../hooks/index.ts";
import { X, AlertTriangle, Copy, Check, Download } from "lucide-react";

interface SeedPhraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  mnemonic: string;
  accountId: string;
  deviceName: string;
}

export const SeedPhraseModal = ({
  isOpen,
  onClose,
  mnemonic,
  accountId,
  deviceName,
}: SeedPhraseModalProps) => {
  const [confirmed, setConfirmed] = useState(false);
  const { copied, copy } = useCopyToClipboard();
  const { downloadFile } = useFileDownload();

  if (!isOpen) return null;

  const words = mnemonic.trim().split(/\s+/);

  const handleDownloadBackup = () => {
    const fileContent = `======================================================
MURMUR SOVEREIGN IDENTITY BACKUP
======================================================
Master Account ID:
${accountId}

Device Name:
${deviceName}

Backup Date:
${new Date().toISOString()}

24-WORD SECRET RECOVERY PHRASE:
${mnemonic}
======================================================
IMPORTANT: Keep this file offline and strictly confidential.
Anyone with this phrase has full ownership of your identity.
======================================================`;

    downloadFile(fileContent, {
      filename: `murmur-identity-backup-${accountId.slice(0, 10)}.txt`,
      mimeType: "text/plain",
    });
  };

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-secondary border border-border rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {!confirmed ? (
          /* Step 1: Warning Gate */
          <div className="text-center space-y-4 py-2">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">
                Security Warning
              </h3>
              <p className="text-xs text-muted max-w-xs mx-auto">
                Ensure nobody is looking at your screen. Anyone who views your
                24 recovery words can clone your account and read all
                conversations.
              </p>
            </div>
            <button
              onClick={() => setConfirmed(true)}
              className="px-6 py-2.5 rounded-xl bg-destructive text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              I Understand, Show Words
            </button>
          </div>
        ) : (
          /* Step 2: 24-Word Grid */
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-foreground">
                24-Word Secret Recovery Phrase
              </h3>
              <p className="text-xs text-muted">
                Write these words down in order and store them in a secure vault
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-surface p-4 rounded-2xl border border-border">
              {words.map((word, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-1.5 bg-secondary/80 rounded-lg text-xs font-mono border border-border/40 select-all"
                >
                  <span className="text-[10px] text-muted w-4 text-right">
                    {idx + 1}.
                  </span>
                  <span className="font-semibold text-foreground">{word}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={() => copy(mnemonic)}
                className="w-full sm:flex-1 py-2.5 rounded-xl border border-border bg-surface hover:bg-border/40 text-foreground text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-muted" />
                )}
                <span>{copied ? "Copied!" : "Copy Phrase"}</span>
              </button>
              <button
                onClick={handleDownloadBackup}
                className="w-full sm:flex-1 py-2.5 rounded-xl bg-tertiary text-tertiary-foreground text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download .txt</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
