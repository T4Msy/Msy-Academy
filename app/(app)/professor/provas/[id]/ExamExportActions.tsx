"use client";

import { useState } from "react";
import type { QuestionData } from "./ExamQuestionsEditor";

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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Real, package-based exports (no CDN scripts, DT-10) generated directly
 * from the structured question data — the same data the editor shows, so
 * "what you edited is what you export".
 */
export function ExamExportActions({
  examTitle,
  questions,
  includeAnswerKey,
}: {
  examTitle: string;
  questions: QuestionData[];
  includeAnswerKey: boolean;
}) {
  const [busy, setBusy] = useState<null | "pdf" | "word">(null);
  const [error, setError] = useState<string | null>(null);

  const exam = { title: examTitle, questions, includeAnswerKey };
  const filename = slugify(examTitle);

  async function exportPdf() {
    setBusy("pdf");
    setError(null);
    try {
      const [{ pdf }, { ExamPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/exam/export/pdfDocument"),
      ]);
      const blob = await pdf(<ExamPdfDocument exam={exam} />).toBlob();
      downloadBlob(blob, `${filename}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gerar PDF.");
    } finally {
      setBusy(null);
    }
  }

  async function exportWord() {
    setBusy("word");
    setError(null);
    try {
      const { buildExamDocxBlob } = await import("@/lib/exam/export/docxDocument");
      const blob = await buildExamDocxBlob(exam);
      downloadBlob(blob, `${filename}.docx`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gerar Word.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="result-actions-wrap">
      <div className="result-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={exportPdf} disabled={busy !== null}>
          {busy === "pdf" ? <span className="btn-loader" /> : "PDF"}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={exportWord} disabled={busy !== null}>
          {busy === "word" ? <span className="btn-loader" /> : "Word"}
        </button>
      </div>
      {error && <div className="notice notice--error result-actions-error">{error}</div>}
    </div>
  );
}
