import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tarefas" };

function formatDueDate(iso: string | null): string {
  if (!iso) return "Sem prazo";
  try {
    return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default async function TarefasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, content_type, content_id, due_at, class_id")
    .order("due_at", { ascending: true, nullsFirst: false });

  const list = assignments ?? [];

  const examIds = list.filter((a) => a.content_type === "EXAM").map((a) => a.content_id);
  const activityIds = list.filter((a) => a.content_type === "ACTIVITY").map((a) => a.content_id);

  const [{ data: exams }, { data: activities }, { data: submissions }] = await Promise.all([
    examIds.length ? supabase.from("exams").select("id, title").in("id", examIds) : Promise.resolve({ data: [] }),
    activityIds.length ? supabase.from("activities").select("id, title").in("id", activityIds) : Promise.resolve({ data: [] }),
    supabase.from("submissions").select("assignment_id, status").eq("student_id", user!.id),
  ]);

  const examTitleById = new Map((exams ?? []).map((e: { id: string; title: string }) => [e.id, e.title]));
  const activityTitleById = new Map((activities ?? []).map((a: { id: string; title: string }) => [a.id, a.title]));
  const statusByAssignment = new Map((submissions ?? []).map((s) => [s.assignment_id, s.status]));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Tarefas</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            {list.length > 0 ? `${list.length} tarefa${list.length > 1 ? "s" : ""}` : "As tarefas atribuídas pela sua turma aparecem aqui."}
          </p>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState variant="tarefa" title="Nenhuma tarefa ainda" text="Entre em uma turma para ver as tarefas atribuídas pelo seu professor." />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {list.map((a) => {
            const title = a.content_type === "EXAM" ? examTitleById.get(a.content_id) : activityTitleById.get(a.content_id);
            const status = statusByAssignment.get(a.id);
            return (
              <Link key={a.id} href={`/aluno/tarefas/${a.id}`} className="flex flex-col gap-2.5 rounded-md border border-border bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:border-border-hover hover:bg-card-2">
                <div className="font-display text-base font-bold tracking-[-0.2px] text-foreground">{title ?? "Tarefa"}</div>
                <div className="mt-0.5 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{a.content_type === "EXAM" ? "Prova" : "Atividade"}</span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{status === "GRADED" ? "Corrigida" : status ? "Enviada" : "Pendente"}</span>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2.5 pt-2 text-xs text-subtle">
                  <span>Prazo</span>
                  <span>{formatDueDate(a.due_at)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
