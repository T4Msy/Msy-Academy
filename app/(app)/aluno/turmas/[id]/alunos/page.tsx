import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

function initialsOf(name: string | null) {
  return (name ?? "?").trim().slice(0, 1).toUpperCase();
}

export default async function AlunoTurmaColegasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roster } = await supabase.rpc("class_roster", { p_class_id: id });
  const colegas = ((roster ?? []) as { user_id: string; full_name: string | null; role: string }[]).filter(
    (row) => row.role === "aluno" && row.user_id !== user.id,
  );

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4">
        <h2 className="font-display text-xl font-bold text-foreground">Colegas de turma</h2>
        <p className="mt-1 text-sm text-muted-foreground">Quem mais está matriculado nesta turma.</p>
      </div>
      {colegas.length === 0 ? (
        <EmptyState
          variant="turma"
          title="Nenhum colega por aqui ainda"
          text="Quando outros alunos entrarem nesta turma, eles aparecerão aqui."
        />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {colegas.map((colega) => (
            <li
              key={colega.user_id}
              className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2.5 text-sm text-foreground"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-dim text-xs font-semibold text-brand-text" aria-hidden>
                {initialsOf(colega.full_name)}
              </span>
              {colega.full_name ?? "Aluno"}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
