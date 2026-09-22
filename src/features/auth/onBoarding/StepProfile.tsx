import { useOnboarding } from "./onboardingStore.ts";
import { ArrowLeft, Loader2, Sparkles, AlertCircle } from "lucide-react";

export const StepProfile = () => {
  const {
    name,
    setName,
    bio,
    setBio,
    deviceName,
    setDeviceName,
    setStep,
    finishOnboarding,
    isSubmitting,
    error,
  } = useOnboarding();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await finishOnboarding();
  };

  return (
    <div className="max-w-md w-full bg-secondary border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <button
          type="button"
          onClick={() => setStep("generate")}
          disabled={isSubmitting}
          className="p-1.5 -ml-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface transition-colors cursor-pointer flex items-center gap-1 text-xs disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="text-[11px] font-mono font-medium text-tertiary bg-tertiary/10 px-2.5 py-0.5 rounded-full">
          Step 3 of 3
        </span>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          Profile & Local Device
        </h2>
        <p className="text-xs text-muted max-w-xs mx-auto">
          Choose how peers will see you and label this physical client instance.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Display Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Display Name</span>
            <span className="text-[10px] text-muted font-normal">Required</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alice"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border focus:border-tertiary focus:outline-none text-foreground text-xs transition-colors"
          />
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Bio</span>
            <span className="text-[10px] text-muted font-normal">Optional</span>
          </label>
          <input
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="e.g. Exploring sovereign communications"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border focus:border-tertiary focus:outline-none text-foreground text-xs transition-colors"
          />
        </div>

        {/* Device Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Device Label</span>
            <span className="text-[10px] text-muted font-normal">
              Auto-detected
            </span>
          </label>
          <input
            type="text"
            required
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border focus:border-tertiary focus:outline-none text-foreground text-xs transition-colors font-mono"
          />
          <p className="text-[10px] text-muted">
            Used to identify which of your devices sent a message.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!name.trim() || isSubmitting}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-tertiary text-tertiary-foreground font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Deriving Keys & Registering Device...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Launch Murmur</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default StepProfile;
