import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, ClipboardCheck, FileText, Megaphone, Sparkles, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { isAssessmentExpired } from "@/lib/assessments/deadline";
import { ClassContextNav, type ClassContextView } from "../ClassContextNav";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) { return value ? new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "Sem prazo"; }
function validView(value: string | undefined): ClassContextView { return value === "activities" || value === "materials" ? value : "overview"; }

export default async function AlunoTurmaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string }> }) {
  const { id } = await params;
  const view = validView((await searchParams).view);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();
  const [{ data: enrollment }, { data: classRows }] = await Promise.all([
    supabase.from("enrollments").select("class_id, created_at").eq("class_id", id).eq("student_id", user.id).eq("status", "ACTIVE").maybeSingle(),
    supabase.rpc("student_visible_classes"),
  ]);
  const classroom = ((classRows ?? []) as { id: string; name: string; created_at: string; subject_id: string | null }[]).find((item) => item.id === id) ?? null;
  if (!classroom) notFound();
  const [{ data: assignments }, { data: materials }, { data: announcements }, { data: teacherNames }, { data: subject }] = await Promise.all([
    supabase.from("assignments").select("id, content_type, content_id, due_at, created_at").eq("class_id", id).is("deleted_at", null).order("created_at", { ascending: false }),
    supabase.from("materials").select("id, title, kind, created_at").eq("class_id", id).not("class_id", "is", null).order("created_at", { ascending: false }),
    supabase.from("class_announcements").select("id, message, created_at").eq("class_id", id).order("created_at", { ascending: false }).limit(1),
    supabase.rpc("student_class_teacher_names", { p_class_ids: [id] }),
    classroom.subject_id ? supabase.from("subjects").select("name").eq("id", classroom.subject_id).maybeSingle() : Promise.resolve({ data: null }),
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
  const materialIds = (materials ?? []).map((material) => material.id);
  const { data: classDecks } = materialIds.length ? await supabase.from("flashcard_decks").select("id, source_material_id").in("source_material_id", materialIds) : { data: [] as { id: string; source_material_id: string | null }[] };
  const examTitleById = new Map((exams ?? []).map((item) => [item.id, item.title]));
  const activityTitleById = new Map((activities ?? []).map((item) => [item.id, item.title]));
  const gradeBySubmission = new Map((grades ?? []).map((grade) => [grade.submission_id, grade.total_score]));
  const submissionByAssignment = new Map((submissions ?? []).map((submission) => [submission.assignment_id, submission]));
  const completedCount = (submissions ?? []).filter((submission) => submission.status !== "PENDING").length;
  const upcoming = rows.filter((item) => !isAssessmentExpired(item.due_at)).sort((a, b) => new Date(a.due_at ?? "9999").getTime() - new Date(b.due_at ?? "9999").getTime()).slice(0, 4);
  const recent = rows.slice(0, 5);
  const recentMaterial = materials?.[0] ?? null;
  const latestGrade = [...(submissions ?? [])].filter((submission) => submission.status !== "PENDING" && gradeBySubmission.has(submission.id)).sort((a, b) => new Date(b.submitted_at ?? "").getTime() - new Date(a.submitted_at ?? "").getTime())[0];
  const teacherName = (teacherNames ?? [])[0]?.teacher_name ?? null;
  const enrollmentCreatedAt = (enrollment as unknown as { created_at: string | null }).created_at;
  const titleFor = (item: { content_type: "EXAM" | "ACTIVITY"; content_id: string }) => item.content_type === "EXAM" ? examTitleById.get(item.content_id) ?? "Prova" : activityTitleById.get(item.content_id) ?? "Atividade";

  return <>
    <Link href="/aluno/turmas" className="mb-5 inline-flex text-sm font-semibold text-muted-foreground hover:text-foreground">← Minhas turmas</Link>
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">{classroom.name}</h1><p className="mt-1 text-sm text-muted-foreground">{[subject?.name, teacherName].filter(Boolean).join(" · ") || "Ambiente de aprendizagem da turma"} · Entrada em {formatDate(enrollmentCreatedAt)}</p></div><Badge variant="outline">Aluno</Badge></div>
    <ClassContextNav classId={id} activeView={view} flashcardsHref={classDecks?.length ? `/aluno/flashcards?materialIds=${materialIds.join(",")}` : undefined} />
    {view === "overview" && <><div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><ContextCard icon={<ClipboardCheck aria-hidden />} label="Próxima atividade" value={upcoming.find((item) => item.content_type === "ACTIVITY") ? titleFor(upcoming.find((item) => item.content_type === "ACTIVITY")!) : "Nenhuma pendente"} detail={upcoming.find((item) => item.content_type === "ACTIVITY") ? formatDate(upcoming.find((item) => item.content_type === "ACTIVITY")!.due_at) : "Você está em dia"} href={upcoming.find((item) => item.content_type === "ACTIVITY") ? `/aluno/tarefas/${upcoming.find((item) => item.content_type === "ACTIVITY")!.id}` : undefined} /><ContextCard icon={<FileText aria-hidden />} label="Próxima prova" value={upcoming.find((item) => item.content_type === "EXAM") ? titleFor(upcoming.find((item) => item.content_type === "EXAM")!) : "Nenhuma próxima"} detail={upcoming.find((item) => item.content_type === "EXAM") ? formatDate(upcoming.find((item) => item.content_type === "EXAM")!.due_at) : "Sem prazo próximo"} href={upcoming.find((item) => item.content_type === "EXAM") ? `/aluno/tarefas/${upcoming.find((item) => item.content_type === "EXAM")!.id}` : undefined} /><ContextCard icon={<BookOpen aria-hidden />} label="Último material" value={recentMaterial?.title ?? "Nenhum material"} detail={recentMaterial ? formatDate(recentMaterial.created_at) : "Os materiais publicados aparecerão aqui"} href={recentMaterial ? `/aluno/materiais/${recentMaterial.id}` : undefined} /><ContextCard icon={<Megaphone aria-hidden />} label="Último aviso" value={announcements?.[0]?.message ?? "Nenhum aviso publicado"} detail={announcements?.[0] ? formatDate(announcements[0].created_at) : "Sem novidades por enquanto"} /><ContextCard icon={<Sparkles aria-hidden />} label="Última nota" value={latestGrade ? String(gradeBySubmission.get(latestGrade.id)) : "Ainda sem notas"} detail={latestGrade ? "Resultado mais recente" : "Notas corrigidas aparecerão aqui"} /><ContextCard icon={<Users aria-hidden />} label="Progresso" value={`${completedCount}/${rows.length} concluídas`} detail={rows.length ? `${Math.round((completedCount / rows.length) * 100)}% das atividades da turma` : "A turma ainda não possui atividades"} /></div><div className="grid gap-6 lg:grid-cols-2"><ContextList title="Próximos prazos" items={upcoming} titleFor={titleFor} empty="Você não possui prazos próximos nesta turma." /><ContextList title="Conteúdos recentes" items={recent} titleFor={titleFor} empty="Esta turma ainda não possui conteúdos publicados." /></div></>}
    {view === "activities" && <ContextActivities rows={rows} titleFor={titleFor} submissionByAssignment={submissionByAssignment} />}
    {view === "materials" && <ContextMaterials materials={materials ?? []} />}
  </>;
}

function ContextCard({ icon, label, value, detail, href }: { icon: React.ReactNode; label: string; value: string; detail: string; href?: string }) { const content = <div className="h-full rounded-lg border border-border bg-card p-4.5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground"><span className="text-brand-text">{icon}</span>{label}</div><p className="mt-3 line-clamp-2 font-display text-base font-bold text-foreground">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p>{href && <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-text">Abrir <ArrowRight className="size-3.5" aria-hidden /></span>}</div>; return href ? <Link href={href} className="block transition hover:-translate-y-0.5">{content}</Link> : content; }
function ContextList({ title, items, titleFor, empty }: { title: string; items: { id: string; content_type: "EXAM" | "ACTIVITY"; content_id: string; due_at: string | null }[]; titleFor: (item: { content_type: "EXAM" | "ACTIVITY"; content_id: string }) => string; empty: string }) { return <section className="rounded-lg border border-border bg-card p-5"><h2 className="mb-3 font-display text-lg font-bold text-foreground">{title}</h2>{items.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : <ul className="space-y-2">{items.map((item) => <li key={item.id}><Link href={`/aluno/tarefas/${item.id}`} className="flex items-center justify-between gap-3 rounded-md border border-border p-3 transition hover:bg-card-2"><span className="min-w-0 truncate text-sm font-semibold text-foreground">{titleFor(item)}</span><span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.due_at)}</span></Link></li>)}</ul>}</section>; }
function ContextActivities({ rows, titleFor, submissionByAssignment }: { rows: { id: string; content_type: "EXAM" | "ACTIVITY"; content_id: string; due_at: string | null }[]; titleFor: (item: { content_type: "EXAM" | "ACTIVITY"; content_id: string }) => string; submissionByAssignment: Map<string, { status: string }> }) { return <section className="rounded-lg border border-border bg-card p-5"><div className="mb-4"><h2 className="font-display text-xl font-bold text-foreground">Atividades da turma</h2><p className="mt-1 text-sm text-muted-foreground">Tudo que precisa ser feito nesta disciplina, em ordem de prazo.</p></div>{rows.length === 0 ? <EmptyState variant="tarefa" title="Esta turma ainda não possui atividades" text="Quando o professor publicar atividades ou provas, elas aparecerão aqui." /> : <div className="space-y-2">{rows.map((item) => { const status = submissionByAssignment.get(item.id)?.status; return <Link key={item.id} href={`/aluno/tarefas/${item.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3 transition hover:bg-card-2"><span className="flex min-w-0 items-center gap-2"><Badge variant="outline">{item.content_type === "EXAM" ? "Prova" : "Atividade"}</Badge><span className="truncate text-sm font-semibold text-foreground">{titleFor(item)}</span></span><span className="flex items-center gap-3 text-xs text-muted-foreground"><span>{status && status !== "PENDING" ? "Concluída" : item.due_at ? formatDate(item.due_at) : "Sem prazo"}</span><ArrowRight className="size-4" aria-hidden /></span></Link>; })}</div>}</section>; }
function ContextMaterials({ materials }: { materials: { id: string; title: string; kind: string; created_at: string }[] }) { return <section className="rounded-lg border border-border bg-card p-5"><div className="mb-4"><h2 className="font-display text-xl font-bold text-foreground">Materiais da turma</h2><p className="mt-1 text-sm text-muted-foreground">Estude os conteúdos publicados para esta disciplina.</p></div>{materials.length === 0 ? <EmptyState variant="biblioteca" title="Esta turma ainda não possui materiais" text="Os materiais compartilhados pelo professor aparecerão aqui." /> : <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{materials.map((material) => <Link key={material.id} href={`/aluno/materiais/${material.id}`} className="group rounded-md border border-border p-4 transition hover:-translate-y-0.5 hover:border-brand-border hover:bg-card-2"><div className="flex items-start justify-between gap-2"><BookOpen className="size-5 text-brand-text" aria-hidden /><ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" aria-hidden /></div><p className="mt-4 font-display text-base font-bold text-foreground">{material.title}</p><p className="mt-1 text-xs text-muted-foreground">{material.kind === "FILE" ? "Arquivo" : material.kind} · {formatDate(material.created_at)}</p></Link>)}</div>}</section>; }
