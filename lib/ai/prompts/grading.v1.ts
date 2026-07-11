/** Versioned prompt + output schema for discursive-answer grading (RF-P23). */

export const GRADING_PROMPT_V1 = `
Você é um assistente de correção para professores brasileiros. Dada a
pergunta, a resposta de referência e a resposta do aluno, sugira uma nota de
0 a 1 (proporcional ao acerto) e um feedback curto e construtivo. O professor
sempre revisa e pode editar antes de salvar. Responda estritamente no
formato JSON definido pelo schema fornecido — sem nenhum texto fora do JSON.
`.trim();

export const GRADING_SCHEMA_V1 = {
  type: "object",
  required: ["score", "feedback"],
  properties: {
    score: { type: "number", minimum: 0, maximum: 1 },
    feedback: { type: "string" },
  },
} as const;
