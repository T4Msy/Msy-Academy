"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** mobilePrimary marks the ≤4 items MobileTabBar shows directly — the rest land under "Mais". */
export type SidebarItem = { href: string; label: string; icon: React.ReactNode; exact?: boolean; mobilePrimary?: boolean };
export type SidebarSection = { title?: string; items: SidebarItem[] };

type Collapsed = "collapsed" | "expanded";

/**
 * Reads the state app/layout.tsx's inline script already applied to
 * <html data-sidebar>, rather than guessing during SSR — same
 * hydration-mismatch avoidance as ThemeToggle.tsx's currentTheme().
 */
function currentCollapsed(): Collapsed {
  if (typeof document === "undefined") return "expanded";
  return document.documentElement.getAttribute("data-sidebar") === "collapsed" ? "collapsed" : "expanded";
}

/** Environment sidebar (Professor or Aluno) — the nav item list is owned by each environment's layout.tsx. */
export function Sidebar({ sections }: { sections: SidebarSection[] }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Collapsed | null>(null);

  useEffect(() => {
    setCollapsed(currentCollapsed());
  }, []);

  function isActive(item: SidebarItem): boolean {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  function toggleCollapsed() {
    const next: Collapsed = currentCollapsed() === "collapsed" ? "expanded" : "collapsed";
    document.documentElement.setAttribute("data-sidebar", next);
    localStorage.setItem("sidebar-collapsed", String(next === "collapsed"));
    setCollapsed(next);
  }

  const isCollapsed = collapsed === "collapsed";

  return (
    <nav className="sidebar" aria-label="Navegação principal">
      {sections.map((section, i) => (
        <div className="sidebar-section" key={section.title ?? i}>
          {section.title && <div className="sidebar-section-title">{section.title}</div>}
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link${isActive(item) ? " active" : ""}`}
              aria-current={isActive(item) ? "page" : undefined}
              title={item.label}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
            </Link>
          ))}
        </div>
      ))}

      <button
        type="button"
        className="sidebar-toggle"
        onClick={toggleCollapsed}
        aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: isCollapsed ? "rotate(180deg)" : undefined }}>
          <path d="M15 6 9 12l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="sidebar-link-label">Recolher</span>
      </button>
    </nav>
  );
}
