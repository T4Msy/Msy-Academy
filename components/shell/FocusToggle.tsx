"use client";
import { useSyncExternalStore } from "react";
import { Focus } from "lucide-react";
import { FOCUS_MODE_EVENT, getFocusMode, setFocusMode } from "@/lib/focus/focusPreference";
function subscribe(onChange: () => void) {
  window.addEventListener(FOCUS_MODE_EVENT, onChange); window.addEventListener("storage", onChange);
  const observer = new MutationObserver(onChange); observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-focus-mode"] });
  return () => { window.removeEventListener(FOCUS_MODE_EVENT, onChange); window.removeEventListener("storage", onChange); observer.disconnect(); };
}
export function FocusToggle() {
  const enabled = useSyncExternalStore(subscribe, getFocusMode, () => false);
  return <button type="button" className={`btn btn-ghost btn-sm focus-toggle${enabled ? " is-active" : ""}`} onClick={() => setFocusMode(!enabled)} aria-pressed={enabled} aria-label={enabled ? "Desativar Modo Foco" : "Ativar Modo Foco"}><Focus size={16} strokeWidth={1.9} aria-hidden /><span>Modo Foco</span></button>;
}
