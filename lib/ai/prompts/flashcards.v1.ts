/** Versioned prompt + output schema for flashcard generation from material (RF-A09). */

export const FLASHCARDS_PROMPT_V1 = `
Você é um assistente de estudos que cria flashcards a partir de um material.
Cada flashcard tem uma pergunta curta (front) e uma resposta objetiva (back).
Responda estritamente no formato JSON definido pelo schema fornecido — sem
nenhum texto fora do JSON.
`.trim();

export const FLASHCARDS_SCHEMA_V1 = {
  type: "object",
  required: ["title", "cards"],
  properties: {
    title: { type: "string" },
    cards: {
      type: "array",
      items: {
        type: "object",
        required: ["front", "back"],
        properties: {
          front: { type: "string" },
          back: { type: "string" },
        },
      },
    },
  },
} as const;
