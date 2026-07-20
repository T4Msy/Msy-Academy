"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addLinkedQuestion,
  moveLinkedQuestion,
  regenerateLinkedQuestion,
  removeLinkedQuestion,
} from "@/lib/questions/linkedQuestions";
import type { NewQuestionInput } from "@/lib/questions/types";
import { getAIProvider } from "@/lib/ai/registry";
import { generatedExamVariationSchema, nextVariationTitle } from "@/lib/exam/variation";

/**
 * Lifecycle + editing actions for a generated exam (Fase 1). All writes go
 * through the caller's authenticated client, so RLS (migrations 0001, 0005)
 * enforces tenant isolation and authorship.
 */

const LINK_CONFIG = (examId: string) => ({
  linkTable: "exam_questions" as const,
  parentColumn: "exam_id" as const,
  parentId: examId,
});

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function renameExam(id: string, title: string): Promise<void> {
  const clean = title.trim();
  if (!clean) return;

  const { supabase } = await requireUser();
  const { error } = await supabase.from("exams").update({ title: clean }).eq("id", id);
  if (error) throw new Error(`Não foi possível renomear: ${error.message}`);

  revalidatePath("/professor/provas");
  revalidatePath(`/professor/provas/${id}`);
}

/** Soft-delete via the SECURITY DEFINER RPC (migration 0003) — see the RLS note there. */
export async function deleteExam(id: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("soft_delete_exam", { p_exam_id: id });
  if (error) throw new Error(`Não foi possível excluir: ${error.message}`);
  revalidatePath("/professor/provas");
}

/** Criação manual (RF sem IA) — prova em branco, questões adicionadas depois via addQuestionToExam. */
export async function createBlankExam(title: string, course?: string): Promise<string> {
  const clean = title.trim();
  if (!clean) throw new Error("Informe um título para a prova.");

  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Perfil não encontrado.");

  const { data, error } = await supabase
    .from("exams")
    .insert({
      tenant_id: profile.tenant_id,
      author_id: user.id,
      title: clean,
      course: course?.trim() || null,
    })
    .select("id")
    .single();
  if (error || !data)
    throw new Error(`Não foi possível criar a prova: ${error?.message ?? "erro"}`);

  revalidatePath("/professor/provas");
  return data.id;
}

/** Cria uma questão nova e anexa ao final da prova. */
export async function addQuestionToExam(examId: string, input: NewQuestionInput): Promise<void> {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Perfil não encontrado.");

  await addLinkedQuestion(supabase, LINK_CONFIG(examId), input, profile.tenant_id, user.id);
  revalidatePath(`/professor/provas/${examId}`);
}

/** Desvincula a questão da prova — a questão continua no Banco de Questões. */
export async function removeQuestionFromExam(examId: string, questionId: string): Promise<void> {
  const { supabase } = await requireUser();
  await removeLinkedQuestion(supabase, LINK_CONFIG(examId), questionId);
  revalidatePath(`/professor/provas/${examId}`);
}

/** Persiste somente uma prévia confirmada, sempre como outra prova e sem copiar vínculos. */
export async function saveExamVariation(
  examId: string,
  variation: unknown,
): Promise<{ id?: string; error?: string }> {
  const parsed = generatedExamVariationSchema.safeParse(variation);
  if (!parsed.success)
    return { error: "A prévia da variação é inválida. Gere novamente antes de salvar." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sua sessão terminou. Entre novamente para continuar." };

  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("title, course, style, generation_params, include_answer_key, author_id")
    .eq("id", examId)
    .single();
  if (examError || !exam) {
    console.error("Failed to load original exam while saving variation", examError);
    return { error: "Prova original não encontrada." };
  }
  if (exam.author_id !== user.id)
    return { error: "Você não tem permissão para salvar uma variação desta prova." };

  const { data: siblings, error: siblingsError } = await supabase
    .from("exams")
    .select("title")
    .eq("author_id", user.id);
  if (siblingsError) {
    console.error("Failed to list exam variation titles", siblingsError);
    return { error: "Não conseguimos preparar o título da nova prova. Tente novamente." };
  }

  const title = nextVariationTitle(
    exam.title,
    (siblings ?? []).map((item) => item.title),
  );
  const provider = getAIProvider();
  const { data: newExamId, error: rpcError } = await supabase.rpc("create_exam_with_questions", {
    p_title: title,
    p_course: exam.course,
    p_style: exam.style,
    p_generation_params: { ...((exam.generation_params as object) ?? {}), variationOf: examId },
    p_include_answer_key: exam.include_answer_key,
    p_ai_provider: provider.id,
    p_questions: parsed.data.questions,
  });

  if (rpcError || !newExamId) {
    console.error("Failed to save exam variation", rpcError);
    return { error: "Não conseguimos salvar a nova prova. A prova original não foi alterada." };
  }

  revalidatePath("/professor/provas");
  return { id: newExamId };
}

/** Swap a question's position with its neighbor within the same exam. */
export async function moveQuestion(
  examId: string,
  questionId: string,
  direction: "up" | "down",
): Promise<void> {
  const { supabase } = await requireUser();
  await moveLinkedQuestion(supabase, LINK_CONFIG(examId), questionId, direction);
  revalidatePath(`/professor/provas/${examId}`);
}

/**
 * Regenerate a single question via the AI orchestrator (quantidade=1, mesmo
 * tipo/dificuldade da questão original) and overwrite it in place — o
 * question_id não muda, então a posição na prova é preservada.
 */
export async function regenerateQuestion(
  examId: string,
  questionId: string,
): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();

  const { data: exam, error: examErr } = await supabase
    .from("exams")
    .select("tenant_id, generation_params")
    .eq("id", examId)
    .single();
  if (examErr || !exam) return { error: "Prova não encontrada." };

  const result = await regenerateLinkedQuestion(
    supabase,
    questionId,
    (exam.generation_params as object) ?? {},
    "EXAM_GEN",
    exam.tenant_id,
    user.id,
  );
  if (result.error) return result;

  revalidatePath(`/professor/provas/${examId}`);
  return {};
}
