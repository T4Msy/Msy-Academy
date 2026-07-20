import type { AIProvider } from "../provider";
import type { Question, QuestionType, Difficulty, AITask } from "../types";

type LocalExamInput = {
  tituloprova?: string;
  materia?: string;
  assunto?: string;
  serie?: string;
  publico?: string;
  quantidade?: number | string;
  tipo?: string;
  nivel?: string;
  apostilaContent?: string;
  variationMode?: boolean;
  variationAttempt?: number;
  originalExam?: { questions?: Array<{ type?: QuestionType; statement?: string; difficulty?: Difficulty }> };
};

type LocalItem = {
  prompt: string;
  answer: string;
  distractors: [string, string, string];
  explanation: string;
};

const PLACEHOLDER_PATTERN = /questão\s+\d+\s+sobre|alternativa\s+[a-z]\s+para|explicação de exemplo|placeholder/i;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

function squareRootItem(index: number, difficulty: Difficulty, variationSeed = 0): LocalItem {
  const exactRoots = difficulty === "FACIL" ? [6, 8, 9, 10, 12] : difficulty === "DIFICIL" ? [15, 18, 20, 25, 30] : [10, 11, 12, 13, 15];
  const root = exactRoots[(index + variationSeed) % exactRoots.length];
  const area = root * root;
  const radicalFactor = 5 + variationSeed;
  const approximateBase = 7 + variationSeed;
  const approximateRadicand = approximateBase ** 2 + 1;
  const variants: LocalItem[] = [
    {
      prompt: `Qual é o valor de √${area}?`,
      answer: String(root),
      distractors: [String(root - 1), String(root + 1), String(root + 2)],
      explanation: `Como ${root} × ${root} = ${area}, então √${area} = ${root}.`,
    },
    {
      prompt: variationSeed
        ? "Qual dos números abaixo possui raiz quadrada inteira?"
        : "Qual dos números abaixo é um quadrado perfeito?",
      answer: String(area),
      distractors: [String(area - 2), String(area + 2), String(area + root)],
      explanation: `${area} é quadrado perfeito porque pode ser escrito como ${root}².`,
    },
    {
      prompt: `Simplifique √${radicalFactor ** 2 * 2}.`,
      answer: `${radicalFactor}√2`,
      distractors: [`${radicalFactor * 2}√2`, `${radicalFactor ** 2}√2`, `${radicalFactor}√${radicalFactor * 2}`],
      explanation: `√${radicalFactor ** 2 * 2} = √(${radicalFactor ** 2} × 2) = ${radicalFactor}√2.`,
    },
    {
      prompt: `Um terreno quadrado tem área de ${area} m². Quanto mede cada lado?`,
      answer: `${root} m`,
      distractors: [`${root - 1} m`, `${root + 1} m`, `${Math.round(area / 4)} m`],
      explanation: `O lado de um quadrado é a raiz quadrada da área: √${area} = ${root} m.`,
    },
    {
      prompt: `Compare √${area} e √${(root + 1) ** 2}.`,
      answer: `√${area} < √${(root + 1) ** 2}`,
      distractors: [`√${area} > √${(root + 1) ** 2}`, `√${area} = √${(root + 1) ** 2}`, "Não é possível comparar"],
      explanation: `√${area} = ${root} e √${(root + 1) ** 2} = ${root + 1}; portanto, ${root} < ${root + 1}.`,
    },
    {
      prompt: `Entre quais inteiros consecutivos está √${approximateRadicand}?`,
      answer: `${approximateBase} e ${approximateBase + 1}`,
      distractors: [`${approximateBase - 2} e ${approximateBase - 1}`, `${approximateBase - 1} e ${approximateBase}`, `${approximateBase + 1} e ${approximateBase + 2}`],
      explanation: `Como ${approximateBase}² = ${approximateBase ** 2} e ${approximateBase + 1}² = ${(approximateBase + 1) ** 2}, √${approximateRadicand} está entre ${approximateBase} e ${approximateBase + 1}.`,
    },
  ];
  return variants[index % variants.length];
}

function basicOperationsItem(index: number, difficulty: Difficulty, variationSeed = 0): LocalItem {
  const factor = difficulty === "FACIL" ? 1 : difficulty === "MEDIO" ? 3 : 7;
  const a = 12 + index * factor + variationSeed * 5;
  const b = 4 + ((index + variationSeed) % 5);
  const answer = a + b * 2;
  return {
    prompt: `Calcule ${a} + ${b} × 2, respeitando a ordem das operações.`,
    answer: String(answer),
    distractors: [String((a + b) * 2), String(answer - 2), String(answer + b)],
    explanation: `Primeiro calculamos ${b} × 2 = ${b * 2}; depois, ${a} + ${b * 2} = ${answer}.`,
  };
}

