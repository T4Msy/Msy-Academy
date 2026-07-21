import { describe, expect, it } from "vitest";
import { selectVisibleSubmissions, toggleSubmissionSelection } from "./selection";

describe("fila de correção: seleção por id", () => {
  it("seleciona e remove uma entrega sem depender da posição", () => {
    const selected = toggleSubmissionSelection(new Set(["a"]), "b");
    expect([...selected]).toEqual(["a", "b"]);
    expect([...toggleSubmissionSelection(selected, "a")]).toEqual(["b"]);
  });

  it("seleciona somente as entregas visíveis", () => {
    expect([...selectVisibleSubmissions(new Set(["fora"]), ["a", "b"], true)]).toEqual(["fora", "a", "b"]);
    expect([...selectVisibleSubmissions(new Set(["a", "fora"]), ["a", "b"], false)]).toEqual(["fora"]);
  });
});
