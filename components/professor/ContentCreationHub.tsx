"use client";

import Link from "next/link";
import { BookOpen, ClipboardCheck, FileText, LibraryBig, Sparkles } from "lucide-react";

type ContentKind = "exam" | "activity" | "material";
const TYPES: Array<{ id: ContentKind; title: string; description: string; icon: typeof FileText }> = [
  { id: "exam", title: "Prova", description: "Crie uma avaliação para sua turma.", icon: FileText },
  { id: "activity", title: "Atividade", description: "Prepare exercícios e listas de prática.", icon: ClipboardCheck },
  { id: "material", title: "Material", description: "Envie um arquivo para compartilhar com alunos.", icon: BookOpen },
];

const OPTIONS: Record<ContentKind, Array<{ title: string; description: string; href: string; icon: typeof Sparkles }>> = {
  exam: [
    { title: "Com IA", description: "Gere questões e revise antes de publicar.", href: "/professor/provas/nova", icon: Sparkles },
    { title: "Do zero", description: "Monte a prova manualmente no editor.", href: "/professor/provas/nova", icon: FileText },
    { title: "Banco de questões", description: "Explore questões reutilizáveis da sua biblioteca.", href: "/professor/banco-de-questoes", icon: LibraryBig },
    { title: "Reutilizar prova", description: "Abra uma prova existente para duplicar e editar.", href: "/professor/provas", icon: FileText },
  ],
  activity: [
    { title: "Com IA", description: "Gere uma lista e revise antes de enviar.", href: "/professor/atividades/nova", icon: Sparkles },
    { title: "Do zero", description: "Comece uma atividade manualmente.", href: "/professor/atividades/nova", icon: ClipboardCheck },
    { title: "Banco de questões", description: "Use questões reutilizáveis que já existem.", href: "/professor/banco-de-questoes", icon: LibraryBig },
    { title: "Reutilizar atividade", description: "Abra uma atividade existente para duplicar e editar.", href: "/professor/atividades", icon: ClipboardCheck },
  ],
  material: [
    { title: "Enviar arquivo", description: "Adicione um arquivo pela Biblioteca e compartilhe quando estiver pronto.", href: "/professor/biblioteca", icon: BookOpen },
    { title: "Reutilizar material", description: "Escolha um material já armazenado na Biblioteca.", href: "/professor/biblioteca", icon: LibraryBig },
  ],
};

export function ContentCreationHub({ initialKind }: { initialKind?: ContentKind }) {
  const selected = initialKind && TYPES.some((type) => type.id === initialKind) ? initialKind : null;
  return <div className="mx-auto max-w-4xl"><ol className="mb-6 flex gap-2 text-xs font-semibold text-muted-foreground" aria-label="Etapas de criação"><li className="rounded-full bg-brand-dim px-3 py-1 text-brand-text">1. Criar</li><li className="rounded-full border border-border px-3 py-1">2. Revisar</li><li className="rounded-full border border-border px-3 py-1">3. Destinatários</li><li className="rounded-full border border-border px-3 py-1">4. Publicar</li></ol>{!selected ? <><h1 className="font-display text-3xl font-extrabold text-foreground">O que você quer criar?</h1><p className="mt-1 text-sm text-muted-foreground">Escolha um tipo para começar. Você poderá revisar tudo antes de publicar.</p><div className="mt-6 grid gap-3 sm:grid-cols-3">{TYPES.map((type) => { const Icon = type.icon; return <Link key={type.id} href={`/professor/criar?tipo=${type.id}`} className="group rounded-xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-brand-border hover:bg-card-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-glow"><span className="flex size-10 items-center justify-center rounded-md bg-brand-dim text-brand-text"><Icon className="size-5" aria-hidden /></span><h2 className="mt-4 font-display text-lg font-bold text-foreground">{type.title}</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{type.description}</p></Link>; })}</div></> : <><Link href="/professor/criar" className="text-sm font-semibold text-brand-text hover:underline">← Alterar tipo de conteúdo</Link><h1 className="mt-3 font-display text-3xl font-extrabold text-foreground">Como você quer começar?</h1><p className="mt-1 text-sm text-muted-foreground">{TYPES.find((type) => type.id === selected)?.title} · escolha uma origem e siga para o editor existente.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{OPTIONS[selected].map((option) => { const Icon = option.icon; return <Link key={option.title} href={option.href} className="group flex min-h-30 items-start gap-3 rounded-xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-brand-border hover:bg-card-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-glow"><span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand-dim text-brand-text"><Icon className="size-5" aria-hidden /></span><span><h2 className="font-display text-base font-bold text-foreground">{option.title}</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{option.description}</p></span></Link>; })}</div></>}</div>;
}
