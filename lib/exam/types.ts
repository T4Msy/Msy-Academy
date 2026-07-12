/**
 * Domain types for the exam generator module.
 * `ExamGenerationParams` mirrors, 1:1, the payload the legacy prototype built
 * in script.js buildPayload() — and maps directly to `exams.generation_params`
 * (JSONB) in the database (see docs/04-banco-de-dados.md).
 */

export type QuestionType = "multipla" | "vf" | "discursiva" | "mista";
export type Difficulty = "facil" | "medio" | "dificil";
export type ExamStyle =
  | "escolar"
  | "enem"
  | "vestibular"
  | "tecnico"
  | "desafiador";

export interface ExamGenerationParams {
  curso: string;
  tituloprova: string;
  pontosporquestao: number;
  materia: string;
  assunto: string;
  quantidade: number;
  nivel: Difficulty;
  tipo: QuestionType;
  estilo: ExamStyle;
  publico: string;
  incluirgabarito: boolean;
  versoes: number;
  distniveis: string;
  usarapostila: boolean;
  observacoesprofessor: string;
}

/** A persisted exam row — Fase 1: dados estruturados, não mais HTML cru (ver migration 0005). */
export interface ExamRow {
  id: string;
  tenant_id: string;
  author_id: string;
  title: string;
  course: string | null;
  style: string | null;
  subject_id: string | null;
  grade_level_id: string | null;
  generation_params: ExamGenerationParams;
  include_answer_key: boolean;
  status: "DRAFT" | "READY" | "ARCHIVED";
  version: number;
  ai_provider: string | null;
  ai_model: string | null;
  created_at: string;
}
