import { useState } from "react";
import { useOnboarding } from "./onboardingStore.ts";
import { isValidMnemonic } from "../../../services/crypto/index.ts";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export const StepRestore = () => {
  const { mnemonic, setMnemonic, setStep } = useOnboarding();
  const [touched, setTouched] = useState(false);

  const cleanMnemonic = mnemonic.trim().replace(/\s+/g, " ");
  const wordCount = cleanMnemonic ? cleanMnemonic.split(" ").length : 0;
  const isValid = isValidMnemonic(cleanMnemonic);

  const handleContinue = () => {
    if (isValid) {
      setMnemonic(cleanMnemonic);
      setStep("profile");
    }
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
          Restore from Seed Phrase
        </h2>
        <p className="text-xs text-muted max-w-sm mx-auto">
          Enter your 24 secret recovery words separated by single spaces.
        </p>
      </div>

      {/* Input Area */}
      <div className="space-y-2">
        <textarea
          rows={4}
          value={mnemonic}
          onChange={(e) => {
            setMnemonic(e.target.value);
            setTouched(true);
          }}
          placeholder="apple river mountain shield..."
          className="w-full p-4 rounded-2xl bg-surface border border-border focus:border-tertiary focus:outline-none text-foreground font-mono text-xs leading-relaxed resize-none transition-colors"
        />

        {/* Word Counter & Status */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-muted font-mono text-[11px]">
            Words entered:{" "}
            <strong
              className={wordCount === 24 ? "text-foreground" : "text-muted"}
            >
              {wordCount} / 24
            </strong>
          </span>

          {touched &&
            wordCount === 24 &&
            (isValid ? (
              <span className="flex items-center gap-1 text-success text-[11px] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Valid Seed Phrase
              </span>
            ) : (
              <span className="flex items-center gap-1 text-destructive text-[11px] font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Invalid words or checksum
              </span>
            ))}
        </div>
      </div>

      {/* Continue Button */}
      <button
        type="button"
        disabled={!isValid}
        onClick={handleContinue}
        className="w-full py-3 px-4 rounded-xl bg-tertiary text-tertiary-foreground font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        <span>Continue to Profile</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default StepRestore;
