"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { isThemePreference, resolveThemePreference, type ThemePreference, type ResolvedTheme } from "@/lib/theme/themePreference";

const THEME_PREFERENCE_EVENT = "msy-theme-preference-change";

const OPTIONS: { value: ThemePreference; label: string; description: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", description: "Uma aparência mais iluminada.", icon: Sun },
  { value: "dark", label: "Escuro", description: "Confortável para ambientes escuros.", icon: Moon },
  { value: "system", label: "Usar configuração do sistema", description: "Acompanha a configuração do dispositivo.", icon: Monitor },
];

function getPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem("theme");
  return isThemePreference(stored) ? stored : "system";
}

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_PREFERENCE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_PREFERENCE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function selectPreference(preference: ThemePreference) {
  const resolved = resolveThemePreference(preference, getSystemTheme());
  document.documentElement.setAttribute("data-theme", resolved);
  window.localStorage.setItem("theme", preference);
  window.dispatchEvent(new Event(THEME_PREFERENCE_EVENT));
}

export function ThemePreferenceSelector() {
  const preference = useSyncExternalStore(subscribe, getPreference, () => "system");

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors" aria-labelledby="appearance-title">
      <div className="border-b border-border px-5.5 py-5">
        <h2 id="appearance-title" className="font-display text-lg font-bold tracking-[-0.2px] text-foreground">Aparência</h2>
        <p className="mt-1 text-sm leading-snug text-muted-foreground">Escolha como a MSY Academy será exibida neste dispositivo.</p>
      </div>
      <fieldset className="grid gap-3 p-5.5 sm:grid-cols-3">
        <legend className="sr-only">Preferência de tema</legend>
        {OPTIONS.map(({ value, label, description, icon: Icon }) => (
          <label key={value} className="group relative cursor-pointer">
            <input
              type="radio"
              name="theme-preference"
              value={value}
              checked={preference === value}
              onChange={() => selectPreference(value)}
              className="peer sr-only"
              aria-label={`Tema ${label}`}
            />
            <span className="flex min-h-24 h-full items-center gap-3 rounded-lg border border-border bg-[rgba(var(--overlay-rgb),0.03)] p-4 transition-all group-hover:border-border-hover group-hover:bg-[rgba(var(--overlay-rgb),0.07)] peer-focus-visible:ring-[3px] peer-focus-visible:ring-brand-glow peer-checked:border-brand peer-checked:bg-brand-dim peer-checked:shadow-[0_0_0_1px_rgba(217,119,87,0.2)]">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card-2 text-muted-foreground transition-colors peer-checked:bg-brand peer-checked:text-primary-foreground" aria-hidden="true">
                <Icon size={19} strokeWidth={1.8} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{label}</span>
                <span className="mt-1 block text-xs leading-snug text-muted-foreground">{description}</span>
              </span>
              <span className="ml-auto flex size-4 shrink-0 items-center justify-center rounded-full border border-border peer-checked:border-brand peer-checked:bg-brand" aria-hidden="true">
                <span className="hidden size-1.5 rounded-full bg-primary-foreground peer-checked:block" />
              </span>
            </span>
          </label>
        ))}
      </fieldset>
    </section>
  );
}
