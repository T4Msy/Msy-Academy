import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { QuestionBankList } from "./QuestionBankList";
import { NewQuestionPanel } from "./NewQuestionPanel";
import { EmptyState } from "@/components/EmptyState";
import { parseBnccCodesParam } from "@/lib/questions/bncc";
import { parseTagsParam } from "@/lib/questions/tags";
import { listQuestionBank } from "@/lib/questions/queries";
import type { Difficulty, QuestionType } from "@/lib/questions/types";

const QUESTION_TYPES = new Set<QuestionType>(["MULTIPLA", "VF", "DISCURSIVA"]);
const DIFFICULTIES = new Set<Difficulty>(["FACIL", "MEDIO", "DIFICIL"]);

function parseQuestionType(value?: string): QuestionType | undefined {
  return value && QUESTION_TYPES.has(value as QuestionType) ? (value as QuestionType) : undefined;
}

function parseDifficulty(value?: string): Difficulty | undefined {
  return value && DIFFICULTIES.has(value as Difficulty) ? (value as Difficulty) : undefined;
}

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Banco de Questões" };

export default async function BancoDeQuestoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; dificuldade?: string; busca?: string; bncc?: string; tags?: string }>;
}) {
  const { tipo, dificuldade, busca, bncc, tags } = await searchParams;
  const supabase = await createClient();

  const [questions, { data: exams }] = await Promise.all([
    listQuestionBank(supabase, {
      type: parseQuestionType(tipo),
      difficulty: parseDifficulty(dificuldade),
      search: busca,
      bnccCodes: parseBnccCodesParam(bncc),
      tags: parseTagsParam(tags),
    }),
    supabase
      .from("exams")
      .select("id, title")
      .is("deleted_at", null)
      .neq("status", "ARCHIVED")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const list = questions;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Banco de Questões</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            {list.length > 0
              ? `${list.length} questão${list.length > 1 ? "ões" : ""} reutilizável${list.length > 1 ? "eis" : ""}`
              : "Crie uma questão manualmente ou gere uma prova para começar a preencher o banco."}
          </p>
        </div>
      </div>

      <NewQuestionPanel />

      <form className="mb-4 overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors" method="get">
        <div className="flex flex-row flex-wrap items-end gap-3 p-5.5">
          <div className="flex min-w-40 flex-col gap-1.5">
            <label className="block text-sm font-semibold text-foreground" htmlFor="busca">Buscar</label>
            <input className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="busca" name="busca" defaultValue={busca ?? ""} placeholder="Palavra no enunciado" />
          </div>
          <div className="flex min-w-40 flex-col gap-1.5"><label className="text-sm font-semibold text-foreground" htmlFor="tags">Tags (qualquer)</label><input id="tags" name="tags" defaultValue={tags ?? ""} placeholder="DNA, revisão" className="w-full rounded-sm border border-border bg-card px-3 py-2.5 text-md" /></div>
          <div className="flex min-w-40 flex-col gap-1.5"><label className="text-sm font-semibold text-foreground" htmlFor="bncc">BNCC</label><input id="bncc" name="bncc" defaultValue={bncc ?? ""} placeholder="EF06MA07" className="w-full rounded-sm border border-border bg-card px-3 py-2.5 text-md uppercase" /></div>
          <div className="flex min-w-40 flex-col gap-1.5">
            <label className="block text-sm font-semibold text-foreground" htmlFor="tipo">Tipo</label>
            <select className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="tipo" name="tipo" defaultValue={tipo ?? ""}>
              <option value="">Todos</option>
              <option value="MULTIPLA">Múltipla escolha</option>
              <option value="VF">Verdadeiro/Falso</option>
              <option value="DISCURSIVA">Discursiva</option>
            </select>
          </div>
          <div className="flex min-w-40 flex-col gap-1.5">
            <label className="block text-sm font-semibold text-foreground" htmlFor="dificuldade">Dificuldade</label>
            <select className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="dificuldade" name="dificuldade" defaultValue={dificuldade ?? ""}>
              <option value="">Todas</option>
              <option value="FACIL">Fácil</option>
              <option value="MEDIO">Médio</option>
              <option value="DIFICIL">Difícil</option>
            </select>
          </div>
          <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-3 py-[7px] text-sm">Filtrar</button>
        </div>
      </form>

      {list.length === 0 ? (
        <EmptyState
          variant="questoes"
          title="Nenhuma questão encontrada"
          text="Crie uma questão manualmente acima ou gere uma prova para preencher seu banco de questões reutilizáveis."
        />
      ) : (
        <QuestionBankList
          questions={list.map((q) => ({
            id: q.id,
            statement: q.statement,
            type: q.type,
            difficulty: q.difficulty,
            tags: q.tags ?? [],
            bnccCodes: q.bncc_codes,
          }))}
          exams={exams ?? []}
        />
      )}
    </>
  );
}
