import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { getStudentAssignmentState, matchesStudentAssignmentFilter, sortStudentAssignments, studentAssignmentStatusLabel, type StudentAssignmentFilter, type StudentAssignmentState } from "@/lib/assignments/studentPriority";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tarefas" };

type Assignment = { id: string; content_type: "EXAM" | "ACTIVITY"; content_id: string; due_at: string | null; class_id: string };
type StudentTask = Assignment & { title: string; state: StudentAssignmentState; submissionStatus: string | null; submittedAt: string | null; grade?: number; className: string };

function formatDate(iso: string | null) {
  if (!iso) return "Sem prazo";
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function stateVisual(state: StudentAssignmentState) {
  if (state === "completed") return { icon: CheckCircle2, className: "border-success-border bg-success-dim text-success-text" };
  if (state === "upcoming") return { icon: AlertTriangle, className: "border-warning-border bg-warning-dim text-warning-text" };
  if (state === "expired") return { icon: XCircle, className: "border-danger-border bg-danger-dim text-danger-text" };
  return { icon: Clock3, className: "border-border bg-card-2 text-muted-foreground" };
}

function validFilter(value: string | undefined, legacyView: string | undefined): StudentAssignmentFilter {
  if (value === "pending" || value === "upcoming" || value === "completed" || value === "expired") return value;
  if (legacyView === "completed") return "completed";
  if (legacyView === "expired") return "expired";
  return "pending";
}

export default async function TarefasPage({ searchParams }: { searchParams: Promise<{ filter?: string; view?: string }> }) {
  const params = await searchParams;
  const filter = validFilter(params.filter, params.view);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: assignments } = await supabase.from("assignments").select("id, content_type, content_id, due_at, class_id").order("due_at", { ascending: true, nullsFirst: false });
  const list = (assignments ?? []) as Assignment[];
  const examIds = list.filter((assignment) => assignment.content_type === "EXAM").map((assignment) => assignment.content_id);
  const activityIds = list.filter((assignment) => assignment.content_type === "ACTIVITY").map((assignment) => assignment.content_id);
  const classIds = [...new Set(list.map((assignment) => assignment.class_id))];
  const [{ data: exams }, { data: activities }, { data: submissions }, { data: classes }] = await Promise.all([
    examIds.length ? supabase.from("exams").select("id, title").in("id", examIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    activityIds.length ? supabase.from("activities").select("id, title").in("id", activityIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    supabase.from("submissions").select("id, assignment_id, status, submitted_at").eq("student_id", user!.id).not("assignment_id", "is", null),
    classIds.length ? supabase.from("classes").select("id, name").in("id", classIds) : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);
  const submissionList = submissions ?? [];
  const submissionIds = submissionList.map((submission) => submission.id);
  const { data: grades } = submissionIds.length ? await supabase.from("grades").select("submission_id, total_score").in("submission_id", submissionIds) : { data: [] as { submission_id: string; total_score: number }[] };
  const examTitleById = new Map((exams ?? []).map((exam) => [exam.id, exam.title]));
  const activityTitleById = new Map((activities ?? []).map((activity) => [activity.id, activity.title]));
  const classNameById = new Map((classes ?? []).map((item) => [item.id, item.name]));
  const submissionByAssignment = new Map(submissionList.filter((submission) => submission.assignment_id).map((submission) => [submission.assignment_id!, submission]));
  const gradeBySubmission = new Map((grades ?? []).map((grade) => [grade.submission_id, grade.total_score]));
  const now = new Date().getTime();
  const tasks = sortStudentAssignments(list.map((assignment) => {
    const submission = submissionByAssignment.get(assignment.id);
    return { ...assignment, dueAt: assignment.due_at, title: assignment.content_type === "EXAM" ? examTitleById.get(assignment.content_id) ?? "Prova" : activityTitleById.get(assignment.content_id) ?? "Atividade", state: getStudentAssignmentState(assignment.due_at, submission?.status, now), submissionStatus: submission?.status ?? null, submittedAt: submission?.submitted_at ?? null, grade: submission ? gradeBySubmission.get(submission.id) : undefined, className: classNameById.get(assignment.class_id) ?? "Turma" };
  }).filter((task) => matchesStudentAssignmentFilter(task.state, filter)));
  const counts = { pending: 0, upcoming: 0, completed: 0, expired: 0 };
  for (const assignment of list) { const submission = submissionByAssignment.get(assignment.id); const state = getStudentAssignmentState(assignment.due_at, submission?.status, now); if (state === "upcoming" || state === "in-progress") counts.pending++; else counts[state]++; }
  const grouped = tasks.reduce<Map<string, StudentTask[]>>((map, task) => { const current = map.get(task.class_id) ?? []; current.push(task); map.set(task.class_id, current); return map; }, new Map());
  const filterLinks: { key: StudentAssignmentFilter; label: string; count?: number }[] = [{ key: "pending", label: "Pendentes", count: counts.pending }, { key: "upcoming", label: "Próximas do vencimento", count: counts.upcoming }, { key: "completed", label: "Concluídas", count: counts.completed }, { key: "expired", label: "Expiradas", count: counts.expired }, { key: "all", label: "Todas" }];

  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Tarefas</h1><p className="mt-1 text-[13.5px] text-muted-foreground">Conteúdos próximos do vencimento aparecem primeiro.</p></div></div>
    <nav aria-label="Filtro de tarefas" className="mb-6 flex flex-wrap gap-2 border-b border-border pb-2">{filterLinks.map((item) => <Link key={item.key} href={item.key === "pending" ? "/aluno/tarefas" : `/aluno/tarefas?filter=${item.key}`} aria-current={filter === item.key ? "page" : undefined} className={`rounded-sm px-3 py-2 text-sm font-semibold transition-colors ${filter === item.key ? "bg-brand-dim text-brand-text" : "text-muted-foreground hover:bg-card-2 hover:text-foreground"}`}>{item.label}{item.count !== undefined && <span className="ml-1.5 text-xs opacity-75">({item.count})</span>}</Link>)}</nav>
    {tasks.length === 0 ? <EmptyState variant="tarefa" title={filter === "completed" ? "Nenhuma tarefa concluída" : filter === "expired" ? "Nenhuma tarefa expirada" : "Nenhuma tarefa encontrada"} text="As tarefas atribuídas pela sua turma aparecerão aqui." /> : <div className="space-y-7">{[...grouped.entries()].map(([classId, classTasks]) => <section key={classId} aria-labelledby={`student-class-${classId}`}><div className="mb-3 flex items-end justify-between"><div><h2 id={`student-class-${classId}`} className="font-display text-xl font-bold text-foreground">{classTasks[0].className}</h2><p className="text-sm text-muted-foreground">{classTasks.length} conteúdo{classTasks.length === 1 ? "" : "s"}</p></div></div><div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">{classTasks.map((assignment) => { const visual = stateVisual(assignment.state); const Icon = visual.icon; return <Link key={assignment.id} href={`/aluno/tarefas/${assignment.id}`} className={`flex flex-col gap-3 rounded-md border bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:bg-card-2 ${assignment.state === "upcoming" ? "border-warning-border" : assignment.state === "expired" ? "border-danger-border" : "border-border"}`}><div className="flex items-start justify-between gap-3"><h3 className="font-display text-base font-bold tracking-[-0.2px] text-foreground">{assignment.title}</h3><Badge variant="outline" className={visual.className}><Icon aria-hidden />{studentAssignmentStatusLabel(assignment.state, assignment.due_at, now)}</Badge></div><div className="flex flex-wrap gap-1.5"><Badge variant="outline">{assignment.content_type === "EXAM" ? "Prova" : "Atividade"}</Badge>{assignment.grade !== undefined && <Badge variant="outline">Nota: {assignment.grade}</Badge>}</div><div className="mt-auto flex items-center justify-between gap-2.5 border-t border-border pt-3 text-xs text-subtle"><span>{assignment.state === "completed" ? `Concluída${assignment.submittedAt ? ` em ${formatDate(assignment.submittedAt)}` : ""}` : assignment.state === "expired" ? "Prazo encerrado" : "Prazo"}</span><span className="font-semibold text-foreground">{formatDate(assignment.due_at)}</span></div></Link>; })}</div></section>)}</div>}
  </>;
}
