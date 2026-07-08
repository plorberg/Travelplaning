"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // Reflect whatever the pre-hydration script chose, else the OS preference.
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light" || attr === "dark") setTheme(attr);
    else
      setTheme(
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
      );
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore (e.g. private mode) — the choice just won't persist
    }
    setTheme(next);
  }

  const label =
    theme === "dark" ? "Zum hellen Design wechseln" : "Zum dunklen Design wechseln";

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-ghost"
      aria-label={label}
      title={label}
      style={{ padding: "0.35rem 0.55rem" }}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
