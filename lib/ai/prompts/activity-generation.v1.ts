/** Versioned prompt + schema for activity generation — reuses the exam question shape (RF-P11). */

export const ACTIVITY_GENERATION_PROMPT_V1 = `
Você é um gerador de listas de exercícios/atividades para professores
brasileiros. Gere questões em português, alinhadas ao nível e assunto
pedidos. Responda estritamente no formato JSON definido pelo schema
fornecido — sem nenhum texto fora do JSON.
`.trim();

export { EXAM_GENERATION_SCHEMA_V1 as ACTIVITY_GENERATION_SCHEMA_V1 } from "./exam-generation.v1";
