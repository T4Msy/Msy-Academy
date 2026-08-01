import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import { removeStudentFromClass } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProfessorTurmaAlunosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: klass }, { data: enrollments }] = await Promise.all([
    supabase.from("classes").select("id, owner_id").eq("id", id).maybeSingle(),
    supabase.from("enrollments").select("student_id, status, created_at").eq("class_id", id).order("created_at"),
  ]);
  if (!klass || user?.id !== klass.owner_id) notFound();

  const activeEnrollments = (enrollments ?? []).filter((e) => e.status === "ACTIVE");
  // Sem FK direta entre enrollments e profiles (ambas referenciam auth.users
  // independentemente) — busca nomes em uma segunda query e junta em JS.
  const studentIds = activeEnrollments.map((e) => e.student_id);
  const { data: studentProfiles } = studentIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", studentIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((studentProfiles ?? []).map((p) => [p.id, p.full_name]));
  const students = activeEnrollments.map((e) => ({ ...e, full_name: nameById.get(e.student_id) ?? null }));

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="font-display text-lg font-bold tracking-[-0.2px] text-foreground">Alunos</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs whitespace-nowrap text-muted-foreground">
            {students.length}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-4.5 p-5.5">
        {students.length === 0 ? (
          <p className="mt-0 text-xs leading-snug text-muted-foreground">Nenhum aluno entrou ainda.</p>
        ) : (
          <ul className="flex list-none flex-col gap-2">
            {students.map((s) => (
              <li key={s.student_id} className="flex flex-col gap-2 rounded-sm border border-border px-3 py-[9px] text-[13.5px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>{s.full_name || "Aluno"}</span>
                <ConfirmActionButton
                  triggerLabel="Remover da turma"
                  title="Remover aluno da turma?"
                  description="A conta do aluno não será excluída. Apenas a matrícula nesta turma será removida."
                  confirmLabel="Remover"
                  pendingLabel="Removendo..."
                  successMessage="Aluno removido da turma."
                  action={removeStudentFromClass.bind(null, id, s.student_id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
