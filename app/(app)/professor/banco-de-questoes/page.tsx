import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { QuestionBankList } from "./QuestionBankList";
import { NewQuestionPanel } from "./NewQuestionPanel";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Banco de Questões" };

export default async function BancoDeQuestoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; dificuldade?: string; busca?: string }>;
}) {
  const { tipo, dificuldade, busca } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("questions")
    .select("id, type, statement, difficulty, tags, created_at")
    .order("created_at", { ascending: false });

  if (tipo) query = query.eq("type", tipo);
  if (dificuldade) query = query.eq("difficulty", dificuldade);
  if (busca) query = query.ilike("statement", `%${busca}%`);

  const [{ data: questions }, { data: exams }] = await Promise.all([
    query,
    supabase
      .from("exams")
      .select("id, title")
      .is("deleted_at", null)
      .neq("status", "ARCHIVED")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const list = questions ?? [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Banco de Questões</h1>
          <p className="page-subtitle">
            {list.length > 0
              ? `${list.length} questão${list.length > 1 ? "ões" : ""} reutilizável${list.length > 1 ? "eis" : ""}`
              : "Crie uma questão manualmente ou gere uma prova para começar a preencher o banco."}
          </p>
        </div>
      </div>

      <NewQuestionPanel />

      <form className="card mb-md" method="get">
        <div className="card-body card-body--filter-row">
          <div className="form-field min-w-160">
            <label className="field-label" htmlFor="busca">Buscar</label>
            <input className="input" id="busca" name="busca" defaultValue={busca ?? ""} placeholder="Palavra no enunciado" />
          </div>
          <div className="form-field min-w-160">
            <label className="field-label" htmlFor="tipo">Tipo</label>
            <select className="input" id="tipo" name="tipo" defaultValue={tipo ?? ""}>
              <option value="">Todos</option>
              <option value="MULTIPLA">Múltipla escolha</option>
              <option value="VF">Verdadeiro/Falso</option>
              <option value="DISCURSIVA">Discursiva</option>
            </select>
          </div>
          <div className="form-field min-w-160">
            <label className="field-label" htmlFor="dificuldade">Dificuldade</label>
            <select className="input" id="dificuldade" name="dificuldade" defaultValue={dificuldade ?? ""}>
              <option value="">Todas</option>
              <option value="FACIL">Fácil</option>
              <option value="MEDIO">Médio</option>
              <option value="DIFICIL">Difícil</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Filtrar</button>
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
          questions={list.map((q) => ({ id: q.id, statement: q.statement, type: q.type, difficulty: q.difficulty, tags: q.tags ?? [] }))}
          exams={exams ?? []}
        />
      )}
    </>
  );
}
