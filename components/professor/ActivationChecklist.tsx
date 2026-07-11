import { createClient } from "@/lib/supabase/server";

/**
 * docs/07-ux-ui.md §7.6 — activation nudge for a brand-new professor. Pure
 * read: counts exams/classes/enrollments (all already RLS-scoped to the
 * caller's tenant). No dismiss state to persist — it just stops rendering
 * once all three steps are done.
 */
export async function ActivationChecklist() {
  const supabase = await createClient();

  const [{ count: examCount }, { data: classes }] = await Promise.all([
    supabase.from("exams").select("id", { count: "exact", head: true }),
    supabase.from("classes").select("id"),
  ]);

  const classIds = (classes ?? []).map((c) => c.id);
  const hasClass = classIds.length > 0;

  let hasEnrollment = false;
  if (hasClass) {
    const { count } = await supabase
      .from("enrollments")
      .select("class_id", { count: "exact", head: true })
      .in("class_id", classIds);
    hasEnrollment = (count ?? 0) > 0;
  }

  const hasExam = (examCount ?? 0) > 0;

  if (hasExam && hasClass && hasEnrollment) return null;

  const steps = [
    { done: hasExam, label: "Criar sua primeira prova", href: "/professor/provas/nova" },
    { done: hasClass, label: "Criar uma turma", href: "/professor/turmas" },
    { done: hasEnrollment, label: "Convidar um aluno", href: "/professor/turmas" },
  ];

  return (
    <section className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">
        <div className="card-title-group">
          <h2 className="card-title">Primeiros passos</h2>
        </div>
      </div>
      <div className="card-body">
        {steps.map((s) => (
          <a
            key={s.label}
            href={s.href}
            className="popover-item"
            style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: s.done ? "line-through" : "none", opacity: s.done ? 0.6 : 1 }}
          >
            <span aria-hidden="true">{s.done ? "✅" : "⬜"}</span>
            {s.label}
            <span className="visually-hidden">{s.done ? " (concluído)" : " (pendente)"}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
