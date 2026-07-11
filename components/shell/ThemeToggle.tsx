"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/**
 * Reads the theme app/layout.tsx's inline script already applied to
 * <html data-theme>, rather than guessing during SSR — avoids a hydration
 * mismatch (server has no theme; client does, before React even mounts).
 */
function currentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function ThemeToggle({ variant = "menu-item" }: { variant?: "menu-item" | "icon" }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(currentTheme());
  }, []);

  function toggle() {
    const next: Theme = currentTheme() === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    setTheme(next);
  }

  const isLight = theme === "light";
  const label = theme === null ? "Alternar tema" : isLight ? "Mudar para tema escuro" : "Mudar para tema claro";

  const icon = isLight ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2.5v2.3M12 19.2v2.3M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  if (variant === "icon") {
    return (
      <button type="button" className="btn btn-ghost btn-sm theme-toggle-icon" onClick={toggle} aria-label={label}>
        {icon}
      </button>
    );
  }

  return (
    <button type="button" className="popover-item theme-toggle-item" onClick={toggle} role="menuitem">
      {icon}
      <span>{isLight ? "Tema escuro" : "Tema claro"}</span>
    </button>
  );
}