function fractionItem(index: number, variationSeed = 0): LocalItem {
  const denominator = 4 + ((index + variationSeed) % 5);
  const first = 1 + (index % 2);
  const second = 1;
  const numerator = first + second;
  const divisor = gcd(numerator, denominator);
  const answer = `${numerator / divisor}/${denominator / divisor}`;
  return {
    prompt: `Calcule ${first}/${denominator} + ${second}/${denominator} e simplifique o resultado.`,
    answer,
    distractors: [`${first}/${denominator + 1}`, `${numerator}/${denominator + 1}`, `${numerator + 1}/${denominator}`],
    explanation: `Como os denominadores são iguais, somamos os numeradores: ${first} + ${second} = ${numerator}. Simplificando, obtemos ${answer}.`,
  };
}

function percentageItem(index: number, difficulty: Difficulty, variationSeed = 0): LocalItem {
  const rates = difficulty === "FACIL" ? [10, 20, 25, 50] : [15, 30, 35, 40];
  const rate = rates[(index + variationSeed) % rates.length];
  const total = 200 + (index + variationSeed) * 40;
  const answer = (total * rate) / 100;
  return {
    prompt: `Quanto é ${rate}% de ${total}?`,
    answer: String(answer),
    distractors: [String(answer + 10), String(total - answer), String(rate + total / 100)],
    explanation: `${rate}% de ${total} = ${rate}/100 × ${total} = ${answer}.`,
  };
}

function equationItem(index: number, difficulty: Difficulty, variationSeed = 0): LocalItem {
  const x = 3 + index + variationSeed;
  const coefficient = difficulty === "FACIL" ? 1 : difficulty === "MEDIO" ? 2 : 3;
  const constant = 4 + (index % 4);
  const result = coefficient * x + constant;
  const expression = coefficient === 1 ? `x + ${constant}` : `${coefficient}x + ${constant}`;
  return {
    prompt: `Resolva a equação ${expression} = ${result}.`,
    answer: `x = ${x}`,
    distractors: [`x = ${x - 1}`, `x = ${x + 1}`, `x = ${x + 2}`],
    explanation: coefficient === 1
      ? `Subtraindo ${constant} dos dois lados, obtemos x = ${x}.`
      : `Subtraindo ${constant} dos dois lados, obtemos ${coefficient}x = ${coefficient * x}; dividindo por ${coefficient}, x = ${x}.`,
  };
}

function pedagogicalFallback(index: number, materia: string, assunto: string, serie: string, variationSeed = 0): LocalItem {
  const topic = assunto || materia;
  const audience = serie ? ` para ${serie}` : "";
  return {
    prompt: variationSeed
      ? `Em um novo contexto de aprendizagem ${index + variationSeed}, qual alternativa aplica corretamente ${topic}${audience}?`
      : `Qual alternativa apresenta uma aplicação coerente de ${topic}${audience}?`,
    answer: variationSeed
      ? `Relacionar ${topic} a um caso concreto e sustentar a análise com evidências verificáveis.`
      : `Usar o conceito de ${topic} para analisar uma situação e justificar a conclusão com evidências.`,
    distractors: [
      `Memorizar o nome de ${topic} sem relacioná-lo a exemplos.`,
      `Ignorar os dados do problema e escolher uma conclusão ao acaso.`,
      `Substituir a explicação por uma opinião sem justificativa.`,
    ],
    explanation: variationSeed
      ? `A nova situação exige aplicar ${topic}, interpretar evidências e justificar a conclusão alcançada.`
      : `Uma aplicação adequada de ${topic} relaciona o conceito a uma situação concreta e apresenta justificativa verificável.`,
  };
}

