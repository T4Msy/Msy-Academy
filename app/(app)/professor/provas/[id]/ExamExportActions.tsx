"use client";

import { useState } from "react";
import type { QuestionData } from "@/lib/questions/types";

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
      setError(err instanceof Error ? err.message : "Não conseguimos criar o arquivo em PDF. Tente novamente.");
    } finally {
      setBusy(null);
    }
  }

  async function exportWord() {
    setBusy("word");
    setError(null);
    try {
      const { buildSchoolExamDocxBlob } = await import("@/lib/exam/export/schoolDocxDocument");
      const blob = await buildSchoolExamDocxBlob(exam);
      downloadBlob(blob, `${filename}.docx`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não conseguimos criar o arquivo do Word. Tente novamente.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" onClick={exportPdf} disabled={busy !== null}>
          {busy === "pdf" ? <span className="inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-black/20 border-t-brand-ink" /> : "PDF"}
        </button>
        <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" onClick={exportWord} disabled={busy !== null}>
          {busy === "word" ? <span className="inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-black/20 border-t-brand-ink" /> : "Word"}
        </button>
      </div>
      {error && <div className="rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text mt-0 max-w-[260px] px-3 py-2 text-right text-sm">{error}</div>}
    </div>
  );
}
