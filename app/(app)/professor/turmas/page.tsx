import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CreateClassForm } from "./CreateClassForm";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Turmas" };

export default async function TurmasPage() {
  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, invite_code, created_at")
    .order("created_at", { ascending: false });

  const list = classes ?? [];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Turmas</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            {list.length > 0
              ? `${list.length} turma${list.length > 1 ? "s" : ""}`
              : "Crie uma turma e convide seus alunos por código."}
          </p>
        </div>
        <CreateClassForm />
      </div>

      {list.length === 0 ? (
        <EmptyState variant="turma" title="Nenhuma turma ainda" text="Crie sua primeira turma para começar a atribuir conteúdo aos alunos." />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {list.map((c) => (
            <Link key={c.id} href={`/professor/turmas/${c.id}`} className="flex flex-col gap-2.5 rounded-md border border-border bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:border-border-hover hover:bg-card-2">
              <div className="font-display text-base font-bold tracking-[-0.2px] text-foreground">{c.name}</div>
              <div className="mt-0.5 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">Código: {c.invite_code}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
