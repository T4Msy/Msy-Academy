import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { LearningNextStep } from "@/components/student/LearningNextStep";

export const dynamic = "force-dynamic";

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: material }, { data: classRows }] = await Promise.all([
    supabase.from("materials").select("id, kind, title, storage_path, class_id, created_at").eq("id", id).eq("kind", "FILE").maybeSingle(),
    supabase.rpc("student_visible_classes"),
  ]);
  if (!material || !material.storage_path || !material.class_id) notFound();
  const classroom = ((classRows ?? []) as { id: string; name: string }[]).find((item) => item.id === material.class_id) ?? null;
  if (!classroom) notFound();
  const fileUrl = `/aluno/materiais/${id}/arquivo`;
  const isImage = material.kind === "IMAGE";
  const fileLabel = isImage ? "Imagem" : "PDF";

  return <><Link href={`/aluno/turmas/${classroom.id}?view=materials`} className="mb-5 inline-flex text-sm font-semibold text-muted-foreground hover:text-foreground">← {classroom.name}</Link><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">{material.title}</h1><p className="mt-1 text-sm text-muted-foreground">{classroom.name} · {fileLabel}</p></div><Button asChild><a href={`${fileUrl}?download=1`} download><Download aria-hidden />Baixar {isImage ? "imagem" : "PDF"}</a></Button></div><div className="overflow-hidden rounded-lg border border-border bg-card p-2 shadow-elevated"><iframe title={`Visualização de ${material.title}`} src={fileUrl} className="h-[min(75vh,900px)] w-full rounded-md bg-white" /></div><p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"><ExternalLink className="h-4 w-4" aria-hidden />Se a visualização não abrir, <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-text hover:underline">abra o arquivo em uma nova aba</a>.</p><LearningNextStep stage="material" materialId={material.id} events={[{ label: "Material aberto", status: "done" }, { label: "Próximo: revisão", status: "current" }]} /></>;
}
