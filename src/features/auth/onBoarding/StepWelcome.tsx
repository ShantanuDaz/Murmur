import { useOnboarding } from "./onboardingStore.ts";
import { Sparkles, KeyRound, ArrowRight } from "lucide-react";
import { LoopLogo } from "../../../components/LoopLogo.tsx";

export const StepWelcome = () => {
  const { startNewIdentity, startRestoreIdentity } = useOnboarding();

  return (
    <div className="max-w-md w-full bg-secondary border border-border rounded-3xl p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
      {/* Brand Icon & Heading */}
      <div className="space-y-2 flex flex-col items-center">
        <LoopLogo
          className="w-16 h-16 shadow-lg shadow-tertiary/25 mb-1"
          variant="squircle"
        />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome to Loop
        </h1>
        <p className="text-xs text-muted leading-relaxed max-w-xs">
          Fast, simple, and private messaging. No phone number, email, or
          passwords required.
        </p>
      </div>

      {/* Action Options */}
      <div className="space-y-3 pt-2">
        {/* Create New Identity */}
        <button
          type="button"
          onClick={startNewIdentity}
          className="w-full group p-4 rounded-2xl bg-surface hover:bg-surface/80 border border-border hover:border-tertiary/50 transition-all duration-200 text-left flex items-center justify-between cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-tertiary/15 text-tertiary flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Create New Account
              </p>
              <p className="text-[11px] text-muted">
                Generate a secure, private account in seconds
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted group-hover:text-tertiary group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* Restore Identity */}
        <button
          type="button"
          onClick={startRestoreIdentity}
          className="w-full group p-4 rounded-2xl bg-surface hover:bg-surface/80 border border-border hover:border-tertiary/50 transition-all duration-200 text-left flex items-center justify-between cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-surface border border-border text-muted flex items-center justify-center shrink-0 group-hover:text-foreground">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Restore Account
              </p>
              <p className="text-[11px] text-muted">
                Log in using your 24-word backup phrase
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* Security Guarantee Footer */}
      <div className="pt-2 border-t border-border/60">
        <p className="text-[11px] text-muted font-medium">
          🔒 End-to-End Encrypted • Zero Tracking • Completely Private
        </p>
      </div>
    </div>
  );
};

export default StepWelcome;
