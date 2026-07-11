import type { AIProvider } from "../provider";
import type { Question, QuestionType, Difficulty, AITask } from "../types";

function pickTipo(tipo: string, i: number): QuestionType {
  if (tipo === "mista") {
    const cycle: QuestionType[] = ["MULTIPLA", "VF", "DISCURSIVA"];
    return cycle[i % cycle.length];
  }
  const map: Record<string, QuestionType> = {
    multipla: "MULTIPLA",
    vf: "VF",
    discursiva: "DISCURSIVA",
  };
  return map[tipo] ?? "MULTIPLA";
}

function buildQuestion(
  i: number,
  tipo: QuestionType,
  materia: string,
  assunto: string,
  difficulty: Difficulty,
): Question {
  const topic = assunto || materia || "o tema solicitado";
  const base = `Questão ${i + 1} sobre ${topic} (${materia || "Geral"}).`;
  const tags = assunto ? [assunto] : [];

  if (tipo === "MULTIPLA") {
    const options = ["A", "B", "C", "D"].map((id) => ({
      id,
      text: `Alternativa ${id} para a questão ${i + 1}`,
    }));
    return {
      type: "MULTIPLA",
      statement: `${base} Assinale a alternativa correta.`,
      options,
      correctAnswer: options[i % options.length].id,
      explanation: `A alternativa correta é a ${options[i % options.length].id} (explicação de exemplo do provider mock).`,
      difficulty,
      tags,
    };
  }

  if (tipo === "VF") {
    return {
      type: "VF",
      statement: `${base} A afirmação a seguir é verdadeira?`,
      options: [
        { id: "V", text: "Verdadeiro" },
        { id: "F", text: "Falso" },
      ],
      correctAnswer: i % 2 === 0 ? "V" : "F",
      explanation: "Explicação de exemplo do provider mock.",
      difficulty,
      tags,
    };
  }

  return {
    type: "DISCURSIVA",
    statement: `${base} Desenvolva sua resposta com argumentos.`,
    correctAnswer: `Resposta de referência de exemplo para a questão ${i + 1}.`,
    difficulty,
    tags,
  };
}

/**
 * Deterministic provider used until a real key/provider is chosen (Fase 1+
 * runs entirely against this). No network calls, no cost, same output shape
 * a real adapter would return — every route/UI is built and tested against
 * this before "com chave real" gates are unblocked.
 */
