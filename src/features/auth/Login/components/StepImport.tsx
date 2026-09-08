import { useState, useRef } from "react";
import {
  KeyRound,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  User,
  Loader2,
  Upload,
  FileCode,
  X,
} from "lucide-react";
import {
  deriveIdentityFromMnemonic,
  isValidMnemonic,
  type GeneratedKeyring,
} from "../../utils/crypto";

interface StepImportProps {
  isSubmitting: boolean;
  onBack: () => void;
  onImportSuccess: (data: {
    name: string;
    avatar?: string;
    bio?: string;
    birthday?: string;
    keyring: GeneratedKeyring;
  }) => void;
}

export const StepImport = ({
  isSubmitting,
  onBack,
  onImportSuccess,
}: StepImportProps) => {
  const [name, setName] = useState("");
  const [words, setWords] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>();
  const [bio, setBio] = useState<string | undefined>();
  const [birthday, setBirthday] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [derivedKeyring, setDerivedKeyring] = useState<GeneratedKeyring | null>(
    null,
  );
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processMnemonic = (rawWords: string) => {
    const cleaned = rawWords.trim().replace(/\s+/g, " ");
    const splitWords = cleaned.split(" ");

    if (splitWords.length === 24 || splitWords.length === 12) {
      if (isValidMnemonic(cleaned)) {
        try {
          const keyring = deriveIdentityFromMnemonic(cleaned);
          setDerivedKeyring(keyring);
          setError(null);
          return true;
        } catch {
          setError("Failed to derive cryptographic keys from these words.");
          setDerivedKeyring(null);
          return false;
        }
      } else {
        setError("Invalid BIP-39 checksum or unrecognized words.");
        setDerivedKeyring(null);
        return false;
      }
    } else {
      setError(
        `Enter all 24 words (currently: ${splitWords.filter(Boolean).length})`,
      );
      setDerivedKeyring(null);
      return false;
    }
  };

  const handleWordsChange = (val: string) => {
    setWords(val);
    processMnemonic(val);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        const mnemonic = parsed.identity?.mnemonic || parsed.mnemonic;
        if (!mnemonic || typeof mnemonic !== "string") {
          setError(
            "Invalid JSON backup file: 24-word recovery phrase not found.",
          );
          return;
        }

        const importedName = parsed.profile?.name || parsed.name || "";
        const importedAvatar = parsed.profile?.avatar || parsed.avatar;
        const importedBio = parsed.profile?.bio || parsed.bio;
        const importedBirthday = parsed.profile?.birthday || parsed.birthday;

        if (importedName) setName(importedName);
        if (importedAvatar) setAvatar(importedAvatar);
        if (importedBio) setBio(importedBio);
        if (importedBirthday) setBirthday(importedBirthday);

        setWords(mnemonic);
        const ok = processMnemonic(mnemonic);
        if (ok) {
          setLoadedFileName(file.name);
          setError(null);
        }
      } catch {
        setError(
          "Failed to read JSON file. Please ensure it's a valid Murmur backup JSON.",
        );
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be re-uploaded if cleared
    e.target.value = "";
  };

  const clearLoadedFile = () => {
    setLoadedFileName(null);
    setWords("");
    setDerivedKeyring(null);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !derivedKeyring) return;
    onImportSuccess({
      name: name.trim(),
      avatar,
      bio,
      birthday,
      keyring: derivedKeyring,
    });
  };

  const isValid = name.trim().length > 0 && derivedKeyring !== null;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold tracking-wider text-tertiary bg-tertiary/10 border border-tertiary/30 rounded-full">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Restore Account</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Import Your Murmur Identity
        </h2>
        <p className="text-xs sm:text-sm text-muted">
          Upload your JSON backup file or type your 24 words manually.
        </p>
      </div>

      {/* JSON File Upload Zone */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileUpload}
          className="hidden"
        />

        {loadedFileName ? (
          <div className="bg-tertiary/10 border border-tertiary/30 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs">
              <FileCode className="w-4 h-4 text-tertiary shrink-0" />
              <div>
                <p className="font-semibold text-foreground">
                  {loadedFileName}
                </p>
                <p className="text-[11px] text-tertiary">
                  Backup data loaded successfully ✓
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearLoadedFile}
              className="text-muted hover:text-destructive p-1 rounded-lg transition-colors cursor-pointer"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-border hover:border-tertiary/50 bg-surface/40 hover:bg-surface/70 rounded-2xl p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 group"
          >
            <div className="w-8 h-8 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-foreground">
              Upload JSON Backup File
            </div>
            <div className="text-[11px] text-muted">
              Click to select your{" "}
              <code className="text-tertiary font-mono">
                murmur-backup.json
              </code>
            </div>
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 text-xs text-muted">
        <div className="flex-1 h-px bg-border" />
        <span>or enter 24 words manually</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Input */}
        <div className="space-y-1.5">
          <label
            htmlFor="import-name-input"
            className="block text-xs font-medium text-foreground-secondary flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-tertiary" />
            <span>Display Name</span>
            <span className="text-tertiary">*</span>
          </label>
          <input
            id="import-name-input"
            type="text"
            required
            maxLength={32}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name or handle..."
            className="w-full bg-surface border border-border focus:border-tertiary focus:ring-1 focus:ring-tertiary rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none transition-colors"
          />
        </div>

        {/* 24 Words Textarea */}
        <div className="space-y-1.5">
          <label
            htmlFor="import-words-textarea"
            className="block text-xs font-medium text-foreground-secondary"
          >
            24 Words{" "}
            <span className="text-muted font-normal">
              (separated by spaces)
            </span>
          </label>
          <textarea
            id="import-words-textarea"
            rows={3}
            value={words}
            onChange={(e) => handleWordsChange(e.target.value)}
            placeholder="word1 word2 word3 ... word24"
            className="w-full bg-surface border border-border focus:border-tertiary focus:ring-1 focus:ring-tertiary rounded-2xl p-3.5 text-xs font-mono text-foreground placeholder:text-muted outline-none resize-none transition-colors leading-relaxed"
          />

          {error && (
            <p className="text-xs text-warning flex items-center gap-1.5 pt-0.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          {derivedKeyring && !error && (
            <p className="text-xs text-tertiary flex items-center gap-1.5 pt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Valid 24-word recovery phrase recognized!</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="w-1/3 py-3 px-4 rounded-2xl text-xs sm:text-sm font-medium border border-border bg-surface hover:bg-secondary text-foreground-secondary hover:text-foreground transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`w-2/3 py-3 px-4 rounded-2xl text-xs sm:text-sm font-semibold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
              isValid && !isSubmitting
                ? "bg-tertiary hover:opacity-90 text-tertiary-foreground shadow-tertiary/20 hover:scale-[1.01]"
                : "bg-surface text-muted border border-border cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Restoring...</span>
              </>
            ) : (
              <>
                <span>Restore & Enter</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
