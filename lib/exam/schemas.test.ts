import { describe, expect, it } from "vitest";
import {
  examGenerationRequestSchema,
  examGenerationSchema,
  toExamGenerationRequest,
} from "./schemas";

const formValues = {
  curso: "",
  tituloprova: "Prova de Matemática",
  materia: "Matemática",
  assunto: "Raiz quadrada",
  publico: "medio" as const,
  estilo: "escolar" as const,
  observacoesprofessor: "",
  tipo: "multipla" as const,
  quantidade: "10",
  pontos: "1",
  nivel: "medio" as const,
  distniveis: "40/40/20" as const,
  usarapostila: false,
  gabarito: true,
};

describe("exam generation request contract", () => {
  it("accepts a form state created before the optional serie field existed", () => {
    expect(examGenerationSchema.safeParse(formValues).success).toBe(true);
  });

  it("converts numeric inputs and omits empty optional strings before the request", () => {
    const payload = toExamGenerationRequest(formValues);
    expect(payload).toMatchObject({ quantidade: 10, pontos: 1 });
    expect(payload).not.toHaveProperty("curso");
    expect(payload).not.toHaveProperty("serie");
    expect(payload).not.toHaveProperty("observacoesprofessor");
    expect(examGenerationRequestSchema.safeParse(payload).success).toBe(true);
  });

  it("rejects numeric strings at the HTTP boundary", () => {
    const payload = { ...toExamGenerationRequest(formValues), quantidade: "10" };
    const result = examGenerationRequestSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.quantidade).toBeDefined();
  });
});
