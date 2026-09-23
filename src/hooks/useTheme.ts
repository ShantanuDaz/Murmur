import { useState, useEffect } from "react";

export type ThemeMode = "system" | "dark" | "light";

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("loop-theme");
      if (saved === "system" || saved === "dark" || saved === "light") {
        return saved;
      }
    }
    return "system";
  });

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (mode: ThemeMode) => {
      const isDark = mode === "system" ? mediaQuery.matches : mode === "dark";

      if (isDark) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
    };

    applyTheme(theme);
    localStorage.setItem("loop-theme", theme);

    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return { theme, setTheme };
};
