import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { CorrectionQueue } from "../../CorrectionQueue";
import { formatDate } from "@/lib/classes/format";

type SubmissionRow = { id: string; student_id: string; assignment_id: string; submitted_at: string; assignments: { content_type: "EXAM" | "ACTIVITY"; content_id: string } | null };
type AssignmentRow = { id: string; content_type: "EXAM" | "ACTIVITY"; content_id: string; due_at: string | null };

export const dynamic = "force-dynamic";

export default async function TurmaCorrecaoPage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ view?: string }> }) {
  const [{ classId }, { view }] = await Promise.all([params, searchParams]);
  const historyView = view === "history";
  const scanView = view === "scan";
  const supabase = await createClient();
  const { data: classroom } = await supabase.from("classes").select("id, name").eq("id", classId).maybeSingle();
  if (!classroom) notFound();
  const { data: assignments } = await supabase.from("assignments").select("id, content_type, content_id, due_at").eq("class_id", classId).is("deleted_at", null).order("created_at", { ascending: false });
  const assignmentList = (assignments ?? []) as AssignmentRow[];
  const assignmentIds = assignmentList.map((assignment) => assignment.id);
  const [{ data: submissions }, { data: allSubmissions }] = await Promise.all([
    !scanView && assignmentIds.length ? supabase.from("submissions").select("id, student_id, assignment_id, submitted_at, assignments(content_type, content_id)").in("assignment_id", assignmentIds).eq("status", historyView ? "GRADED" : "SUBMITTED").order("submitted_at", { ascending: !historyView }) : Promise.resolve({ data: [] }),
    assignmentIds.length ? supabase.from("submissions").select("assignment_id, status").in("assignment_id", assignmentIds) : Promise.resolve({ data: [] }),
  ]);
  const list = submissions ?? [];
  const rows = list as unknown as SubmissionRow[];
  const submissionIds = rows.map((submission) => submission.id);
  const [{ data: grades }, { data: profiles }] = await Promise.all([
    submissionIds.length ? supabase.from("grades").select("submission_id, total_score").in("submission_id", submissionIds) : Promise.resolve({ data: [] }),
    rows.length ? supabase.from("profiles").select("id, full_name").in("id", [...new Set(rows.map((submission) => submission.student_id))]) : Promise.resolve({ data: [] }),
  ]);
  const gradeBySubmission = new Map((grades ?? []).map((grade) => [grade.submission_id, grade.total_score]));
  const nameById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
  const totalByAssignment = new Map(assignmentIds.map((id) => [id, { total: 0, pending: 0 }]));
  for (const submission of allSubmissions ?? []) {
    const total = totalByAssignment.get(submission.assignment_id);
    if (!total) continue;
    total.total += 1;
    if (submission.status === "SUBMITTED") total.pending += 1;
  }
  const examIds = assignmentList.filter((assignment) => assignment.content_type === "EXAM").map((assignment) => assignment.content_id);
  const activityIds = assignmentList.filter((assignment) => assignment.content_type === "ACTIVITY").map((assignment) => assignment.content_id);
  const [{ data: exams }, { data: activities }] = await Promise.all([
    examIds.length ? supabase.from("exams").select("id, title").in("id", examIds) : Promise.resolve({ data: [] }),
    activityIds.length ? supabase.from("activities").select("id, title").in("id", activityIds) : Promise.resolve({ data: [] }),
  ]);
  const examTitleById = new Map((exams ?? []).map((exam: { id: string; title: string }) => [exam.id, exam.title]));
  const activityTitleById = new Map((activities ?? []).map((activity: { id: string; title: string }) => [activity.id, activity.title]));
  const titleFor = (assignment: AssignmentRow) => assignment.content_type === "EXAM" ? examTitleById.get(assignment.content_id) ?? "Prova" : activityTitleById.get(assignment.content_id) ?? "Atividade";
  return <>
    <div className="mb-6"><Link href="/professor/correcao" className="text-sm text-muted-foreground hover:text-foreground">← Todas as turmas</Link><h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Correção · {classroom.name}</h1><p className="mt-1 text-[13.5px] text-muted-foreground">{scanView ? "Escolha uma prova para escanear os cartões-resposta." : historyView ? `${rows.length} entrega(s) corrigida(s)` : `${rows.length} entrega(s) aguardando correção`}</p></div>
    <nav aria-label="Seções da correção" className="mb-5 flex max-w-full gap-2 overflow-x-auto border-b border-border"><Link href={`/professor/correcao/turma/${classId}`} className={`shrink-0 border-b-2 px-3 py-2 text-sm font-semibold ${!historyView && !scanView ? "border-brand text-brand-text" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Pendentes</Link><Link href={`/professor/correcao/turma/${classId}?view=history`} className={`shrink-0 border-b-2 px-3 py-2 text-sm font-semibold ${historyView ? "border-brand text-brand-text" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Corrigidas</Link><Link href={`/professor/correcao/turma/${classId}?view=scan`} className={`shrink-0 border-b-2 px-3 py-2 text-sm font-semibold ${scanView ? "border-brand text-brand-text" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Escanear gabaritos</Link></nav>
    {scanView ? (examIds.length === 0 ? <EmptyState variant="notificacao" title="Nenhuma prova nesta turma" text="Atribua uma prova à turma antes de escanear cartões-resposta." /> : <ul className="flex list-none flex-col gap-2">{assignmentList.filter((assignment) => assignment.content_type === "EXAM").map((assignment) => <li key={assignment.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"><span className="font-semibold text-foreground">{titleFor(assignment)}</span><Link href={`/professor/correcao/escanear/${assignment.id}?turma=${classId}`} className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Escanear</Link></li>)}</ul>) : rows.length === 0 ? <EmptyState variant="notificacao" title={historyView ? "Nenhuma entrega corrigida" : "Fila vazia"} text={historyView ? "As entregas corrigidas desta turma aparecerão aqui." : "Os envios dos alunos desta turma aparecerão aqui."} /> : <div className="flex flex-col gap-5">{assignmentList.map((assignment) => { const groupRows = rows.filter((submission) => submission.assignment_id === assignment.id); if (groupRows.length === 0) return null; const totals = totalByAssignment.get(assignment.id) ?? { total: groupRows.length, pending: historyView ? 0 : groupRows.length }; const first = groupRows[0]; return <section key={assignment.id} className="rounded-xl border border-border bg-card p-4 sm:p-5"><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">{assignment.content_type === "EXAM" ? "Prova" : "Atividade"}</span><h2 className="truncate font-display text-lg font-bold text-foreground">{titleFor(assignment)}</h2></div><p className="mt-1 text-sm text-muted-foreground">{classroom.name} · {totals.total} entrega{totals.total === 1 ? "" : "s"} · {totals.pending} pendente{totals.pending === 1 ? "" : "s"}{assignment.due_at ? ` · prazo ${formatDate(assignment.due_at)}` : ""}</p></div>{!historyView && <Link href={`/professor/correcao/${first.id}?turma=${classId}`} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-sm bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Corrigir</Link>}</div><CorrectionQueue key={groupRows.map((submission) => submission.id).join(",")} items={groupRows.map((submission) => ({ id: submission.id, studentName: nameById.get(submission.student_id) || "Aluno", assignmentTitle: titleFor(assignment), eligible: !historyView, statusLabel: historyView ? `Corrigida${gradeBySubmission.has(submission.id) ? ` · Nota ${gradeBySubmission.get(submission.id)}` : ""}` : "Pendente", detailHref: `/professor/correcao/${submission.id}?turma=${classId}` }))} /></section>; })}</div>}
  </>;
}
