"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ClassTabItem } from "./types";

/**
 * Navegação por grupos da turma — sub-rotas reais, não query string. É um
 * <nav> com <Link aria-current>, não o Tabs do Radix: Tabs assume troca de
 * painel dentro da mesma árvore montada (sem navegação de página), o que
 * colide com SSR por rota e confunde ARIA ao trocar a URL. `overflow-x-auto`
 * próprio evita que os itens empurrem a largura da página em mobile (mesma
 * técnica já validada no ClassContextNav que este componente substitui).
 */
export function ClassTabsNav({
  items,
  trailingLink,
}: {
  items: (ClassTabItem & { exact?: boolean })[];
  /** Ex.: "Flashcards" — não é uma sub-rota da turma, então nunca fica "ativo". */
  trailingLink?: { label: string; href: string };
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação da turma"
      className="mb-6 flex max-w-full gap-1 overflow-x-auto border-b border-border pb-2"
    >
      {items.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? "bg-brand-dim text-brand-text"
                : "text-muted-foreground hover:bg-card-2 hover:text-foreground"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
      {trailingLink && (
        <Link
          href={trailingLink.href}
          className="shrink-0 rounded-sm px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground"
        >
          {trailingLink.label}
        </Link>
      )}
    </nav>
  );
}
