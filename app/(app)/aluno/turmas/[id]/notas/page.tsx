import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { NotasFilterBar, type NotaAvaliacaoOption } from "@/components/classes/NotasFilterBar";
import { formatDate } from "@/lib/classes/format";

export const dynamic = "force-dynamic";

type GradeRow = {
  submission_id: string;
  assignment_id: string;
  module_id: string | null;
  content_type: "EXAM" | "ACTIVITY";
  content_category: string;
  title: string | null;
  due_at: string | null;
  submitted_at: string | null;
  total_score: number | null;
};

export default async function AlunoTurmaNotasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ modulo?: string; avaliacao?: string; mes?: string; ano?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.rpc("class_grade_report", {
    p_class_id: id,
    p_student_id: user.id,
  });
  const allRows = (data ?? []) as GradeRow[];

  const avaliacoes: NotaAvaliacaoOption[] = Array.from(new Map(allRows.map((row) => [row.assignment_id, row])).values()).map((row) => ({
    id: row.assignment_id,
    title: row.title ?? (row.content_type === "EXAM" ? "Prova" : "Atividade"),
    kind: row.content_type,
  }));
  const years = [...new Set(allRows.map((row) => new Date(row.submitted_at ?? row.due_at ?? "").getFullYear()).filter((y) => Number.isFinite(y)))].sort((a, b) => b - a);

  const rows = allRows.filter((row) => {
    if (sp.modulo && row.module_id !== sp.modulo) return false;
    if (sp.avaliacao && row.assignment_id !== sp.avaliacao) return false;
    const referenceDate = row.submitted_at ?? row.due_at;
    if (sp.mes || sp.ano) {
      if (!referenceDate) return false;
      const date = new Date(referenceDate);
      if (sp.mes && date.getMonth() + 1 !== Number(sp.mes)) return false;
      if (sp.ano && date.getFullYear() !== Number(sp.ano)) return false;
    }
    return true;
  });

  const graded = rows.filter((row) => row.total_score !== null);
  const average = graded.length ? graded.reduce((sum, row) => sum + (row.total_score ?? 0), 0) / graded.length : null;

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Notas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Suas notas nesta turma.</p>
        </div>
        {average !== null && (
          <p className="text-sm text-muted-foreground">
            Média nesta seleção: <span className="font-bold text-foreground">{average.toFixed(1)}</span>
          </p>
        )}
      </div>

      <NotasFilterBar avaliacoes={avaliacoes} years={years} />

      {rows.length === 0 && allRows.length === 0 ? (
        <EmptyState variant="tarefa" title="Você ainda não tem notas nesta turma" text="As notas aparecem aqui conforme o professor for corrigindo." />
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma nota encontrada com esses filtros.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.submission_id}>
              <Link
                href={`/aluno/tarefas/${row.assignment_id}`}
                className="flex flex-col gap-1 rounded-md border border-border p-3 transition hover:bg-card-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Badge variant="outline">{row.content_type === "EXAM" ? "Prova" : "Atividade"}</Badge>
                  <span className="truncate text-sm font-semibold text-foreground">
                    {row.title ?? "(conteúdo removido)"} — {formatDate(row.submitted_at ?? row.due_at)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold text-foreground">
                  {row.total_score !== null ? row.total_score : "Aguardando correção"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
