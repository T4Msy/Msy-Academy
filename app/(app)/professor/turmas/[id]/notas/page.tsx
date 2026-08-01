import Link from "next/link";
import { notFound } from "next/navigation";
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

export default async function ProfessorTurmaNotasPage({
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

  const { data: klass } = await supabase.from("classes").select("id, owner_id").eq("id", id).maybeSingle();
  if (!klass || user?.id !== klass.owner_id) notFound();

  const { data } = await supabase.rpc("class_grade_report", { p_class_id: id });
  const allRows = (data ?? []) as GradeRow[];

  const avaliacoes: NotaAvaliacaoOption[] = Array.from(new Map(allRows.map((row) => [row.assignment_id, row])).values()).map((row) => ({
    id: row.assignment_id,
    title: row.title ?? (row.content_type === "EXAM" ? "Prova" : "Atividade"),
    kind: row.content_type,
  }));
  const years = [...new Set(allRows.map((row) => new Date(row.submitted_at ?? row.due_at ?? "").getFullYear()).filter((y) => Number.isFinite(y)))].sort((a, b) => b - a);

  const filtered = allRows.filter((row) => {
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

  const byAssignment = new Map<string, { title: string; contentType: "EXAM" | "ACTIVITY"; dueAt: string | null; scores: number[]; total: number }>();
  for (const row of filtered) {
    const entry = byAssignment.get(row.assignment_id) ?? {
      title: row.title ?? (row.content_type === "EXAM" ? "Prova" : "Atividade"),
      contentType: row.content_type,
      dueAt: row.due_at,
      scores: [],
      total: 0,
    };
    entry.total += 1;
    if (row.total_score !== null) entry.scores.push(row.total_score);
    byAssignment.set(row.assignment_id, entry);
  }
  const summaries = [...byAssignment.entries()].sort((a, b) => new Date(b[1].dueAt ?? "").getTime() - new Date(a[1].dueAt ?? "").getTime());

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4">
        <h2 className="font-display text-xl font-bold text-foreground">Notas</h2>
        <p className="mt-1 text-sm text-muted-foreground">Desempenho da turma por avaliação.</p>
      </div>

      <NotasFilterBar avaliacoes={avaliacoes} years={years} />

      {summaries.length === 0 ? (
        allRows.length === 0 ? (
          <EmptyState variant="tarefa" title="Nenhuma nota registrada ainda" text="As notas aparecem aqui conforme os alunos forem corrigidos." />
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma nota encontrada com esses filtros.</p>
        )
      ) : (
        <ul className="space-y-2">
          {summaries.map(([assignmentId, entry]) => {
            const average = entry.scores.length ? entry.scores.reduce((sum, s) => sum + s, 0) / entry.scores.length : null;
            return (
              <li key={assignmentId}>
                <Link
                  href={`/professor/correcao/turma/${id}`}
                  className="flex flex-col gap-1 rounded-md border border-border p-3 transition hover:bg-card-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Badge variant="outline">{entry.contentType === "EXAM" ? "Prova" : "Atividade"}</Badge>
                    <span className="truncate text-sm font-semibold text-foreground">{entry.title} — {formatDate(entry.dueAt)}</span>
                  </span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {entry.scores.length}/{entry.total} corrigidas
                    {average !== null && <span className="ml-2 font-bold text-foreground">Média {average.toFixed(1)}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
