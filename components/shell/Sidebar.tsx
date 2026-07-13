"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevronDown } from "./navIcons";

/** mobilePrimary marks the ≤4 items MobileTabBar shows directly — the rest land under "Mais". */
export type SidebarItem = { href: string; label: string; icon: React.ReactNode; exact?: boolean; mobilePrimary?: boolean };

/** A section entry is either a leaf link or a group with its own sub-items (e.g. "Criar" > Nova Prova/Atividade/Plano). */
export type SidebarEntry =
  | ({ kind?: "item" } & SidebarItem)
  | { kind: "group"; label: string; icon: React.ReactNode; items: SidebarItem[] };

export type SidebarSection = { title?: string; items: SidebarEntry[] };

type Collapsed = "collapsed" | "expanded";

/**
 * Reads the state app/layout.tsx's inline script already applied to
 * <html data-sidebar> via useSyncExternalStore — snapshot de servidor
 * "expanded" (sem hydration mismatch), MutationObserver como subscription.
 */
function currentCollapsed(): Collapsed {
  return document.documentElement.getAttribute("data-sidebar") === "collapsed" ? "collapsed" : "expanded";
}

function subscribeToSidebar(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-sidebar"] });
  return () => observer.disconnect();
}

function activeGroupLabels(sections: SidebarSection[], pathname: string): string[] {
  return sections
    .flatMap((s) => s.items)
    .filter((entry): entry is Extract<SidebarEntry, { kind: "group" }> => entry.kind === "group")
    .filter((group) => group.items.some((item) => isActiveHref(pathname, item)))
    .map((group) => group.label);
}

/** Environment sidebar (Professor or Aluno) — the nav item list is owned by each environment's layout.tsx. */
export function Sidebar({ sections }: { sections: SidebarSection[] }) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    subscribeToSidebar,
    currentCollapsed,
    () => "expanded" as Collapsed,
  );
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(activeGroupLabels(sections, pathname)),
  );

  // Auto-open any group containing the active route, so navigating straight
  // to a sub-item doesn't leave its parent group collapsed with no visible
  // active state. Padrão "adjust state during render" (sem effect): quando o
  // pathname muda, mescla os grupos ativos no estado antes do commit.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    const active = activeGroupLabels(sections, pathname);
    if (active.some((label) => !openGroups.has(label))) {
      setOpenGroups((prev) => new Set([...prev, ...active]));
    }
  }

  function toggleGroup(label: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function toggleCollapsed() {
    const next: Collapsed = currentCollapsed() === "collapsed" ? "expanded" : "collapsed";
    document.documentElement.setAttribute("data-sidebar", next);
    localStorage.setItem("sidebar-collapsed", String(next === "collapsed"));
  }

  const isCollapsed = collapsed === "collapsed";

  return (
    <nav className="sidebar" aria-label="Navegação principal">
      {sections.map((section, i) => (
        <div className="sidebar-section" key={section.title ?? i}>
          {section.title && <div className="sidebar-section-title">{section.title}</div>}
          {section.items.map((entry) =>
            entry.kind === "group" ? (
              <div
                key={entry.label}
                className={`sidebar-group${openGroups.has(entry.label) ? " is-open" : ""}`}
              >
                <button
                  type="button"
                  className={`sidebar-link sidebar-group-trigger${entry.items.some((item) => isActiveHref(pathname, item)) ? " active" : ""}`}
                  aria-expanded={openGroups.has(entry.label)}
                  onClick={() => toggleGroup(entry.label)}
                  title={entry.label}
                >
                  <span className="sidebar-link-icon">{entry.icon}</span>
                  <span className="sidebar-link-label">{entry.label}</span>
                  <span className="sidebar-group-chevron" aria-hidden="true">
                    <IconChevronDown />
                  </span>
                </button>
                <div className="sidebar-group-items" role="menu">
                  {entry.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`sidebar-link sidebar-group-item${isActiveHref(pathname, item) ? " active" : ""}`}
                      aria-current={isActiveHref(pathname, item) ? "page" : undefined}
                      role="menuitem"
                    >
                      <span className="sidebar-link-icon">{item.icon}</span>
                      <span className="sidebar-link-label">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={entry.href}
                href={entry.href}
                className={`sidebar-link${isActiveHref(pathname, entry) ? " active" : ""}`}
                aria-current={isActiveHref(pathname, entry) ? "page" : undefined}
                title={entry.label}
              >
                <span className="sidebar-link-icon">{entry.icon}</span>
                <span className="sidebar-link-label">{entry.label}</span>
              </Link>
            ),
          )}
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

function isActiveHref(pathname: string, item: SidebarItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}
