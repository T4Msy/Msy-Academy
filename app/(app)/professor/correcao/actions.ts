"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { generateStructured } from "@/lib/ai/orchestrator";
import { GRADING_SCHEMA_V1 } from "@/lib/ai/prompts/grading.v1";
import type { GradingSuggestion } from "@/lib/ai/types";
import { checkRateLimit } from "@/lib/ratelimit";
import { QuotaExceededError } from "@/lib/billing/quota";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/**
 * RF-P23 — AI-suggested nota+feedback for one discursive answer. Never
 * auto-saved — the professor reviews it.
 *
 * Returns `{ data } | { error }` instead of throwing/returning the value
 * directly — a `throw` here gets redacted to a generic message by Next.js in
 * production builds (see project memory
 * `nextjs-server-action-error-redaction`), which would silently swallow
 * both the quota-exceeded message and the new rate-limit message below.
 */
export async function suggestGrade(
  submissionId: string,
  statement: string,
  referenceAnswer: string,
  studentAnswer: string,
): Promise<{ data: GradingSuggestion } | { error: string }> {
  const { supabase, user } = await requireUser();

  const rateLimit = await checkRateLimit("ai", user.id);
  if (!rateLimit.success) {
    return { error: "Muitas correções sugeridas em pouco tempo. Aguarde um momento e tente novamente." };
  }

  const { data: submission } = await supabase
    .from("submissions")
    .select("assignment_id, assignments(tenant_id)")
    .eq("id", submissionId)
    .single();
  const tenantId = (submission?.assignments as unknown as { tenant_id: string } | null)?.tenant_id;
  if (!tenantId) return { error: "Envio não encontrado." };

  try {
    const data = await generateStructured<GradingSuggestion>({
      task: "GRADING",
      schema: GRADING_SCHEMA_V1,
      input: { statement, referenceAnswer, studentAnswer },
      tenantId,
      userId: user.id,
    });
    return { data };
  } catch (err) {
    if (err instanceof QuotaExceededError) return { error: err.message };
    return { error: "Não foi possível gerar a sugestão. Tente novamente." };
  }
}

/** Saves the final grade (teacher-reviewed, whether AI-assisted or manual) and flips the submission to GRADED. */
export async function saveGrade(
  submissionId: string,
  totalScore: number,
  feedback: string,
  gradedBy: "AI_SUGGESTED" | "TEACHER",
): Promise<void> {
  if (!Number.isFinite(totalScore) || totalScore < 0 || feedback.length > 5_000) {
    throw new Error("A nota ou o feedback informado e invalido.");
  }
  const { supabase, user } = await requireUser();

  const { error: gradeErr } = await supabase
    .from("grades")
    .upsert({ submission_id: submissionId, total_score: totalScore, feedback, graded_by: gradedBy, reviewed_by: user.id }, { onConflict: "submission_id" });
  if (gradeErr) throw new Error(`Não foi possível salvar a nota: ${gradeErr.message}`);

  const { error: rpcErr } = await supabase.rpc("mark_submission_graded", { p_submission_id: submissionId });
  if (rpcErr) throw new Error(`Não foi possível concluir a correção: ${rpcErr.message}`);

  revalidatePath("/professor/correcao");
  revalidatePath(`/professor/correcao/${submissionId}`);
  revalidatePath("/professor/dashboard");
}

const batchInputSchema = z.object({ submissionIds: z.array(z.string().uuid()).min(1).max(25) });

type BatchAnswerRow = {
  submission_id: string;
  answer: unknown;
  score: number | null;
  questions: { type: string; statement: string; correct_answer: string | string[] | null } | null;
};

function answerToText(answer: unknown): string {
  if (typeof answer === "string") return answer;
  if (Array.isArray(answer)) return answer.join(", ");
  return "";
}

/**
 * Backend for the future multi-select UI. The browser supplies IDs only; the
 * authenticated Supabase client (and its RLS policies) loads ownership,
 * tenant, questions and answers before the suggestion is applied.
 */
