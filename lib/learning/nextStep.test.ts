import { describe, expect, it } from "vitest";
import { getNextStep } from "./nextStep";

describe("getNextStep", () => {
  it("prioriza a revisão prática depois de abrir um material", () => {
    expect(getNextStep({ stage: "material", materialId: "material-1" }).primary).toEqual({
      href: "/aluno/flashcards?materialIds=material-1",
      label: "Revisar",
    });
  });

  it("prioriza revisar erros depois de um simulado", () => {
    expect(getNextStep({ stage: "simulado" }).primary).toEqual({
      href: "#resultado",
      label: "Revisar erros",
    });
  });

  it("mantém uma única ação principal em cada estágio", () => {
    for (const stage of ["material", "task", "flashcards", "simulado", "plan"] as const) {
      expect(getNextStep({ stage }).primary.href).toBeTruthy();
    }
  });
});
