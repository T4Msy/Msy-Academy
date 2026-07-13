"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SidebarItem, SidebarSection } from "./Sidebar";
import { IconMais } from "./navIcons";

type RestSection = { title?: string; items: SidebarItem[] };

/** Fixed bottom tab bar for mobile — replaces the old horizontal-scroll sidebar.
 * Shows the items each layout marked `mobilePrimary` (≤4) directly; everything
 * else opens in a "Mais" bottom sheet, grouped under the same section titles
 * the desktop Sidebar uses (not flattened into one generic list) — a
 * `kind: "group"` entry (e.g. "Criar") has no href of its own on mobile, its
 * children are spread into their parent section instead. */
export function MobileTabBar({ sections }: { sections: SidebarSection[] }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const allItems: SidebarItem[] = sections.flatMap((s) =>
    s.items.flatMap((entry) => (entry.kind === "group" ? entry.items : [entry])),
  );
  const primary = allItems.filter((i) => i.mobilePrimary);

  const restSections: RestSection[] = sections
    .map((s) => ({
      title: s.title,
      items: s.items
        .flatMap((entry) => (entry.kind === "group" ? entry.items : [entry]))
        .filter((i) => !i.mobilePrimary),
    }))
    .filter((s) => s.items.length > 0);

  function isActive(item: SidebarItem): boolean {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <>
      <nav className="tabbar" aria-label="Navegação principal">
        {primary.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`tabbar-item${isActive(item) ? " active" : ""}`}
            aria-current={isActive(item) ? "page" : undefined}
            onClick={() => setMoreOpen(false)}
          >
            <span className="tabbar-item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        {restSections.length > 0 && (
          <button
            type="button"
            className={`tabbar-item${moreOpen ? " active" : ""}`}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
          >
            <span className="tabbar-item-icon"><IconMais /></span>
            <span>Mais</span>
          </button>
        )}
      </nav>

      {moreOpen && (
        <>
          <div className="popover-backdrop popover-backdrop--dim" onClick={() => setMoreOpen(false)} />
          <div className="tabbar-more-sheet" role="menu">
            <div className="tabbar-more-handle" aria-hidden="true" />
            {restSections.map((section, i) => (
              <div className="tabbar-more-section" key={section.title ?? i}>
                {section.title && <div className="tabbar-more-section-title">{section.title}</div>}
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`tabbar-more-item${isActive(item) ? " active" : ""}`}
                    role="menuitem"
                    onClick={() => setMoreOpen(false)}
                  >
                    <span className="tabbar-more-item-icon">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
