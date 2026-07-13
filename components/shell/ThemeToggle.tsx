"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

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

/**
 * variant="menu-item" não traz estilo próprio: é desenhado para viver dentro
 * de um <DropdownMenuItem asChild> (UserMenu), que injeta classes/handlers
 * via Slot — por isso o spread de {...props} no button.
 */
export function ThemeToggle({
  variant = "menu-item",
  ...props
}: { variant?: "menu-item" | "icon" } & React.ComponentProps<"button">) {
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
    <Sun size={16} strokeWidth={1.8} aria-hidden />
  ) : (
    <Moon size={16} strokeWidth={1.8} aria-hidden />
  );

  if (variant === "icon") {
    return (
      <button
        type="button"
        className="btn btn-ghost btn-sm theme-toggle-icon"
        onClick={toggle}
        aria-label={label}
        {...props}
      >
        {icon}
      </button>
    );
  }

  return (
    <button type="button" {...props} onClick={toggle}>
      {icon}
      <span>{isLight ? "Tema escuro" : "Tema claro"}</span>
    </button>
  );
}