export async function applyAiSuggestedGradesBatch(input: { submissionIds: string[] }): Promise<{
  processedIds: string[];
  failed: { submissionId: string; error: string }[];
}> {
  const parsed = batchInputSchema.safeParse(input);
  if (!parsed.success) throw new Error("Selecione entre 1 e 25 entregas validas.");

  const session = await getSession();
  if (!session.user) redirect("/login");
  if (!session.roles.includes("PROFESSOR")) throw new Error("Sem permissao para corrigir entregas.");

  const submissionIds = [...new Set(parsed.data.submissionIds)];
  const rateLimit = await checkRateLimit("ai", session.user.id);
  if (!rateLimit.success) throw new Error("Muitas correcoes sugeridas em pouco tempo. Aguarde um momento e tente novamente.");

  const { data: submissions, error: submissionsError } = await session.supabase
    .from("submissions")
    .select("id, assignments!inner(tenant_id)")
    .in("id", submissionIds)
    .eq("status", "SUBMITTED");
  if (submissionsError) throw new Error("Nao foi possivel validar as entregas selecionadas.");

  const rows = (submissions ?? []) as unknown as { id: string; assignments: { tenant_id: string } | null }[];
  const submissionById = new Map(rows.map((submission) => [submission.id, submission]));
  const authorizedIds = rows.filter((submission) => submission.assignments?.tenant_id).map((submission) => submission.id);
  const { data: answers, error: answersError } = authorizedIds.length
    ? await session.supabase
        .from("submission_answers")
        .select("submission_id, answer, score, questions(type, statement, correct_answer)")
        .in("submission_id", authorizedIds)
    : { data: [], error: null };
  if (answersError) throw new Error("Nao foi possivel carregar as respostas das entregas.");

  const answersBySubmission = new Map<string, BatchAnswerRow[]>();
  for (const answer of (answers ?? []) as unknown as BatchAnswerRow[]) {
    const list = answersBySubmission.get(answer.submission_id) ?? [];
    list.push(answer);
    answersBySubmission.set(answer.submission_id, list);
  }

  const processedIds: string[] = [];
  const failed: { submissionId: string; error: string }[] = [];
  for (const submissionId of submissionIds) {
    const submission = submissionById.get(submissionId);
    if (!submission?.assignments?.tenant_id) {
      failed.push({ submissionId, error: "Entrega nao encontrada, ja corrigida ou sem permissao." });
      continue;
    }
    const tenantId = submission.assignments.tenant_id;

    const submissionAnswers = answersBySubmission.get(submissionId) ?? [];
    const discursiveAnswers = submissionAnswers.filter((answer) => answer.questions?.type === "DISCURSIVA");
    if (!discursiveAnswers.length) {
      failed.push({ submissionId, error: "A entrega nao possui questoes discursivas para correcao por IA." });
      continue;
    }

    try {
      const suggestions = await Promise.all(
        discursiveAnswers.map((answer) =>
          generateStructured<GradingSuggestion>({
            task: "GRADING",
            schema: GRADING_SCHEMA_V1,
            input: {
              statement: answer.questions!.statement,
              referenceAnswer: Array.isArray(answer.questions!.correct_answer)
                ? answer.questions!.correct_answer.join(", ")
                : (answer.questions!.correct_answer ?? ""),
              studentAnswer: answerToText(answer.answer),
            },
            tenantId,
            userId: session.user.id,
          }),
        ),
      );
      const objectiveScore = submissionAnswers
        .filter((answer) => answer.questions?.type !== "DISCURSIVA")
        .reduce((total, answer) => total + (answer.score ?? 0), 0);
      const totalScore = objectiveScore + suggestions.reduce((total, suggestion) => total + suggestion.score, 0);
      const feedback = suggestions.map((suggestion) => suggestion.feedback.trim()).filter(Boolean).join(" ");

      const { error: gradeError } = await session.supabase.from("grades").upsert(
        { submission_id: submissionId, total_score: totalScore, feedback, graded_by: "AI_SUGGESTED", reviewed_by: session.user.id },
        { onConflict: "submission_id" },
      );
      if (gradeError) throw gradeError;
      const { error: statusError } = await session.supabase.rpc("mark_submission_graded", { p_submission_id: submissionId });
      if (statusError) throw statusError;

      revalidatePath(`/professor/correcao/${submissionId}`);
      processedIds.push(submissionId);
    } catch (error) {
      failed.push({
        submissionId,
        error: error instanceof QuotaExceededError ? error.message : "Nao foi possivel aplicar a sugestao da IA nesta entrega.",
      });
    }
  }

  if (processedIds.length) {
    revalidatePath("/professor/correcao");
    revalidatePath("/professor/dashboard");
  }
  return { processedIds, failed };
}
