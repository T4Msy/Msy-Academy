import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/classes/format";

export const dynamic = "force-dynamic";

export default async function AlunoTurmaMateriaisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: materials } = await supabase
    .from("materials")
    .select("id, title, kind, created_at")
    .eq("class_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const rows = materials ?? [];

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4">
        <h2 className="font-display text-xl font-bold text-foreground">Materiais da turma</h2>
        <p className="mt-1 text-sm text-muted-foreground">Estude os conteúdos publicados para esta disciplina.</p>
      </div>
      {rows.length === 0 ? (
        <EmptyState variant="biblioteca" title="Esta turma ainda não possui materiais" text="Os materiais compartilhados pelo professor aparecerão aqui." />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((material) => (
            <Link key={material.id} href={`/aluno/materiais/${material.id}`} className="group rounded-md border border-border p-4 transition hover:-translate-y-0.5 hover:border-brand-border hover:bg-card-2">
              <div className="flex items-start justify-between gap-2">
                <BookOpen className="size-5 text-brand-text" aria-hidden />
                <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" aria-hidden />
              </div>
              <p className="mt-4 font-display text-base font-bold text-foreground">{material.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{material.kind === "FILE" ? "Arquivo" : material.kind} · {formatDate(material.created_at)}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
