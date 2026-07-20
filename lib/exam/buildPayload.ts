import type {
  ExamGenerationParams,
  Difficulty,
  QuestionType,
  ExamStyle,
} from "./types";

type RawInput = Record<string, string | boolean | number | null | undefined>;

/**
 * Normalizes raw form values into a typed ExamGenerationParams.
 * Logic-preserving port of the legacy script.js buildPayload(): trims text,
 * parses integers, and forces `versoes: 1`. The result maps 1:1 to
 * `exams.generation_params` (JSONB).
 */
export function buildExamParams(raw: RawInput): ExamGenerationParams {
  const str = (k: string) => String(raw[k] ?? "").trim();
  const int = (k: string, fallback: number) => {
    const n = parseInt(String(raw[k] ?? ""), 10);
    return Number.isFinite(n) ? n : fallback;
  };
  const bool = (k: string) => raw[k] === true || raw[k] === "true" || raw[k] === "on";

  return {
    curso: str("curso"),
    tituloprova: str("tituloprova"),
    pontosporquestao: int("pontos", 1),
    materia: str("materia"),
    assunto: str("assunto"),
    serie: str("serie"),
    quantidade: int("quantidade", 10),
    nivel: (str("nivel") || "medio") as Difficulty,
    tipo: (str("tipo") || "multipla") as QuestionType,
    estilo: (str("estilo") || "escolar") as ExamStyle,
    publico: str("publico"),
    incluirgabarito: bool("gabarito"),
    versoes: 1,
    distniveis: str("distniveis"),
    usarapostila: bool("usarapostila"),
    observacoesprofessor: str("observacoesprofessor"),
  };
}
