import { z } from "zod";

/** Contrato único de geração de atividade (decisão nº 9 do ADR 13). */
export const activityGenerationSchema = z
  .object({
    tituloprova: z.string().trim().max(160, "Máximo de 160 caracteres."),
    materia: z.string().trim().max(120, "Máximo de 120 caracteres."),
    assunto: z.string().trim().max(200, "Máximo de 200 caracteres."),
    tipo: z.enum(["multipla", "vf", "discursiva", "mista"]),
    quantidade: z
      .string()
      .trim()
      .regex(/^\d+$/, "Use um número inteiro.")
      .refine((v) => Number(v) >= 1 && Number(v) <= 30, "Entre 1 e 30 questões."),
    nivel: z.enum(["facil", "medio", "dificil"]),
  })
  .refine((v) => v.tituloprova.length > 0 || v.materia.length > 0, {
    message: "Informe ao menos título ou matéria.",
    path: ["tituloprova"],
  });

export type ActivityGenerationInput = z.infer<typeof activityGenerationSchema>;
