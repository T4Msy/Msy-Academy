import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: material } = await supabase.from("materials").select("id, kind, title, storage_path, created_at, classes(id, name)").eq("id", id).eq("kind", "FILE").maybeSingle();
  if (!material || !material.storage_path) notFound();
  const classroom = material.classes as unknown as { id: string; name: string } | null;
  if (!classroom) notFound();
  const { data: signed, error } = await supabase.storage.from("materials").createSignedUrl(material.storage_path, 300);
  if (error || !signed?.signedUrl) notFound();
  return <><Link href="/aluno/materiais" className="mb-5 inline-flex text-sm font-semibold text-muted-foreground hover:text-foreground">← Materiais</Link><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">{material.title}</h1><p className="mt-1 text-sm text-muted-foreground">{classroom.name} · PDF</p></div><Button asChild><a href={signed.signedUrl} download target="_blank" rel="noopener noreferrer"><Download aria-hidden />Baixar PDF</a></Button></div><div className="overflow-hidden rounded-lg border border-border bg-card p-2 shadow-elevated"><iframe title={`Visualização de ${material.title}`} src={signed.signedUrl} className="h-[min(75vh,900px)] w-full rounded-md bg-white" /></div><p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground"><ExternalLink className="h-4 w-4" aria-hidden />Se a visualização não abrir, use o botão “Baixar PDF”.</p></>;
}
