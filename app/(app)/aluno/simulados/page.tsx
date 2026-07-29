import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Clock3, FileQuestion, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { SimuladoWizard } from "./SimuladoWizard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Testar conhecimentos" };

type SimuladoFilter = "available" | "in-progress" | "completed" | "all";
function validFilter(value: string | undefined): SimuladoFilter { return value === "available" || value === "in-progress" || value === "completed" || value === "all" ? value : "available"; }
function formatDate(iso: string): string { try { return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }); } catch { return iso; } }

export default async function SimuladosPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const filter = validFilter((await searchParams).filter);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: simulados }, { data: subjects }] = await Promise.all([
    supabase.from("simulados").select("id, title, mode, created_at").order("created_at", { ascending: false }),
    supabase.from("subjects").select("id, name").order("name"),
  ]);
  const list = simulados ?? [];
  const { data: submissions } = list.length ? await supabase.from("submissions").select("id, simulado_id, status").eq("student_id", user!.id).not("simulado_id", "is", null) : { data: [] as { id: string; simulado_id: string; status: string }[] };
  const submissionList = submissions ?? [];
  const submissionBySimulado = new Map(submissionList.map((submission) => [submission.simulado_id, submission]));
  const submissionIds = submissionList.map((submission) => submission.id);
  const { data: grades } = submissionIds.length ? await supabase.from("grades").select("submission_id, total_score").in("submission_id", submissionIds) : { data: [] as { submission_id: string; total_score: number }[] };
  const gradeBySubmission = new Map((grades ?? []).map((grade) => [grade.submission_id, grade.total_score]));
  const visible = list.filter((simulado) => { const status = submissionBySimulado.get(simulado.id)?.status; if (filter === "in-progress") return status === "PENDING"; if (filter === "completed") return Boolean(status && status !== "PENDING"); if (filter === "available") return !status; return true; });
  const completed = submissionList.filter((submission) => submission.status !== "PENDING");
  const scores = completed.map((submission) => gradeBySubmission.get(submission.id)).filter((score): score is number => score !== undefined);
  const filters: { key: SimuladoFilter; label: string; count?: number }[] = [{ key: "available", label: "Disponíveis", count: list.filter((simulado) => !submissionBySimulado.has(simulado.id)).length }, { key: "in-progress", label: "Em andamento", count: list.filter((simulado) => submissionBySimulado.get(simulado.id)?.status === "PENDING").length }, { key: "completed", label: "Concluídos", count: completed.length }, { key: "all", label: "Todos" }];
  const emptyTitle = filter === "completed" ? "Nenhum simulado concluído" : filter === "in-progress" ? "Nenhum simulado em andamento" : filter === "all" ? "Nenhum simulado ainda" : "Nenhum simulado disponível";
  const emptyText = list.length === 0 ? "Conclua uma atividade ou selecione um material para gerar seu primeiro simulado." : filter === "available" ? "Você já iniciou todos os simulados disponíveis. Gere outro para continuar praticando." : "Os simulados que entrarem nesta categoria aparecerão aqui.";

  return <>
    <PageHeader title="Simulados" subtitle="Pratique questões e acompanhe seu desempenho." actions={<SimuladoWizard subjects={subjects ?? []} />} />
    <div className="mb-5 grid gap-2 sm:grid-cols-3"><div className="rounded-lg border border-border bg-card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Concluídos</p><p className="mt-1 text-2xl font-extrabold text-foreground">{completed.length}</p></div><div className="rounded-lg border border-border bg-card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Média</p><p className="mt-1 text-2xl font-extrabold text-foreground">{scores.length ? `${Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)}%` : "—"}</p></div><div className="rounded-lg border border-border bg-card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Melhor nota</p><p className="mt-1 text-2xl font-extrabold text-brand-text">{scores.length ? `${Math.max(...scores)}%` : "—"}</p></div></div>
    <nav aria-label="Filtro de simulados" className="mb-6 flex max-w-full gap-2 overflow-x-auto border-b border-border pb-2">{filters.map((item) => <Link key={item.key} href={item.key === "available" ? "/aluno/simulados" : `/aluno/simulados?filter=${item.key}`} aria-current={filter === item.key ? "page" : undefined} className={`shrink-0 rounded-sm px-3 py-2 text-sm font-semibold transition-colors ${filter === item.key ? "bg-brand-dim text-brand-text" : "text-muted-foreground hover:bg-card-2 hover:text-foreground"}`}>{item.label}{item.count !== undefined && <span className="ml-1.5 text-xs opacity-75">({item.count})</span>}</Link>)}</nav>
    {visible.length === 0 ? <EmptyState variant="tarefa" title={emptyTitle} text={emptyText} action={list.length === 0 ? <SimuladoWizard subjects={subjects ?? []} /> : undefined} /> : <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3.5">{visible.map((simulado) => { const submission = submissionBySimulado.get(simulado.id); const isDone = Boolean(submission && submission.status !== "PENDING"); const score = submission ? gradeBySubmission.get(submission.id) : undefined; return <Link key={simulado.id} href={`/aluno/simulados/${simulado.id}`} className="group flex min-h-44 flex-col gap-3 rounded-md border border-border bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:border-brand-border hover:bg-card-2"><div className="flex items-start justify-between gap-3"><span className="flex size-10 items-center justify-center rounded-md bg-brand-dim text-brand-text">{isDone ? <CheckCircle2 className="size-5" aria-hidden /> : submission ? <Clock3 className="size-5" aria-hidden /> : <FileQuestion className="size-5" aria-hidden />}</span><Badge variant="outline" className={isDone ? "border-success-border bg-success-dim text-success-text" : submission ? "border-warning-border bg-warning-dim text-warning-text" : "border-border"}>{isDone ? "Concluído" : submission ? "Em andamento" : "Disponível"}</Badge></div><h2 className="font-display text-base font-bold text-foreground">{simulado.title}</h2><div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-subtle"><span>{formatDate(simulado.created_at)}{score !== undefined ? ` · Nota ${score}` : ""}</span><span className="inline-flex items-center gap-1 font-bold text-brand-text">{isDone ? "Ver resultado" : submission ? "Continuar" : "Iniciar"}{submission ? <ArrowRight className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}</span></div></Link>; })}</div>}
  </>;
}
