import { afterEach, describe, expect, it } from "vitest";
import { checkRateLimit } from "./ratelimit";

const ORIGINAL_URL = process.env.UPSTASH_REDIS_REST_URL;
const ORIGINAL_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

describe("checkRateLimit", () => {
  afterEach(() => {
    if (ORIGINAL_URL === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = ORIGINAL_URL;
    if (ORIGINAL_TOKEN === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = ORIGINAL_TOKEN;
  });

  it("is a no-op (always succeeds) when Upstash credentials aren't configured", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const result = await checkRateLimit("ai", "some-user-id");
    expect(result).toEqual({ success: true });
  });

  it("never throws even when called repeatedly without credentials", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    for (let i = 0; i < 15; i++) {
      await expect(checkRateLimit("auth", "1.2.3.4")).resolves.toEqual({ success: true });
    }
  });
});
