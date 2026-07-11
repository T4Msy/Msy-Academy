import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

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

  const examTitleById = new Map((exams ?? []).map((e: any) => [e.id, e.title]));
  const activityTitleById = new Map((activities ?? []).map((a: any) => [a.id, a.title]));
  const statusByAssignment = new Map((submissions ?? []).map((s) => [s.assignment_id, s.status]));

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Tarefas</h1>
          <p className="page-subtitle">
            {list.length > 0 ? `${list.length} tarefa${list.length > 1 ? "s" : ""}` : "As tarefas atribuídas pela sua turma aparecem aqui."}
          </p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">Nenhuma tarefa ainda</div>
          <p className="empty-text">Entre em uma turma para ver as tarefas atribuídas pelo seu professor.</p>
        </div>
      ) : (
        <div className="exam-grid">
          {list.map((a) => {
            const title = a.content_type === "EXAM" ? examTitleById.get(a.content_id) : activityTitleById.get(a.content_id);
            const status = statusByAssignment.get(a.id);
            return (
              <Link key={a.id} href={`/aluno/tarefas/${a.id}`} className="exam-card">
                <div className="exam-card-title">{title ?? "Tarefa"}</div>
                <div className="exam-meta">
                  <span className="chip">{a.content_type === "EXAM" ? "Prova" : "Atividade"}</span>
                  <span className="chip">{status === "GRADED" ? "Corrigida" : status ? "Enviada" : "Pendente"}</span>
                </div>
                <div className="exam-foot">
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
