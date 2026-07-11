import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RenameDeleteMenu } from "@/components/shell/RenameDeleteMenu";
import { renameLessonPlan, deleteLessonPlan } from "./actions";

export const dynamic = "force-dynamic";

export default async function PlanoDeAulaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("lesson_plans")
    .select("id, theme, objectives, content, suggested_activities, suggested_assessments, created_at")
    .eq("id", id)
    .single();
  if (!plan) notFound();

  const renameAction = renameLessonPlan.bind(null, id);
  const deleteAction = deleteLessonPlan.bind(null, id);

  const sections = [
    { title: "Objetivos", content: plan.objectives },
    { title: "Conteúdo", content: plan.content },
    { title: "Atividades sugeridas", content: plan.suggested_activities },
    { title: "Avaliação sugerida", content: plan.suggested_assessments },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <Link href="/professor/biblioteca" className="sidebar-link" style={{ padding: "0 0 8px", display: "inline-block" }}>
            ← Biblioteca
          </Link>
          <h1 className="page-title">{plan.theme}</h1>
        </div>
        <RenameDeleteMenu currentTitle={plan.theme} onRename={renameAction} onDelete={deleteAction} redirectAfterDelete="/professor/biblioteca" />
      </div>

      <div className="questions-stack">
        {sections.map((s) => (
          <section key={s.title} className="card">
            <div className="card-header">
              <div className="card-title-group">
                <h2 className="card-title">{s.title}</h2>
              </div>
            </div>
            <div className="card-body">
              <p className="question-statement" style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>
                {s.content || "—"}
              </p>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
