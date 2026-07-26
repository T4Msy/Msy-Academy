import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { CorrectionQueue } from "../../CorrectionQueue";

type SubmissionRow = { id: string; student_id: string; assignments: { content_type: "EXAM" | "ACTIVITY"; content_id: string } | null };

export const dynamic = "force-dynamic";

export default async function TurmaCorrecaoPage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ view?: string }> }) {
  const [{ classId }, { view }] = await Promise.all([params, searchParams]);
  const historyView = view === "history";
  const scanView = view === "scan";
  const supabase = await createClient();
  const { data: classroom } = await supabase.from("classes").select("id, name").eq("id", classId).maybeSingle();
  if (!classroom) notFound();
  const { data: assignments } = await supabase.from("assignments").select("id, content_type, content_id").eq("class_id", classId).order("created_at", { ascending: false });
  const assignmentList = assignments ?? [];
  const assignmentIds = assignmentList.map((assignment) => assignment.id);
  const { data: submissions } = !scanView && assignmentIds.length ? await supabase.from("submissions").select("id, student_id, assignment_id, submitted_at, assignments(content_type, content_id)").in("assignment_id", assignmentIds).eq("status", historyView ? "GRADED" : "SUBMITTED").order("submitted_at", { ascending: !historyView }) : { data: [] };
  const list = submissions ?? [];
  const rows = list as unknown as SubmissionRow[];
  const submissionIds = rows.map((submission) => submission.id);
  const [{ data: grades }, { data: profiles }] = await Promise.all([
    submissionIds.length ? supabase.from("grades").select("submission_id, total_score").in("submission_id", submissionIds) : Promise.resolve({ data: [] }),
    rows.length ? supabase.from("profiles").select("id, full_name").in("id", [...new Set(rows.map((submission) => submission.student_id))]) : Promise.resolve({ data: [] }),
  ]);
  const gradeBySubmission = new Map((grades ?? []).map((grade) => [grade.submission_id, grade.total_score]));
  const nameById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
  const examIds = assignmentList.filter((assignment) => assignment.content_type === "EXAM").map((assignment) => assignment.content_id);
  const activityIds = assignmentList.filter((assignment) => assignment.content_type === "ACTIVITY").map((assignment) => assignment.content_id);
  const [{ data: exams }, { data: activities }] = await Promise.all([
    examIds.length ? supabase.from("exams").select("id, title").in("id", examIds) : Promise.resolve({ data: [] }),
    activityIds.length ? supabase.from("activities").select("id, title").in("id", activityIds) : Promise.resolve({ data: [] }),
  ]);
  const examTitleById = new Map((exams ?? []).map((exam: { id: string; title: string }) => [exam.id, exam.title]));
  const activityTitleById = new Map((activities ?? []).map((activity: { id: string; title: string }) => [activity.id, activity.title]));

  return <>
    <div className="mb-6"><Link href="/professor/correcao" className="text-sm text-muted-foreground hover:text-foreground">← Todas as turmas</Link><h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Correção · {classroom.name}</h1><p className="mt-1 text-[13.5px] text-muted-foreground">{scanView ? "Escolha uma prova para escanear os cartões-resposta." : historyView ? `${rows.length} entrega(s) corrigida(s)` : `${rows.length} entrega(s) aguardando correção`}</p></div>
    <nav aria-label="Seções da correção" className="mb-5 flex gap-2 border-b border-border"><Link href={`/professor/correcao/turma/${classId}`} className={`border-b-2 px-3 py-2 text-sm font-semibold ${!historyView && !scanView ? "border-brand text-brand-text" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Pendentes</Link><Link href={`/professor/correcao/turma/${classId}?view=history`} className={`border-b-2 px-3 py-2 text-sm font-semibold ${historyView ? "border-brand text-brand-text" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Corrigidas</Link><Link href={`/professor/correcao/turma/${classId}?view=scan`} className={`border-b-2 px-3 py-2 text-sm font-semibold ${scanView ? "border-brand text-brand-text" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Escanear gabaritos</Link></nav>
    {scanView ? (examIds.length === 0 ? <EmptyState variant="notificacao" title="Nenhuma prova nesta turma" text="Atribua uma prova à turma antes de escanear cartões-resposta." /> : <ul className="flex list-none flex-col gap-2">{assignmentList.filter((assignment) => assignment.content_type === "EXAM").map((assignment) => <li key={assignment.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"><span className="font-semibold text-foreground">{examTitleById.get(assignment.content_id) ?? "Prova"}</span><Link href={`/professor/correcao/escanear/${assignment.id}?turma=${classId}`} className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Escanear</Link></li>)}</ul>) : rows.length === 0 ? <EmptyState variant="notificacao" title={historyView ? "Nenhuma entrega corrigida" : "Fila vazia"} text={historyView ? "As entregas corrigidas desta turma aparecerão aqui." : "Os envios dos alunos desta turma aparecerão aqui."} /> : <CorrectionQueue key={rows.map((submission) => submission.id).join(",")} items={rows.map((submission) => ({ id: submission.id, studentName: nameById.get(submission.student_id) || "Aluno", assignmentTitle: submission.assignments?.content_type === "EXAM" ? examTitleById.get(submission.assignments.content_id) ?? "Prova" : activityTitleById.get(submission.assignments?.content_id ?? "") ?? "Atividade", eligible: !historyView, statusLabel: historyView ? `Corrigida${gradeBySubmission.has(submission.id) ? ` · Nota ${gradeBySubmission.get(submission.id)}` : ""}` : "Pendente", detailHref: `/professor/correcao/${submission.id}?turma=${classId}` }))} />}
  </>;
}
