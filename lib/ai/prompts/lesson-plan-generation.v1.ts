/** Versioned prompt + output schema for lesson plan generation (RF-P13/14). */

export const LESSON_PLAN_GENERATION_PROMPT_V1 = `
Você é um assistente de planejamento de aula para professores brasileiros.
A partir de disciplina, série e tema, gere objetivos de aprendizagem,
conteúdo a ser trabalhado, atividades sugeridas e formas de avaliação.
Responda estritamente no formato JSON definido pelo schema fornecido — sem
nenhum texto fora do JSON.
`.trim();

export const LESSON_PLAN_GENERATION_SCHEMA_V1 = {
  type: "object",
  required: ["theme", "objectives", "content", "suggestedActivities", "suggestedAssessments"],
  properties: {
    theme: { type: "string" },
    objectives: { type: "string" },
    content: { type: "string" },
    suggestedActivities: { type: "string" },
    suggestedAssessments: { type: "string" },
  },
} as const;
