import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { JoinClassDialog } from "./JoinClassDialog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Minhas Turmas" };

type StudentClassRow = { id: string; name: string; created_at: string; subject_id: string | null };
function formatDate(iso: string): string { try { return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }); } catch { return iso; } }

export default async function AlunoTurmasPage() {
  const supabase = await createClient();
  const { data: classRows } = await supabase.rpc("student_visible_classes");
  const classes = (classRows ?? []) as StudentClassRow[];
  const classIds = classes.map((klass) => klass.id);
  const subjectIds = [...new Set(classes.map((klass) => klass.subject_id).filter((subjectId): subjectId is string => Boolean(subjectId)))];
  const [{ data: assignments }, { data: materials }, { data: subjects }, { data: teacherNames }] = classIds.length ? await Promise.all([
    supabase.from("assignments").select("id, class_id, due_at").in("class_id", classIds).is("deleted_at", null),
    supabase.from("materials").select("id, class_id, created_at").in("class_id", classIds),
    subjectIds.length ? supabase.from("subjects").select("id, name").in("id", subjectIds) : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabase.rpc("student_class_teacher_names", { p_class_ids: classIds }),
  ]) : [{ data: [] as { id: string; class_id: string; due_at: string | null }[] }, { data: [] as { id: string; class_id: string; created_at: string }[] }, { data: [] as { id: string; name: string }[] }, { data: [] as { class_id: string; teacher_name: string | null }[] }];
  const assignmentCount = new Map<string, number>();
  const nextDue = new Map<string, string>();
  const materialCount = new Map<string, number>();
  const latestUpdate = new Map<string, string>();
  for (const item of assignments ?? []) { assignmentCount.set(item.class_id, (assignmentCount.get(item.class_id) ?? 0) + 1); if (item.due_at && (!nextDue.has(item.class_id) || new Date(item.due_at).getTime() < new Date(nextDue.get(item.class_id)!).getTime())) nextDue.set(item.class_id, item.due_at); }
  for (const item of materials ?? []) { materialCount.set(item.class_id, (materialCount.get(item.class_id) ?? 0) + 1); if (!latestUpdate.has(item.class_id) || new Date(item.created_at).getTime() > new Date(latestUpdate.get(item.class_id)!).getTime()) latestUpdate.set(item.class_id, item.created_at); }
  const subjectById = new Map((subjects ?? []).map((subject) => [subject.id, subject.name]));
  const teacherByClassId = new Map((teacherNames ?? []).map((teacher: { class_id: string; teacher_name: string | null }) => [teacher.class_id, teacher.teacher_name]));

  return <><PageHeader title="Minhas Turmas" subtitle={classes.length > 0 ? `${classes.length} turma${classes.length > 1 ? "s" : ""} em que você está matriculado.` : "Entre em uma turma com o código compartilhado pelo professor."} actions={<JoinClassDialog />} />{classes.length === 0 ? <EmptyState variant="turma" title="Nenhuma turma ainda" text="Use o código de convite do professor para entrar na sua primeira turma." action={<JoinClassDialog />} /> : <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3.5">{classes.map((klass) => { const pending = assignmentCount.get(klass.id) ?? 0; const materialsTotal = materialCount.get(klass.id) ?? 0; const subject = klass.subject_id ? subjectById.get(klass.subject_id) : null; const teacher = teacherByClassId.get(klass.id); return <Link href={`/aluno/turmas/${klass.id}`} key={klass.id} className="group flex min-h-52 flex-col gap-3 rounded-md border border-border bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:border-brand-border hover:bg-card-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-glow"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-display text-lg font-bold tracking-[-0.2px] text-foreground">{klass.name}</h2><p className="mt-1 truncate text-sm text-muted-foreground">{[subject, teacher].filter(Boolean).join(" · ") || "Ambiente de aprendizagem"}</p></div><ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand-text" aria-hidden /></div><div className="grid grid-cols-2 gap-2 border-y border-border py-3"><div className="flex items-center gap-2 text-sm text-muted-foreground"><ClipboardList className="size-4 text-brand-text" aria-hidden /><span><b className="text-foreground">{pending}</b> tarefa{pending === 1 ? "" : "s"}</span></div><div className="flex items-center gap-2 text-sm text-muted-foreground"><BookOpen className="size-4 text-brand-text" aria-hidden /><span><b className="text-foreground">{materialsTotal}</b> material{materialsTotal === 1 ? "" : "is"}</span></div></div><div className="mt-auto flex items-center justify-between gap-2 text-xs text-subtle"><span>{nextDue.has(klass.id) ? `Próxima: ${formatDate(nextDue.get(klass.id)!)}` : "Sem próxima entrega"}</span><span>{latestUpdate.has(klass.id) ? `Atualizada ${formatDate(latestUpdate.get(klass.id)!)}` : "Sem conteúdo ainda"}</span></div><span className="text-sm font-bold text-brand-text">Entrar <ArrowRight className="ml-1 inline size-3.5" aria-hidden /></span></Link>; })}</div>}</>;
}
