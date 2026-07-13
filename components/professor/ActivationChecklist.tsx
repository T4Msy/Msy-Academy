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
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section className="card card--highlight activation-checklist">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Primeiros passos</h2>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{doneCount}/{steps.length}</span>
        </div>
      </div>
      <div className="flex flex-col p-5.5 gap-1.5">
        <div className="h-2 overflow-hidden rounded-full bg-[rgba(var(--overlay-rgb),0.06)]">
          <div className="h-full rounded-full bg-brand transition-[width] duration-[320ms]" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
        </div>
        {steps.map((s) => (
          <a
            key={s.label}
            href={s.href}
            className={`popover-item activation-step${s.done ? " is-done" : ""}`}
          >
            <span className={`activation-step-icon${s.done ? " activation-step-icon--done" : ""}`} aria-hidden="true">
              {s.done && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="activation-step-label">{s.label}</span>
            <span className="visually-hidden">{s.done ? " (concluído)" : " (pendente)"}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
