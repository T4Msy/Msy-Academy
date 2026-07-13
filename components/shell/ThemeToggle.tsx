"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

/**
 * O tema vive em <html data-theme> (aplicado pelo script no-flash do
 * app/layout.tsx). useSyncExternalStore lê esse estado externo do jeito
 * certo: snapshot de servidor "dark" (sem hydration mismatch) e observer
 * de atributo como subscription — sem setState em effect.
 */
function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function currentTheme(): Theme {
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
  const theme = useSyncExternalStore(subscribeToTheme, currentTheme, () => "dark" as Theme);

  function toggle() {
    const next: Theme = currentTheme() === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  const isLight = theme === "light";
  const label = isLight ? "Mudar para tema escuro" : "Mudar para tema claro";
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
