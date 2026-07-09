import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ExamRow } from "@/lib/exam/types";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // RLS scopes this to the professor's own tenant automatically.
  const { data: exams } = await supabase
    .from("exams")
    .select(
      "id, title, course, style, ai_provider, include_answer_key, created_at",
    )
    .order("created_at", { ascending: false });

  const list = (exams ?? []) as Pick<
    ExamRow,
    "id" | "title" | "course" | "style" | "ai_provider" | "include_answer_key" | "created_at"
  >[];

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
        <Link href="/provas/nova" className="btn btn-primary">
          <svg fill="none" width="16" height="16" viewBox="0 0 24 24">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Nova Prova
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg fill="none" width="26" height="26" viewBox="0 0 24 24">
              <path
                d="M7 3h10a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M8 9h8M8 13h8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="empty-title">Nenhuma prova ainda</div>
          <p className="empty-text">
            Gere sua primeira prova com IA. Ela será salva automaticamente e ficará
            disponível aqui para editar, exportar e reimprimir.
          </p>
          <Link href="/provas/nova" className="btn btn-primary">
            Gerar primeira prova
          </Link>
        </div>
      ) : (
        <div className="exam-grid">
          {list.map((exam) => (
            <Link key={exam.id} href={`/provas/${exam.id}`} className="exam-card">
              <div className="exam-card-title">{exam.title || "Prova sem título"}</div>
              <div className="exam-meta">
                {exam.course && <span className="chip">{exam.course}</span>}
                {exam.style && <span className="chip">{exam.style}</span>}
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
