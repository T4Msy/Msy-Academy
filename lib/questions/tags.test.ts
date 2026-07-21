import { describe, expect, it } from "vitest";
import { normalizeQuestionTags } from "./tags";
describe("question tags", () => {
  it("normalizes spaces and removes case-insensitive duplicates", () => {
    expect(normalizeQuestionTags([" DNA ", "dna", "genética"])).toEqual(["DNA", "genética"]);
  });
  it("enforces tag limits", () => {
    expect(() => normalizeQuestionTags(["x".repeat(41)])).toThrow();
    expect(() => normalizeQuestionTags(Array.from({ length: 11 }, (_, i) => `tag-${i}`))).toThrow();
  });
});
