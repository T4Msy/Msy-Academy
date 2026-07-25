import { describe, expect, it } from "vitest";
import { PROFILE_LIMITS, validateProfileInput } from "./profileValidation";

describe("validateProfileInput", () => {
  it("accepts the optional fields as empty", () => {
    expect(validateProfileInput({ fullName: "Ana Silva" })).toBeNull();
  });

  it("rejects an empty name and oversized biography", () => {
    expect(validateProfileInput({ fullName: "  " })).toContain("nome");
    expect(validateProfileInput({ fullName: "Ana", bio: "x".repeat(PROFILE_LIMITS.bio + 1) })).toContain("280");
  });
});
