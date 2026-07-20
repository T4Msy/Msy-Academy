import { describe, expect, it } from "vitest";
import {
  allVariationStatementsMatch,
  generatedExamVariationSchema,
  nextVariationTitle,
} from "./variation";

describe("exam variation", () => {
  it("numbers variation titles without overwriting an existing exam", () => {
    expect(nextVariationTitle("Prova de Biologia", [])).toBe("Prova de Biologia — Variação");
    expect(nextVariationTitle("Prova de Biologia", ["Prova de Biologia — Variação"])).toBe(
      "Prova de Biologia — Variação 2",
    );
  });

  it("rejects an invalid AI response", () => {
    expect(
      generatedExamVariationSchema.safeParse({ title: "Variação", questions: [] }).success,
    ).toBe(false);
  });

  it("detects a variation whose statements only differ by spacing or casing", () => {
    expect(
      allVariationStatementsMatch(
        [{ statement: "Qual é o valor de √100?" }],
        [{ statement: "  QUAL É O VALOR DE √100?  " }],
      ),
    ).toBe(true);
    expect(
      allVariationStatementsMatch(
        [{ statement: "Qual é o valor de √100?" }],
        [{ statement: "Qual é o valor de √196?" }],
      ),
    ).toBe(false);
  });
});
