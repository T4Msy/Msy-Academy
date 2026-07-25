import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { UploadMaterialForm } from "./UploadMaterialForm";
import { EmptyState } from "@/components/EmptyState";
import { STUDY_MATERIAL_KIND } from "@/lib/materials/studyMaterial";
import { ProfessorLibraryClient } from "./ProfessorLibraryClient";
import type { LibraryMaterial } from "@/lib/materials/libraryGrouping";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Biblioteca" };

export default async function BibliotecaPage({ searchParams }: { searchParams: Promise<{ busca?: string }> }) {
  const { busca } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase.from("materials").select("id, kind, ref_id, storage_path, title, created_at, class_id, owner_id").eq("kind", STUDY_MATERIAL_KIND).order("created_at", { ascending: false });
  if (busca) query = query.textSearch("search_vector", busca, { type: "plain", config: "portuguese" });

  const [{ data: materials, error }, { data: classes }] = await Promise.all([
    query,
    supabase.from("classes").select("id, name").order("name"),
  ]);
  if (error && process.env.NODE_ENV === "development") console.error("[professor/library] falha ao carregar materiais", { code: error.code, message: error.message, details: error.details, hint: error.hint });

  const classNameById = new Map((classes ?? []).map((item) => [item.id, item.name]));
  const list: LibraryMaterial[] = (materials ?? []).map((material) => ({
    id: material.id,
    kind: material.kind,
    refId: material.ref_id,
    storagePath: material.storage_path,
    title: material.title,
    createdAt: material.created_at,
    classId: material.class_id,
    className: material.class_id ? classNameById.get(material.class_id) ?? "Turma" : null,
    ownerId: material.owner_id,
    isOwner: material.owner_id === user?.id,
  }));

  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Biblioteca</h1><p className="mt-1 text-[13.5px] text-muted-foreground">{list.length > 0 ? `${list.length} material${list.length > 1 ? "is" : ""}` : "Organize e compartilhe seus materiais com as turmas."}</p></div><UploadMaterialForm classes={classes ?? []} /></div>
    <form className="mb-4 overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors" method="get"><div className="flex flex-col gap-3 p-5.5 sm:flex-row sm:flex-wrap sm:items-end"><div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-[200px]"><label className="block text-sm font-semibold text-foreground" htmlFor="busca">Buscar</label><input className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="busca" name="busca" defaultValue={busca ?? ""} placeholder="Título ou tag" /></div><button type="submit" className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-primary px-3 py-[7px] text-sm font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] transition-all outline-none hover:-translate-y-px hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-brand-glow sm:w-auto">Filtrar</button></div></form>
    {error ? <div role="alert" className="rounded-lg border border-danger-border bg-danger-dim p-4 text-sm text-danger-text">Não foi possível carregar a Biblioteca. Tente novamente.</div> : list.length === 0 ? <EmptyState variant="biblioteca" title="Nenhum material salvo" text="Adicione materiais para organizá-los e compartilhá-los com suas turmas." /> : <ProfessorLibraryClient materials={list} />}
  </>;
}
