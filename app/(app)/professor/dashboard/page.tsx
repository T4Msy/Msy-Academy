import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { deriveClassStats } from "./deriveClassStats";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Desempenho das Turmas" };

/**
 * One batched round trip per table across ALL of the professor's classes,
 * instead of a 4-hop chain repeated per class (was 1+4N queries for N
 * classes, now a constant 4 here + the `classes` query in the page).
 * Grouping/derivation is pure — see deriveClassStats.ts.
 */
async function fetchClassStatsInputs(supabase: Awaited<ReturnType<typeof createClient>>, classIds: string[]) {
  if (classIds.length === 0) {
    return { enrollments: [], assignments: [], submissions: [], answers: [], profiles: [] };
  }

  const [{ data: enrollments }, { data: assignments }] = await Promise.all([
    supabase.from("enrollments").select("class_id, student_id").in("class_id", classIds).eq("status", "ACTIVE"),
    supabase.from("assignments").select("id, class_id, due_at").in("class_id", classIds),
  ]);

  const studentIds = [...new Set((enrollments ?? []).map((e) => e.student_id))];
  const assignmentIds = (assignments ?? []).map((a) => a.id);

  const [{ data: profiles }, { data: submissions }] = await Promise.all([
    studentIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", studentIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    assignmentIds.length
      ? supabase.from("submissions").select("id, assignment_id, student_id, status").in("assignment_id", assignmentIds)
      : Promise.resolve({ data: [] as { id: string; assignment_id: string; student_id: string; status: string }[] }),
  ]);

  const submissionIds = (submissions ?? []).map((s) => s.id);
  const { data: answers } = submissionIds.length
    ? await supabase.from("submission_answers").select("submission_id, is_correct").in("submission_id", submissionIds)
    : { data: [] as { submission_id: string; is_correct: boolean | null }[] };

  return {
    enrollments: enrollments ?? [],
    assignments: assignments ?? [],
    submissions: submissions ?? [],
    answers: answers ?? [],
    profiles: profiles ?? [],
  };
}

export default async function ProfessorDashboardPage() {
  const supabase = await createClient();
  const { data: classes } = await supabase.from("classes").select("id, name").order("name");
  const classList = classes ?? [];

  const { enrollments, assignments, submissions, answers, profiles } = await fetchClassStatsInputs(
    supabase,
    classList.map((c) => c.id),
  );
  const classStats = deriveClassStats(classList, enrollments, assignments, submissions, answers, profiles, new Date().toISOString());

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Desempenho das Turmas</h1>
          <p className="page-subtitle">Desempenho das turmas e alunos em risco.</p>
        </div>
      </div>

      {classStats.length === 0 ? (
        <EmptyState variant="turma" title="Sem turmas ainda" text="Crie uma turma para ver o desempenho dos alunos aqui." />
      ) : (
        <div className="questions-stack">
          {classStats.map(({ klass, students }) => (
            <section key={klass.id} className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <h2 className="card-title">{klass.name}</h2>
                  <span className="chip">{students.length} alunos</span>
                  {students.some((s) => s.atRisk) && (
                    <span className="chip" style={{ borderColor: "var(--danger-border)", background: "var(--danger-dim)", color: "var(--danger-text)" }}>
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
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <span>
                            <b>{s.name}</b>
                            {s.overdueCount > 0 && ` · ${s.overdueCount} tarefa${s.overdueCount > 1 ? "s" : ""} atrasada${s.overdueCount > 1 ? "s" : ""}`}
                            {s.atRisk && (
                              <>
                                {" "}
                                <span aria-hidden="true">⚠</span>
                                <span className="visually-hidden"> (em risco)</span>
                              </>
                            )}
                          </span>
                          <span style={{ color: "var(--fg-muted)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                            {s.accuracyPct !== null ? `${s.accuracyPct}%` : "sem dados"}
                          </span>
                        </div>
                        {s.accuracyPct !== null && (
                          <div className="usage-bar" style={{ marginTop: 6 }}>
                            <div
                              className={`usage-bar-fill${s.atRisk ? " usage-bar-fill--warn" : ""}`}
                              style={{ width: `${Math.max(4, s.accuracyPct)}%` }}
                            />
                          </div>
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
