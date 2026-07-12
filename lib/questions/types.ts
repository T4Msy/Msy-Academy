/**
 * Shared question shape — a `questions` row (migration 0005) is reused by
 * Provas, Atividades e Banco de Questões via `exam_questions`/`activity_items`.
 */

export type QuestionType = "MULTIPLA" | "VF" | "DISCURSIVA";
export type Difficulty = "FACIL" | "MEDIO" | "DIFICIL";

export interface QuestionData {
  id: string;
  type: QuestionType;
  statement: string;
  options: { id: string; text: string }[] | null;
  correct_answer: string | string[];
  explanation: string | null;
  difficulty: Difficulty;
  tags: string[];
  position: number;
}

export interface NewQuestionInput {
  type: QuestionType;
  statement: string;
  options: { id: string; text: string }[] | null;
  correctAnswer: string | string[];
  explanation?: string | null;
  difficulty?: Difficulty;
  tags?: string[];
}
