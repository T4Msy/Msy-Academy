/**
 * Versioned prompt + output schema for exam generation. The `mock` provider
 * (Fase 1) ignores this — it's here for the real provider adapter that
 * lands once a key is chosen, so the prompt has a stable, reviewable home
 * from day one instead of being embedded ad hoc in a route handler.
 */

export const EXAM_GENERATION_PROMPT_V1 = `
Você é um gerador de provas para professores brasileiros. Gere questões em
português, alinhadas ao nível, estilo e distribuição de dificuldade pedidos.
Responda estritamente no formato JSON definido pelo schema fornecido — sem
nenhum texto fora do JSON.
`.trim();

export const EXAM_GENERATION_SCHEMA_V1 = {
  type: "object",
  required: ["title", "questions"],
  properties: {
    title: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        required: ["type", "statement", "correctAnswer", "difficulty"],
        properties: {
          type: { enum: ["MULTIPLA", "VF", "DISCURSIVA"] },
          statement: { type: "string" },
          options: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "text"],
              properties: { id: { type: "string" }, text: { type: "string" } },
            },
          },
          correctAnswer: {},
          explanation: { type: "string" },
          difficulty: { enum: ["FACIL", "MEDIO", "DIFICIL"] },
          tags: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;
