import type { AIProvider } from "../provider";
import type { AITask, Question, Difficulty } from "../types";

/**
 * A second, independently-implemented deterministic provider — its purpose
 * isn't sophistication, it's proof: every route/UI in the app calls
 * `getAIProvider()` and only touches the `AIProvider` interface, never a
 * provider's internals. Swapping `AI_PROVIDER=echo` (vs. the default
 * `mock`) changes every generated artifact's shape/wording without a single
 * code change outside `lib/ai/registry.ts` — if that weren't true, this
 * provider existing would immediately break something.
 *
 * Deliberately built with different internal logic than `mock.ts` (always
 * multiple-choice questions, different phrasing, a different grading
 * heuristic) so the two are never confusable with a copy-paste.
 */
export const echoProvider: AIProvider = {
  id: "echo",
  metered: false,

  async generateStructured<T>({ task, input }: { task: AITask; schema: Record<string, unknown>; input: unknown }) {
    if (task === "EXAM_GEN" || task === "ACTIVITY_GEN") {
      const p = input as {
        tituloprova?: string;
        materia?: string;
        assunto?: string;
        quantidade?: number | string;
        nivel?: string;
        variationMode?: boolean;
        variationAttempt?: number;
        originalExam?: { questions?: Question[] };
      };
      if (p.variationMode && p.originalExam?.questions?.length) {
        const attempt = Math.max(1, p.variationAttempt ?? 1);
        const questions = p.originalExam.questions.map((question, index) => ({
          ...question,
          statement: `[echo] Variação ${attempt}.${index + 1}: aplique a mesma habilidade em um novo contexto.`,
          options: question.options?.map((option, optionIndex) => ({
            ...option,
            text: `[echo] Alternativa reformulada ${attempt}.${index + 1}.${optionIndex + 1}`,
          })),
          explanation: `[echo] Nova justificativa equivalente para a questão ${index + 1}.`,
        }));
        return {
          data: { title: `${p.tituloprova ?? "Prova"} — Variação`, questions } as unknown as T,
          tokensIn: 0,
          tokensOut: 0,
        };
      }
      const quantidade = Number(p.quantidade) || 5;
      const difficulty = (p.nivel?.toUpperCase() as Difficulty) || "MEDIO";
      const topic = p.assunto || p.materia || "conteúdo geral";
      const questions: Question[] = Array.from({ length: quantidade }, (_, i) => {
        const correctIndex = (i + 1) % 4;
        const options = ["A", "B", "C", "D"].map((id, idx) => ({
          id,
          text: idx === correctIndex ? `Resposta correta sobre ${topic}` : `Distrator ${idx + 1}`,
        }));
        return {
          type: "MULTIPLA",
          statement: `[echo] Item ${i + 1} — avalie o conhecimento sobre ${topic}.`,
          options,
          correctAnswer: options[correctIndex].id,
          explanation: `[echo] A opção correta trata diretamente de ${topic}.`,
          difficulty,
          tags: p.assunto ? [p.assunto] : [],
        };
      });
      return {
        data: { title: p.tituloprova || `[echo] ${topic}`, questions } as unknown as T,
        tokensIn: 0,
        tokensOut: 0,
      };
    }

    if (task === "LESSON_PLAN") {
      const p = input as { tema?: string; disciplina?: string };
      const tema = p.tema || p.disciplina || "tema geral";
      return {
        data: {
          theme: `[echo] ${tema}`,
          objectives: `Desenvolver competências relacionadas a ${tema}.`,
          content: `Bloco 1: fundamentos de ${tema}. Bloco 2: aplicação prática.`,
          suggestedActivities: `Trabalho em duplas sobre ${tema}.`,
          suggestedAssessments: `Questionário rápido ao final da aula sobre ${tema}.`,
        } as unknown as T,
        tokensIn: 0,
        tokensOut: 0,
      };
    }

    if (task === "GRADING") {
      const p = input as { studentAnswer?: string };
      const wordCount = (p.studentAnswer ?? "").trim().split(/\s+/).filter(Boolean).length;
      const score = Math.min(1, wordCount / 20);
      return {
        data: { score: Math.round(score * 100) / 100, feedback: `[echo] Resposta com ${wordCount} palavras — nota proporcional à extensão.` } as unknown as T,
        tokensIn: 0,
        tokensOut: 0,
      };
    }

    if (task === "STUDY_PLAN") {
      const p = input as { goal?: string };
      const items = Array.from({ length: 5 }, (_, i) => ({
        date: new Date(Date.now() + (i + 1) * 86400000).toISOString().slice(0, 10),
        topic: `[echo] Bloco ${i + 1} rumo a: ${p.goal ?? "objetivo"}`,
        type: (["LEITURA", "EXERCICIO", "REVISAO"] as const)[i % 3],
      }));
      return { data: { items } as unknown as T, tokensIn: 0, tokensOut: 0 };
    }

    if (task === "FLASHCARDS") {
      const p = input as { title?: string };
      return {
        data: {
          title: `[echo] ${p.title ?? "Deck"}`,
          cards: [
            { front: "[echo] Pergunta 1", back: "[echo] Resposta 1" },
            { front: "[echo] Pergunta 2", back: "[echo] Resposta 2" },
          ],
        } as unknown as T,
        tokensIn: 0,
        tokensOut: 0,
      };
    }

    throw new Error(`O provider echo ainda não implementa a tarefa "${task}".`);
  },

  async *streamChat({ messages, context, onUsage }) {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const reply = context?.trim()
      ? `[echo] Baseado no material: ${context.slice(0, 100)}. Pergunta recebida: "${lastUserMessage}".`
      : `[echo] Sem material de contexto para: "${lastUserMessage}".`;
    for (const chunk of reply.split(" ")) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      yield chunk + " ";
    }

    // Deterministic non-zero estimate, same reasoning as mock.ts.
    const tokensIn = messages.reduce((sum, m) => sum + m.content.split(/\s+/).filter(Boolean).length, 0);
    const tokensOut = reply.split(/\s+/).filter(Boolean).length;
    onUsage?.({ tokensIn, tokensOut });
  },

  async embed({ texts }) {
    // Different (but still deterministic) hashing strategy than mock.ts —
    // proves embed() isn't tied to one hash implementation either.
    return texts.map((t) => {
      let h = 5381;
      for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) >>> 0;
      return Array.from({ length: 8 }, (_, i) => (((h + i * 97) % 97) / 97));
    });
  },
};
