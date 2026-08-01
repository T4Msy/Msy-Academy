import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { MaterialItem } from "@/app/(app)/professor/biblioteca/MaterialItem";
import { UploadMaterialForm } from "./UploadMaterialForm";

export const dynamic = "force-dynamic";

export default async function ProfessorTurmaMateriaisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: klass }, { data: materials }] = await Promise.all([
    supabase.from("classes").select("id, owner_id").eq("id", id).maybeSingle(),
    supabase.from("materials").select("id, kind, ref_id, storage_path, title, owner_id").eq("class_id", id).is("deleted_at", null).order("created_at", { ascending: false }),
  ]);
  if (!klass || user?.id !== klass.owner_id) notFound();

  const rows = materials ?? [];

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Materiais</h2>
          <p className="mt-1 text-sm text-muted-foreground">Apostilas e PDFs desta turma.</p>
        </div>
        <UploadMaterialForm classId={id} />
      </div>
      {rows.length === 0 ? (
        <EmptyState variant="biblioteca" title="Esta turma ainda não possui materiais" text="Envie apostilas e PDFs para que os alunos matriculados possam acessá-los." />
      ) : (
        <div className="flex flex-col gap-3.5">
          {rows.map((material) => (
            <MaterialItem
              key={material.id}
              id={material.id}
              kind={material.kind}
              refId={material.ref_id}
              storagePath={material.storage_path}
              title={material.title}
              isOwner={material.owner_id === user?.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}
