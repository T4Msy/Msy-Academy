"use client";

import { EmptyState } from "@/components/EmptyState";
import { useClassStats } from "@/hooks/useClassStats";

/**
 * Metade client do piloto de hidratação: o primeiro render lê o cache
 * desidratado pelo prefetch do page.tsx (nada de spinner na primeira
 * pintura); depois o TanStack Query governa refetch/invalidação.
 * Markup idêntico ao page server-only anterior (classes do shell legado —
 * a conversão visual desta página acontece na Fase 2).
 */
export function DashboardContent() {
  const { data: classStats, isError } = useClassStats();

  if (isError) {
    return <p className="field-hint">Não foi possível carregar o desempenho das turmas.</p>;
  }
  if (!classStats) return null;

  if (classStats.length === 0) {
    return (
      <EmptyState
        variant="turma"
        title="Sem turmas ainda"
        text="Crie uma turma para ver o desempenho dos alunos aqui."
      />
    );
  }

  return (
    <div className="questions-stack">
      {classStats.map(({ klass, students }) => (
        <section key={klass.id} className="card">
          <div className="card-header">
            <div className="card-title-group">
              <h2 className="card-title">{klass.name}</h2>
              <span className="chip">{students.length} alunos</span>
              {students.some((s) => s.atRisk) && (
                <span className="chip chip--danger">{students.filter((s) => s.atRisk).length} em risco</span>
              )}
            </div>
          </div>
          <div className="card-body">
            {students.length === 0 ? (
              <p className="field-hint mt-0">Nenhum aluno matriculado.</p>
            ) : (
              <ul className="question-options-list">
                {students.map((s) => (
                  <li key={s.studentId} className={`question-option${s.atRisk ? "" : " question-option--correct"}`}>
                    <div className="row-between">
                      <span>
                        <b>{s.name}</b>
                        {s.overdueCount > 0 &&
                          ` · ${s.overdueCount} tarefa${s.overdueCount > 1 ? "s" : ""} atrasada${s.overdueCount > 1 ? "s" : ""}`}
                        {s.atRisk && (
                          <>
                            {" "}
                            <span aria-hidden="true">⚠</span>
                            <span className="visually-hidden"> (em risco)</span>
                          </>
                        )}
                      </span>
                      <span className="tabular-nums-muted">
                        {s.accuracyPct !== null ? `${s.accuracyPct}%` : "sem dados"}
                      </span>
                    </div>
                    {s.accuracyPct !== null && (
                      <div className="usage-bar usage-bar--tight">
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
  );
}
