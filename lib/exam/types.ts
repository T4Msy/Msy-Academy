/**
 * Domain types for the exam generator module.
 * `ExamGenerationParams` mirrors, 1:1, the payload the legacy prototype built
 * in script.js buildPayload() — and maps directly to `exams.generation_params`
 * (JSONB) in the database (see docs/04-banco-de-dados.md).
 */

export type IaProvider =
  | "perplexity"
  | "llama"
  | "deepseek"
  | "chatgpt"
  | "gemini";

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
  ia: IaProvider;
  observacoesprofessor: string;
}

/** A persisted exam row (subset of the target schema for Slice 1). */
export interface ExamRow {
  id: string;
  tenant_id: string;
  author_id: string;
  title: string;
  course: string | null;
  style: string | null;
  generation_params: ExamGenerationParams;
  generated_html: string;
  include_answer_key: boolean;
  status: "DRAFT" | "READY" | "ARCHIVED";
  ai_provider: string | null;
  ai_model: string | null;
  created_at: string;
}
