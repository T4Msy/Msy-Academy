import { z } from "zod";

/** Contrato único de geração de plano de aula (decisão nº 9 do ADR 13). */
export const lessonPlanGenerationSchema = z.object({
  disciplina: z.string().trim().max(120, "Máximo de 120 caracteres."),
  serie: z.string().trim().max(60, "Máximo de 60 caracteres."),
  tema: z.string().trim().min(1, "Informe o tema da aula.").max(200, "Máximo de 200 caracteres."),
  observacoes: z.string().trim().max(2000, "Máximo de 2000 caracteres."),
});

export type LessonPlanGenerationInput = z.infer<typeof lessonPlanGenerationSchema>;
