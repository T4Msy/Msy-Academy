import { afterEach, describe, expect, it, vi } from "vitest";
import { geminiProvider } from "./gemini";

afterEach(() => vi.unstubAllGlobals());

describe("geminiProvider", () => {
  it("calls the Supabase Edge Function with the structured contract", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-test-key";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { title: "Prova", questions: [] }, tokensIn: 4, tokensOut: 8 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await geminiProvider.generateStructured({ task: "EXAM_GEN", schema: { type: "object" }, input: { assunto: "frações" } });
    expect(result.tokensIn).toBe(4);
    expect(fetchMock).toHaveBeenCalledWith("https://example.supabase.co/functions/v1/generate-exam-gemini", expect.objectContaining({ method: "POST" }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ task: "EXAM_GEN", input: { assunto: "frações" } });
  });
});
