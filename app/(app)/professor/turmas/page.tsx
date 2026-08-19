import Link from "next/link";
import type { Metadata } from "next";
import { ClipboardCheck, Megaphone, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CreateClassForm } from "./CreateClassForm";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import { deleteClass } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Turmas" };

type ClassSummary = { students: number; activities: number; exams: number; pending: number; announcements: number };

export default async function TurmasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: classes } = user
    ? await supabase.from("classes").select("id, name, invite_code, owner_id, created_at").eq("owner_id", user.id).order("created_at", { ascending: false })
    : { data: [] as { id: string; name: string; invite_code: string; owner_id: string; created_at: string }[] };
  const list = classes ?? [];
  const classIds = list.map((klass) => klass.id);

  const [{ data: enrollments }, { data: assignments }, { data: announcements }] = classIds.length
    ? await Promise.all([
        supabase.from("enrollments").select("class_id, student_id").in("class_id", classIds).eq("status", "ACTIVE"),
        supabase.from("assignments").select("id, class_id, content_type").in("class_id", classIds).is("deleted_at", null),
        supabase.from("class_announcements").select("class_id").in("class_id", classIds),
      ])
    : [{ data: [] as { class_id: string; student_id: string }[] }, { data: [] as { id: string; class_id: string; content_type: string }[] }, { data: [] as { class_id: string }[] }];

  const assignmentIds = (assignments ?? []).map((assignment) => assignment.id);
  const { data: submissions } = assignmentIds.length
    ? await supabase.from("submissions").select("assignment_id, status").in("assignment_id", assignmentIds)
    : { data: [] as { assignment_id: string; status: string }[] };
  const classByAssignment = new Map((assignments ?? []).map((assignment) => [assignment.id, assignment.class_id]));
  const summaries = new Map<string, ClassSummary>(classIds.map((id) => [id, { students: 0, activities: 0, exams: 0, pending: 0, announcements: 0 }]));
  for (const enrollment of enrollments ?? []) summaries.get(enrollment.class_id)!.students += 1;
  for (const assignment of assignments ?? []) {
    const summary = summaries.get(assignment.class_id);
    if (!summary) continue;
    if (assignment.content_type === "EXAM") summary.exams += 1;
    if (assignment.content_type === "ACTIVITY") summary.activities += 1;
  }
  for (const announcement of announcements ?? []) summaries.get(announcement.class_id)!.announcements += 1;
  for (const submission of submissions ?? []) {
    if (submission.status === "SUBMITTED") {
      const classId = classByAssignment.get(submission.assignment_id);
      if (classId) summaries.get(classId)!.pending += 1;
    }
  }

  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Turmas</h1><p className="mt-1 text-[13.5px] text-muted-foreground">{list.length > 0 ? `${list.length} turma${list.length > 1 ? "s" : ""}` : "Crie uma turma e convide seus alunos por código."}</p></div><CreateClassForm /></div>
    {list.length === 0 ? <EmptyState variant="turma" title="Nenhuma turma ainda" text="Crie sua primeira turma para começar a atribuir conteúdo aos alunos." /> : <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-3.5">{list.map((klass) => { const summary = summaries.get(klass.id)!; const isOwner = user?.id === klass.owner_id; return <article key={klass.id} className="flex min-w-0 flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-border-hover hover:bg-card-2"><div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><Link href={`/professor/turmas/${klass.id}`} className="block truncate font-display text-lg font-bold tracking-[-0.2px] text-foreground hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-glow">{klass.name}</Link><span className="mt-1 inline-flex max-w-full truncate rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">Código: {klass.invite_code}</span></div></div><div className="mt-4 grid grid-cols-2 gap-2 border-y border-border py-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Users className="size-3.5 text-brand-text" aria-hidden />{summary.students} alunos</span><span className="inline-flex items-center gap-1.5"><ClipboardCheck className="size-3.5 text-brand-text" aria-hidden />{summary.activities} atividades</span><span>{summary.exams} provas</span><span className={summary.pending > 0 ? "font-semibold text-warning-text" : ""}>{summary.pending} pendências</span></div><div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Megaphone className="size-3.5 text-brand-text" aria-hidden />{summary.announcements} avisos</span><Link href={`/professor/turmas/${klass.id}`} className="font-semibold text-brand-text">Abrir turma</Link></div>{!isOwner && <p className="mt-3 text-xs text-muted-foreground">Somente visualização</p>}{isOwner && <div className="mt-3 flex justify-end border-t border-border pt-3"><ConfirmActionButton triggerLabel="Excluir turma" title="Excluir turma?" description="Esta ação é irreversível. A turma, matrículas, atribuições e dados relacionados serão removidos." confirmLabel="Excluir turma" pendingLabel="Excluindo..." successMessage="Turma excluída." action={deleteClass.bind(null, klass.id)} variant="destructive-ghost" /></div>}</article>; })}</div>}
  </>;
}
