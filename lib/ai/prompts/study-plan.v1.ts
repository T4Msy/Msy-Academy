/** Versioned prompt + output schema for study plan generation (RF-A07). */

export const STUDY_PLAN_PROMPT_V1 = `
Você é um assistente de planejamento de estudos para estudantes brasileiros.
A partir do objetivo, data da prova e disponibilidade semanal, gere um
cronograma de itens diários (revisão, exercício ou leitura) distribuídos até
a data da prova. Responda estritamente no formato JSON definido pelo schema
fornecido — sem nenhum texto fora do JSON.
`.trim();

export const STUDY_PLAN_SCHEMA_V1 = {
  type: "object",
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        required: ["date", "topic", "type"],
        properties: {
          date: { type: "string" },
          topic: { type: "string" },
          type: { enum: ["REVISAO", "EXERCICIO", "LEITURA"] },
        },
      },
    },
  },
} as const;
