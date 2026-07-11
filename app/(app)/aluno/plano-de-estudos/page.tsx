import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StudyPlanWizard } from "./StudyPlanWizard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Plano de Estudos" };

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default async function PlanoDeEstudosPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("study_plans")
    .select("id, goal, exam_date, created_at")
    .order("created_at", { ascending: false });

  const list = plans ?? [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Plano de Estudos</h1>
          <p className="page-subtitle">
            {list.length > 0 ? `${list.length} plano${list.length > 1 ? "s" : ""}` : "Gere um cronograma personalizado para o seu objetivo."}
          </p>
        </div>
      </div>

      <StudyPlanWizard />

      {list.length > 0 && (
        <div className="exam-grid" style={{ marginTop: 16 }}>
          {list.map((p) => (
            <Link key={p.id} href={`/aluno/plano-de-estudos/${p.id}`} className="exam-card">
              <div className="exam-card-title">{p.goal}</div>
              <div className="exam-meta">
                {p.exam_date && <span className="chip">Prova: {formatDate(p.exam_date)}</span>}
              </div>
              <div className="exam-foot">
                <span>{formatDate(p.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
