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
const GAME_BATCH_SIZE = 10;

function difficultyForQuestion(index: number) {
  if (index < 10) return { generatorDifficulty: "facil", label: "Iniciante", instruction: "Priorize fundamentos e raciocínio direto." };
  if (index < 20) return { generatorDifficulty: "medio", label: "Intermediário", instruction: "Exija aplicação dos conceitos em situações variadas." };
  if (index < 40) return { generatorDifficulty: "dificil", label: "Avançado", instruction: "Exija raciocínio em múltiplas etapas e evite pistas óbvias." };
  if (index < 60) return { generatorDifficulty: "dificil", label: "Elite", instruction: "Crie desafios complexos, com distratores plausíveis e integração de conceitos." };
  if (index < 100) return { generatorDifficulty: "dificil", label: "Extremo", instruction: "Crie questões de nível extremo: alto rigor, múltiplas etapas e casos menos usuais." };
  return { generatorDifficulty: "dificil", label: "Lendário", instruction: "Crie questões de nível lendário/extremo, progressivamente mais exigentes, mas sempre solucionáveis pelo conteúdo do tema." };
}

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

function normalizeGeneratedQuestions(activity: GeneratedActivity, startIndex = 0) {
  const playable = activity.questions.filter((q) => q.type !== "DISCURSIVA" && Array.isArray(q.options) && q.options.length >= 2).slice(0, GAME_BATCH_SIZE);
  if (playable.length < 5) throw new Error("A IA não gerou desafios suficientes. Tente outro tema.");
  return {
    publicQuestions: playable.map((q) => ({ id: crypto.randomUUID(), type: q.type === "VF" ? "VF" : "MULTIPLA", statement: q.statement, options: q.options! })),
    answerKeys: playable.map((q, question_index) => ({ question_index: startIndex + question_index, correct_answer: Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer, explanation: q.explanation ?? null })),
  };
}

async function generateGameBatch(input: { subject: string; topic: string; tenantId: string; userId: string; startIndex: number }) {
  const difficulty = difficultyForQuestion(input.startIndex);
  const activity = await generateStructured<GeneratedActivity>({
    task: "ACTIVITY_GEN", schema: ACTIVITY_GENERATION_SCHEMA_V1,
    input: { tituloprova: `Missão do Saber: ${input.subject}`, materia: input.subject, assunto: `${input.topic}. ${difficulty.instruction}`, tipo: "multipla", quantidade: GAME_BATCH_SIZE, nivel: difficulty.generatorDifficulty },
    tenantId: input.tenantId, userId: input.userId,
  });
  return normalizeGeneratedQuestions(activity, input.startIndex);
}

export async function startStudyGame(raw: unknown): Promise<string> {
  const parsed = startSchema.parse(raw);
  const { user, tenantId } = await requireStudent();
  const topic = parsed.topic || `Fundamentos de ${parsed.subject}`;
  const { publicQuestions, answerKeys } = await generateGameBatch({ subject: parsed.subject, topic, tenantId, userId: user.id, startIndex: 0 });
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
    .select("id, subject, topic, questions, status, current_question_index, score, combo, lives_remaining, correct_count")
    .eq("id", runId).eq("student_id", user.id).eq("tenant_id", tenantId).single();
  if (runError || !run || run.status !== "ACTIVE") throw new Error("Esta missão já foi encerrada.");
  if (run.current_question_index !== questionIndex) throw new Error("Essa pergunta já foi respondida.");
  const questions = run.questions as StudyGameQuestion[];
  if (!questions[questionIndex]) throw new Error("Pergunta inválida.");
  const { data: key } = await admin.from("study_game_answer_keys").select("correct_answer, explanation").eq("run_id", runId).eq("question_index", questionIndex).single();
  if (!key) throw new Error("Não foi possível validar a resposta.");
  const isCorrect = answer === key.correct_answer;
  const correctOption = questions[questionIndex].options.find((option) => option.id === key.correct_answer);
  const explanation = key.explanation ?? (correctOption ? `A resposta correta é: ${correctOption.text}.` : "Confira a alternativa correta destacada antes de seguir.");
  const nextCombo = isCorrect ? run.combo + 1 : 0;
  const earned = isCorrect ? 100 * Math.min(2, 1 + Math.floor(run.combo / 3)) : 0;
  const nextScore = run.score + earned;
  const nextLives = isCorrect ? run.lives_remaining : run.lives_remaining - 1;
  const nextIndex = questionIndex + 1;
  let appendedQuestions: StudyGameQuestion[] = [];
  let allQuestions = questions;
  if (nextLives > 0 && nextIndex >= questions.length) {
    const batch = await generateGameBatch({ subject: run.subject, topic: run.topic, tenantId, userId: user.id, startIndex: questions.length });
    appendedQuestions = batch.publicQuestions as StudyGameQuestion[];
    allQuestions = [...questions, ...appendedQuestions];
    const { error: keysError } = await admin.from("study_game_answer_keys").upsert(batch.answerKeys.map((key) => ({ ...key, run_id: runId })), { onConflict: "run_id,question_index", ignoreDuplicates: true });
    if (keysError) throw new Error("Não foi possível preparar a próxima fase.");
  }
  const status = nextLives === 0 ? "LOST" : "ACTIVE";
  const completed = status !== "ACTIVE";
  const { error: updateError } = await admin.from("study_game_runs").update({ questions: allQuestions, current_question_index: nextIndex, score: nextScore, combo: nextCombo, lives_remaining: nextLives, correct_count: run.correct_count + (isCorrect ? 1 : 0), status, finished_at: completed ? new Date().toISOString() : null }).eq("id", runId).eq("current_question_index", questionIndex);
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
  return { isCorrect, correctAnswer: key.correct_answer, explanation, score: nextScore, combo: nextCombo, livesRemaining: nextLives, status, nextQuestionIndex: nextIndex, appendedQuestions, newRecord };
}
