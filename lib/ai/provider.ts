import type { AITask, ChatMessage, GenerateStructuredResult } from "./types";

/**
 * The contract every AI provider adapter implements. Locked before any real
 * provider exists (Fase 1 ships only `mock`) so adding OpenAI/Anthropic/
 * Gemini/etc. later — or a second adapter, per the "não acoplar a um
 * provedor" requirement — never requires touching call sites.
 *
 * - `generateStructured` covers exams/activities/lesson plans/simulados/
 *   grading suggestions — anything that returns validable JSON.
 * - `streamChat` is unused until Fase 4 (Tutor IA), but the shape is fixed
 *   now.
 * - `embed` is unused until Fase 4 (RAG); the provider chosen must offer
 *   embeddings, or the registry needs a separate embeddings provider.
 */
export interface AIProvider {
  readonly id: string;
  /** Local/test providers do not consume paid AI quota or require admin usage logging. */
  readonly metered?: boolean;

  generateStructured<T>(args: {
    task: AITask;
    schema: Record<string, unknown>;
    input: unknown;
  }): Promise<GenerateStructuredResult<T>>;

  streamChat(args: {
    messages: ChatMessage[];
    context?: string;
    /** Called once, after the stream finishes, with real usage if the provider has it (mock/echo report a deterministic estimate). */
    onUsage?: (usage: { tokensIn: number; tokensOut: number }) => void;
  }): AsyncIterable<string>;

  embed(args: { texts: string[] }): Promise<number[][]>;
}
