import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Correção" };

export default async function CorrecaoPage() {
  const supabase = await createClient();

  // RLS already scopes this to submissions of assignments the caller owns —
  // simulado-based submissions (assignment_id null) never match here, since
  // they have no owning class to check against (private student practice).
  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, student_id, submitted_at, assignment_id, assignments(content_type, content_id)")
    .eq("status", "SUBMITTED")
    .order("submitted_at", { ascending: true });

  const list = submissions ?? [];

  // Gabarito scans awaiting teacher review (already processed, detected
  // answers ready to confirm) or that failed to read — surfaced here so
  // correção has one single queue, not two separate places to check.
  const { data: scans } = await supabase
    .from("answer_sheet_scans")
    .select("id, assignment_id, status, created_at")
    .in("status", ["NEEDS_REVIEW", "FAILED"])
    .order("created_at", { ascending: true });
  const scanList = scans ?? [];
  const scanAssignmentIds = [...new Set(scanList.map((s) => s.assignment_id))];
  const { data: scanAssignments } = scanAssignmentIds.length
    ? await supabase.from("assignments").select("id, content_id").in("id", scanAssignmentIds)
    : { data: [] as { id: string; content_id: string }[] };
  const scanExamIds = [...new Set((scanAssignments ?? []).map((a) => a.content_id))];
  const { data: scanExams } = scanExamIds.length
    ? await supabase.from("exams").select("id, title").in("id", scanExamIds)
    : { data: [] as { id: string; title: string }[] };
  const examIdByAssignmentId = new Map((scanAssignments ?? []).map((a) => [a.id, a.content_id]));
  const examTitleByExamId = new Map((scanExams ?? []).map((e) => [e.id, e.title]));

  const studentIds = [...new Set(list.map((s) => s.student_id))];
  const { data: profiles } = studentIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", studentIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const examIds = list.filter((s: any) => s.assignments?.content_type === "EXAM").map((s: any) => s.assignments.content_id);
  const activityIds = list.filter((s: any) => s.assignments?.content_type === "ACTIVITY").map((s: any) => s.assignments.content_id);
  const [{ data: exams }, { data: activities }] = await Promise.all([
    examIds.length ? supabase.from("exams").select("id, title").in("id", examIds) : Promise.resolve({ data: [] }),
    activityIds.length ? supabase.from("activities").select("id, title").in("id", activityIds) : Promise.resolve({ data: [] }),
  ]);
  const examTitleById = new Map((exams ?? []).map((e: any) => [e.id, e.title]));
  const activityTitleById = new Map((activities ?? []).map((a: any) => [a.id, a.title]));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Correção</h1>
          {list.length > 0 && (
            <p className="mt-1 text-[13.5px] text-muted-foreground">{`${list.length} envio${list.length > 1 ? "s" : ""} aguardando correção`}</p>
          )}
        </div>
      </div>

      {scanList.length > 0 && (
        <div className="questions-stack mb-md">
          {scanList.map((s) => {
            const examId = examIdByAssignmentId.get(s.assignment_id);
            const title = examId ? examTitleByExamId.get(examId) : undefined;
            return (
              <Link key={s.id} href={`/professor/correcao/gabarito/${s.id}`} className="block overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
                <div className="flex flex-row items-center justify-between gap-3 p-5.5">
                  <div>
                    <div className="font-display text-base font-bold tracking-[-0.2px] text-foreground">Cartão-resposta escaneado</div>
                    <div className="mt-1 text-xs leading-snug text-muted-foreground">{title ?? "Prova"}</div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{s.status === "FAILED" ? "Falhou" : "Revisar"}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {list.length === 0 && scanList.length === 0 ? (
        <EmptyState variant="notificacao" title="Fila vazia" text="Envios com questões discursivas aparecem aqui para correção." />
      ) : (
        <div className="flex flex-col gap-3.5">
          {list.map((s: any) => {
            const title = s.assignments?.content_type === "EXAM" ? examTitleById.get(s.assignments.content_id) : activityTitleById.get(s.assignments?.content_id);
            return (
              <Link key={s.id} href={`/professor/correcao/${s.id}`} className="block overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
                <div className="flex flex-row items-center justify-between gap-3 p-5.5">
                  <div>
                    <div className="font-display text-base font-bold tracking-[-0.2px] text-foreground">{nameById.get(s.student_id) || "Aluno"}</div>
                    <div className="mt-1 text-xs leading-snug text-muted-foreground">{title ?? "Tarefa"}</div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">Pendente</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
