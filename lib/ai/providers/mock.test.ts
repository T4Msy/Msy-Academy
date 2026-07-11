import { describe, expect, it } from "vitest";
import { mockProvider } from "./mock";
import type { GeneratedExam, GeneratedFlashcardDeck, GradingSuggestion } from "../types";

describe("mockProvider.generateStructured", () => {
  it("generates the requested number of exam questions, cycling types for 'mista'", async () => {
    const { data } = await mockProvider.generateStructured<GeneratedExam>({
      task: "EXAM_GEN",
      schema: {},
      input: { materia: "Matemática", assunto: "Frações", quantidade: 6, tipo: "mista", nivel: "dificil" },
    });

    expect(data.questions).toHaveLength(6);
    expect(data.questions.map((q) => q.type)).toEqual([
      "MULTIPLA", "VF", "DISCURSIVA", "MULTIPLA", "VF", "DISCURSIVA",
    ]);
    expect(data.questions.every((q) => q.difficulty === "DIFICIL")).toBe(true);
  });

  it("gives every MULTIPLA question exactly 4 options and a correctAnswer among them", async () => {
    const { data } = await mockProvider.generateStructured<GeneratedExam>({
      task: "EXAM_GEN",
      schema: {},
      input: { materia: "História", quantidade: 3, tipo: "multipla" },
    });

    for (const q of data.questions) {
      expect(q.options).toHaveLength(4);
      expect(q.options!.map((o) => o.id)).toContain(q.correctAnswer);
    }
  });

  it("scores an empty discursive answer as 0 with a 'blank' remark", async () => {
    const { data } = await mockProvider.generateStructured<GradingSuggestion>({
      task: "GRADING",
      schema: {},
      input: { statement: "s", referenceAnswer: "r", studentAnswer: "" },
    });
    expect(data.score).toBe(0);
    expect(data.feedback).toMatch(/em branco/i);
  });

  it("scores a non-empty discursive answer above 0", async () => {
    const { data } = await mockProvider.generateStructured<GradingSuggestion>({
      task: "GRADING",
      schema: {},
      input: { statement: "s", referenceAnswer: "r", studentAnswer: "Uma resposta bem desenvolvida." },
    });
    expect(data.score).toBeGreaterThan(0);
    expect(data.score).toBeLessThanOrEqual(1);
  });

  it("builds flashcards from sentences in the source material, capped at 8", async () => {
    const longContent = Array.from({ length: 12 }, (_, i) => `Esta é a frase número ${i} do material de teste.`).join(" ");
    const { data } = await mockProvider.generateStructured<GeneratedFlashcardDeck>({
      task: "FLASHCARDS",
      schema: {},
      input: { title: "Deck de teste", content: longContent },
    });
    expect(data.cards.length).toBeGreaterThan(0);
    expect(data.cards.length).toBeLessThanOrEqual(8);
    expect(data.cards[0]).toHaveProperty("front");
    expect(data.cards[0]).toHaveProperty("back");
  });

  it("falls back to a placeholder card when the source material has no usable sentences", async () => {
    const { data } = await mockProvider.generateStructured<GeneratedFlashcardDeck>({
      task: "FLASHCARDS",
      schema: {},
      input: { title: "Deck vazio", content: "" },
    });
    expect(data.cards).toHaveLength(1);
  });

  it("rejects a task it doesn't implement", async () => {
    await expect(
      mockProvider.generateStructured({ task: "TUTOR", schema: {}, input: {} }),
    ).rejects.toThrow(/TUTOR/);
  });
});

describe("mockProvider.streamChat", () => {
  it("streams a grounded answer word by word when RAG context is present", async () => {
    const chunks: string[] = [];
    for await (const chunk of mockProvider.streamChat({
      messages: [{ role: "user", content: "O que é fotossíntese?" }],
      context: "Fotossíntese é o processo pelo qual plantas convertem luz em energia.",
    })) {
      chunks.push(chunk);
    }
    const full = chunks.join("");
    expect(chunks.length).toBeGreaterThan(1);
    expect(full).toMatch(/Com base no material/);
  });

  it("says it found nothing when there is no RAG context", async () => {
    const chunks: string[] = [];
    for await (const chunk of mockProvider.streamChat({ messages: [{ role: "user", content: "Oi" }] })) {
      chunks.push(chunk);
    }
    expect(chunks.join("")).toMatch(/Não encontrei material/);
  });
});

describe("mockProvider.embed", () => {
  it("is deterministic — same text always yields the same vector", async () => {
    const [a] = await mockProvider.embed({ texts: ["mesmo texto"] });
    const [b] = await mockProvider.embed({ texts: ["mesmo texto"] });
    expect(a).toEqual(b);
  });

  it("returns one fixed-length vector per input text", async () => {
    const vectors = await mockProvider.embed({ texts: ["a", "b", "c"] });
    expect(vectors).toHaveLength(3);
    expect(vectors.every((v) => v.length === 8)).toBe(true);
  });
});
