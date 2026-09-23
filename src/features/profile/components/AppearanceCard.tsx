import { useTheme, type ThemeMode } from "../../../hooks/useTheme.ts";
import { Sun, Moon, Monitor, Palette } from "lucide-react";

export const AppearanceCard = () => {
  const { theme, setTheme } = useTheme();

  const options: {
    id: ThemeMode;
    label: string;
    icon: typeof Sun;
    desc: string;
  }[] = [
    {
      id: "system",
      label: "System",
      icon: Monitor,
      desc: "Matches your device OS",
    },
    {
      id: "dark",
      label: "Dark",
      icon: Moon,
      desc: "Midnight Slate & Cobalt",
    },
    {
      id: "light",
      label: "Light",
      icon: Sun,
      desc: "Crisp white & clean slate",
    },
  ];

  return (
    <div className="bg-secondary border border-border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-tertiary" />
          <h2 className="text-sm font-semibold text-foreground tracking-tight">
            Appearance
          </h2>
        </div>
        <span className="text-[11px] text-muted capitalize font-medium">
          {theme} mode
        </span>
      </div>

      <p className="text-xs text-muted">
        Choose how Loop looks on your screen. System mode automatically updates
        when your device switches.
      </p>

      {/* 3 Theme Options */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-tertiary/10 border-tertiary text-tertiary shadow-sm shadow-tertiary/10"
                  : "bg-surface border-border/80 text-muted hover:text-foreground hover:bg-surface/80"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  isSelected
                    ? "bg-tertiary text-white"
                    : "bg-secondary text-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div>
                <p
                  className={`text-xs font-semibold ${isSelected ? "text-tertiary" : "text-foreground"}`}
                >
                  {opt.label}
                </p>
                <p className="text-[10px] text-muted hidden sm:block mt-0.5 leading-tight">
                  {opt.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
