import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CreateModeTabs } from "@/components/CreateModeTabs";
import { StudyPlanWizard } from "./StudyPlanWizard";
import { BlankStudyPlanForm } from "./BlankStudyPlanForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Plano de Estudos" };

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default async function PlanoDeEstudosPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("study_plans")
    .select("id, goal, exam_date, created_at")
    .order("created_at", { ascending: false });

  const list = plans ?? [];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Plano de Estudos</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            {list.length > 0 ? `${list.length} plano${list.length > 1 ? "s" : ""}` : "Gere um cronograma personalizado para o seu objetivo."}
          </p>
        </div>
      </div>

      <CreateModeTabs
        aiLabel="Gerar com IA"
        aiDesc="A IA monta um cronograma a partir do seu objetivo e data de prova."
        blankLabel="Criar do zero"
        blankDesc="Comece com um plano em branco e adicione os itens manualmente."
        aiForm={<StudyPlanWizard />}
        blankForm={<BlankStudyPlanForm />}
      />

      {list.length > 0 && (
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {list.map((p) => (
            <Link key={p.id} href={`/aluno/plano-de-estudos/${p.id}`} className="flex flex-col gap-2.5 rounded-md border border-border bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:border-border-hover hover:bg-card-2">
              <div className="font-display text-base font-bold tracking-[-0.2px] text-foreground">{p.goal}</div>
              <div className="mt-0.5 flex flex-wrap gap-1.5">
                {p.exam_date && <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">Prova: {formatDate(p.exam_date)}</span>}
              </div>
              <div className="mt-auto flex items-center justify-between gap-2.5 pt-2 text-xs text-subtle">
                <span>{formatDate(p.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
