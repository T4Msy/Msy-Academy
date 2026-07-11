import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SimuladoWizard } from "./SimuladoWizard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Simulados" };

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default async function SimuladosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: simulados }, { data: subjects }] = await Promise.all([
    supabase.from("simulados").select("id, title, mode, created_at").order("created_at", { ascending: false }),
    supabase.from("subjects").select("id, name").order("name"),
  ]);

  const list = simulados ?? [];
  const { data: submissions } = list.length
    ? await supabase.from("submissions").select("simulado_id, status").eq("student_id", user!.id).not("simulado_id", "is", null)
    : { data: [] as { simulado_id: string; status: string }[] };
  const statusBySimulado = new Map((submissions ?? []).map((s) => [s.simulado_id, s.status]));

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Simulados</h1>
          <p className="page-subtitle">
            {list.length > 0 ? `${list.length} simulado${list.length > 1 ? "s" : ""}` : "Pratique com questões das suas tarefas."}
          </p>
        </div>
        <SimuladoWizard subjects={subjects ?? []} />
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">Nenhum simulado ainda</div>
          <p className="empty-text">Resolva ao menos uma tarefa atribuída para desbloquear questões para o simulado.</p>
        </div>
      ) : (
        <div className="exam-grid">
          {list.map((s) => {
            const status = statusBySimulado.get(s.id);
            return (
              <Link key={s.id} href={`/aluno/simulados/${s.id}`} className="exam-card">
                <div className="exam-card-title">{s.title}</div>
                <div className="exam-meta">
                  <span className="chip">{status === "GRADED" ? "Corrigido" : status ? "Concluído" : "Pendente"}</span>
                </div>
                <div className="exam-foot">
                  <span>{formatDate(s.created_at)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
