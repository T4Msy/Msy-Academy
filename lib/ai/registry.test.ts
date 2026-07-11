import { afterEach, describe, expect, it } from "vitest";
import { getAIProvider } from "./registry";

const ORIGINAL_ENV = process.env.AI_PROVIDER;

describe("getAIProvider", () => {
  afterEach(() => {
    process.env.AI_PROVIDER = ORIGINAL_ENV;
  });

  it("defaults to the mock provider when AI_PROVIDER isn't set", () => {
    delete process.env.AI_PROVIDER;
    expect(getAIProvider().id).toBe("mock");
  });

  it("selects the provider named by AI_PROVIDER", () => {
    process.env.AI_PROVIDER = "echo";
    expect(getAIProvider().id).toBe("echo");
  });

  it("throws a clear error for an unregistered provider id", () => {
    process.env.AI_PROVIDER = "does-not-exist";
    expect(() => getAIProvider()).toThrow(/does-not-exist/);
  });
});
