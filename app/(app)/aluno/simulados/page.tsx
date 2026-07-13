import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SimuladoWizard } from "./SimuladoWizard";
import { EmptyState } from "@/components/EmptyState";

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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Simulados</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            {list.length > 0 ? `${list.length} simulado${list.length > 1 ? "s" : ""}` : "Pratique com questões das suas tarefas."}
          </p>
        </div>
        <SimuladoWizard subjects={subjects ?? []} />
      </div>

      {list.length === 0 ? (
        <EmptyState variant="tarefa" title="Nenhum simulado ainda" text="Resolva ao menos uma tarefa atribuída para desbloquear questões para o simulado." />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {list.map((s) => {
            const status = statusBySimulado.get(s.id);
            return (
              <Link key={s.id} href={`/aluno/simulados/${s.id}`} className="flex flex-col gap-2.5 rounded-md border border-border bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:border-border-hover hover:bg-card-2">
                <div className="font-display text-base font-bold tracking-[-0.2px] text-foreground">{s.title}</div>
                <div className="mt-0.5 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{status === "GRADED" ? "Corrigido" : status ? "Concluído" : "Pendente"}</span>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2.5 pt-2 text-xs text-subtle">
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
