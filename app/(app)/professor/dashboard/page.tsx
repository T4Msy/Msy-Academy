import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

interface StudentStat {
  studentId: string;
  name: string;
  overdueCount: number;
  accuracyPct: number | null;
  atRisk: boolean;
}

async function computeClassStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  classId: string,
): Promise<StudentStat[]> {
  const now = new Date().toISOString();

  const [{ data: enrollments }, { data: assignments }] = await Promise.all([
    supabase.from("enrollments").select("student_id").eq("class_id", classId).eq("status", "ACTIVE"),
    supabase.from("assignments").select("id, due_at").eq("class_id", classId),
  ]);

  const studentIds = (enrollments ?? []).map((e) => e.student_id);
  if (studentIds.length === 0) return [];

  const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", studentIds);
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name || "Aluno"]));

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const overdueAssignmentIds = new Set((assignments ?? []).filter((a) => a.due_at && a.due_at < now).map((a) => a.id));

  const { data: submissions } = assignmentIds.length
    ? await supabase.from("submissions").select("id, assignment_id, student_id, status").in("assignment_id", assignmentIds)
    : { data: [] as { id: string; assignment_id: string; student_id: string; status: string }[] };

  const submissionIds = (submissions ?? []).map((s) => s.id);
  const { data: answers } = submissionIds.length
    ? await supabase.from("submission_answers").select("submission_id, is_correct").in("submission_id", submissionIds)
    : { data: [] as { submission_id: string; is_correct: boolean | null }[] };

  const submissionById = new Map((submissions ?? []).map((s) => [s.id, s]));

  return studentIds.map((studentId) => {
    const submitted = new Set(
      (submissions ?? []).filter((s) => s.student_id === studentId && s.status !== "PENDING").map((s) => s.assignment_id),
    );
    const overdueCount = [...overdueAssignmentIds].filter((aid) => !submitted.has(aid)).length;

    const studentAnswers = (answers ?? []).filter((a) => submissionById.get(a.submission_id)?.student_id === studentId && a.is_correct !== null);
    const correctCount = studentAnswers.filter((a) => a.is_correct).length;
    const accuracyPct = studentAnswers.length > 0 ? Math.round((correctCount / studentAnswers.length) * 100) : null;

    return {
      studentId,
      name: nameById.get(studentId) ?? "Aluno",
      overdueCount,
      accuracyPct,
      atRisk: overdueCount > 0 || (accuracyPct !== null && accuracyPct < 50),
    };
  });
}

export default async function ProfessorDashboardPage() {
  const supabase = await createClient();
  const { data: classes } = await supabase.from("classes").select("id, name").order("name");

  const classStats = await Promise.all(
    (classes ?? []).map(async (klass) => ({ klass, students: await computeClassStats(supabase, klass.id) })),
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Desempenho das turmas e alunos em risco.</p>
        </div>
      </div>

      {classStats.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">Sem turmas ainda</div>
          <p className="empty-text">Crie uma turma para ver o desempenho dos alunos aqui.</p>
        </div>
      ) : (
        <div className="questions-stack">
          {classStats.map(({ klass, students }) => (
            <section key={klass.id} className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <h2 className="card-title">{klass.name}</h2>
                  <span className="chip">{students.length} alunos</span>
                  {students.some((s) => s.atRisk) && (
                    <span className="chip" style={{ borderColor: "var(--danger-border)", background: "var(--danger-dim)", color: "#fca5a5" }}>
                      {students.filter((s) => s.atRisk).length} em risco
                    </span>
                  )}
                </div>
              </div>
              <div className="card-body">
                {students.length === 0 ? (
                  <p className="field-hint" style={{ marginTop: 0 }}>Nenhum aluno matriculado.</p>
                ) : (
                  <ul className="question-options-list">
                    {students.map((s) => (
                      <li key={s.studentId} className={`question-option${s.atRisk ? "" : " question-option--correct"}`}>
                        <b>{s.name}</b> — {s.accuracyPct !== null ? `${s.accuracyPct}% de acerto` : "sem dados"}
                        {s.overdueCount > 0 && ` · ${s.overdueCount} tarefa${s.overdueCount > 1 ? "s" : ""} atrasada${s.overdueCount > 1 ? "s" : ""}`}
                        {s.atRisk && (
                          <>
                            {" "}
                            <span aria-hidden="true">⚠</span>
                            <span className="visually-hidden"> (em risco)</span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
