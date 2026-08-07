import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardCheck, Megaphone, Sparkles, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isAssessmentExpired } from "@/lib/assessments/deadline";
import { formatDate } from "@/lib/classes/format";

export const dynamic = "force-dynamic";

export default async function ProfessorTurmaOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: assignments }, { count: studentCount }, { data: gradeRows }, { data: announcements }, { data: materials }] = await Promise.all([
    supabase.from("assignments").select("id, content_type, content_id, due_at").eq("class_id", id).is("deleted_at", null).order("due_at", { ascending: true, nullsFirst: false }),
    supabase.from("enrollments").select("student_id", { count: "exact", head: true }).eq("class_id", id).eq("status", "ACTIVE"),
    supabase.rpc("class_grade_report", { p_class_id: id }),
    supabase.from("class_announcements").select("id, message, created_at").eq("class_id", id).order("created_at", { ascending: false }).limit(3),
    supabase.from("materials").select("id, title, created_at").eq("class_id", id).is("deleted_at", null).order("created_at", { ascending: false }).limit(3),
  ]);
  const rows = assignments ?? [];
  const assignmentIds = rows.map((item) => item.id);
  const { data: submissions } = assignmentIds.length
    ? await supabase.from("submissions").select("status").in("assignment_id", assignmentIds)
    : { data: [] as { status: string }[] };
  const pendingCorrections = (submissions ?? []).filter((item) => item.status === "SUBMITTED").length;
  const active = rows.filter((item) => !isAssessmentExpired(item.due_at));
  const nextDue = active[0] ?? null;

  const examIds = rows.filter((r) => r.content_type === "EXAM").map((r) => r.content_id);
  const activityIds = rows.filter((r) => r.content_type === "ACTIVITY").map((r) => r.content_id);
  const [{ data: exams }, { data: activities }] = await Promise.all([
    examIds.length ? supabase.from("exams").select("id, title").in("id", examIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    activityIds.length ? supabase.from("activities").select("id, title").in("id", activityIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);
  const examTitleById = new Map((exams ?? []).map((item) => [item.id, item.title]));
  const activityTitleById = new Map((activities ?? []).map((item) => [item.id, item.title]));
  const titleFor = (item: { content_type: "EXAM" | "ACTIVITY"; content_id: string }) =>
    item.content_type === "EXAM" ? examTitleById.get(item.content_id) ?? "Prova" : activityTitleById.get(item.content_id) ?? "Atividade";

  const graded = (gradeRows ?? []).filter((row: { total_score: number | null }) => row.total_score !== null);
  const average = graded.length ? graded.reduce((sum: number, row: { total_score: number }) => sum + row.total_score, 0) / graded.length : null;

  return (
    <>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users aria-hidden />} label="Alunos matriculados" value={String(studentCount ?? 0)} />
        <StatCard icon={<ClipboardCheck aria-hidden />} label="Atividades ativas" value={String(active.length)} />
        <StatCard icon={<ClipboardCheck aria-hidden />} label="Correções aguardando" value={String(pendingCorrections)} detail={pendingCorrections ? "Entregas enviadas pelos alunos" : "Tudo corrigido por aqui"} />
        <StatCard icon={<Sparkles aria-hidden />} label="Média geral" value={average !== null ? average.toFixed(1) : "—"} />
        <StatCard icon={<ArrowRight aria-hidden />} label="Próximo prazo" value={nextDue ? titleFor(nextDue) : "Nenhum"} detail={nextDue ? formatDate(nextDue.due_at) : undefined} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-3 font-display text-lg font-bold text-foreground">Próximas atribuições</h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">Esta turma não possui atribuições ativas no momento.</p>
        ) : (
          <ul className="space-y-2">
            {active.slice(0, 6).map((item) => (
              <li key={item.id}>
                <Link href={`/professor/turmas/${id}/atividades`} className="flex items-center justify-between gap-3 rounded-md border border-border p-3 transition hover:bg-card-2">
                  <span className="min-w-0 truncate text-sm font-semibold text-foreground">{titleFor(item)}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.due_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-bold text-foreground">Correções</h2><Link href={`/professor/correcao/turma/${id}`} className="text-sm font-semibold text-brand-text">{pendingCorrections ? "Corrigir" : "Ver correções"}</Link></div>
        <p className="text-sm text-muted-foreground">{pendingCorrections ? `${pendingCorrections} entrega${pendingCorrections === 1 ? "" : "s"} aguardando correção.` : "Tudo corrigido por aqui."}</p>
      </section>
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground"><BookOpen className="size-4.5 text-brand-text" aria-hidden />Materiais recentes</h2><Link href={`/professor/turmas/${id}/materiais`} className="text-sm font-semibold text-brand-text">Ver materiais</Link></div>
        {(materials ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Nenhum material compartilhado.</p> : <ul className="space-y-2">{materials?.map((item) => <li key={item.id} className="rounded-md border border-border p-3"><p className="truncate text-sm font-semibold text-foreground">{item.title || "Material sem título"}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(item.created_at)}</p></li>)}</ul>}
      </section>
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-bold text-foreground">Desempenho</h2><Link href={`/professor/turmas/${id}/notas`} className="text-sm font-semibold text-brand-text">Ver desempenho</Link></div>
        <p className="text-sm text-muted-foreground">{graded.length ? `Média atual ${average?.toFixed(1)} nas avaliações corrigidas.` : "Os dados aparecerão conforme os alunos realizarem atividades."}</p>
      </section>
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground"><Megaphone className="size-4.5 text-brand-text" aria-hidden />Avisos</h2>
          <Link href={`/professor/turmas/${id}/avisos`} className="text-sm font-semibold text-brand-text">Ver todos</Link>
        </div>
        {(announcements ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Nenhum aviso publicado.</p> : <ul className="space-y-2">{announcements?.map((item) => <li key={item.id} className="rounded-md border border-border p-3"><p className="line-clamp-2 whitespace-pre-wrap text-sm text-foreground">{item.message}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(item.created_at)}</p></li>)}</ul>}
      </section>
      </div>
    </>
  );
}

function StatCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4.5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <span className="text-brand-text">{icon}</span>
        {label}
      </div>
      <p className="mt-3 line-clamp-2 font-display text-base font-bold text-foreground">{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}
