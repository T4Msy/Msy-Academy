import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Brain, Layers3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CreateModeTabs } from "@/components/CreateModeTabs";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { isDue, DEFAULT_SRS_STATE, type SrsState } from "@/lib/srs/sm2";
import { GenerateDeckForm } from "./GenerateDeckForm";
import { NewDeckForm } from "./NewDeckForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Revisar conteúdos" };

export default async function FlashcardsPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string; materialIds?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim().toLocaleLowerCase("pt-BR") ?? "";
  const filter = params.filter === "due" ? "due" : "all";
  const contextMaterialIds = new Set((params.materialIds ?? "").split(",").filter(Boolean));
  const supabase = await createClient();
  const [{ data: decks }, { data: materials }] = await Promise.all([
    supabase.from("flashcard_decks").select("id, title, created_at, source_material_id").order("created_at", { ascending: false }),
    supabase.from("materials").select("id, title").eq("kind", "FILE").order("title"),
  ]);
  const list = decks ?? [];
  const { data: cards } = list.length ? await supabase.from("flashcards").select("id, deck_id, srs_state").in("deck_id", list.map((deck) => deck.id)) : { data: [] as { id: string; deck_id: string; srs_state: SrsState | null }[] };
  const cardsByDeck = new Map<string, { total: number; due: number }>();
  for (const card of cards ?? []) { const current = cardsByDeck.get(card.deck_id) ?? { total: 0, due: 0 }; current.total += 1; if (isDue((card.srs_state as SrsState) ?? DEFAULT_SRS_STATE, new Date())) current.due += 1; cardsByDeck.set(card.deck_id, current); }
  const visible = list.filter((deck) => (!contextMaterialIds.size || contextMaterialIds.has(deck.source_material_id ?? "")) && (!query || deck.title.toLocaleLowerCase("pt-BR").includes(query)) && (filter !== "due" || (cardsByDeck.get(deck.id)?.due ?? 0) > 0));

  return <>
    <PageHeader title="Flashcards" subtitle={list.length > 0 ? `${list.length} deck${list.length > 1 ? "s" : ""} para revisar.` : "Crie um deck para começar suas revisões."} />
    <CreateModeTabs aiLabel="Gerar com IA" aiDesc="A IA monta os cartões a partir de um material já processado." blankLabel="Criar do zero" blankDesc="Comece com um conjunto vazio e adicione os cartões como preferir." aiForm={<GenerateDeckForm materials={materials ?? []} />} blankForm={<NewDeckForm />} />
    {list.length > 0 && <form method="get" className="my-5 flex flex-col gap-2 sm:flex-row"><input name="q" defaultValue={params.q ?? ""} aria-label="Buscar decks" placeholder="Buscar deck" className="min-w-0 flex-1 rounded-sm border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand-border focus:ring-2 focus:ring-brand-glow" /><select name="filter" defaultValue={filter} aria-label="Filtrar decks" className="rounded-sm border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand-border focus:ring-2 focus:ring-brand-glow"><option value="all">Todos os decks</option><option value="due">Com revisão pendente</option></select><button type="submit" className="rounded-sm bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Filtrar</button></form>}
    {visible.length === 0 ? <EmptyState variant="tarefa" title={list.length === 0 ? "Nenhum deck ainda" : "Nenhum deck encontrado"} text={list.length === 0 ? "Crie um deck do zero ou gere cartões a partir de um material da sua turma." : "Tente ajustar a busca ou o filtro de revisão."} /> : <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3.5">{visible.map((deck) => { const stats = cardsByDeck.get(deck.id) ?? { total: 0, due: 0 }; const reviewed = stats.total ? Math.round(((stats.total - stats.due) / stats.total) * 100) : 0; return <Link key={deck.id} href={`/aluno/flashcards/${deck.id}`} className="group flex min-h-44 flex-col gap-3 rounded-md border border-border bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:border-brand-border hover:bg-card-2"><div className="flex items-start justify-between gap-3"><span className="flex size-10 items-center justify-center rounded-md bg-brand-dim text-brand-text"><Layers3 className="size-5" aria-hidden /></span>{stats.due > 0 && <Badge className="bg-warning-dim text-warning-text">{stats.due} pendente{stats.due === 1 ? "" : "s"}</Badge>}</div><h2 className="font-display text-base font-bold text-foreground">{deck.title}</h2><div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-subtle"><span className="inline-flex items-center gap-1"><Brain className="size-3.5" aria-hidden />{stats.total} cartão{stats.total === 1 ? "" : "s"} · {reviewed}% revisado</span><span className="inline-flex items-center gap-1 font-bold text-brand-text">Revisar <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden /></span></div></Link>; })}</div>}
  </>;
}
