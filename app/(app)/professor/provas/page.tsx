import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Minhas Provas" };

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default async function ProvasPage() {
  const supabase = await createClient();

  const { data: exams } = await supabase
    .from("exams")
    .select("id, title, course, style, version, ai_provider, include_answer_key, created_at")
    .order("created_at", { ascending: false });

  const list = exams ?? [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Minhas Provas</h1>
          <p className="page-subtitle">
            {list.length > 0
              ? `${list.length} prova${list.length > 1 ? "s" : ""} salva${list.length > 1 ? "s" : ""}`
              : "Suas provas geradas ficam salvas aqui."}
          </p>
        </div>
        <Link href="/professor/provas/nova" className="btn btn-primary">
          <svg fill="none" width="16" height="16" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Nova Prova
        </Link>
      </div>

      {list.length === 0 ? (
        <EmptyState
          variant="biblioteca"
          title="Nenhuma prova ainda"
          text="Gere sua primeira prova com IA. As questões ficam salvas e editáveis, prontas para exportar e reutilizar."
          action={
            <Link href="/professor/provas/nova" className="btn btn-primary">
              Gerar primeira prova
            </Link>
          }
        />
      ) : (
        <div className="exam-grid">
          {list.map((exam) => (
            <Link key={exam.id} href={`/professor/provas/${exam.id}`} className="exam-card">
              <div className="exam-card-title">{exam.title || "Prova sem título"}</div>
              <div className="exam-meta">
                {exam.course && <span className="chip">{exam.course}</span>}
                {exam.style && <span className="chip">{exam.style}</span>}
                {exam.version > 1 && <span className="chip">Versão {exam.version}</span>}
                {exam.include_answer_key && <span className="chip">Com gabarito</span>}
              </div>
              <div className="exam-foot">
                <span>{exam.ai_provider ?? "IA"}</span>
                <span>{formatDate(exam.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
