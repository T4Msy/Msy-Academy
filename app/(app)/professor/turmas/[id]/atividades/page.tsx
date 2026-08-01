import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssignContentForm } from "./AssignContentForm";
import { UnassignButton } from "./UnassignButton";
import { isAssessmentExpired } from "@/lib/assessments/deadline";
import { formatDateTime } from "@/lib/classes/format";

export const dynamic = "force-dynamic";

type CategoryFilter = "all" | "avaliacao" | "exercicio";
function parseCategory(value: string | undefined): CategoryFilter {
  return value === "avaliacao" || value === "exercicio" ? value : "all";
}
const CATEGORY_LABEL: Record<CategoryFilter, string> = { all: "Todas", avaliacao: "Avaliações", exercicio: "Exercícios" };

export default async function ProfessorTurmaAtividadesPage({
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

  let assignmentsQuery = supabase.from("assignments").select("id, content_type, content_id, due_at, created_at, content_category").eq("class_id", id).is("deleted_at", null).order("created_at", { ascending: false });
  if (moduleId) assignmentsQuery = assignmentsQuery.eq("module_id", moduleId);
  if (category !== "all") assignmentsQuery = assignmentsQuery.eq("content_category", category);

  // assignmentsQuery não depende de nada das outras 5 — roda na mesma leva
  // em vez de esperar o Promise.all terminar para só então começar.
  const [{ data: klass }, { data: ownedClasses }, { data: exams }, { data: activities }, { data: modules }, { data: assignments }] =
    await Promise.all([
      supabase.from("classes").select("id, owner_id").eq("id", id).maybeSingle(),
      supabase.from("classes").select("id, name").order("name"),
      supabase.from("exams").select("id, title").order("created_at", { ascending: false }),
      supabase.from("activities").select("id, title").order("created_at", { ascending: false }),
      supabase.from("class_modules").select("id, name").eq("class_id", id).is("deleted_at", null).order("position"),
      assignmentsQuery,
    ]);
  if (!klass || user?.id !== klass.owner_id) notFound();

  const allClassIds = (ownedClasses ?? []).map((c) => c.id);
  const { data: allEnrollments } = allClassIds.length
    ? await supabase.from("enrollments").select("class_id, student_id").in("class_id", allClassIds).eq("status", "ACTIVE")
    : { data: [] as { class_id: string; student_id: string }[] };
  const allStudentIds = [...new Set((allEnrollments ?? []).map((e) => e.student_id))];
  const { data: allProfiles } = allStudentIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", allStudentIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const allNameById = new Map((allProfiles ?? []).map((p) => [p.id, p.full_name]));
  const studentsByClass = (allEnrollments ?? []).reduce<Record<string, { id: string; name: string | null }[]>>((map, enrollment) => {
    (map[enrollment.class_id] ??= []).push({ id: enrollment.student_id, name: allNameById.get(enrollment.student_id) ?? null });
    return map;
  }, {});

  const examTitleById = new Map((exams ?? []).map((e) => [e.id, e.title]));
  const activityTitleById = new Map((activities ?? []).map((a) => [a.id, a.title]));

  const queryString = (next: CategoryFilter) => {
    const params = new URLSearchParams();
    if (moduleId) params.set("modulo", moduleId);
    if (next !== "all") params.set("categoria", next);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="font-display text-lg font-bold tracking-[-0.2px] text-foreground">Atividades</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs whitespace-nowrap text-muted-foreground">
            {assignments?.length ?? 0}
          </span>
          <div className="flex gap-1.5">
            {(["all", "avaliacao", "exercicio"] as const).map((key) => (
              <Link key={key} href={`.${queryString(key)}`} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${category === key ? "bg-brand-dim text-brand-text" : "border border-border text-muted-foreground hover:bg-card-2"}`}>
                {CATEGORY_LABEL[key]}
              </Link>
            ))}
          </div>
        </div>
        <AssignContentForm
          classId={id}
          classes={(ownedClasses ?? []).map((c) => ({ id: c.id, name: c.name }))}
          studentsByClass={studentsByClass}
          exams={(exams ?? []).map((e) => ({ id: e.id, title: e.title }))}
          activities={(activities ?? []).map((a) => ({ id: a.id, title: a.title }))}
          modules={(modules ?? []).map((m) => ({ id: m.id, name: m.name }))}
        />
      </div>
      <div className="flex flex-col gap-4.5 p-5.5">
        {(assignments ?? []).length === 0 ? (
          <p className="mt-0 text-xs leading-snug text-muted-foreground">Nenhuma prova ou atividade atribuída ainda.</p>
        ) : (
          <ul className="flex list-none flex-col gap-2">
            {(assignments ?? []).map((a) => {
              const title = a.content_type === "EXAM" ? examTitleById.get(a.content_id) : activityTitleById.get(a.content_id);
              return (
                <li key={a.id} className="flex flex-col gap-2 rounded-sm border border-border px-3 py-[9px] text-[13.5px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0 break-words">
                    <span className="mr-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs whitespace-nowrap text-muted-foreground">
                      {a.content_type === "EXAM" ? "Prova" : "Atividade"}
                    </span>
                    {a.content_category === "exercicio" && (
                      <span className="mr-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs whitespace-nowrap text-muted-foreground">
                        Exercício
                      </span>
                    )}
                    {isAssessmentExpired(a.due_at) && (
                      <span className="mr-2 inline-flex items-center gap-1.5 rounded-full border border-danger-border bg-danger-dim px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-danger-text">
                        Encerrada
                      </span>
                    )}
                    {title ?? "(conteúdo removido)"} — {formatDateTime(a.due_at)}
                  </span>
                  <span className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {a.content_type === "EXAM" && (
                      <>
                        <a href={`/api/gabarito/${a.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.06)] px-3 py-[7px] text-md text-sm font-semibold whitespace-nowrap text-foreground transition-all outline-none hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50">
                          Baixar gabarito
                        </a>
                        <Link href={`/professor/correcao/turma/${id}?view=scan`} className="inline-flex items-center justify-center gap-2 rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.06)] px-3 py-[7px] text-md text-sm font-semibold whitespace-nowrap text-foreground transition-all outline-none hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50">
                          Escanear
                        </Link>
                      </>
                    )}
                    <UnassignButton classId={id} assignmentId={a.id} />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
