"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type SidebarItem = { href: string; label: string; exact?: boolean };
export type SidebarSection = { title?: string; items: SidebarItem[] };

/** Environment sidebar (Professor or Aluno) — the nav item list is owned by each environment's layout.tsx. */
export function Sidebar({ sections }: { sections: SidebarSection[] }) {
  const pathname = usePathname();

  function isActive(item: SidebarItem): boolean {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

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
            >
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
