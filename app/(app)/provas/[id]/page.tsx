import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExamActions } from "./ExamActions";
import type { ExamRow } from "@/lib/exam/types";

export const dynamic = "force-dynamic";

const PREVIEW_STYLE = `<style>
  * { box-sizing: border-box; }
  body { background:#fff !important; color:#111 !important; font-family:Arial,sans-serif !important; padding:20px; margin:0; }
</style>`;

function slugify(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "prova"
  );
}

export default async function ExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS ensures the professor can only read their own exams.
  const { data } = await supabase
    .from("exams")
    .select(
      "id, title, course, style, generated_html, include_answer_key, ai_provider, created_at",
    )
    .eq("id", id)
    .single();

  if (!data) notFound();

  const exam = data as Pick<
    ExamRow,
    "id" | "title" | "course" | "style" | "generated_html" | "include_answer_key" | "ai_provider" | "created_at"
  >;

  const filename = slugify(exam.title);
  const srcDoc = `${PREVIEW_STYLE}${exam.generated_html}`;

  return (
    <>
      <div className="page-head">
        <div>
          <Link href="/dashboard" className="nav-link" style={{ paddingLeft: 0 }}>
            ← Minhas Provas
          </Link>
          <h1 className="page-title">{exam.title || "Prova sem título"}</h1>
          <div className="exam-meta">
            {exam.course && <span className="chip">{exam.course}</span>}
            {exam.style && <span className="chip">{exam.style}</span>}
            {exam.ai_provider && <span className="chip">{exam.ai_provider}</span>}
            {exam.include_answer_key && <span className="chip">Com gabarito</span>}
          </div>
        </div>
        <ExamActions html={exam.generated_html} iframeId="preview" filename={filename} />
      </div>

      <section className="card result-card">
        <div className="card-body">
          <iframe
            id="preview"
            className="preview-frame"
            title="Preview da prova gerada"
            srcDoc={srcDoc}
          />
        </div>
      </section>
    </>
  );
}
