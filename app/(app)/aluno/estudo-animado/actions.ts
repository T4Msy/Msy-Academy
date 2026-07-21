"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/ai/orchestrator";
import { ACTIVITY_GENERATION_SCHEMA_V1 } from "@/lib/ai/prompts/activity-generation.v1";
import type { GeneratedActivity } from "@/lib/ai/types";
import type { StudyGameAnswerResult, StudyGameQuestion } from "@/lib/study-game/types";

const startSchema = z.object({ subject: z.string().trim().min(2, "Informe uma matéria.").max(80), topic: z.string().trim().max(140).optional() });

async function requireStudent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("tenant_id").eq("id", user.id).single(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);
  if (!profile || !roles?.some((item) => item.role === "ALUNO")) throw new Error("Sem permissão para iniciar uma missão.");
  return { user, tenantId: profile.tenant_id };
}

function normalizeGeneratedQuestions(activity: GeneratedActivity) {
  const playable = activity.questions.filter((q) => q.type !== "DISCURSIVA" && Array.isArray(q.options) && q.options.length >= 2).slice(0, 10);
  if (playable.length < 5) throw new Error("A IA não gerou desafios suficientes. Tente outro tema.");
  return {
    publicQuestions: playable.map((q) => ({ id: crypto.randomUUID(), type: q.type === "VF" ? "VF" : "MULTIPLA", statement: q.statement, options: q.options! })),
    answerKeys: playable.map((q, question_index) => ({ question_index, correct_answer: Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer, explanation: q.explanation ?? null })),
  };
}

export async function startStudyGame(raw: unknown): Promise<string> {
  const parsed = startSchema.parse(raw);
  const { user, tenantId } = await requireStudent();
  const topic = parsed.topic || `Fundamentos de ${parsed.subject}`;
  const activity = await generateStructured<GeneratedActivity>({
    task: "ACTIVITY_GEN", schema: ACTIVITY_GENERATION_SCHEMA_V1,
    input: { tituloprova: `Missão do Saber: ${parsed.subject}`, materia: parsed.subject, assunto: topic, tipo: "multipla", quantidade: 10, nivel: "medio" },
    tenantId, userId: user.id,
  });
  const { publicQuestions, answerKeys } = normalizeGeneratedQuestions(activity);
  const admin = createAdminClient();
  const { data: run, error } = await admin.from("study_game_runs").insert({ tenant_id: tenantId, student_id: user.id, subject: parsed.subject, topic, questions: publicQuestions }).select("id").single();
  if (error || !run) throw new Error("Não foi possível iniciar sua missão.");
  const { error: keysError } = await admin.from("study_game_answer_keys").insert(answerKeys.map((key) => ({ ...key, run_id: run.id })));
  if (keysError) { await admin.from("study_game_runs").delete().eq("id", run.id); throw new Error("Não foi possível preparar os desafios."); }
  await admin.from("study_game_profiles").upsert({ student_id: user.id, tenant_id: tenantId }, { onConflict: "student_id", ignoreDuplicates: true });
  return run.id;
}

export async function answerStudyGameQuestion(runId: string, questionIndex: number, answer: string): Promise<StudyGameAnswerResult> {
  const { user, tenantId } = await requireStudent();
  const admin = createAdminClient();
  const { data: run, error: runError } = await admin.from("study_game_runs")
    .select("id, subject, questions, status, current_question_index, score, combo, lives_remaining, correct_count")
    .eq("id", runId).eq("student_id", user.id).eq("tenant_id", tenantId).single();
  if (runError || !run || run.status !== "ACTIVE") throw new Error("Esta missão já foi encerrada.");
  if (run.current_question_index !== questionIndex) throw new Error("Essa pergunta já foi respondida.");
  const questions = run.questions as StudyGameQuestion[];
  if (!questions[questionIndex]) throw new Error("Pergunta inválida.");
  const { data: key } = await admin.from("study_game_answer_keys").select("correct_answer, explanation").eq("run_id", runId).eq("question_index", questionIndex).single();
  if (!key) throw new Error("Não foi possível validar a resposta.");
  const isCorrect = answer === key.correct_answer;
  const nextCombo = isCorrect ? run.combo + 1 : 0;
  const earned = isCorrect ? 100 * Math.min(2, 1 + Math.floor(run.combo / 3)) : 0;
  const nextScore = run.score + earned;
  const nextLives = isCorrect ? run.lives_remaining : run.lives_remaining - 1;
  const nextIndex = questionIndex + 1;
  const status = nextLives === 0 ? "LOST" : nextIndex >= questions.length ? "WON" : "ACTIVE";
  const completed = status !== "ACTIVE";
  const { error: updateError } = await admin.from("study_game_runs").update({ current_question_index: nextIndex, score: nextScore, combo: nextCombo, lives_remaining: nextLives, correct_count: run.correct_count + (isCorrect ? 1 : 0), status, finished_at: completed ? new Date().toISOString() : null }).eq("id", runId).eq("current_question_index", questionIndex);
  if (updateError) throw new Error("Não foi possível salvar sua resposta.");
  let newRecord = false;
  if (completed) {
    const { data: record } = await admin.from("study_game_subject_records").select("best_score, games_played, best_combo").eq("student_id", user.id).eq("subject", run.subject).maybeSingle();
    newRecord = nextScore > (record?.best_score ?? 0);
    await admin.from("study_game_subject_records").upsert({ student_id: user.id, tenant_id: tenantId, subject: run.subject, best_score: Math.max(nextScore, record?.best_score ?? 0), games_played: (record?.games_played ?? 0) + 1, best_combo: Math.max(nextCombo, record?.best_combo ?? 0), updated_at: new Date().toISOString() }, { onConflict: "student_id,subject" });
    const today = new Date().toISOString().slice(0, 10);
    const { data: profile } = await admin.from("study_game_profiles").select("xp, total_games, current_streak, last_played_on").eq("student_id", user.id).maybeSingle();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const nextStreak = profile?.last_played_on === today ? profile.current_streak : profile?.last_played_on === yesterday ? profile.current_streak + 1 : 1;
    await admin.from("study_game_profiles").upsert({
      student_id: user.id, tenant_id: tenantId, xp: (profile?.xp ?? 0) + nextScore,
      total_games: (profile?.total_games ?? 0) + 1, current_streak: nextStreak, last_played_on: today,
      updated_at: new Date().toISOString(),
    }, { onConflict: "student_id" });
    revalidatePath("/aluno/estudo-animado");
  }
  return { isCorrect, explanation: key.explanation, score: nextScore, combo: nextCombo, livesRemaining: nextLives, status, nextQuestionIndex: nextIndex, newRecord };
}
