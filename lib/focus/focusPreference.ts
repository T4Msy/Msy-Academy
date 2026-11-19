export const FOCUS_MODE_STORAGE_KEY = "msy-focus-mode";
export const FOCUS_MODE_EVENT = "msy-focus-mode-change";

export function isFocusMode(value: string | null): boolean { return value === "true"; }
export function getFocusMode(): boolean {
  if (typeof window === "undefined") return false;
  return isFocusMode(window.localStorage.getItem(FOCUS_MODE_STORAGE_KEY));
}
export function setFocusMode(enabled: boolean) {
  document.documentElement.setAttribute("data-focus-mode", String(enabled));
  window.localStorage.setItem(FOCUS_MODE_STORAGE_KEY, String(enabled));
  window.dispatchEvent(new Event(FOCUS_MODE_EVENT));
}
