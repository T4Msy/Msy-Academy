/**
 * Domain types for the AI Orchestration layer. `Question` is the single
 * structured shape produced by any generation task (exam, activity,
 * simulado) and stored 1:1 in `questions` — no per-feature adaptation.
 */

export type QuestionType = "MULTIPLA" | "VF" | "DISCURSIVA";
export type Difficulty = "FACIL" | "MEDIO" | "DIFICIL";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  type: QuestionType;
  statement: string;
  options?: QuestionOption[];
  correctAnswer: string | string[];
  explanation?: string;
  difficulty: Difficulty;
  tags?: string[];
}

export interface GeneratedExam {
  title: string;
  questions: Question[];
}

/** Same shape as GeneratedExam — reused verbatim for activities (RF-P11). */
export type GeneratedActivity = GeneratedExam;

export interface GeneratedLessonPlan {
  theme: string;
  objectives: string;
  content: string;
  suggestedActivities: string;
  suggestedAssessments: string;
}

export interface GradingSuggestion {
  score: number;
  feedback: string;
}

export interface GeneratedStudyPlanItem {
  date: string; // ISO date (YYYY-MM-DD)
  topic: string;
  type: "REVISAO" | "EXERCICIO" | "LEITURA";
}

export interface GeneratedStudyPlan {
  items: GeneratedStudyPlanItem[];
}

export interface GeneratedFlashcard {
  front: string;
  back: string;
}

export interface GeneratedFlashcardDeck {
  title: string;
  cards: GeneratedFlashcard[];
}

/** Mirrors `ai_interactions.feature` (migration 0005). */
export type AITask =
  | "EXAM_GEN"
  | "ACTIVITY_GEN"
  | "LESSON_PLAN"
  | "TUTOR"
  | "GRADING"
  | "FLASHCARDS"
  | "STUDY_PLAN";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GenerateStructuredResult<T> {
  data: T;
  tokensIn: number;
  tokensOut: number;
}
