/** Shared input shape for both the PDF and Word exporters — mirrors QuestionData. */
export interface ExportQuestion {
  id: string;
  type: "MULTIPLA" | "VF" | "DISCURSIVA";
  statement: string;
  options: { id: string; text: string }[] | null;
  correct_answer: string | string[];
  explanation: string | null;
  difficulty: "FACIL" | "MEDIO" | "DIFICIL";
}

export interface ExportExam {
  title: string;
  questions: ExportQuestion[];
  includeAnswerKey: boolean;
}
