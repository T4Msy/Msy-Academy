import Link from "next/link";

export type ClassContextView = "overview" | "activities" | "materials";

export function ClassContextNav({ classId, activeView, flashcardsHref }: { classId: string; activeView: ClassContextView; flashcardsHref?: string }) {
  const items: { key: ClassContextView; label: string; href: string }[] = [
    { key: "overview", label: "Visão geral", href: `/aluno/turmas/${classId}` },
    { key: "activities", label: "Atividades", href: `/aluno/turmas/${classId}?view=activities` },
    { key: "materials", label: "Materiais", href: `/aluno/turmas/${classId}?view=materials` },
  ];

  return (
    <nav aria-label="Navegação da turma" className="mb-6 flex max-w-full gap-2 overflow-x-auto border-b border-border pb-2">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={activeView === item.key ? "page" : undefined}
          className={`shrink-0 rounded-sm px-3 py-2 text-sm font-semibold transition-colors ${activeView === item.key ? "bg-brand-dim text-brand-text" : "text-muted-foreground hover:bg-card-2 hover:text-foreground"}`}
        >
          {item.label}
        </Link>
      ))}
      {flashcardsHref && <Link href={flashcardsHref} className="shrink-0 rounded-sm px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground">Flashcards</Link>}
    </nav>
  );
}
