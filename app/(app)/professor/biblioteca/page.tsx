import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { UploadMaterialForm } from "./UploadMaterialForm";
import { MaterialItem } from "./MaterialItem";
import { EmptyState } from "@/components/EmptyState";
import { parseBnccCodesParam } from "@/lib/questions/bncc";
import { parseTagsParam } from "@/lib/questions/tags";
import { findQuestionMaterialRefs } from "@/lib/questions/libraryFilter";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Biblioteca" };

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; tipo?: string; tags?: string; bncc?: string }>;
}) {
  const { busca, tipo, tags, bncc } = await searchParams;
  const supabase = await createClient();
  const tagFilters = parseTagsParam(tags); const bnccFilters = parseBnccCodesParam(bncc);
  const matchingRefs = tagFilters.length || bnccFilters.length ? await findQuestionMaterialRefs(tagFilters, bnccFilters) : [];

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
  if (tagFilters.length || bnccFilters.length) query = query.in("ref_id", matchingRefs);

  const [{ data: materials }, { data: classes }] = await Promise.all([
    query,
    supabase.from("classes").select("id, name").order("name"),
  ]);
  const list = materials ?? [];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Biblioteca</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            {list.length > 0
              ? `${list.length} item${list.length > 1 ? "ns" : ""}`
              : "Provas, atividades, planos de aula e arquivos ficam aqui, pesquisáveis."}
          </p>
        </div>
        <UploadMaterialForm classes={classes ?? []} />
      </div>

      <form className="mb-4 overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors" method="get">
        <div className="flex flex-col gap-3 p-5.5 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-[200px]">
            <label className="block text-sm font-semibold text-foreground" htmlFor="busca">Buscar</label>
            <input className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="busca" name="busca" defaultValue={busca ?? ""} placeholder="Palavra no título ou tag" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-[180px]">
            <label className="block text-sm font-semibold text-foreground" htmlFor="tipo">Tipo</label>
            <select className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="tipo" name="tipo" defaultValue={tipo ?? ""}>
              <option value="">Todos</option>
              <option value="EXAM">Provas</option>
              <option value="ACTIVITY">Atividades</option>
              <option value="LESSON_PLAN">Planos de aula</option>
              <option value="FILE">Arquivos</option>
            </select>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-[180px]"><label className="text-sm font-semibold text-foreground" htmlFor="tags">Tags</label><input id="tags" name="tags" defaultValue={tags ?? ""} placeholder="DNA, revisão" className="w-full rounded-sm border border-border bg-card px-3 py-2.5 text-md" /></div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-[180px]"><label className="text-sm font-semibold text-foreground" htmlFor="bncc">BNCC</label><input id="bncc" name="bncc" defaultValue={bncc ?? ""} placeholder="EF06MA07" className="w-full rounded-sm border border-border bg-card px-3 py-2.5 text-md uppercase" /></div>
          <button type="submit" className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-3 py-[7px] text-sm sm:w-auto">Filtrar</button>
        </div>
      </form>

      {list.length === 0 ? (
        <EmptyState variant="biblioteca" title="Nada por aqui ainda" text="Crie uma prova, atividade ou plano de aula — ou envie um arquivo — para começar." />
      ) : (
        <div className="flex flex-col gap-3.5">
          {list.map((m) => (
            <MaterialItem key={m.id} id={m.id} kind={m.kind} refId={m.ref_id} storagePath={m.storage_path} title={m.title} />
          ))}
        </div>
      )}
    </>
  );
}
