import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { CorrectionQueue } from "./CorrectionQueue";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Correção" };

type SubmissionRow = {
  id: string;
  student_id: string;
  assignments: { content_type: "EXAM" | "ACTIVITY"; content_id: string } | null;
};

export default async function CorrecaoPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const historyView = view === "history";
  const supabase = await createClient();
  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, student_id, submitted_at, assignment_id, assignments(content_type, content_id)")
    .eq("status", historyView ? "GRADED" : "SUBMITTED")
    .order("submitted_at", { ascending: !historyView });
  const list = submissions ?? [];

  const { data: scans } = !historyView
    ? await supabase.from("answer_sheet_scans").select("id, assignment_id, status, created_at").in("status", ["NEEDS_REVIEW", "FAILED"]).order("created_at", { ascending: true })
    : { data: [] as { id: string; assignment_id: string; status: "NEEDS_REVIEW" | "FAILED"; created_at: string }[] };
  const scanList = scans ?? [];
  const scanAssignmentIds = [...new Set(scanList.map((scan) => scan.assignment_id))];
  const { data: scanAssignments } = scanAssignmentIds.length ? await supabase.from("assignments").select("id, content_id").in("id", scanAssignmentIds) : { data: [] as { id: string; content_id: string }[] };
  const scanExamIds = [...new Set((scanAssignments ?? []).map((assignment) => assignment.content_id))];
  const { data: scanExams } = scanExamIds.length ? await supabase.from("exams").select("id, title").in("id", scanExamIds) : { data: [] as { id: string; title: string }[] };
  const examIdByAssignmentId = new Map((scanAssignments ?? []).map((assignment) => [assignment.id, assignment.content_id]));
  const examTitleByExamId = new Map((scanExams ?? []).map((exam) => [exam.id, exam.title]));

  const submissionIds = list.map((submission) => submission.id);
  const { data: grades } = submissionIds.length ? await supabase.from("grades").select("submission_id, total_score").in("submission_id", submissionIds) : { data: [] as { submission_id: string; total_score: number }[] };
  const gradeBySubmission = new Map((grades ?? []).map((grade) => [grade.submission_id, grade.total_score]));
  const studentIds = [...new Set(list.map((submission) => submission.student_id))];
  const { data: profiles } = studentIds.length ? await supabase.from("profiles").select("id, full_name").in("id", studentIds) : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));

  const rows = list as unknown as SubmissionRow[];
  const examIds = rows.filter((submission) => submission.assignments?.content_type === "EXAM").map((submission) => submission.assignments!.content_id);
  const activityIds = rows.filter((submission) => submission.assignments?.content_type === "ACTIVITY").map((submission) => submission.assignments!.content_id);
  const [{ data: exams }, { data: activities }] = await Promise.all([
    examIds.length ? supabase.from("exams").select("id, title").in("id", examIds) : Promise.resolve({ data: [] }),
    activityIds.length ? supabase.from("activities").select("id, title").in("id", activityIds) : Promise.resolve({ data: [] }),
  ]);
  const examTitleById = new Map((exams ?? []).map((exam: { id: string; title: string }) => [exam.id, exam.title]));
  const activityTitleById = new Map((activities ?? []).map((activity: { id: string; title: string }) => [activity.id, activity.title]));

  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Correção</h1><p className="mt-1 text-[13.5px] text-muted-foreground">{historyView ? `${list.length} envio${list.length !== 1 ? "s" : ""} corrigido${list.length !== 1 ? "s" : ""}` : `${list.length} envio${list.length !== 1 ? "s" : ""} aguardando correção`}</p></div></div>
    <nav aria-label="Filtro de correção" className="mb-5 flex gap-2 border-b border-border"><Link href="/professor/correcao" className={`border-b-2 px-3 py-2 text-sm font-semibold ${!historyView ? "border-brand text-brand-text" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Pendentes</Link><Link href="/professor/correcao?view=history" className={`border-b-2 px-3 py-2 text-sm font-semibold ${historyView ? "border-brand text-brand-text" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Histórico</Link></nav>
    {scanList.length > 0 && <div className="questions-stack mb-md">{scanList.map((scan) => { const examId = examIdByAssignmentId.get(scan.assignment_id); return <Link key={scan.id} href={`/professor/correcao/gabarito/${scan.id}`} className="block overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors"><div className="flex flex-row items-center justify-between gap-3 p-5.5"><div><div className="font-display text-base font-bold tracking-[-0.2px] text-foreground">Cartão-resposta escaneado</div><div className="mt-1 text-xs leading-snug text-muted-foreground">{examId ? examTitleByExamId.get(examId) : "Prova"}</div></div><span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{scan.status === "FAILED" ? "Falhou" : "Revisar"}</span></div></Link>; })}</div>}
    {list.length === 0 && scanList.length === 0 ? <EmptyState variant="notificacao" title={historyView ? "Histórico vazio" : "Fila vazia"} text={historyView ? "Entregas corrigidas aparecerão aqui para consulta." : "Envios com questões discursivas aparecem aqui para correção."} /> : <CorrectionQueue key={rows.map((submission) => submission.id).join(",")} items={rows.map((submission) => ({ id: submission.id, studentName: nameById.get(submission.student_id) || "Aluno", assignmentTitle: submission.assignments?.content_type === "EXAM" ? examTitleById.get(submission.assignments.content_id) ?? "Prova" : activityTitleById.get(submission.assignments?.content_id ?? "") ?? "Tarefa", eligible: !historyView, statusLabel: historyView ? `Corrigida${gradeBySubmission.has(submission.id) ? ` · Nota ${gradeBySubmission.get(submission.id)}` : ""}` : "Pendente" }))} />}
  </>;
}
