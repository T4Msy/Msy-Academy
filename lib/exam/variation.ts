import { z } from "zod";

const generatedQuestionSchema = z
  .object({
    type: z.enum(["MULTIPLA", "VF", "DISCURSIVA"]),
    statement: z.string().trim().min(1),
    options: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).optional(),
    correctAnswer: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
    explanation: z.string().optional(),
    difficulty: z.enum(["FACIL", "MEDIO", "DIFICIL"]),
    tags: z.array(z.string()).optional(),
    bnccCodes: z.array(z.string()).optional(),
  })
  .superRefine((question, context) => {
    if (question.type !== "DISCURSIVA" && !question.options?.length) {
      context.addIssue({
        code: "custom",
        path: ["options"],
        message: "Alternativas obrigatórias.",
      });
    }
  });

export const generatedExamSchema = z.object({
  title: z.string().trim().min(1),
  questions: z.array(generatedQuestionSchema).min(1),
});

export const generatedExamVariationSchema = generatedExamSchema;

export type ExamVariation = z.infer<typeof generatedExamVariationSchema>;

function normalizedStatement(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

export function allVariationStatementsMatch(
  original: Array<{ statement: string }>,
  variation: Array<{ statement: string }>,
): boolean {
  return (
    original.length === variation.length &&
    original.every(
      (question, index) =>
        normalizedStatement(question.statement) ===
        normalizedStatement(variation[index]?.statement ?? ""),
    )
  );
}

export function nextVariationTitle(originalTitle: string, existingTitles: string[]): string {
  const base = `${originalTitle} — Variação`;
  const used = new Set(existingTitles);
  if (!used.has(base)) return base;

  let number = 2;
  while (used.has(`${base} ${number}`)) number += 1;
  return `${base} ${number}`;
}
