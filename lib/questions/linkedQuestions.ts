import { createClient } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/ai/orchestrator";
import { EXAM_GENERATION_SCHEMA_V1 } from "@/lib/ai/prompts/exam-generation.v1";
import type { GeneratedExam } from "@/lib/ai/types";
import type { NewQuestionInput } from "./types";

/**
 * Genérico sobre `exam_questions`/`activity_items` (migrations 0005/0007) —
 * as duas tabelas de junção têm o mesmo shape (parent_id, question_id,
 * position, points) e as mesmas policies de INSERT/UPDATE/DELETE para o
 * autor do parent. Reaproveitado por Provas e Atividades para não duplicar
 * a lógica de mover/adicionar/remover/regenerar questão. Não é "use server"
 * — só é chamado a partir de arquivos que já são (provas/actions.ts,
 * atividades/[id]/actions.ts), depois de requireUser().
 */

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface LinkedQuestionsConfig {
  linkTable: "exam_questions" | "activity_items";
  parentColumn: "exam_id" | "activity_id";
  parentId: string;
}

/** Cria uma questão nova e anexa ao final da prova/atividade. */
export async function addLinkedQuestion(
  supabase: Supabase,
  config: LinkedQuestionsConfig,
  input: NewQuestionInput,
  tenantId: string,
  authorId: string,
): Promise<string> {
  const { data: question, error: qErr } = await supabase
    .from("questions")
    .insert({
      tenant_id: tenantId,
      author_id: authorId,
      type: input.type,
      difficulty: input.difficulty ?? "MEDIO",
      statement: input.statement,
      options: input.options,
      correct_answer: input.correctAnswer,
      explanation: input.explanation ?? null,
      tags: input.tags ?? [],
    })
    .select("id")
    .single();
  if (qErr || !question) throw new Error(`Não foi possível criar a questão: ${qErr?.message ?? "erro"}`);

  const { data: lastRow } = await supabase
    .from(config.linkTable)
    .select("position")
    .eq(config.parentColumn, config.parentId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (lastRow?.position ?? 0) + 1;

  const { error: linkErr } = await supabase
    .from(config.linkTable)
    .insert({ [config.parentColumn]: config.parentId, question_id: question.id, position });
  if (linkErr) throw new Error(`Não foi possível anexar a questão: ${linkErr.message}`);

  return question.id;
}

/** Desvincula a questão da prova/atividade — a questão continua no banco. */
export async function removeLinkedQuestion(
  supabase: Supabase,
  config: LinkedQuestionsConfig,
  questionId: string,
): Promise<void> {
  const { error } = await supabase
    .from(config.linkTable)
    .delete()
    .eq(config.parentColumn, config.parentId)
    .eq("question_id", questionId);
  if (error) throw new Error(`Não foi possível remover a questão: ${error.message}`);
}

/** Troca a posição de uma questão com a vizinha. */
export async function moveLinkedQuestion(
  supabase: Supabase,
  config: LinkedQuestionsConfig,
  questionId: string,
  direction: "up" | "down",
): Promise<void> {
  const { data: rows, error } = await supabase
    .from(config.linkTable)
    .select("question_id, position")
    .eq(config.parentColumn, config.parentId)
    .order("position");
  if (error || !rows) throw new Error("Não foi possível reordenar.");

  const idx = rows.findIndex((r) => r.question_id === questionId);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= rows.length) return;

  const a = rows[idx];
  const b = rows[swapIdx];

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from(config.linkTable).update({ position: b.position }).eq(config.parentColumn, config.parentId).eq("question_id", a.question_id),
    supabase.from(config.linkTable).update({ position: a.position }).eq(config.parentColumn, config.parentId).eq("question_id", b.question_id),
  ]);
  if (e1 || e2) throw new Error("Não foi possível reordenar.");
}

/**
 * Regenera uma única questão via IA (mesmo tipo/dificuldade da original) e
 * sobrescreve em lugar — o question_id não muda, a posição é preservada.
 * `task` varia por kind (EXAM_GEN/ACTIVITY_GEN) só para o log de
 * `ai_interactions`; o schema de saída é o mesmo nos dois casos (activity-
 * generation.v1.ts reexporta EXAM_GENERATION_SCHEMA_V1 sem alteração).
 */
export async function regenerateLinkedQuestion(
  supabase: Supabase,
  questionId: string,
  generationParams: object,
  task: "EXAM_GEN" | "ACTIVITY_GEN",
  tenantId: string,
  userId: string,
): Promise<void> {
  const { data: question, error: qErr } = await supabase
    .from("questions")
    .select("type, difficulty")
    .eq("id", questionId)
    .single();
  if (qErr || !question) throw new Error("Questão não encontrada.");

  const typeMap: Record<string, string> = { MULTIPLA: "multipla", VF: "vf", DISCURSIVA: "discursiva" };
  const input = {
    ...generationParams,
    quantidade: 1,
    tipo: typeMap[question.type] ?? "multipla",
    nivel: question.difficulty.toLowerCase(),
  };

  const generated = await generateStructured<GeneratedExam>({
    task,
    schema: EXAM_GENERATION_SCHEMA_V1,
    input,
    tenantId,
    userId,
  });

  const newQuestion = generated.questions[0];
  if (!newQuestion) throw new Error("A IA não retornou uma nova questão.");

  const { error } = await supabase
    .from("questions")
    .update({
      statement: newQuestion.statement,
      options: newQuestion.options ?? null,
      correct_answer: newQuestion.correctAnswer,
      explanation: newQuestion.explanation ?? null,
      difficulty: newQuestion.difficulty,
      tags: newQuestion.tags ?? [],
    })
    .eq("id", questionId);
  if (error) throw new Error(`Não foi possível regenerar: ${error.message}`);
}
