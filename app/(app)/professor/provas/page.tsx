import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { loadTeacherAssignmentGroups, assignmentStatus } from "@/lib/assignments/teacherResourceList";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Minhas Provas" };

function formatDate(iso: string | null) {
  if (!iso) return "Sem prazo";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function ProvasPage() {
  const supabase = await createClient();
  const groups = await loadTeacherAssignmentGroups(supabase, "EXAM");
  const ids = groups.flatMap((group) => group.assignments.map((assignment) => assignment.content_id));
  const { data: exams } = ids.length
    ? await supabase.from("exams").select("id, title, course, style, version, include_answer_key, created_at").in("id", [...new Set(ids)])
    : { data: [] as { id: string; title: string | null; course: string | null; style: string | null; version: number; include_answer_key: boolean; created_at: string }[] };
  const examById = new Map((exams ?? []).map((exam) => [exam.id, exam]));

  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Minhas Provas</h1><p className="mt-1 text-[13.5px] text-muted-foreground">Conteúdos organizados pela turma que os recebeu.</p></div>
      <Link href="/professor/provas/nova" className="rounded-sm bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Nova prova</Link>
    </div>
    {groups.length === 0 ? <EmptyState variant="biblioteca" title="Nenhuma prova enviada" text="As provas aparecem aqui depois que você escolhe uma turma e confirma o envio." action={<Link href="/professor/provas/nova" className="rounded-sm bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Criar primeira prova</Link>} /> : <div className="space-y-6">
      {groups.map((group) => <section key={group.classId} aria-labelledby={`class-${group.classId}`}>
        <div className="mb-3 flex items-end justify-between gap-3"><div><h2 id={`class-${group.classId}`} className="font-display text-xl font-bold text-foreground">{group.className}</h2><p className="text-sm text-muted-foreground">{group.assignments.length} atribuição{group.assignments.length === 1 ? "" : "ões"} · {group.activeStudents} alunos ativos</p></div><Link href={`/professor/turmas/${group.classId}`} className="text-sm font-semibold text-brand-text">Abrir turma</Link></div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">{group.assignments.map((assignment) => { const exam = examById.get(assignment.content_id); if (!exam) return null; const recipientCount = group.recipientsByAssignment.get(assignment.id) ?? 0; const submissions = group.submissionsByAssignment.get(assignment.id) ?? 0; return <article key={assignment.id} className="flex flex-col gap-2.5 rounded-md border border-border bg-card p-4.5 transition-all hover:border-border-hover hover:bg-card-2"><Link href={`/professor/provas/${exam.id}`} className="flex flex-1 flex-col gap-2.5"><h3 className="font-display text-base font-bold text-foreground">{exam.title || "Prova sem título"}</h3><div className="flex flex-wrap gap-1.5">{exam.course && <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{exam.course}</span>}<span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{assignment.audience_type === "class" ? "Toda a turma" : `${recipientCount} aluno${recipientCount === 1 ? "" : "s"} selecionado${recipientCount === 1 ? "" : "s"}`}</span><span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{assignmentStatus(assignment.due_at)}</span></div></Link><div className="flex items-center justify-between text-xs text-subtle"><span>{submissions} resposta{submissions === 1 ? "" : "s"}</span><span>Prazo: {formatDate(assignment.due_at)}</span></div></article>; })}</div>
      </section>)}
    </div>}
  </>;
}
