import type { AIProvider } from "../provider";
import type { AITask, ChatMessage, GenerateStructuredResult } from "../types";

type GeminiEnvelope<T> = { data: T; tokensIn?: number; tokensOut?: number };

function functionUrl(): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) throw new Error("NEXT_PUBLIC_SUPABASE_URL não está configurada.");
  return `${base}/functions/v1/generate-exam-gemini`;
}

export const geminiProvider: AIProvider = {
  id: "gemini",
  metered: true,
  async generateStructured<T>({ task, schema, input }: { task: AITask; schema: Record<string, unknown>; input: unknown }): Promise<GenerateStructuredResult<T>> {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY não está configurada para a chamada Gemini.");
    const response = await fetch(functionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
      body: JSON.stringify({ task, schema, input }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`A Edge Function Gemini respondeu HTTP ${response.status}.`);
    let envelope: GeminiEnvelope<T>;
    try { envelope = (await response.json()) as GeminiEnvelope<T>; } catch { throw new Error("A Edge Function Gemini retornou JSON inválido."); }
    if (!envelope?.data || typeof envelope.data !== "object") throw new Error("A Edge Function Gemini retornou dados estruturados inválidos.");
    return { data: envelope.data, tokensIn: envelope.tokensIn ?? 0, tokensOut: envelope.tokensOut ?? 0 };
  },
  async *streamChat(args: { messages: ChatMessage[]; context?: string; onUsage?: (usage: { tokensIn: number; tokensOut: number }) => void }) {
    void args;
    throw new Error("O provider Gemini não implementa streaming nesta integração.");
  },
  async embed(args: { texts: string[] }) {
    void args;
    throw new Error("O provider Gemini não implementa embeddings nesta integração.");
  },
};
