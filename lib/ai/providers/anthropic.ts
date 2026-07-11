import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider } from "../provider";
import type { AITask, ChatMessage } from "../types";
import { EXAM_GENERATION_PROMPT_V1 } from "../prompts/exam-generation.v1";
import { ACTIVITY_GENERATION_PROMPT_V1 } from "../prompts/activity-generation.v1";
import { LESSON_PLAN_GENERATION_PROMPT_V1 } from "../prompts/lesson-plan-generation.v1";
import { GRADING_PROMPT_V1 } from "../prompts/grading.v1";
import { STUDY_PLAN_PROMPT_V1 } from "../prompts/study-plan.v1";
import { FLASHCARDS_PROMPT_V1 } from "../prompts/flashcards.v1";

/**
 * Real provider adapter — the first one that isn't `mock`/`echo`. Selected
 * via AI_PROVIDER=anthropic (see lib/ai/registry.ts); needs ANTHROPIC_API_KEY
 * set in the environment. The client is constructed lazily (not at module
 * load) so importing this file — which registry.ts always does, regardless
 * of which provider is active — never throws just because the key is unset
 * while running on `mock`.
 *
 * Model is configurable via ANTHROPIC_MODEL; defaults to claude-sonnet-5, a
 * deliberate choice over claude-opus-4-8 for this product specifically —
 * every generation task here is quota-metered per tenant (RF-IA02) and the
 * docs' own north star (RNF-E05) calls for cost-elastic routing, not the
 * most expensive tier by default. Override per deployment if quality on a
 * specific task warrants it.
 */
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const MAX_TOKENS = 8192;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

const TASK_PROMPTS: Partial<Record<AITask, string>> = {
  EXAM_GEN: EXAM_GENERATION_PROMPT_V1,
  ACTIVITY_GEN: ACTIVITY_GENERATION_PROMPT_V1,
  LESSON_PLAN: LESSON_PLAN_GENERATION_PROMPT_V1,
  GRADING: GRADING_PROMPT_V1,
  STUDY_PLAN: STUDY_PLAN_PROMPT_V1,
  FLASHCARDS: FLASHCARDS_PROMPT_V1,
};

const TUTOR_SYSTEM_PROMPT = `
Você é um tutor de IA para estudantes brasileiros. Explique conceitos com
clareza, adapte a linguagem ao nível da pergunta e responda em português.
Quando material de referência da turma do aluno for fornecido, baseie sua
resposta nele e diga quando a pergunta foge do que o material cobre — não
invente conteúdo que não está no material nem no seu conhecimento geral.
`.trim();

export const anthropicProvider: AIProvider = {
  id: "anthropic",

  async generateStructured<T>({
    task,
    schema,
    input,
  }: {
    task: AITask;
    schema: Record<string, unknown>;
    input: unknown;
  }) {
    const system = TASK_PROMPTS[task];
    if (!system) {
      throw new Error(`O provider anthropic ainda não implementa a tarefa "${task}".`);
    }

    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      output_config: { format: { type: "json_schema", schema } },
      messages: [{ role: "user", content: JSON.stringify(input) }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error(`O provider anthropic não retornou conteúdo de texto para a tarefa "${task}".`);
    }

    return {
      data: JSON.parse(textBlock.text) as T,
      tokensIn: response.usage.input_tokens,
      tokensOut: response.usage.output_tokens,
    };
  },

  async *streamChat({ messages, context }: { messages: ChatMessage[]; context?: string }) {
    const system = context?.trim()
      ? `${TUTOR_SYSTEM_PROMPT}\n\nMaterial de referência da turma:\n${context}`
      : TUTOR_SYSTEM_PROMPT;

    const stream = getClient().messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
  },

  async embed({ texts }: { texts: string[] }) {
    // Anthropic has no first-party embeddings endpoint (confirmed: the
    // Messages/Batches/Files/Token-Counting/Models APIs are the full
    // surface). `material_chunks.embedding` is `vector(8)` — explicitly
    // sized to the mock provider's placeholder output (migration 0012's own
    // comment), not a real embedding dimension. Reusing that same
    // deterministic hash here keeps RAG plumbing from crashing when this
    // provider is selected, but semantic retrieval quality stays placeholder
    // until a dedicated embeddings provider (e.g. Voyage AI) is wired in and
    // the column is resized to match its real output dimension.
    return texts.map((t) => {
      let h = 0;
      for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
      return Array.from({ length: 8 }, (_, i) => ((h >> i) % 100) / 100);
    });
  },
};
