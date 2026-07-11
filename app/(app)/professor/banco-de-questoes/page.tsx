import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { QuestionBankItem } from "./QuestionBankItem";

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

  const { data: questions } = await query;
  const list = questions ?? [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Banco de Questões</h1>
          <p className="page-subtitle">
            {list.length > 0
              ? `${list.length} questão${list.length > 1 ? "ões" : ""} reutilizável${list.length > 1 ? "eis" : ""}`
              : "Toda questão gerada numa prova cai aqui automaticamente."}
          </p>
        </div>
      </div>

      <form className="card" method="get" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", gap: 12 }}>
          <div className="form-field" style={{ minWidth: 160 }}>
            <label className="field-label" htmlFor="busca">Buscar</label>
            <input className="input" id="busca" name="busca" defaultValue={busca ?? ""} placeholder="Palavra no enunciado" />
          </div>
          <div className="form-field" style={{ minWidth: 160 }}>
            <label className="field-label" htmlFor="tipo">Tipo</label>
            <select className="input" id="tipo" name="tipo" defaultValue={tipo ?? ""}>
              <option value="">Todos</option>
              <option value="MULTIPLA">Múltipla escolha</option>
              <option value="VF">Verdadeiro/Falso</option>
              <option value="DISCURSIVA">Discursiva</option>
            </select>
          </div>
          <div className="form-field" style={{ minWidth: 160 }}>
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
        <div className="empty-state">
          <div className="empty-title">Nenhuma questão encontrada</div>
          <p className="empty-text">
            Gere uma prova para começar a preencher seu banco de questões reutilizáveis.
          </p>
        </div>
      ) : (
        <div className="questions-stack">
          {list.map((q) => (
            <QuestionBankItem
              key={q.id}
              id={q.id}
              statement={q.statement}
              type={q.type}
              difficulty={q.difficulty}
              tags={q.tags ?? []}
            />
          ))}
        </div>
      )}
    </>
  );
}
