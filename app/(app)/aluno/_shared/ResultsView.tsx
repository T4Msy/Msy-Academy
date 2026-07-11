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
        <section className="card card--highlight" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <div className="card-title">Nota: {grade.total_score}</div>
            {grade.feedback && <p className="field-hint" style={{ marginTop: 8 }}>{grade.feedback}</p>}
          </div>
        </section>
      )}
      {status === "SUBMITTED" && (
        <div className="notice" style={{ marginBottom: 16 }}>
          Enviado! Questões discursivas aguardam correção do professor.
        </div>
      )}

      <div className="questions-stack">
        {questions.map((q, i) => {
          const a = answersById.get(q.id);
          return (
            <section key={q.id} className="card question-card">
              <div className="card-header">
                <div className="card-title-group">
                  <div className="step-badge">Questão {i + 1}</div>
                  <span className="chip">{TYPE_LABEL[q.type]}</span>
                  {a?.is_correct === true && <span className="chip">Correta</span>}
                  {a?.is_correct === false && <span className="chip">Incorreta</span>}
                </div>
              </div>
              <div className="card-body">
                <p className="question-statement">{q.statement}</p>
                {q.type !== "DISCURSIVA" && q.options && (
                  <ul className="question-options-list">
                    {q.options.map((opt) => (
                      <li
                        key={opt.id}
                        className={`question-option${opt.id === q.correct_answer ? " question-option--correct" : ""}`}
                      >
                        <span className="question-option-id">{opt.id}</span> {opt.text}
                        {a?.answer === opt.id && " (sua resposta)"}
                      </li>
                    ))}
                  </ul>
                )}
                {q.type === "DISCURSIVA" && (
                  <>
                    <p className="question-reference-answer"><b>Sua resposta:</b> {a?.answer}</p>
                    <p className="question-reference-answer">
                      <b>Resposta de referência:</b> {Array.isArray(q.correct_answer) ? q.correct_answer.join(", ") : q.correct_answer}
                    </p>
                  </>
                )}
                {q.explanation && <p className="field-hint"><b>Explicação:</b> {q.explanation}</p>}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
