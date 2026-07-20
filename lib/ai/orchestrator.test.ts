import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AIProvider } from "./provider";

// checkQuota is mocked (not the DB-backed getActivePlanForTenant it wraps) so
// these tests exercise orchestrator.ts's own sequencing — quota-before-call,
// log-after-call, generator finally semantics — without touching Supabase.
// The real QuotaExceededError class is preserved via importOriginal so
// `instanceof`/message assertions still work against the actual type.
const checkQuotaMock = vi.fn(async (_tenantId: string) => {});
vi.mock("@/lib/billing/quota", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/billing/quota")>();
  return { ...actual, checkQuota: (tenantId: string) => checkQuotaMock(tenantId) };
});

const getAIProviderMock = vi.fn();
vi.mock("./registry", () => ({
  getAIProvider: () => getAIProviderMock(),
}));

const insertMock = vi.fn(async (_row: Record<string, unknown>) => ({ error: null as null }));
const rpcMock = vi.fn(async (_fn: string, _params: Record<string, unknown>) => ({ error: null as null }));
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: () => ({
    from: () => ({ insert: insertMock }),
    rpc: rpcMock,
  }),
}));

const { generateStructured, streamGenerate, embedTexts } = await import("./orchestrator");
const { QuotaExceededError } = await import("@/lib/billing/quota");

function makeFakeProvider(overrides: Partial<AIProvider> = {}): AIProvider {
  const base = {
    id: "fake",
    generateStructured: vi.fn(async () => ({ data: { ok: true }, tokensIn: 5, tokensOut: 7 })),
    async *streamChat({ onUsage }: Parameters<AIProvider["streamChat"]>[0]) {
      yield "hello ";
      yield "world";
      onUsage?.({ tokensIn: 3, tokensOut: 2 });
    },
    embed: vi.fn(async ({ texts }: { texts: string[] }) => texts.map(() => [0, 0, 0, 0, 0, 0, 0, 0])),
  };
  return { ...base, ...overrides } as unknown as AIProvider;
}

beforeEach(() => {
  checkQuotaMock.mockReset().mockResolvedValue(undefined);
  getAIProviderMock.mockReset().mockReturnValue(makeFakeProvider());
  insertMock.mockClear();
  rpcMock.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("generateStructured", () => {
  it("runs an unmetered local provider without quota or admin logging", async () => {
    getAIProviderMock.mockReturnValue(makeFakeProvider({ metered: false }));

    await expect(
      generateStructured({ task: "EXAM_GEN", schema: {}, input: {}, tenantId: "t1", userId: "u1" }),
    ).resolves.toEqual({ ok: true });

    expect(checkQuotaMock).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("throws QuotaExceededError and never calls the provider when quota is exceeded", async () => {
    checkQuotaMock.mockRejectedValueOnce(new QuotaExceededError());
    const provider = makeFakeProvider();
    getAIProviderMock.mockReturnValue(provider);

    await expect(
      generateStructured({ task: "EXAM_GEN", schema: {}, input: {}, tenantId: "t1", userId: "u1" }),
    ).rejects.toBeInstanceOf(QuotaExceededError);

    expect(provider.generateStructured).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("returns the provider's data and logs usage once with the right feature/tokens", async () => {
    const data = await generateStructured({ task: "EXAM_GEN", schema: {}, input: {}, tenantId: "t1", userId: "u1" });

    expect(data).toEqual({ ok: true });
    expect(insertMock).toHaveBeenCalledTimes(1);
    const row = insertMock.mock.calls[0]![0];
    expect(row.feature).toBe("EXAM_GEN");
    expect(row.tokens_in).toBe(5);
    expect(row.tokens_out).toBe(7);
    expect(rpcMock).toHaveBeenCalledWith("increment_ai_usage", expect.objectContaining({ p_tenant_id: "t1", p_tokens: 12 }));
  });
});

describe("streamGenerate", () => {
  it("rejects before any token is produced when quota is exceeded", async () => {
    checkQuotaMock.mockRejectedValueOnce(new QuotaExceededError());
    const provider = makeFakeProvider();
    getAIProviderMock.mockReturnValue(provider);

    await expect(
      streamGenerate({ task: "TUTOR", messages: [{ role: "user", content: "oi" }], tenantId: "t1", userId: "u1" }),
    ).rejects.toBeInstanceOf(QuotaExceededError);

    expect(insertMock).not.toHaveBeenCalled();
  });

  it("streams all tokens through and logs usage once at the end with real (non-zero) usage — regression test for the tokensIn/tokensOut=0 bug", async () => {
    const tokens = await streamGenerate({
      task: "TUTOR",
      messages: [{ role: "user", content: "oi" }],
      tenantId: "t1",
      userId: "u1",
    });

    const collected: string[] = [];
    for await (const token of tokens) collected.push(token);

    expect(collected.join("")).toBe("hello world");
    expect(insertMock).toHaveBeenCalledTimes(1);
    const row = insertMock.mock.calls[0]![0];
    expect(row.feature).toBe("TUTOR");
    expect(row.tokens_in).toBe(3);
    expect(row.tokens_out).toBe(2);
  });

  it("still logs exactly once if the consumer stops iterating early", async () => {
    const tokens = await streamGenerate({
      task: "TUTOR",
      messages: [{ role: "user", content: "oi" }],
      tenantId: "t1",
      userId: "u1",
    });

    for await (const _token of tokens) {
      break; // triggers the async generator's .return(), which must still run the `finally`
    }

    expect(insertMock).toHaveBeenCalledTimes(1);
  });
});

describe("embedTexts", () => {
  it("does not call provider.embed when quota is exceeded", async () => {
    checkQuotaMock.mockRejectedValueOnce(new QuotaExceededError());
    const provider = makeFakeProvider();
    getAIProviderMock.mockReturnValue(provider);

    await expect(embedTexts({ texts: ["a"], tenantId: "t1", feature: "TUTOR" })).rejects.toBeInstanceOf(
      QuotaExceededError,
    );
    expect(provider.embed).not.toHaveBeenCalled();
  });

  it("returns embeddings and logs usage once", async () => {
    const result = await embedTexts({ texts: ["a", "b"], tenantId: "t1", userId: "u1", feature: "TUTOR" });

    expect(result).toHaveLength(2);
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock.mock.calls[0]![0].feature).toBe("TUTOR");
  });
});
