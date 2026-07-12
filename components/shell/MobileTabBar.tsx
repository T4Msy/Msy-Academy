"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SidebarItem, SidebarSection } from "./Sidebar";
import { IconMais } from "./navIcons";

/** Fixed bottom tab bar for mobile — replaces the old horizontal-scroll sidebar.
 * Shows the items each layout marked `mobilePrimary` (≤4) directly; everything
 * else opens in a "Mais" bottom sheet. A `kind: "group"` entry (e.g. "Criar")
 * has no href of its own on mobile — only its children can be `mobilePrimary`
 * and land in either list, same as any other leaf item. */
export function MobileTabBar({ sections }: { sections: SidebarSection[] }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const allItems: SidebarItem[] = sections.flatMap((s) =>
    s.items.flatMap((entry) => (entry.kind === "group" ? entry.items : [entry])),
  );
  const primary = allItems.filter((i) => i.mobilePrimary);
  const rest = allItems.filter((i) => !i.mobilePrimary);

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
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
        {rest.length > 0 && (
          <button
            type="button"
            className={`tabbar-item${moreOpen ? " active" : ""}`}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
          >
            <IconMais />
            <span>Mais</span>
          </button>
        )}
      </nav>

      {moreOpen && (
        <>
          <div className="popover-backdrop" onClick={() => setMoreOpen(false)} />
          <div className="tabbar-more-sheet" role="menu">
            {rest.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`popover-item${isActive(item) ? " active" : ""}`}
                role="menuitem"
                onClick={() => setMoreOpen(false)}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
