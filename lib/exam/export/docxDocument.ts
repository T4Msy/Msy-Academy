import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import type { ExportExam } from "./types";

/**
 * Real .docx generation from structured question data (`docx` package),
 * replacing the CDN-loaded html-docx-js (DT-10).
 */
export async function buildExamDocxBlob(exam: ExportExam): Promise<Blob> {
  const children: Paragraph[] = [
    new Paragraph({ text: exam.title || "Prova", heading: HeadingLevel.HEADING_1 }),
  ];

  exam.questions.forEach((q, i) => {
    children.push(
      new Paragraph({
        spacing: { before: 200 },
        children: [new TextRun({ text: `Questão ${i + 1}`, bold: true })],
      }),
      new Paragraph({ text: q.statement }),
    );

    if (q.type !== "DISCURSIVA" && q.options) {
      q.options.forEach((opt) => {
        children.push(new Paragraph({ text: `${opt.id}) ${opt.text}`, indent: { left: 360 } }));
      });
    } else if (q.type === "DISCURSIVA") {
      children.push(new Paragraph({ text: "_".repeat(60), indent: { left: 360 } }));
    }
  });

  if (exam.includeAnswerKey) {
    children.push(
      new Paragraph({ text: "Gabarito", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
    );
    exam.questions.forEach((q, i) => {
      const answer = Array.isArray(q.correct_answer) ? q.correct_answer.join(", ") : q.correct_answer;
      children.push(new Paragraph({ text: `${i + 1}. ${answer}` }));
    });
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBlob(doc);
}
