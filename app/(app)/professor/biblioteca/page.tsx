import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { UploadMaterialForm } from "./UploadMaterialForm";
import { MaterialItem } from "./MaterialItem";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Biblioteca" };

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; tipo?: string }>;
}) {
  const { busca, tipo } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("materials")
    .select("id, kind, ref_id, storage_path, title, created_at")
    .order("created_at", { ascending: false });

  if (tipo) query = query.eq("kind", tipo);
  // type: "plain" (plainto_tsquery) — raw to_tsquery (the default) requires
  // explicit operators between words and errors on ordinary multi-word
  // input like "prova biologia"; only worked in earlier testing because a
  // single-word query happens to be valid raw tsquery syntax too.
  if (busca) query = query.textSearch("search_vector", busca, { type: "plain", config: "portuguese" });

  const [{ data: materials }, { data: classes }] = await Promise.all([
    query,
    supabase.from("classes").select("id, name").order("name"),
  ]);
  const list = materials ?? [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Biblioteca</h1>
          <p className="page-subtitle">
            {list.length > 0
              ? `${list.length} item${list.length > 1 ? "ns" : ""}`
              : "Provas, atividades, planos de aula e arquivos ficam aqui, pesquisáveis."}
          </p>
        </div>
        <UploadMaterialForm classes={classes ?? []} />
      </div>

      <form className="card" method="get" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", gap: 12 }}>
          <div className="form-field" style={{ minWidth: 200 }}>
            <label className="field-label" htmlFor="busca">Buscar</label>
            <input className="input" id="busca" name="busca" defaultValue={busca ?? ""} placeholder="Palavra no título ou tag" />
          </div>
          <div className="form-field" style={{ minWidth: 180 }}>
            <label className="field-label" htmlFor="tipo">Tipo</label>
            <select className="input" id="tipo" name="tipo" defaultValue={tipo ?? ""}>
              <option value="">Todos</option>
              <option value="EXAM">Provas</option>
              <option value="ACTIVITY">Atividades</option>
              <option value="LESSON_PLAN">Planos de aula</option>
              <option value="FILE">Arquivos</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Filtrar</button>
        </div>
      </form>

      {list.length === 0 ? (
        <EmptyState variant="biblioteca" title="Nada por aqui ainda" text="Crie uma prova, atividade ou plano de aula — ou envie um arquivo — para começar." />
      ) : (
        <div className="questions-stack">
          {list.map((m) => (
            <MaterialItem key={m.id} id={m.id} kind={m.kind} refId={m.ref_id} storagePath={m.storage_path} title={m.title} />
          ))}
        </div>
      )}
    </>
  );
}
