import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ClipboardCheck, FileText, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { isAssessmentExpired } from "@/lib/assessments/deadline";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) { return value ? new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "Sem prazo"; }

export default async function AlunoTurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();
  const { data: enrollment } = await supabase.from("enrollments").select("class_id, created_at, classes(id, name, invite_code, created_at)").eq("class_id", id).eq("student_id", user.id).eq("status", "ACTIVE").maybeSingle();
  const classroom = enrollment?.classes as unknown as { id: string; name: string; invite_code: string; created_at: string } | null;
  if (!classroom) notFound();
  const [{ data: assignments }, { data: materials }] = await Promise.all([
    supabase.from("assignments").select("id, content_type, content_id, due_at, created_at").eq("class_id", id).is("deleted_at", null).order("created_at", { ascending: false }),
    supabase.from("materials").select("id, title, kind, created_at").eq("class_id", id).not("class_id", "is", null).order("created_at", { ascending: false }),
  ]);
  const rows = assignments ?? [];
  const examIds = rows.filter((item) => item.content_type === "EXAM").map((item) => item.content_id);
  const activityIds = rows.filter((item) => item.content_type === "ACTIVITY").map((item) => item.content_id);
  const [{ data: exams }, { data: activities }] = await Promise.all([
    examIds.length ? supabase.from("exams").select("id, title").in("id", examIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    activityIds.length ? supabase.from("activities").select("id, title").in("id", activityIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);
  const examTitleById = new Map((exams ?? []).map((item) => [item.id, item.title]));
  const activityTitleById = new Map((activities ?? []).map((item) => [item.id, item.title]));
  const upcoming = rows.filter((item) => !isAssessmentExpired(item.due_at)).slice(0, 4);
  const recent = rows.slice(0, 5);
  const enrollmentCreatedAt = (enrollment as unknown as { created_at: string | null }).created_at;
  return <><Link href="/aluno/turmas" className="mb-5 inline-flex text-sm font-semibold text-muted-foreground hover:text-foreground">← Minhas turmas</Link><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">{classroom.name}</h1><p className="mt-1 text-sm text-muted-foreground">Turma ativa · Entrada em {formatDate(enrollmentCreatedAt)}</p></div><Badge variant="outline">Aluno</Badge></div><div className="mb-6 grid gap-3 sm:grid-cols-3"><Card className="p-4"><Users className="mb-2 h-5 w-5 text-brand-text" aria-hidden /><p className="text-2xl font-bold text-foreground">—</p><p className="text-sm text-muted-foreground">Colegas</p></Card><Card className="p-4"><ClipboardCheck className="mb-2 h-5 w-5 text-brand-text" aria-hidden /><p className="text-2xl font-bold text-foreground">{rows.filter((item) => item.content_type === "ACTIVITY").length}</p><p className="text-sm text-muted-foreground">Atividades</p></Card><Card className="p-4"><FileText className="mb-2 h-5 w-5 text-brand-text" aria-hidden /><p className="text-2xl font-bold text-foreground">{rows.filter((item) => item.content_type === "EXAM").length}</p><p className="text-sm text-muted-foreground">Provas</p></Card></div><div className="grid gap-6 lg:grid-cols-2"><section className="rounded-lg border border-border bg-card p-5"><h2 className="mb-3 font-display text-lg font-bold text-foreground">Próximos prazos</h2>{upcoming.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum prazo próximo.</p> : <ul className="space-y-2">{upcoming.map((item) => <li key={item.id}><Link href={`/aluno/tarefas/${item.id}`} className="flex items-center justify-between gap-3 rounded-md border border-border p-3 hover:bg-card-2"><span className="min-w-0 truncate text-sm font-semibold text-foreground">{item.content_type === "EXAM" ? examTitleById.get(item.content_id) ?? "Prova" : activityTitleById.get(item.content_id) ?? "Atividade"}</span><span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.due_at)}</span></Link></li>)}</ul>}</section><section className="rounded-lg border border-border bg-card p-5"><h2 className="mb-3 font-display text-lg font-bold text-foreground">Conteúdos recentes</h2>{recent.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum conteúdo enviado para esta turma.</p> : <ul className="space-y-2">{recent.map((item) => <li key={item.id}><Link href={`/aluno/tarefas/${item.id}`} className="flex items-center gap-3 rounded-md border border-border p-3 hover:bg-card-2"><span className="text-brand-text">{item.content_type === "EXAM" ? <FileText className="h-4 w-4" aria-hidden /> : <ClipboardCheck className="h-4 w-4" aria-hidden />}</span><span className="min-w-0 truncate text-sm font-semibold text-foreground">{item.content_type === "EXAM" ? examTitleById.get(item.content_id) ?? "Prova" : activityTitleById.get(item.content_id) ?? "Atividade"}</span></Link></li>)}</ul>}</section></div><section className="mt-6 rounded-lg border border-border bg-card p-5"><h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-foreground"><BookOpen className="h-5 w-5 text-brand-text" aria-hidden />Materiais compartilhados</h2>{(materials ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Nenhum material compartilhado com esta turma.</p> : <div className="grid gap-2 sm:grid-cols-2">{(materials ?? []).slice(0, 6).map((material) => <Link key={material.id} href={`/aluno/materiais/${material.id}`} className="rounded-md border border-border p-3 hover:bg-card-2"><p className="text-sm font-semibold text-foreground">{material.title}</p><p className="mt-1 text-xs text-muted-foreground">PDF · {formatDate(material.created_at)}</p></Link>)}</div>}</section></>;
}
