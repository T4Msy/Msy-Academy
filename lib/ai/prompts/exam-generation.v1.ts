/**
 * Versioned prompt + output schema for exam generation. The `mock` provider
 * (Fase 1) ignores this — it's here for the real provider adapter that
 * lands once a key is chosen, so the prompt has a stable, reviewable home
 * from day one instead of being embedded ad hoc in a route handler.
 */

export const EXAM_GENERATION_PROMPT_V1 = `
Você é um gerador de provas para professores brasileiros. Gere questões em
português, alinhadas ao nível, estilo e distribuição de dificuldade pedidos.
Se o campo "apostilaContent" estiver presente na entrada, baseie as questões
no conteúdo desse material — ele é a apostila/material de referência que o
professor enviou especificamente para isso; não ignore nem trate como
contexto secundário. Responda estritamente no formato JSON definido pelo
schema fornecido — sem nenhum texto fora do JSON.

Quando a entrada contiver "variationMode": true, gere uma variação equivalente
da prova enviada em "originalExam": preserve tema, disciplina, nível, estilo,
distribuição de dificuldade, tipos e quantidade de questões. Cada questão nova
deve avaliar a mesma habilidade da questão original na posição correspondente,
mas usar enunciados, contextos, valores e alternativas diferentes. Não copie
questões literalmente e não inclua comentários sobre a comparação no resultado.
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
          bnccCodes: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;
