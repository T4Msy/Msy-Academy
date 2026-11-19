"use client";
import { useSyncExternalStore } from "react";
import { Sidebar, type SidebarSection } from "./Sidebar";
import { MobileTabBar } from "./MobileTabBar";
import { FOCUS_MODE_EVENT, getFocusMode } from "@/lib/focus/focusPreference";
function subscribe(onChange: () => void) { window.addEventListener(FOCUS_MODE_EVENT, onChange); window.addEventListener("storage", onChange); return () => { window.removeEventListener(FOCUS_MODE_EVENT, onChange); window.removeEventListener("storage", onChange); }; }
export function StudentNavigation({ normal, focus }: { normal: SidebarSection[]; focus: SidebarSection[] }) { const enabled = useSyncExternalStore(subscribe, getFocusMode, () => false); const sections = enabled ? focus : normal; return <><Sidebar sections={sections} /><MobileTabBar sections={sections} /></>; }
