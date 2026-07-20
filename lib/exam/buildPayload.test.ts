import { describe, expect, it } from "vitest";
import { buildExamParams } from "./buildPayload";

describe("buildExamParams", () => {
  it("applies defaults for an empty submission", () => {
    const params = buildExamParams({});
    expect(params.quantidade).toBe(10);
    expect(params.pontosporquestao).toBe(1);
    expect(params.nivel).toBe("medio");
    expect(params.tipo).toBe("multipla");
    expect(params.estilo).toBe("escolar");
    expect(params.incluirgabarito).toBe(false);
    expect(params.usarapostila).toBe(false);
    expect(params.versoes).toBe(1);
  });

  it("trims text fields and parses numeric fields from form-encoded strings", () => {
    const params = buildExamParams({
      curso: "  Ensino Médio  ",
      materia: " Biologia ",
      serie: " 8º ano ",
      quantidade: "15",
      pontos: "2",
    });
    expect(params.curso).toBe("Ensino Médio");
    expect(params.materia).toBe("Biologia");
    expect(params.serie).toBe("8º ano");
    expect(params.quantidade).toBe(15);
    expect(params.pontosporquestao).toBe(2);
  });

  it("treats checkbox values 'on'/'true'/true as checked, everything else as unchecked", () => {
    expect(buildExamParams({ gabarito: "on" }).incluirgabarito).toBe(true);
    expect(buildExamParams({ gabarito: "true" }).incluirgabarito).toBe(true);
    expect(buildExamParams({ gabarito: true }).incluirgabarito).toBe(true);
    expect(buildExamParams({ gabarito: "false" }).incluirgabarito).toBe(false);
    expect(buildExamParams({}).incluirgabarito).toBe(false);
  });

  it("falls back to the default when a numeric field isn't a valid number", () => {
    expect(buildExamParams({ quantidade: "abc" }).quantidade).toBe(10);
    expect(buildExamParams({ quantidade: "" }).quantidade).toBe(10);
  });

  it("always forces versoes to 1 (DT-19 — not yet configurable)", () => {
    expect(buildExamParams({ versoes: "5" } as never).versoes).toBe(1);
  });
});
