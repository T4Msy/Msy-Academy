"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAssessmentExpired } from "@/lib/assessments/deadline";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/**
 * Resolves and submits a tarefa (assignment) OR a simulado — same submission
 * engine for both, per the Fase 3 plan. Get-or-create the submission row,
 * insert the raw answers, then run the server-side auto-grading RPC
 * (`submit_submission`, migration 0009 — a client can never set
 * is_correct/score itself).
 */
export async function submitAnswers(
  parent: { assignmentId: string } | { simuladoId: string },
  answers: Record<string, string>,
): Promise<string> {
  const { supabase, user } = await requireUser();
  let assignmentDueAt: string | null = null;

  if ("assignmentId" in parent) {
    const { data: assignment } = await supabase.from("assignments").select("due_at").eq("id", parent.assignmentId).maybeSingle();
    if (!assignment) throw new Error("Esta avaliação não está mais disponível.");
    assignmentDueAt = assignment.due_at;
    if (isAssessmentExpired(assignment.due_at)) {
      throw new Error("A avaliação foi encerrada e não aceita mais respostas.");
    }
  }

  const filter: { assignment_id: string | null; simulado_id: string | null; student_id: string } =
    "assignmentId" in parent
      ? { assignment_id: parent.assignmentId, simulado_id: null, student_id: user.id }
      : { assignment_id: null, simulado_id: parent.simuladoId, student_id: user.id };

  let { data: submission } = await supabase
    .from("submissions")
    .select("id, status")
    .match(
      "assignmentId" in parent
        ? { assignment_id: filter.assignment_id!, student_id: filter.student_id }
        : { simulado_id: filter.simulado_id!, student_id: filter.student_id },
    )
    .maybeSingle();

  if (!submission) {
    const { data: created, error: createErr } = await supabase
      .from("submissions")
      .insert(filter)
      .select("id, status")
      .single();
    if (createErr || !created) throw new Error(`Não foi possível iniciar o envio: ${createErr?.message}`);
    submission = created;
  }

  if (submission.status !== "PENDING") {
    throw new Error("Você já enviou esta atividade.");
  }

  const rows = Object.entries(answers).map(([questionId, answer]) => ({
    submission_id: submission!.id,
    question_id: questionId,
    answer,
  }));
  if (rows.length > 0) {
    const { error: insertErr } = await supabase.from("submission_answers").insert(rows);
    if (insertErr) {
      if (isAssessmentExpired(assignmentDueAt)) {
        throw new Error("A avaliação foi encerrada e não aceita mais respostas.");
      }
      throw new Error("Não foi possível salvar as respostas. Tente novamente.");
    }
  }

  // A transição é atômica e revalida o prazo no banco, protegendo também
  // contra a corrida entre a checagem acima e o envio efetivo.
  const { error: submitErr } = await supabase.rpc("close_submission", { p_submission_id: submission.id });
  if (submitErr) {
    if (submitErr.message.includes("avaliação foi encerrada")) {
      throw new Error("A avaliação foi encerrada e não aceita mais respostas.");
    }
    throw new Error("Não foi possível enviar a avaliação. Tente novamente.");
  }

  if ("assignmentId" in parent) {
    revalidatePath(`/aluno/tarefas/${parent.assignmentId}`);
    revalidatePath("/aluno/tarefas");
  } else revalidatePath(`/aluno/simulados/${parent.simuladoId}`);
  return submission.id;
}