export const mockProvider: AIProvider = {
  id: "mock",

  async generateStructured<T>({ task, input }: { task: AITask; schema: Record<string, unknown>; input: unknown }) {
    if (task === "EXAM_GEN" || task === "ACTIVITY_GEN") {
      const p = input as {
        tituloprova?: string;
        materia?: string;
        assunto?: string;
        quantidade?: number | string;
        tipo?: string;
        nivel?: string;
        apostilaContent?: string;
      };
      const quantidade = Number(p.quantidade) || 10;
      const difficulty = (p.nivel?.toUpperCase() as Difficulty) || "MEDIO";
      const questions: Question[] = Array.from({ length: quantidade }, (_, i) =>
        buildQuestion(i, pickTipo(p.tipo ?? "multipla", i), p.materia ?? "", p.assunto ?? "", difficulty),
      );
      const baseTitle = p.tituloprova || p.materia || (task === "EXAM_GEN" ? "Prova gerada" : "Atividade gerada");
      return {
        data: {
          title: p.apostilaContent ? `${baseTitle} (com base na apostila enviada)` : baseTitle,
          questions,
        } as unknown as T,
        tokensIn: 0,
        tokensOut: 0,
      };
    }

    if (task === "LESSON_PLAN") {
      const p = input as { disciplina?: string; serie?: string; tema?: string; observacoes?: string };
      const tema = p.tema || p.disciplina || "o tema solicitado";
      return {
        data: {
          theme: p.tema || "Plano de aula",
          objectives: `Compreender os conceitos fundamentais de ${tema}${p.serie ? ` para ${p.serie}` : ""} (exemplo do provider mock).`,
          content: `Introdução ao tema, desenvolvimento com exemplos práticos, e síntese final sobre ${tema}.`,
          suggestedActivities: `Discussão em grupo, exercícios de fixação e produção escrita sobre ${tema}.`,
          suggestedAssessments: `Avaliação formativa por participação + prova objetiva sobre ${tema} ao final da unidade.`,
        } as unknown as T,
        tokensIn: 0,
        tokensOut: 0,
      };
    }

    if (task === "GRADING") {
      const p = input as { statement?: string; referenceAnswer?: string; studentAnswer?: string };
      const studentAnswer = (p.studentAnswer ?? "").trim();
      // Deterministic heuristic (not real grading): longer answers score
      // higher — enough to exercise the suggest -> review -> save flow
      // before a real provider judges actual content.
      const score = studentAnswer.length === 0 ? 0 : Math.min(1, 0.4 + studentAnswer.length / 200);
      return {
        data: {
          score: Math.round(score * 100) / 100,
          feedback:
            studentAnswer.length === 0
              ? "Resposta em branco."
              : `Resposta sugerida pelo provider mock: nota proporcional ao desenvolvimento apresentado. Revise antes de salvar.`,
        } as unknown as T,
        tokensIn: 0,
        tokensOut: 0,
      };
    }

    if (task === "STUDY_PLAN") {
      const p = input as { goal?: string; examDate?: string; availability?: Record<string, number> };
      const goal = p.goal || "seus estudos";
      const today = new Date();
      const examDate = p.examDate ? new Date(p.examDate) : new Date(today.getTime() + 14 * 86400000);
      const totalDays = Math.max(1, Math.round((examDate.getTime() - today.getTime()) / 86400000));
      const itemCount = Math.min(totalDays, 14); // one item per day, capped at two weeks of plumbing
      const cycle: ("REVISAO" | "EXERCICIO" | "LEITURA")[] = ["LEITURA", "EXERCICIO", "REVISAO"];
      const items = Array.from({ length: itemCount }, (_, i) => {
        const date = new Date(today.getTime() + (i + 1) * 86400000);
        return {
          date: date.toISOString().slice(0, 10),
          topic: `${cycle[i % cycle.length] === "REVISAO" ? "Revisar" : cycle[i % cycle.length] === "EXERCICIO" ? "Exercícios sobre" : "Ler sobre"} ${goal} (dia ${i + 1})`,
          type: cycle[i % cycle.length],
        };
      });
      return { data: { items } as unknown as T, tokensIn: 0, tokensOut: 0 };
    }

    if (task === "FLASHCARDS") {
      const p = input as { title?: string; content?: string };
      const content = (p.content ?? "").trim();
      const sentences = content
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 15)
        .slice(0, 8);
      const cards = (sentences.length > 0 ? sentences : ["Conteúdo do material de exemplo."]).map((s, i) => ({
        front: `Pergunta ${i + 1}: o que diz o material sobre "${s.slice(0, 40)}..."?`,
        back: s,
      }));
      return { data: { title: p.title || "Deck gerado", cards } as unknown as T, tokensIn: 0, tokensOut: 0 };
    }

    throw new Error(`O provider mock ainda não implementa a tarefa "${task}".`);
  },

  async *streamChat({ messages, context }) {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const grounded = !!context?.trim();
    // Deterministic, context-aware "answer" — enough to prove retrieval fed
    // real chunk content into the model call and that streaming yields
    // multiple pieces over the wire, without needing a real provider.
    const responseText = grounded
      ? `Com base no material da sua turma: "${context!.slice(0, 160)}". Isso ajuda com sua pergunta sobre "${lastUserMessage}"? (resposta de exemplo do provider mock)`
      : `Não encontrei material da sua turma sobre "${lastUserMessage}". (resposta de exemplo do provider mock, sem contexto)`;

    for (const word of responseText.split(" ")) {
      // A tiny delay between tokens is what makes real providers feel like
      // streaming instead of an instant dump — also forces distinguishable
      // network frames instead of TCP coalescing a fast, tiny response.
      await new Promise((resolve) => setTimeout(resolve, 15));
      yield word + " ";
    }
  },

  async embed({ texts }) {
    // Deterministic hash -> low-dim vector — enough to exercise the RAG
    // plumbing before a real embeddings provider exists (Fase 4).
    return texts.map((t) => {
      let h = 0;
      for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
      return Array.from({ length: 8 }, (_, i) => ((h >> i) % 100) / 100);
    });
  },
};
