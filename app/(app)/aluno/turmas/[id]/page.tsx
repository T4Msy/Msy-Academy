import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardCheck, FileText, Megaphone, Sparkles, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isAssessmentExpired } from "@/lib/assessments/deadline";
import { formatDate } from "@/lib/classes/format";

export const dynamic = "force-dynamic";

export default async function AlunoTurmaOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: assignments }, { data: materials }, { data: announcements }] = await Promise.all([
    supabase.from("assignments").select("id, content_type, content_id, due_at, created_at").eq("class_id", id).is("deleted_at", null).order("created_at", { ascending: false }),
    supabase.from("materials").select("id, title, created_at").eq("class_id", id).is("deleted_at", null).order("created_at", { ascending: false }),
    supabase.from("class_announcements").select("id, message, created_at").eq("class_id", id).order("created_at", { ascending: false }).limit(1),
  ]);
  const rows = assignments ?? [];
  const examIds = rows.filter((item) => item.content_type === "EXAM").map((item) => item.content_id);
  const activityIds = rows.filter((item) => item.content_type === "ACTIVITY").map((item) => item.content_id);
  const assignmentIds = rows.map((item) => item.id);
  const [{ data: exams }, { data: activities }, { data: submissions }] = await Promise.all([
    examIds.length ? supabase.from("exams").select("id, title").in("id", examIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    activityIds.length ? supabase.from("activities").select("id, title").in("id", activityIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    assignmentIds.length ? supabase.from("submissions").select("id, assignment_id, status, submitted_at").eq("student_id", user.id).in("assignment_id", assignmentIds) : Promise.resolve({ data: [] as { id: string; assignment_id: string; status: string; submitted_at: string | null }[] }),
  ]);
  const submissionIds = (submissions ?? []).map((submission) => submission.id);
  const { data: grades } = submissionIds.length ? await supabase.from("grades").select("submission_id, total_score").in("submission_id", submissionIds) : { data: [] as { submission_id: string; total_score: number }[] };
  const examTitleById = new Map((exams ?? []).map((item) => [item.id, item.title]));
  const activityTitleById = new Map((activities ?? []).map((item) => [item.id, item.title]));
  const gradeBySubmission = new Map((grades ?? []).map((grade) => [grade.submission_id, grade.total_score]));
  const completedCount = (submissions ?? []).filter((submission) => submission.status !== "PENDING").length;
  const upcoming = rows.filter((item) => !isAssessmentExpired(item.due_at)).sort((a, b) => new Date(a.due_at ?? "9999").getTime() - new Date(b.due_at ?? "9999").getTime()).slice(0, 4);
  const recent = rows.slice(0, 5);
  const recentMaterial = materials?.[0] ?? null;
  const latestGrade = [...(submissions ?? [])].filter((submission) => submission.status !== "PENDING" && gradeBySubmission.has(submission.id)).sort((a, b) => new Date(b.submitted_at ?? "").getTime() - new Date(a.submitted_at ?? "").getTime())[0];
  const titleFor = (item: { content_type: "EXAM" | "ACTIVITY"; content_id: string }) => item.content_type === "EXAM" ? examTitleById.get(item.content_id) ?? "Prova" : activityTitleById.get(item.content_id) ?? "Atividade";
  const nextActivity = upcoming.find((item) => item.content_type === "ACTIVITY");
  const nextExam = upcoming.find((item) => item.content_type === "EXAM");

  return (
    <>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ContextCard icon={<ClipboardCheck aria-hidden />} label="Próxima atividade" value={nextActivity ? titleFor(nextActivity) : "Nenhuma pendente"} detail={nextActivity ? formatDate(nextActivity.due_at) : "Você está em dia"} href={nextActivity ? `/aluno/tarefas/${nextActivity.id}` : undefined} />
        <ContextCard icon={<FileText aria-hidden />} label="Próxima prova" value={nextExam ? titleFor(nextExam) : "Nenhuma próxima"} detail={nextExam ? formatDate(nextExam.due_at) : "Sem prazo próximo"} href={nextExam ? `/aluno/tarefas/${nextExam.id}` : undefined} />
        <ContextCard icon={<Users aria-hidden />} label="Progresso" value={`${completedCount}/${rows.length} concluídas`} detail={rows.length ? `${Math.round((completedCount / rows.length) * 100)}% das atividades da turma` : "A turma ainda não possui atividades"} />
        <ContextCard icon={<Sparkles aria-hidden />} label="Última nota" value={latestGrade ? String(gradeBySubmission.get(latestGrade.id)) : "Ainda sem notas"} detail={latestGrade ? "Resultado mais recente" : "Notas corrigidas aparecerão aqui"} />
        <ContextCard icon={<BookOpen aria-hidden />} label="Último material" value={recentMaterial?.title ?? "Nenhum material"} detail={recentMaterial ? formatDate(recentMaterial.created_at) : "Os materiais publicados aparecerão aqui"} href={recentMaterial ? `/aluno/materiais/${recentMaterial.id}` : undefined} />
        <ContextCard icon={<Megaphone aria-hidden />} label="Último aviso" value={announcements?.[0]?.message ?? "Nenhum aviso publicado"} detail={announcements?.[0] ? formatDate(announcements[0].created_at) : "Sem novidades por enquanto"} href={`/aluno/turmas/${id}/avisos`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ContextList title="Próximos prazos" items={upcoming} titleFor={titleFor} empty="Você não possui prazos próximos nesta turma." />
        <ContextList title="Conteúdos recentes" items={recent} titleFor={titleFor} empty="Esta turma ainda não possui conteúdos publicados." />
      </div>
    </>
  );
}

function ContextCard({ icon, label, value, detail, href }: { icon: React.ReactNode; label: string; value: string; detail: string; href?: string }) {
  const content = (
    <div className="h-full rounded-lg border border-border bg-card p-4.5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground"><span className="text-brand-text">{icon}</span>{label}</div>
      <p className="mt-3 line-clamp-2 font-display text-base font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      {href && <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-text">Abrir <ArrowRight className="size-3.5" aria-hidden /></span>}
    </div>
  );
  return href ? <Link href={href} className="block transition hover:-translate-y-0.5">{content}</Link> : content;
}

function ContextList({ title, items, titleFor, empty }: { title: string; items: { id: string; content_type: "EXAM" | "ACTIVITY"; content_id: string; due_at: string | null }[]; titleFor: (item: { content_type: "EXAM" | "ACTIVITY"; content_id: string }) => string; empty: string }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-3 font-display text-lg font-bold text-foreground">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/aluno/tarefas/${item.id}`} className="flex items-center justify-between gap-3 rounded-md border border-border p-3 transition hover:bg-card-2">
                <span className="min-w-0 truncate text-sm font-semibold text-foreground">{titleFor(item)}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.due_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
