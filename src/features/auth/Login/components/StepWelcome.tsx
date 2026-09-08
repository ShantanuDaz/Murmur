import { useState } from "react";
import { ArrowRight, User, Radio, KeyRound } from "lucide-react";

interface StepWelcomeProps {
  initialName: string;
  onNext: (name: string) => void;
  onGoToImport: () => void;
}

export const StepWelcome = ({
  initialName,
  onNext,
  onGoToImport,
}: StepWelcomeProps) => {
  const [name, setName] = useState(initialName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onNext(trimmed);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold tracking-wider text-tertiary bg-tertiary/10 border border-tertiary/30 rounded-full">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Serverless P2P Space</span>
        </div>

        <div className="pt-2 flex justify-center">
          <img
            src="/logo.svg"
            alt="Murmur Logo"
            className="w-16 h-16 drop-shadow-lg hover:scale-110 transition-transform cursor-pointer select-none"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
          <span>Welcome to Murmur</span>
          <span className="text-tertiary">.</span>
        </h1>

        <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto leading-relaxed">
          Light, casual, and serverless. No tracking, no data harvesting—just
          direct connection with people you care about.
        </p>
      </div>

      {/* Form asking only for Name */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label
            htmlFor="welcome-name-input"
            className="block text-xs font-medium text-slate-300 flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-tertiary" />
            <span>What should peers call you?</span>
            <span className="text-tertiary">*</span>
          </label>
          <input
            id="welcome-name-input"
            type="text"
            required
            autoFocus
            maxLength={32}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your nickname or name (e.g. Alice)"
            className="w-full bg-surface border border-border focus:border-tertiary focus:ring-1 focus:ring-tertiary rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder:text-muted outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={!name.trim()}
          className={`w-full py-3.5 px-4 rounded-2xl text-sm font-semibold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
            name.trim()
              ? "bg-tertiary hover:opacity-90 text-white shadow-tertiary/20 hover:scale-[1.01]"
              : "bg-surface text-muted border border-border cursor-not-allowed"
          }`}
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Returning User Option */}
      <div className="pt-2 text-center border-t border-border">
        <button
          type="button"
          onClick={onGoToImport}
          className="text-xs text-muted hover:text-tertiary transition-colors cursor-pointer inline-flex items-center gap-1.5 py-1"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>
            Already have a secret phrase? <strong>Restore identity →</strong>
          </span>
        </button>
      </div>
    </div>
  );
};
