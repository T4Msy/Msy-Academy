import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { StudentMaterialsClient, type StudentMaterial } from "./StudentMaterialsClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Conteúdos" };

export default async function MateriaisPage({ searchParams }: { searchParams: Promise<{ classId?: string }> }) {
  const { classId } = await searchParams;
  const supabase = await createClient();
  const [{ data: materials, error }, { data: classRows }] = await Promise.all([
    supabase.from("materials").select("id, kind, title, storage_path, class_id, created_at").eq("kind", "FILE").not("class_id", "is", null).order("created_at", { ascending: false }),
    supabase.rpc("student_visible_classes"),
  ]);
  if (error && process.env.NODE_ENV === "development") console.error("[student/materials] falha ao carregar materiais", { code: error.code, message: error.message, details: error.details, hint: error.hint });
  const classNameById = new Map(((classRows ?? []) as { id: string; name: string }[]).map((classroom) => [classroom.id, classroom.name]));
  const list: StudentMaterial[] = (materials ?? []).flatMap((material) => { const className = material.class_id ? classNameById.get(material.class_id) : null; if (!className || !material.class_id) return []; return [{ id: material.id, title: material.title, kind: material.kind, classId: material.class_id, className, createdAt: material.created_at, storagePath: material.storage_path }]; });
  return <><PageHeader title="Materiais" subtitle="Consulte os materiais compartilhados com suas turmas." />{error ? <div role="alert" className="rounded-md border border-danger-border bg-danger-dim p-4 text-sm text-danger-text">Não foi possível carregar os materiais. Tente novamente.</div> : <StudentMaterialsClient materials={list} initialClassId={classId ?? "all"} />}</>;
}
