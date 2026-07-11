"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/ai/orchestrator";
import { EXAM_GENERATION_SCHEMA_V1 } from "@/lib/ai/prompts/exam-generation.v1";
import type { GeneratedExam } from "@/lib/ai/types";

/**
 * Lifecycle + editing actions for a generated exam (Fase 1). All writes go
 * through the caller's authenticated client, so RLS (migrations 0001, 0005)
 * enforces tenant isolation and authorship.
 */

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

/**
 * RF-P08 — gera uma "versão B": nova linha em `exams` (version+1), reaproveita
 * as MESMAS `questions` (nenhuma duplicada), mas embaralha a ordem das
 * `exam_questions.position`. Embaralhar a ordem das alternativas de múltipla
 * escolha acontece no render, não no dado — ver ExamQuestionsEditor.
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

/** Edit a question inline (statement/options/correctAnswer/explanation). */
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

/** Swap a question's position with its neighbor within the same exam. */
export async function moveQuestion(
  examId: string,
  questionId: string,
  direction: "up" | "down",
): Promise<void> {
  const { supabase } = await requireUser();

  const { data: eqs, error } = await supabase
    .from("exam_questions")
    .select("question_id, position")
    .eq("exam_id", examId)
    .order("position");
  if (error || !eqs) throw new Error("Não foi possível reordenar.");

  const idx = eqs.findIndex((e) => e.question_id === questionId);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= eqs.length) return;

  const a = eqs[idx];
  const b = eqs[swapIdx];

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from("exam_questions").update({ position: b.position }).eq("exam_id", examId).eq("question_id", a.question_id),
    supabase.from("exam_questions").update({ position: a.position }).eq("exam_id", examId).eq("question_id", b.question_id),
  ]);
  if (e1 || e2) throw new Error("Não foi possível reordenar.");

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

  const { data: question, error: qErr } = await supabase
    .from("questions")
    .select("type, difficulty")
    .eq("id", questionId)
    .single();
  if (qErr || !question) throw new Error("Questão não encontrada.");

  const typeMap: Record<string, string> = { MULTIPLA: "multipla", VF: "vf", DISCURSIVA: "discursiva" };
  const input = {
    ...((exam.generation_params as object) ?? {}),
    quantidade: 1,
    tipo: typeMap[question.type] ?? "multipla",
    nivel: question.difficulty.toLowerCase(),
  };

  const generated = await generateStructured<GeneratedExam>({
    task: "EXAM_GEN",
    schema: EXAM_GENERATION_SCHEMA_V1,
    input,
    tenantId: exam.tenant_id,
    userId: user.id,
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

  revalidatePath(`/professor/provas/${examId}`);
}
