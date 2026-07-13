import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AssignContentForm } from "./AssignContentForm";
import { UnassignButton } from "./UnassignButton";

export const dynamic = "force-dynamic";

function formatDueDate(iso: string | null): string {
  if (!iso) return "Sem prazo";
  try {
    return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default async function TurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: klass }, { data: enrollments }, { data: exams }, { data: activities }, { data: assignments }] = await Promise.all([
    supabase.from("classes").select("id, name, invite_code, created_at").eq("id", id).single(),
    supabase.from("enrollments").select("student_id, status, created_at").eq("class_id", id).order("created_at"),
    supabase.from("exams").select("id, title").order("created_at", { ascending: false }),
    supabase.from("activities").select("id, title").order("created_at", { ascending: false }),
    supabase
      .from("assignments")
      .select("id, content_type, content_id, due_at, created_at")
      .eq("class_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!klass) notFound();

  const activeEnrollments = (enrollments ?? []).filter((e) => e.status === "ACTIVE");

  // No direct FK between enrollments and profiles (both reference auth.users
  // independently, not each other), so PostgREST can't auto-embed profiles
  // here — fetch names in a second query and merge in JS.
  const studentIds = activeEnrollments.map((e) => e.student_id);
  const { data: studentProfiles } = studentIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", studentIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((studentProfiles ?? []).map((p) => [p.id, p.full_name]));
  const students = activeEnrollments.map((e) => ({ ...e, full_name: nameById.get(e.student_id) ?? null }));

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const inviteUrl = `${origin}/entrar/${klass.invite_code}`;

  const examTitleById = new Map((exams ?? []).map((e) => [e.id, e.title]));
  const activityTitleById = new Map((activities ?? []).map((a) => [a.id, a.title]));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/professor/turmas" className="inline-flex items-center gap-2 pb-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            ← Turmas
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">{klass.name}</h1>
        </div>
      </div>

      <section className="mb-4 overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Convidar alunos</h2>
          </div>
        </div>
        <div className="flex flex-col gap-4.5 p-5.5">
          <p className="mt-0 text-xs leading-snug text-muted-foreground">
            Compartilhe o código com a turma — cada aluno entra em <b>Entrar em turma</b> ou acessando o link direto.
          </p>
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs border-border bg-[rgba(var(--overlay-rgb),0.03)] font-display text-base font-bold text-muted-foreground">{klass.invite_code}</span>
          </div>
          {origin && <p className="mt-1 text-xs leading-snug text-muted-foreground">{inviteUrl}</p>}
        </div>
      </section>

      <section className="mb-4 overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Alunos</h2>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{students.length}</span>
          </div>
        </div>
        <div className="flex flex-col gap-4.5 p-5.5">
          {students.length === 0 ? (
            <p className="mt-0 text-xs leading-snug text-muted-foreground">Nenhum aluno entrou ainda.</p>
          ) : (
            <ul className="flex list-none flex-col gap-2">
              {students.map((s) => (
                <li key={s.student_id} className="flex items-baseline gap-2 rounded-sm border px-3 py-[9px] text-[13.5px] border-border text-muted-foreground">
                  {s.full_name || "Aluno"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Atribuições</h2>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{assignments?.length ?? 0}</span>
          </div>
          <AssignContentForm
            classId={id}
            exams={(exams ?? []).map((e) => ({ id: e.id, title: e.title }))}
            activities={(activities ?? []).map((a) => ({ id: a.id, title: a.title }))}
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
                  <li key={a.id} className="flex items-center justify-between gap-2 rounded-sm border border-border px-3 py-[9px] text-[13.5px] text-muted-foreground">
                    <span>
                      <span className="mr-2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{a.content_type === "EXAM" ? "Prova" : "Atividade"}</span>
                      {title ?? "(conteúdo removido)"} — {formatDueDate(a.due_at)}
                    </span>
                    <span className="flex items-center gap-2">
                      {a.content_type === "EXAM" && (
                        <>
                          <a href={`/api/gabarito/${a.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm">
                            Baixar gabarito
                          </a>
                          <Link href={`/professor/correcao/escanear/${a.id}`} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm">
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
    </>
  );
}
