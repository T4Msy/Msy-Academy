"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ActivityLibraryItem = { id: string; title: string; subject: string; level: string; questionCount: number; origin: "ai" | "manual"; status: string; createdAt: string };

export function ActivityLibraryClient({ activities, error }: { activities: ActivityLibraryItem[]; error?: string }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const visible = useMemo(() => activities.filter((activity) => {
    const matchesQuery = `${activity.title} ${activity.subject} ${activity.level}`.toLocaleLowerCase().includes(query.toLocaleLowerCase());
    const matchesFilter = filter === "all" || filter === activity.origin || filter === activity.status.toLocaleLowerCase();
    return matchesQuery && matchesFilter;
  }), [activities, filter, query]);
  return <section className="mt-8" aria-labelledby="my-activities-title">
    <div className="mb-4"><h2 id="my-activities-title" className="font-display text-2xl font-extrabold tracking-[-0.4px] text-foreground">Minhas atividades</h2><p className="mt-1 text-[13.5px] text-muted-foreground">Encontre e gerencie as atividades criadas manualmente ou com IA.</p></div>
    {error ? <div role="alert" className="rounded-md border border-danger-border bg-danger-dim p-4 text-sm text-danger-text">{error}</div> : activities.length === 0 ? <div className="rounded-lg border border-dashed border-border p-8 text-center"><p className="text-sm text-muted-foreground">Você ainda não criou nenhuma atividade.</p><Link href="/professor/atividades/nova" className="mt-4 inline-flex rounded-sm bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Criar primeira atividade</Link></div> : <><div className="mb-4 flex flex-col gap-2 sm:flex-row"><Input aria-label="Buscar atividade" placeholder="Buscar atividade" value={query} onChange={(event) => setQuery(event.target.value)} /><Select value={filter} onValueChange={setFilter}><SelectTrigger aria-label="Filtrar atividades" className="w-full sm:w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem><SelectItem value="ai">Geradas por IA</SelectItem><SelectItem value="manual">Criadas manualmente</SelectItem><SelectItem value="draft">Rascunhos</SelectItem><SelectItem value="ready">Prontas</SelectItem></SelectContent></Select></div>{visible.length === 0 ? <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhuma atividade encontrada com esses filtros.</p> : <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">{visible.map((activity) => <Link key={activity.id} href={`/professor/atividades/${activity.id}`} className="flex min-h-40 flex-col gap-3 rounded-lg border border-border bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:border-border-hover hover:bg-card-2"><div className="font-display text-base font-bold text-foreground">{activity.title || "Atividade sem título"}</div><div className="flex flex-wrap gap-1.5"><span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{activity.origin === "ai" ? "Gerada por IA" : "Criada manualmente"}</span><span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{activity.status === "DRAFT" ? "Rascunho" : activity.status === "ARCHIVED" ? "Arquivada" : "Pronta"}</span></div><p className="mt-auto text-xs text-subtle">{activity.questionCount} questão{activity.questionCount === 1 ? "" : "ões"}{activity.subject ? ` · ${activity.subject}` : ""}{activity.level ? ` · ${activity.level}` : ""}</p><p className="text-xs text-subtle">Criada em {new Date(activity.createdAt).toLocaleDateString("pt-BR")}</p></Link>)}</div>}</>}
  </section>;
}
