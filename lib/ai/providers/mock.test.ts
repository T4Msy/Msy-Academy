import { describe, expect, it } from "vitest";
import { mockProvider } from "./mock";
import type { GeneratedExam, GeneratedFlashcardDeck, GradingSuggestion } from "../types";

describe("mockProvider.generateStructured", () => {
  it("generates realistic square-root questions without placeholders", async () => {
    const { data } = await mockProvider.generateStructured<GeneratedExam>({
      task: "EXAM_GEN",
      schema: {},
      input: {
        materia: "Matemática",
        assunto: "raiz quadrada",
        serie: "8º ano",
        quantidade: 6,
        tipo: "multipla",
        nivel: "medio",
      },
    });

    expect(data.questions).toHaveLength(6);
    expect(data.questions[0]).toMatchObject({
      statement: "Qual é o valor de √100?",
      difficulty: "MEDIO",
      explanation: "Como 10 × 10 = 100, então √100 = 10.",
      tags: ["Matemática", "raiz quadrada", "8º ano"],
    });

    for (const question of data.questions) {
      const allText = [
        question.statement,
        question.explanation,
        ...(question.options?.map((option) => option.text) ?? []),
      ].join(" ");
      expect(allText).not.toMatch(/Questão \d+ sobre|Alternativa [A-Z] para|explicação de exemplo|placeholder/i);
      expect(new Set(question.options?.map((option) => option.text)).size).toBe(4);
      expect(question.options?.map((option) => option.id)).toContain(question.correctAnswer);
      expect(question.explanation?.length).toBeGreaterThan(15);
    }
  });

  it.each([
    ["operações básicas", /primeiro calculamos/i],
    ["frações", /denominadores/i],
    ["porcentagem", /100/],
    ["equações simples", /x =/],
  ])("generates pedagogical Mathematics content for %s", async (assunto, expected) => {
    const { data } = await mockProvider.generateStructured<GeneratedExam>({
      task: "EXAM_GEN",
      schema: {},
      input: { materia: "Matemática", assunto, quantidade: 2, tipo: "multipla", nivel: "facil" },
    });
    expect(data.questions).toHaveLength(2);
    expect(data.questions.map((question) => question.explanation).join(" ")).toMatch(expected);
  });

  it("is deterministic and does not require external services", async () => {
    const args = {
      task: "EXAM_GEN" as const,
      schema: {},
      input: { materia: "Matemática", assunto: "raiz quadrada", quantidade: 3, tipo: "mista", nivel: "dificil" },
    };
    const first = await mockProvider.generateStructured<GeneratedExam>(args);
    const second = await mockProvider.generateStructured<GeneratedExam>(args);
    expect(first.data).toEqual(second.data);
    expect(mockProvider.metered).toBe(false);
  });

  it("creates a genuinely different but structurally equivalent variation", async () => {
    const input = {
      tituloprova: "Raízes",
      materia: "Matemática",
      assunto: "raiz quadrada",
      serie: "8º ano",
      quantidade: 3,
      tipo: "multipla",
      nivel: "medio",
    };
    const original = await mockProvider.generateStructured<GeneratedExam>({
      task: "EXAM_GEN",
      schema: {},
      input,
    });
    const variation = await mockProvider.generateStructured<GeneratedExam>({
      task: "EXAM_GEN",
      schema: {},
      input: {
        ...input,
        variationMode: true,
        variationAttempt: 1,
        originalExam: { questions: original.data.questions },
      },
    });

    expect(variation.data.questions).toHaveLength(original.data.questions.length);
    variation.data.questions.forEach((question, index) => {
      const source = original.data.questions[index];
      expect(question.type).toBe(source.type);
      expect(question.difficulty).toBe(source.difficulty);
      expect(question.statement).not.toBe(source.statement);
      expect(question.options?.map((option) => option.text)).not.toEqual(
        source.options?.map((option) => option.text),
      );
      expect(question.explanation).not.toBe(source.explanation);
    });
  });

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

  it("flags the title when apostilaContent is present (US-2.3)", async () => {
    const { data } = await mockProvider.generateStructured<GeneratedExam>({
      task: "EXAM_GEN",
      schema: {},
      input: { materia: "Biologia", quantidade: 2, apostilaContent: "Fotossíntese é o processo..." },
    });
    expect(data.title).toContain("com base na apostila enviada");
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
