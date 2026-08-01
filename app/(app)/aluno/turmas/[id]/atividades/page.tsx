import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { isAssessmentExpired } from "@/lib/assessments/deadline";
import { formatDate } from "@/lib/classes/format";

export const dynamic = "force-dynamic";

type CategoryFilter = "all" | "avaliacao" | "exercicio";
function parseCategory(value: string | undefined): CategoryFilter {
  return value === "avaliacao" || value === "exercicio" ? value : "all";
}

const CATEGORY_LABEL: Record<CategoryFilter, string> = {
  all: "Todas",
  avaliacao: "Avaliações",
  exercicio: "Exercícios",
};

export default async function AlunoTurmaAtividadesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ modulo?: string; categoria?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const moduleId = sp.modulo;
  const category = parseCategory(sp.categoria);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let query = supabase
    .from("assignments")
    .select("id, content_type, content_id, due_at, content_category")
    .eq("class_id", id)
    .is("deleted_at", null)
    .order("due_at", { ascending: true, nullsFirst: false });
  if (moduleId) query = query.eq("module_id", moduleId);
  if (category !== "all") query = query.eq("content_category", category);
  const { data: assignments } = await query;
  const rows = assignments ?? [];

  const examIds = rows.filter((item) => item.content_type === "EXAM").map((item) => item.content_id);
  const activityIds = rows.filter((item) => item.content_type === "ACTIVITY").map((item) => item.content_id);
  const assignmentIds = rows.map((item) => item.id);
  const [{ data: exams }, { data: activities }, { data: submissions }] = await Promise.all([
    examIds.length ? supabase.from("exams").select("id, title").in("id", examIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    activityIds.length ? supabase.from("activities").select("id, title").in("id", activityIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    assignmentIds.length ? supabase.from("submissions").select("id, assignment_id, status").eq("student_id", user.id).in("assignment_id", assignmentIds) : Promise.resolve({ data: [] as { id: string; assignment_id: string; status: string }[] }),
  ]);
  const examTitleById = new Map((exams ?? []).map((item) => [item.id, item.title]));
  const activityTitleById = new Map((activities ?? []).map((item) => [item.id, item.title]));
  const submissionByAssignment = new Map((submissions ?? []).map((submission) => [submission.assignment_id, submission]));
  const titleFor = (item: { content_type: "EXAM" | "ACTIVITY"; content_id: string }) =>
    item.content_type === "EXAM" ? examTitleById.get(item.content_id) ?? "Prova" : activityTitleById.get(item.content_id) ?? "Atividade";

  const queryString = (next: CategoryFilter) => {
    const params = new URLSearchParams();
    if (moduleId) params.set("modulo", moduleId);
    if (next !== "all") params.set("categoria", next);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Atividades da turma</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tudo que precisa ser feito nesta disciplina, em ordem de prazo.</p>
        </div>
        <div className="flex gap-1.5">
          {(["all", "avaliacao", "exercicio"] as const).map((key) => (
            <Link
              key={key}
              href={`.${queryString(key)}`}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                category === key ? "bg-brand-dim text-brand-text" : "border border-border text-muted-foreground hover:bg-card-2"
              }`}
            >
              {CATEGORY_LABEL[key]}
            </Link>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          variant="tarefa"
          title="Nenhuma atividade com esse filtro"
          text="Quando o professor publicar atividades ou provas, elas aparecerão aqui."
        />
      ) : (
        <div className="space-y-2">
          {rows.map((item) => {
            const status = submissionByAssignment.get(item.id)?.status;
            return (
              <Link key={item.id} href={`/aluno/tarefas/${item.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3 transition hover:bg-card-2">
                <span className="flex min-w-0 items-center gap-2">
                  <Badge variant="outline">{item.content_type === "EXAM" ? "Prova" : "Atividade"}</Badge>
                  {item.content_category === "exercicio" && <Badge variant="secondary">Exercício</Badge>}
                  <span className="truncate text-sm font-semibold text-foreground">{titleFor(item)}</span>
                </span>
                <span className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{status && status !== "PENDING" ? "Concluída" : isAssessmentExpired(item.due_at) ? "Encerrada" : formatDate(item.due_at)}</span>
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
