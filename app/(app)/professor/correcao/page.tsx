import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

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
      <div className="page-head">
        <div>
          <h1 className="page-title">Correção</h1>
          <p className="page-subtitle">
            {list.length > 0 ? `${list.length} envio${list.length > 1 ? "s" : ""} aguardando correção` : "Nenhum envio pendente."}
          </p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">Fila vazia</div>
          <p className="empty-text">Envios com questões discursivas aparecem aqui para correção.</p>
        </div>
      ) : (
        <div className="questions-stack">
          {list.map((s: any) => {
            const title = s.assignments?.content_type === "EXAM" ? examTitleById.get(s.assignments.content_id) : activityTitleById.get(s.assignments?.content_id);
            return (
              <Link key={s.id} href={`/professor/correcao/${s.id}`} className="card question-card" style={{ display: "block" }}>
                <div className="card-body" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div className="exam-card-title">{nameById.get(s.student_id) || "Aluno"}</div>
                    <div className="field-hint" style={{ marginTop: 4 }}>{title ?? "Tarefa"}</div>
                  </div>
                  <span className="chip">Pendente</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
