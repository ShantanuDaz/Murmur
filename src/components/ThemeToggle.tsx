import { Sun, Moon } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle = ({ className = "" }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl border border-border bg-surface hover:bg-secondary text-muted hover:text-foreground transition-all cursor-pointer flex items-center justify-center ${className}`}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-tertiary" />
      ) : (
        <Moon className="w-4 h-4 text-tertiary" />
      )}
    </button>
  );
};
