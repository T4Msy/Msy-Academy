import { z } from "zod";

/**
 * Contrato único de geração de prova (decisão nº 9 do ADR 13): o MESMO
 * schema valida no client (RHF/zodResolver, UX instantânea) e no route
 * handler (segurança real), antes da normalização do buildExamParams.
 */
export const examGenerationSchema = z.object({
  curso: z.string().trim().max(120, "Máximo de 120 caracteres."),
  tituloprova: z.string().trim().min(1, "Informe o título da prova.").max(160, "Máximo de 160 caracteres."),
  materia: z.string().trim().min(1, "Informe a matéria.").max(120, "Máximo de 120 caracteres."),
  assunto: z.string().trim().min(1, "Informe o assunto/tema.").max(200, "Máximo de 200 caracteres."),
  publico: z.enum(["infantil", "fundamental", "medio", "graduacao", "tecnico", "concurso"]),
  estilo: z.enum(["escolar", "enem", "vestibular", "tecnico", "desafiador"]),
  observacoesprofessor: z.string().trim().max(2000, "Máximo de 2000 caracteres."),
  tipo: z.enum(["multipla", "vf", "discursiva", "mista"]),
  // Strings numéricas de propósito: inputs type=number entregam string e o
  // buildExamParams (server) já faz a normalização numérica — evita a
  // divergência input/output do z.coerce no typing do zodResolver.
  quantidade: z
    .string()
    .trim()
    .regex(/^\d+$/, "Use um número inteiro.")
    .refine((v) => Number(v) >= 1 && Number(v) <= 50, "Entre 1 e 50 questões."),
  pontos: z
    .string()
    .trim()
    .regex(/^\d+([.,]\d+)?$/, "Número inválido.")
    .refine((v) => Number(v.replace(",", ".")) <= 100, "Máximo de 100 pontos."),
  nivel: z.enum(["facil", "medio", "dificil"]),
  distniveis: z.enum(["40/40/20", "30/50/20", "25/50/25", "20/40/40"]),
  usarapostila: z.boolean(),
  gabarito: z.boolean(),
});

export type ExamGenerationInput = z.infer<typeof examGenerationSchema>;
