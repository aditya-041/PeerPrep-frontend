// Dark/Light Mode Toggle Button using next-themes

"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // To avoid hydration mismatch, only render after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Determine current theme (system or user-selected)
  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <button
      aria-label="Toggle Dark Mode"
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      style={{
        padding: "0.5rem 1rem",
        borderRadius: "0.375rem",
        border: "1px solid #ccc",
        background: "transparent",
        cursor: "pointer",
      }}
    >
      {currentTheme === "dark" ? "🌞 Light Mode" : "🌙 Dark Mode"}
    </button>
  );
}
