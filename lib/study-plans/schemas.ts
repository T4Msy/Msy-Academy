import { z } from "zod";

/** Contrato único de geração de plano de estudos (decisão nº 9 do ADR 13). */
export const studyPlanGenerationSchema = z.object({
  goal: z.string().trim().min(1, "Informe seu objetivo.").max(300, "Máximo de 300 caracteres."),
  // <input type="date"> entrega "" quando vazio; o route trata null/"" como sem data.
  examDate: z
    .string()
    .trim()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Data inválida."),
});

export type StudyPlanGenerationInput = z.infer<typeof studyPlanGenerationSchema>;
