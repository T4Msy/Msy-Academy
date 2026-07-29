import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CalendarDays, CheckCircle2, ListChecks } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CreateModeTabs } from "@/components/CreateModeTabs";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { StudyPlanWizard } from "./StudyPlanWizard";
import { BlankStudyPlanForm } from "./BlankStudyPlanForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Plano de Estudos" };

function formatDate(iso: string): string { try { return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }); } catch { return iso; } }

export default async function PlanoDeEstudosPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase.from("study_plans").select("id, goal, exam_date, created_at").order("created_at", { ascending: false });
  const list = plans ?? [];
  const { data: items } = list.length ? await supabase.from("study_plan_items").select("id, study_plan_id, status, item_date").in("study_plan_id", list.map((plan) => plan.id)).order("item_date") : { data: [] as { id: string; study_plan_id: string; status: string; item_date: string }[] };
  const statsByPlan = new Map<string, { total: number; done: number; next: string | null }>();
  for (const item of items ?? []) { const current = statsByPlan.get(item.study_plan_id) ?? { total: 0, done: 0, next: null }; current.total += 1; if (item.status === "DONE") current.done += 1; if (!current.next && item.status !== "DONE") current.next = item.item_date; statsByPlan.set(item.study_plan_id, current); }

  return <>
    <PageHeader title="Plano de Estudos" subtitle={list.length > 0 ? `${list.length} plano${list.length > 1 ? "s" : ""} para organizar sua rotina.` : "Crie um plano para organizar sua rotina de estudos."} />
    <CreateModeTabs aiLabel="Gerar com IA" aiDesc="A IA monta um cronograma a partir do seu objetivo e data de prova." blankLabel="Criar do zero" blankDesc="Comece com um plano em branco e adicione os itens manualmente." aiForm={<StudyPlanWizard />} blankForm={<BlankStudyPlanForm />} />
    {list.length === 0 ? <div className="mt-5"><EmptyState variant="plano" title="Você ainda não possui um plano de estudos" text="Escolha um dos métodos acima para organizar sua rotina e acompanhar seus próximos itens." /></div> : <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3.5">{list.map((plan) => { const stats = statsByPlan.get(plan.id) ?? { total: 0, done: 0, next: null }; const progress = stats.total ? Math.round((stats.done / stats.total) * 100) : 0; return <Link key={plan.id} href={`/aluno/plano-de-estudos/${plan.id}`} className="group flex min-h-48 flex-col gap-3 rounded-md border border-border bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:border-brand-border hover:bg-card-2"><div className="flex items-start justify-between gap-3"><h2 className="min-w-0 font-display text-base font-bold text-foreground">{plan.goal}</h2><ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden /></div><div className="flex flex-wrap gap-1.5">{plan.exam_date && <Badge variant="outline"><CalendarDays className="size-3" aria-hidden />Prova: {formatDate(plan.exam_date)}</Badge>}<Badge variant="outline"><ListChecks className="size-3" aria-hidden />{stats.done}/{stats.total} concluídos</Badge></div><div className="mt-auto"><div className="mb-1 flex justify-between text-xs text-subtle"><span>{stats.next ? `Próximo item: ${formatDate(stats.next)}` : "Sem itens pendentes"}</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-card-2"><div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${progress}%` }} /></div></div><span className="inline-flex items-center gap-1 text-sm font-bold text-brand-text">Continuar plano <CheckCircle2 className="size-3.5" aria-hidden /></span></Link>; })}</div>}
  </>;
}
