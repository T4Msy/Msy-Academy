import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Correção" };

export default async function CorrecaoPage() {
  const supabase = await createClient();
  const { data: classes } = await supabase.from("classes").select("id, name").order("created_at", { ascending: false });
  const classList = classes ?? [];
  const classIds = classList.map((classroom) => classroom.id);
  const { data: assignments } = classIds.length ? await supabase.from("assignments").select("id, class_id").in("class_id", classIds) : { data: [] as { id: string; class_id: string }[] };
  const assignmentList = assignments ?? [];
  const assignmentIds = assignmentList.map((assignment) => assignment.id);
  const [{ data: submissions }, { data: scans }] = await Promise.all([
    assignmentIds.length ? supabase.from("submissions").select("assignment_id, status").in("assignment_id", assignmentIds) : Promise.resolve({ data: [] }),
    assignmentIds.length ? supabase.from("answer_sheet_scans").select("assignment_id, status").in("assignment_id", assignmentIds).in("status", ["NEEDS_REVIEW", "FAILED"]) : Promise.resolve({ data: [] }),
  ]);
  const classByAssignment = new Map(assignmentList.map((assignment) => [assignment.id, assignment.class_id]));
  const totals = new Map(classIds.map((classId) => [classId, { pending: 0, graded: 0, scans: 0 }]));
  for (const submission of submissions ?? []) {
    const classId = submission.assignment_id ? classByAssignment.get(submission.assignment_id) : undefined;
    if (!classId) continue;
    const total = totals.get(classId)!;
    if (submission.status === "SUBMITTED") total.pending += 1;
    if (submission.status === "GRADED") total.graded += 1;
  }
  for (const scan of scans ?? []) {
    const classId = classByAssignment.get(scan.assignment_id);
    if (classId) totals.get(classId)!.scans += 1;
  }

  return <>
    <div className="mb-6"><h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Correção</h1><p className="mt-1 text-[13.5px] text-muted-foreground">Escolha a turma para ver entregas, aplicar gabaritos e acompanhar as correções.</p></div>
    {classList.length === 0 ? <EmptyState variant="notificacao" title="Nenhuma turma criada" text="Crie uma turma para receber e corrigir atividades dos alunos." /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{classList.map((classroom) => { const total = totals.get(classroom.id)!; const initial = classroom.name.trim().charAt(0).toUpperCase() || "T"; return <article key={classroom.id} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-elevated transition duration-300 hover:-translate-y-1 hover:border-brand-border hover:shadow-[0_16px_40px_rgba(217,119,87,.16)]"><div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-brand/20 via-brand/5 to-transparent" /><div className="relative flex items-start justify-between gap-3"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-brand-border bg-brand-dim font-display text-xl font-extrabold text-brand-text shadow-[0_8px_20px_rgba(217,119,87,.16)]">{initial}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${total.pending > 0 ? "bg-brand-dim text-brand-text" : "bg-card-2 text-muted-foreground"}`}>{total.pending > 0 ? `${total.pending} aguardando` : "Em dia"}</span></div><div className="relative mt-5"><h2 className="truncate font-display text-xl font-extrabold tracking-[-0.2px] text-foreground">{classroom.name}</h2><p className="mt-1 text-sm text-muted-foreground">Central de correção da turma</p></div><div className="relative mt-5 grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card-2"><div className="px-3 py-3 text-center"><b className="block text-lg text-brand-text">{total.pending}</b><span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Pendentes</span></div><div className="px-3 py-3 text-center"><b className="block text-lg text-foreground">{total.graded}</b><span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Corrigidas</span></div><div className="px-3 py-3 text-center"><b className="block text-lg text-warning">{total.scans}</b><span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Scans</span></div></div><div className="relative mt-5 flex gap-2"><Link href={`/professor/correcao/turma/${classroom.id}`} className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition group-hover:shadow-[0_6px_18px_rgba(217,119,87,.25)]">Abrir correção</Link><Link href={`/professor/correcao/turma/${classroom.id}?view=scan`} className="inline-flex items-center justify-center rounded-xl border border-border px-4 text-sm font-bold text-foreground transition hover:border-brand-border hover:bg-brand-dim">Scan</Link></div></article>; })}</div>}
  </>;
}
