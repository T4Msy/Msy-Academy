import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RenameDeleteMenu } from "@/components/shell/RenameDeleteMenu";
import { AiBadge } from "@/components/AiBadge";
import { renameActivity, deleteActivity } from "./actions";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = { MULTIPLA: "Múltipla escolha", VF: "Verdadeiro/Falso", DISCURSIVA: "Discursiva" };
const DIFFICULTY_LABEL: Record<string, string> = { FACIL: "Fácil", MEDIO: "Médio", DIFICIL: "Difícil" };

export default async function AtividadePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: activity } = await supabase.from("activities").select("id, title, ai_provider, created_at").eq("id", id).single();
  if (!activity) notFound();

  const { data: items } = await supabase
    .from("activity_items")
    .select("position, questions(type, statement, options, correct_answer, difficulty)")
    .eq("activity_id", id)
    .order("position");

  const renameAction = renameActivity.bind(null, id);
  const deleteAction = deleteActivity.bind(null, id);

  return (
    <>
      <div className="page-head">
        <div>
          <Link href="/professor/biblioteca" className="sidebar-link" style={{ padding: "0 0 8px", display: "inline-block" }}>
            ← Biblioteca
          </Link>
          <h1 className="page-title">{activity.title}</h1>
          <div className="exam-meta">
            <span className="chip">{items?.length ?? 0} questões</span>
            {activity.ai_provider && <AiBadge />}
          </div>
        </div>
        <RenameDeleteMenu currentTitle={activity.title} onRename={renameAction} onDelete={deleteAction} redirectAfterDelete="/professor/biblioteca" />
      </div>

      <div className="questions-stack">
        {(items ?? []).map((item, i) => {
          const q = item.questions as unknown as {
            type: string; statement: string;
            options: { id: string; text: string }[] | null;
            correct_answer: string | string[]; difficulty: string;
          } | null;
          if (!q) return null;
          return (
            <section key={i} className="card question-card">
              <div className="card-header">
                <div className="card-title-group">
                  <div className="step-badge">Questão {i + 1}</div>
                  <span className="chip">{TYPE_LABEL[q.type] ?? q.type}</span>
                  <span className="chip">{DIFFICULTY_LABEL[q.difficulty] ?? q.difficulty}</span>
                </div>
              </div>
              <div className="card-body">
                <p className="question-statement">{q.statement}</p>
                {q.type !== "DISCURSIVA" && q.options && (
                  <ul className="question-options-list">
                    {q.options.map((opt) => (
                      <li key={opt.id} className={`question-option${opt.id === q.correct_answer ? " question-option--correct" : ""}`}>
                        <span className="question-option-id">{opt.id}</span> {opt.text}
                      </li>
                    ))}
                  </ul>
                )}
                {q.type === "DISCURSIVA" && (
                  <p className="question-reference-answer">
                    <b>Resposta de referência:</b> {Array.isArray(q.correct_answer) ? q.correct_answer.join(", ") : q.correct_answer}
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
