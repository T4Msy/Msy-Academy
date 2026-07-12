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
      <div className="page-head">
        <div>
          <h1 className="page-title">Turmas</h1>
          <p className="page-subtitle">
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
        <div className="exam-grid">
          {list.map((c) => (
            <Link key={c.id} href={`/professor/turmas/${c.id}`} className="exam-card">
              <div className="exam-card-title">{c.name}</div>
              <div className="exam-meta">
                <span className="chip">Código: {c.invite_code}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
