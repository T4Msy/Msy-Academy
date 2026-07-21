import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import type { ExportExam } from "./types";

const PAGE_MARGIN = 1134;
const CONTENT_WIDTH = 9638;
const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: "444444" };

function line(text: string, bold = false) {
  return new TextRun({ text, bold, font: "Arial", size: 22 });
}

function formCell(text: string, width: number) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [new Paragraph({ spacing: { after: 0 }, children: [line(text)] })],
  });
}

function answerLines(count = 4) {
  return Array.from({ length: count }, () => new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "808080", space: 1 } },
    spacing: { before: 130, after: 130 },
  }));
}

/** Generates a print-ready A4 school exam. */
export async function buildSchoolExamDocxBlob(exam: ExportExam): Promise<Blob> {
  const children: Array<Paragraph | Table> = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: "AVALIAÇÃO", bold: true, font: "Arial", size: 30 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 220 }, children: [new TextRun({ text: exam.title || "Prova", bold: true, font: "Arial", size: 26 })] }),
    new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({ children: [formCell("Escola: __________________________________________________", CONTENT_WIDTH)] }),
        new TableRow({ children: [formCell("Aluno(a): _________________________________________________", 6800), formCell("Turma: __________", 2838)] }),
        new TableRow({ children: [formCell("Professor(a): _____________________________________________", 6800), formCell("Data: ____/____/______", 2838)] }),
      ],
    }),
    new Paragraph({ spacing: { before: 220, after: 90 }, children: [line("Instruções", true)] }),
    new Paragraph({ spacing: { after: 180, line: 276 }, children: [line("Leia cada questão com atenção antes de responder. Use caneta azul ou preta. Revise suas respostas antes de entregar.")] }),
  ];

  exam.questions.forEach((question, index) => {
    children.push(new Paragraph({ spacing: { before: 180, after: 80, line: 276 }, children: [line(`${index + 1}. `, true), line(question.statement)] }));
    if (question.type !== "DISCURSIVA" && question.options) {
      question.options.forEach((option) => {
        children.push(new Paragraph({ indent: { left: 360 }, spacing: { after: 60, line: 276 }, children: [line(`${option.id}) ${option.text}`)] }));
      });
    } else if (question.type === "DISCURSIVA") {
      children.push(...answerLines());
    }
  });

  if (exam.includeAnswerKey) {
    children.push(
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 260 }, children: [new TextRun({ text: "GABARITO", bold: true, font: "Arial", size: 28 })] }),
    );
    exam.questions.forEach((question, index) => {
      const answer = Array.isArray(question.correct_answer) ? question.correct_answer.join(", ") : question.correct_answer;
      children.push(new Paragraph({ spacing: { after: 90 }, children: [line(`${index + 1}. `, true), line(answer)] }));
    });
  }

  const doc = new Document({
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: PAGE_MARGIN, right: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN } } },
      footers: {
        default: new Footer({
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Página ", font: "Arial", size: 18 }), new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18 })] })],
        }),
      },
      children,
    }],
  });
  return Packer.toBlob(doc);
}
