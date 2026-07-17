const TYPE_LABEL: Record<string, string> = { MULTIPLA: "Múltipla escolha", VF: "Verdadeiro/Falso", DISCURSIVA: "Discursiva" };

export interface ResultQuestion {
  id: string;
  type: "MULTIPLA" | "VF" | "DISCURSIVA";
  statement: string;
  options: { id: string; text: string }[] | null;
  correct_answer: string | string[];
  explanation: string | null;
}

export interface AnswerRecord {
  answer: string;
  is_correct: boolean | null;
  score: number | null;
}

/** Post-submission read-only view: gabarito, correctness badges, explanation — shared by Tarefas and Simulados (RF-A05/A13). */
export function ResultsView({
  status,
  grade,
  questions,
  answersById,
}: {
  status: "SUBMITTED" | "GRADED";
  grade: { total_score: number; feedback: string | null } | null;
  questions: ResultQuestion[];
  answersById: Map<string, AnswerRecord>;
}) {
  return (
    <>
      {status === "GRADED" && grade && (
        <section className="card card--highlight mb-md" data-testid="submission-graded">
          <div className="flex flex-col gap-4.5 p-5.5">
            <div className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Nota: {grade.total_score}</div>
            {grade.feedback && <p className="field-hint mt-sm">{grade.feedback}</p>}
          </div>
        </section>
      )}
      {status === "SUBMITTED" && (
        <div data-testid="submission-submitted" className="mb-4 rounded-md border border-brand-border bg-brand-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-brand-text">
          Enviado! Questões discursivas aguardam correção do professor.
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        {questions.map((q, i) => {
          const a = answersById.get(q.id);
          return (
            <section key={q.id} className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2 py-[3px] font-display text-2xs font-bold tracking-[0.5px] uppercase text-muted-foreground">Questão {i + 1}</div>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{TYPE_LABEL[q.type]}</span>
                  {a?.is_correct === true && <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">Correta</span>}
                  {a?.is_correct === false && <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">Incorreta</span>}
                </div>
              </div>
              <div className="flex flex-col gap-4.5 p-5.5">
                <p className="mb-3.5 text-[14.5px] leading-relaxed text-foreground">{q.statement}</p>
                {q.type !== "DISCURSIVA" && q.options && (
                  <ul className="flex list-none flex-col gap-2">
                    {q.options.map((opt) => (
                      <li
                        key={opt.id}
                        className={`flex items-baseline gap-2 rounded-sm border px-3 py-[9px] text-[13.5px] ${opt.id === q.correct_answer ? "border-brand-border bg-brand-dim text-foreground" : "border-border text-muted-foreground"}`}
                      >
                        <span className="shrink-0 font-display font-bold text-brand-text">{opt.id}</span> {opt.text}
                        {a?.answer === opt.id && " (sua resposta)"}
                      </li>
                    ))}
                  </ul>
                )}
                {q.type === "DISCURSIVA" && (
                  <>
                    <p className="text-[13.5px] leading-relaxed text-muted-foreground"><b>Sua resposta:</b> {a?.answer}</p>
                    <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                      <b>Resposta de referência:</b> {Array.isArray(q.correct_answer) ? q.correct_answer.join(", ") : q.correct_answer}
                    </p>
                  </>
                )}
                {q.explanation && <p className="mt-1 text-xs leading-snug text-muted-foreground"><b>Explicação:</b> {q.explanation}</p>}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
