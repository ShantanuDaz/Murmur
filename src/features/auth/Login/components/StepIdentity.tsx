import { useState } from "react";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Lock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Info,
  FileCode,
} from "lucide-react";
import { useClipboard } from "../../../../hooks/useClipboard";
import { useDownloadFile } from "../../../../hooks/useDownloadFile";
import type { GeneratedKeyring } from "../../utils/crypto";

interface StepIdentityProps {
  name: string;
  avatar: string;
  bio?: string;
  birthday?: string;
  keyring: GeneratedKeyring;
  isSubmitting: boolean;
  onRegenerate: () => void;
  onBack: () => void;
  onSubmit: () => void;
}

export const StepIdentity = ({
  name,
  avatar,
  bio,
  birthday,
  keyring,
  isSubmitting,
  onRegenerate,
  onBack,
  onSubmit,
}: StepIdentityProps) => {
  const { copied: wordsCopied, copy: copyWords } = useClipboard();
  const { copied: edCopied, copy: copyEd } = useClipboard();
  const { copied: xCopied, copy: copyX } = useClipboard();
  const { downloadFile } = useDownloadFile();

  const [isPhraseBlurred, setIsPhraseBlurred] = useState(true);
  const [hasBackedUp, setHasBackedUp] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const wordsList = keyring.mnemonic.split(" ");

  const handleDownloadBackup = () => {
    const backupData = {
      version: 1,
      appName: "Murmur",
      backupDate: new Date().toISOString(),
      profile: {
        name,
        avatar,
        bio: bio || undefined,
        birthday: birthday || undefined,
        publicKey: keyring.ed25519PubHex,
        encryptionKey: keyring.x25519PubHex,
      },
      identity: {
        mnemonic: keyring.mnemonic,
        publicKey: keyring.ed25519PubHex,
        encryptionKey: keyring.x25519PubHex,
      },
      instructions:
        "Keep this JSON file safe. You can import this file anytime to restore your account on any device.",
    };

    const content = JSON.stringify(backupData, null, 2);
    const safeName =
      name.toLowerCase().replace(/[^a-z0-9]/g, "-") || "identity";
    const filename = `murmur-backup-${safeName}.json`;
    downloadFile(filename, content, "application/json");
    setHasDownloaded(true);
    setHasBackedUp(true);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold tracking-wider text-tertiary bg-tertiary/10 border border-tertiary/30 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Step 3 of 3: Master Key</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Your 24-Word Recovery Phrase
        </h2>
      </div>

      {/* Simple P2P Educational Callout */}
      <div className="bg-surface/80 border border-border p-3.5 rounded-2xl flex items-start gap-3 text-xs leading-relaxed text-foreground-secondary">
        <Info className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-foreground">
            Why are these 24 words needed?
          </p>
          <p className="text-muted mt-0.5">
            Murmur is serverless—your messages pass directly between peers.
            Because no company holds your account on a remote server, these
            words are your <strong>only master key</strong>.
          </p>
        </div>
      </div>

      {/* 24 Words Container */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Secret Phrase
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsPhraseBlurred(!isPhraseBlurred)}
              className="text-xs text-muted hover:text-foreground transition-colors cursor-pointer flex items-center gap-1"
            >
              {isPhraseBlurred ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-tertiary" />
              )}
              <span>{isPhraseBlurred ? "Reveal" : "Blur"}</span>
            </button>
            <button
              type="button"
              onClick={() => copyWords(keyring.mnemonic)}
              className="text-xs text-tertiary hover:opacity-80 transition-colors cursor-pointer flex items-center gap-1"
            >
              {wordsCopied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{wordsCopied ? "Copied!" : "Copy Words"}</span>
            </button>
          </div>
        </div>

        {/* Words Grid */}
        <div
          className={`grid grid-cols-3 sm:grid-cols-4 gap-1.5 bg-surface p-3 rounded-2xl border border-border relative transition-all duration-300 ${
            isPhraseBlurred ? "blur-sm select-none" : ""
          }`}
        >
          {wordsList.map((word, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-1.5 bg-secondary border border-border px-2 py-1.5 rounded-lg text-[11px]"
            >
              <span className="text-muted select-none w-4 text-right font-mono">
                {idx + 1}.
              </span>
              <span className="font-mono font-medium text-foreground truncate">
                {word}
              </span>
            </div>
          ))}
        </div>

        {isPhraseBlurred && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsPhraseBlurred(false)}
              className="text-xs text-muted hover:text-tertiary underline underline-offset-4 cursor-pointer inline-flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Click to reveal words for review</span>
            </button>
          </div>
        )}
      </div>

      {/* Download & Copy Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={handleDownloadBackup}
          className="py-2.5 px-3 rounded-xl border border-border bg-surface hover:bg-secondary text-foreground text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2 hover:border-tertiary/40"
        >
          {hasDownloaded ? (
            <>
              <Check className="w-3.5 h-3.5 text-tertiary" />
              <span className="text-tertiary">Backup Downloaded (.json) ✓</span>
            </>
          ) : (
            <>
              <FileCode className="w-3.5 h-3.5 text-tertiary" />
              <span>Download Backup (.json)</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => copyWords(keyring.mnemonic)}
          className="py-2.5 px-3 rounded-xl border border-border bg-surface hover:bg-secondary text-foreground text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2 hover:border-tertiary/40"
        >
          {wordsCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-tertiary" />
              <span className="text-tertiary">Copied to Clipboard ✓</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-tertiary" />
              <span>Copy All Words</span>
            </>
          )}
        </button>
      </div>

      {/* Backup Confirmation Checkbox */}
      <label className="flex items-start gap-2.5 text-xs text-foreground-secondary bg-tertiary/10 border border-tertiary/20 p-3 rounded-xl cursor-pointer hover:bg-tertiary/15 transition-colors">
        <input
          type="checkbox"
          checked={hasBackedUp}
          onChange={(e) => setHasBackedUp(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-border bg-surface text-tertiary focus:ring-tertiary cursor-pointer"
        />
        <span>
          I have downloaded or recorded my 24 words securely. I understand that
          without them, my account and encrypted chats cannot be recovered.
        </span>
      </label>

      {/* Regenerate Option */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            onRegenerate();
            setHasBackedUp(false);
            setHasDownloaded(false);
          }}
          className="text-[11px] text-muted hover:text-foreground transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Generate different seed phrase</span>
        </button>
      </div>

      {/* Advanced Cryptographic Details Accordion */}
      <div className="border border-border rounded-2xl bg-surface/50 overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2 font-medium">
            <Lock className="w-3.5 h-3.5 text-tertiary" />
            <span>Advanced Cryptographic Keys</span>
          </span>
          <span className="text-[11px] flex items-center gap-1">
            {showAdvanced ? (
              <>
                <span>Hide</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Show</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </span>
        </button>

        {showAdvanced && (
          <div className="p-3.5 border-t border-border space-y-2.5 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-muted text-[11px]">
                <span>Ed25519 Identity Key (Signatures / Peer ID)</span>
                <button
                  type="button"
                  onClick={() => copyEd(keyring.ed25519PubHex)}
                  className="text-tertiary hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  {edCopied ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{edCopied ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="font-mono text-[10px] text-tertiary bg-surface p-2 rounded-lg border border-border break-all select-all">
                {keyring.ed25519PubHex}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-muted text-[11px]">
                <span>X25519 Encryption Key (Diffie-Hellman E2EE)</span>
                <button
                  type="button"
                  onClick={() => copyX(keyring.x25519PubHex)}
                  className="text-accent-info hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  {xCopied ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{xCopied ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="font-mono text-[10px] text-accent-info bg-surface p-2 rounded-lg border border-border break-all select-all">
                {keyring.x25519PubHex}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-1/3 py-3 px-4 rounded-2xl text-xs sm:text-sm font-medium border border-border bg-surface hover:bg-secondary text-foreground-secondary hover:text-foreground transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          disabled={!hasBackedUp || isSubmitting}
          onClick={onSubmit}
          className={`w-2/3 py-3 px-4 rounded-2xl text-xs sm:text-sm font-semibold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
            hasBackedUp && !isSubmitting
              ? "bg-tertiary hover:opacity-90 text-tertiary-foreground shadow-tertiary/20 hover:scale-[1.01]"
              : "bg-surface text-muted border border-border cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving to Keystore...</span>
            </>
          ) : (
            <>
              <span>Enter Murmur</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
