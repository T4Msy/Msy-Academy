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
      <div className="page-head">
        <div>
          <Link href="/professor/turmas" className="sidebar-link back-link">
            ← Turmas
          </Link>
          <h1 className="page-title">{klass.name}</h1>
        </div>
      </div>

      <section className="card mb-md">
        <div className="card-header">
          <div className="card-title-group">
            <h2 className="card-title">Convidar alunos</h2>
          </div>
        </div>
        <div className="card-body">
          <p className="field-hint mt-0">
            Compartilhe o código com a turma — cada aluno entra em <b>Entrar em turma</b> ou acessando o link direto.
          </p>
          <div className="exam-meta">
            <span className="chip chip--code">{klass.invite_code}</span>
          </div>
          {origin && <p className="field-hint">{inviteUrl}</p>}
        </div>
      </section>

      <section className="card mb-md">
        <div className="card-header">
          <div className="card-title-group">
            <h2 className="card-title">Alunos</h2>
            <span className="chip">{students.length}</span>
          </div>
        </div>
        <div className="card-body">
          {students.length === 0 ? (
            <p className="field-hint mt-0">Nenhum aluno entrou ainda.</p>
          ) : (
            <ul className="question-options-list">
              {students.map((s) => (
                <li key={s.student_id} className="question-option">
                  {s.full_name || "Aluno"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2 className="card-title">Atribuições</h2>
            <span className="chip">{assignments?.length ?? 0}</span>
          </div>
          <AssignContentForm
            classId={id}
            exams={(exams ?? []).map((e) => ({ id: e.id, title: e.title }))}
            activities={(activities ?? []).map((a) => ({ id: a.id, title: a.title }))}
          />
        </div>
        <div className="card-body">
          {(assignments ?? []).length === 0 ? (
            <p className="field-hint mt-0">Nenhuma prova ou atividade atribuída ainda.</p>
          ) : (
            <ul className="question-options-list">
              {(assignments ?? []).map((a) => {
                const title = a.content_type === "EXAM" ? examTitleById.get(a.content_id) : activityTitleById.get(a.content_id);
                return (
                  <li key={a.id} className="question-option list-row">
                    <span>
                      <span className="chip mr-sm">{a.content_type === "EXAM" ? "Prova" : "Atividade"}</span>
                      {title ?? "(conteúdo removido)"} — {formatDueDate(a.due_at)}
                    </span>
                    <UnassignButton classId={id} assignmentId={a.id} />
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
