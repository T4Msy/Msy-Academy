"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { NewQuestionInput } from "./types";

/**
 * Ações de questão compartilhadas entre Provas, Atividades e Banco de
 * Questões — `questions` (migration 0005) é um banco único por tenant, não
 * pertence a nenhum módulo específico.
 */

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/** Cria uma questão avulsa no banco do tenant (RLS: questions_insert_own, migration 0005). */
export async function createQuestion(input: NewQuestionInput): Promise<string> {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) throw new Error("Perfil não encontrado.");

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
      tags: input.tags ?? [],
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Não foi possível criar a questão: ${error?.message ?? "erro"}`);

  return data.id;
}

/** Edita uma questão in-line — usado por Provas, Atividades e Banco de Questões. */
export async function updateQuestion(
  questionId: string,
  patch: {
    statement?: string;
    options?: { id: string; text: string }[] | null;
    correctAnswer?: string | string[];
    explanation?: string | null;
  },
): Promise<void> {
  const { supabase } = await requireUser();

  const update: Record<string, unknown> = {};
  if (patch.statement !== undefined) update.statement = patch.statement;
  if (patch.options !== undefined) update.options = patch.options;
  if (patch.correctAnswer !== undefined) update.correct_answer = patch.correctAnswer;
  if (patch.explanation !== undefined) update.explanation = patch.explanation;

  const { error } = await supabase.from("questions").update(update).eq("id", questionId);
  if (error) throw new Error(`Não foi possível salvar a questão: ${error.message}`);
}
