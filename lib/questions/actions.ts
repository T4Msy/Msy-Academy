"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeBnccCodes } from "./bncc";
import { normalizeQuestionTags } from "./tags";
import type { NewQuestionInput } from "./types";

/**
 * Acoes de questao compartilhadas entre Provas, Atividades e Banco de
 * Questoes. `questions` (migration 0005) e um banco unico por tenant.
 */

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

async function setQuestionBnccCodes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  questionId: string,
  bnccCodes: string[],
): Promise<void> {
  const { error } = await supabase.rpc("set_question_bncc_skills", {
    p_question_id: questionId,
    p_bncc_codes: bnccCodes,
  });
  if (error) throw new Error(`Nao foi possivel salvar os codigos BNCC: ${error.message}`);
}

/** Cria uma questao avulsa no banco do tenant (RLS: questions_insert_own, migration 0005). */
export async function createQuestion(input: NewQuestionInput): Promise<string> {
  const { supabase, user } = await requireUser();
  const bnccCodes = normalizeBnccCodes(input.bnccCodes);
  const tags = normalizeQuestionTags(input.tags) ?? [];

  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) throw new Error("Perfil nao encontrado.");

  const { data, error } = await supabase
    .from("questions")
    .insert({
      tenant_id: profile.tenant_id,
      author_id: user.id,
      type: input.type,
      difficulty: input.difficulty ?? "MEDIO",
      statement: input.statement,
      options: input.options,
      correct_answer: input.correctAnswer,
      explanation: input.explanation ?? null,
      tags,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Nao foi possivel criar a questao: ${error?.message ?? "erro"}`);

  if (bnccCodes !== undefined) {
    await setQuestionBnccCodes(supabase, data.id, bnccCodes);
  }

  return data.id;
}

/** Edita uma questao in-line, usado por Provas, Atividades e Banco de Questoes. */
export async function updateQuestion(
  questionId: string,
  patch: {
    statement?: string;
    options?: { id: string; text: string }[] | null;
    correctAnswer?: string | string[];
    explanation?: string | null;
    tags?: string[];
    bnccCodes?: string[];
  },
): Promise<void> {
  const { supabase } = await requireUser();
  const bnccCodes = normalizeBnccCodes(patch.bnccCodes);
  const tags = normalizeQuestionTags(patch.tags);

  const update: Record<string, unknown> = {};
  if (patch.statement !== undefined) update.statement = patch.statement;
  if (patch.options !== undefined) update.options = patch.options;
  if (patch.correctAnswer !== undefined) update.correct_answer = patch.correctAnswer;
  if (patch.explanation !== undefined) update.explanation = patch.explanation;
  if (tags !== undefined) update.tags = tags;

  if (Object.keys(update).length > 0) {
    const { error } = await supabase.from("questions").update(update).eq("id", questionId);
    if (error) throw new Error(`Nao foi possivel salvar a questao: ${error.message}`);
  }

  if (bnccCodes !== undefined) {
    await setQuestionBnccCodes(supabase, questionId, bnccCodes);
  }
}
