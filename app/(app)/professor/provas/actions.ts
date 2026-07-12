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
  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) throw new Error("Perfil não encontrado.");

  const { data, error } = await supabase
    .from("exams")
    .insert({ tenant_id: profile.tenant_id, author_id: user.id, title: clean, course: course?.trim() || null })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Não foi possível criar a prova: ${error?.message ?? "erro"}`);

  revalidatePath("/professor/provas");
  return data.id;
}

/** Cria uma questão nova e anexa ao final da prova. */
export async function addQuestionToExam(examId: string, input: NewQuestionInput): Promise<void> {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
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

/**
 * RF-P08 — gera uma "versão B": nova linha em `exams` (version+1), reaproveita
 * as MESMAS `questions` (nenhuma duplicada), mas embaralha a ordem das
 * `exam_questions.position`. Embaralhar a ordem das alternativas de múltipla
 * escolha acontece no render, não no dado — ver QuestionsEditor.
 */
export async function duplicateExamVersion(examId: string): Promise<string> {
  const { supabase, user } = await requireUser();

  const { data: exam, error: examErr } = await supabase
    .from("exams")
    .select("title, course, style, subject_id, grade_level_id, generation_params, include_answer_key, ai_provider, ai_model, version")
    .eq("id", examId)
    .single();
  if (examErr || !exam) throw new Error("Prova não encontrada.");

  const { data: eqs, error: eqErr } = await supabase
    .from("exam_questions")
    .select("question_id, points")
    .eq("exam_id", examId);
  if (eqErr || !eqs || eqs.length === 0) throw new Error("Prova sem questões para duplicar.");

  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) throw new Error("Perfil não encontrado.");

  const { data: newExam, error: insertErr } = await supabase
    .from("exams")
    .insert({
      tenant_id: profile.tenant_id,
      author_id: user.id,
      title: `${exam.title} (Versão B)`,
      course: exam.course,
      style: exam.style,
      subject_id: exam.subject_id,
      grade_level_id: exam.grade_level_id,
      generation_params: exam.generation_params,
      include_answer_key: exam.include_answer_key,
      status: "READY",
      ai_provider: exam.ai_provider,
      ai_model: exam.ai_model,
      version: (exam.version ?? 1) + 1,
    })
    .select("id")
    .single();
  if (insertErr || !newExam) throw new Error(`Não foi possível duplicar: ${insertErr?.message ?? "erro"}`);

  const shuffled = [...eqs].sort(() => Math.random() - 0.5);
  const rows = shuffled.map((eq, i) => ({
    exam_id: newExam.id,
    question_id: eq.question_id,
    position: i + 1,
    points: eq.points,
  }));
  const { error: linkErr } = await supabase.from("exam_questions").insert(rows);
  if (linkErr) throw new Error(`Não foi possível copiar as questões: ${linkErr.message}`);

  revalidatePath("/professor/provas");
  return newExam.id;
}

/** Swap a question's position with its neighbor within the same exam. */
export async function moveQuestion(examId: string, questionId: string, direction: "up" | "down"): Promise<void> {
  const { supabase } = await requireUser();
  await moveLinkedQuestion(supabase, LINK_CONFIG(examId), questionId, direction);
  revalidatePath(`/professor/provas/${examId}`);
}

/**
 * Regenerate a single question via the AI orchestrator (quantidade=1, mesmo
 * tipo/dificuldade da questão original) and overwrite it in place — o
 * question_id não muda, então a posição na prova é preservada.
 */
export async function regenerateQuestion(examId: string, questionId: string): Promise<void> {
  const { supabase, user } = await requireUser();

  const { data: exam, error: examErr } = await supabase
    .from("exams")
    .select("tenant_id, generation_params")
    .eq("id", examId)
    .single();
  if (examErr || !exam) throw new Error("Prova não encontrada.");

  await regenerateLinkedQuestion(
    supabase,
    questionId,
    (exam.generation_params as object) ?? {},
    "EXAM_GEN",
    exam.tenant_id,
    user.id,
  );
  revalidatePath(`/professor/provas/${examId}`);
}
