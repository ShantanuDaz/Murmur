import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { step: 1, label: "Name" },
  { step: 2, label: "Profile" },
  { step: 3, label: "Master Key" },
];

export const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 select-none">
      {STEPS.map((s, idx) => {
        const isCompleted = currentStep > s.step;
        const isActive = currentStep === s.step;

        return (
          <div key={s.step} className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all ${
                  isCompleted
                    ? "bg-tertiary text-white shadow-sm"
                    : isActive
                      ? "bg-tertiary/20 text-tertiary border border-tertiary ring-2 ring-tertiary/20"
                      : "bg-surface text-muted border border-border"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  s.step
                )}
              </div>
              <span
                className={`text-xs font-medium transition-colors hidden sm:inline ${
                  isActive ? "text-slate-100" : "text-muted"
                }`}
              >
                {s.label}
              </span>
            </div>

            {idx < STEPS.length - 1 && (
              <div
                className={`w-6 sm:w-10 h-0.5 rounded-full transition-colors ${
                  currentStep > s.step ? "bg-tertiary" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