function localItem(index: number, input: LocalExamInput, difficulty: Difficulty, variationSeed = 0): LocalItem {
  const subject = normalize(input.materia ?? "");
  const topic = normalize(input.assunto ?? "");
  if (subject.includes("matemat") || ["raiz", "oper", "frac", "porcent", "equac"].some((term) => topic.includes(term))) {
    if (topic.includes("raiz") || topic.includes("radic")) {
      const original = normalize(input.originalExam?.questions?.[index]?.statement ?? "");
      const objective = original.includes("quadrado perfeito") || original.includes("raiz quadrada inteira")
        ? 1
        : original.includes("simplifique")
          ? 2
          : original.includes("area")
            ? 3
            : original.includes("compare")
              ? 4
              : original.includes("inteiros consecutivos")
                ? 5
                : index;
      return squareRootItem(objective, difficulty, variationSeed);
    }
    if (topic.includes("frac")) return fractionItem(index, variationSeed);
    if (topic.includes("porcent")) return percentageItem(index, difficulty, variationSeed);
    if (topic.includes("equac")) return equationItem(index, difficulty, variationSeed);
    if (topic.includes("oper") || topic.includes("aritmet")) return basicOperationsItem(index, difficulty, variationSeed);
  }
  return pedagogicalFallback(index, input.materia || "a disciplina", input.assunto || "o conteúdo solicitado", input.serie || input.publico || "", variationSeed);
}

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
  input: LocalExamInput,
  difficulty: Difficulty,
  variationSeed = 0,
): Question {
  const item = localItem(i, input, difficulty, variationSeed);
  const tags = [input.materia, input.assunto, input.serie || input.publico].filter(Boolean) as string[];

  if (tipo === "MULTIPLA") {
    const texts = [item.answer, ...item.distractors];
    const shift = (i + variationSeed) % texts.length;
    const rotated = [...texts.slice(shift), ...texts.slice(0, shift)];
    const options = rotated.map((text, optionIndex) => ({ id: String.fromCharCode(65 + optionIndex), text }));
    const correctAnswer = options.find((option) => option.text === item.answer)!.id;
    return {
      type: "MULTIPLA",
      statement: item.prompt,
      options,
      correctAnswer,
      explanation: item.explanation,
      difficulty,
      tags,
    };
  }

  if (tipo === "VF") {
    const isTrue = (i + variationSeed) % 2 === 0;
    const proposedAnswer = isTrue ? item.answer : item.distractors[0];
    return {
      type: "VF",
      statement: `${item.prompt} Considere a resposta “${proposedAnswer}”. Essa afirmação é verdadeira?`,
      options: [
        { id: "V", text: "Verdadeiro" },
        { id: "F", text: "Falso" },
      ],
      correctAnswer: isTrue ? "V" : "F",
      explanation: isTrue ? item.explanation : `A afirmação é falsa. ${item.explanation}`,
      difficulty,
      tags,
    };
  }

  return {
    type: "DISCURSIVA",
    statement: `${item.prompt} Apresente os cálculos ou a justificativa utilizada.`,
    correctAnswer: item.answer,
    explanation: item.explanation,
    difficulty,
    tags,
  };
}

function assertExamQuality(questions: Question[]): void {
  for (const [index, question] of questions.entries()) {
    const texts = [question.statement, question.explanation ?? "", ...(question.options?.map((option) => option.text) ?? [])];
    if (texts.some((text) => !text.trim() || PLACEHOLDER_PATTERN.test(text))) throw new Error(`Questão local ${index + 1} contém texto inválido.`);
    if (question.type !== "DISCURSIVA") {
      const options = question.options ?? [];
      const normalizedOptions = options.map((option) => normalize(option.text));
      if (new Set(normalizedOptions).size !== normalizedOptions.length) throw new Error(`Questão local ${index + 1} contém alternativas duplicadas.`);
      if (!options.some((option) => option.id === question.correctAnswer)) throw new Error(`Questão local ${index + 1} não possui a resposta correta nas alternativas.`);
    }
  }
}

/**
 * Deterministic provider used until a real key/provider is chosen (Fase 1+
 * runs entirely against this). No network calls, no cost, same output shape
 * a real adapter would return — every route/UI is built and tested against
 * this before "com chave real" gates are unblocked.
 */
export const mockProvider: AIProvider = {
  id: "mock",
  metered: false,

  async generateStructured<T>({ task, input }: { task: AITask; schema: Record<string, unknown>; input: unknown }) {
    if (task === "EXAM_GEN" || task === "ACTIVITY_GEN") {
      const p = input as LocalExamInput;
      const originalQuestions = p.originalExam?.questions ?? [];
      const quantidade = p.variationMode ? originalQuestions.length : Number(p.quantidade) || 10;
      const difficulty = (p.nivel?.toUpperCase() as Difficulty) || "MEDIO";
      const variationSeed = p.variationMode ? Math.max(1, p.variationAttempt ?? 1) : 0;
      const questions: Question[] = Array.from({ length: quantidade }, (_, i) => {
        const original = originalQuestions[i];
        return buildQuestion(
          i,
          p.variationMode && original?.type ? original.type : pickTipo(p.tipo ?? "multipla", i),
          p,
          p.variationMode && original?.difficulty ? original.difficulty : difficulty,
          variationSeed,
        );
      });
      assertExamQuality(questions);
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

  async *streamChat({ messages, context, onUsage }) {
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

    // Deterministic non-zero estimate (word counts) — not real token usage
    // (mock never calls a real API), but non-zero so tests/regressions can
    // actually verify usage flows end-to-end through the orchestrator.
    const tokensIn = messages.reduce((sum, m) => sum + m.content.split(/\s+/).filter(Boolean).length, 0);
    const tokensOut = responseText.split(/\s+/).filter(Boolean).length;
    onUsage?.({ tokensIn, tokensOut });
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
