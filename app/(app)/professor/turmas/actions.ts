"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function generateInviteCode(): string {
  // 6 chars from an unambiguous alphabet (no 0/O/1/I) — easy to read aloud/type.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
}

/** Creates a class with a unique invite code, retrying on the rare collision. */
export async function createClass(name: string): Promise<string> {
  const clean = name.trim();
  if (!clean) throw new Error("Dê um nome para a turma.");

  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Perfil não encontrado.");

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("classes")
      .insert({
        tenant_id: profile.tenant_id,
        owner_id: user.id,
        name: clean,
        invite_code: generateInviteCode(),
      })
      .select("id")
      .single();

    if (!error && data) {
      revalidatePath("/professor/turmas");
      return data.id;
    }
    // 23505 = unique_violation on invite_code — regenerate and retry.
    if (error?.code !== "23505")
      throw new Error(`Não foi possível criar a turma: ${error?.message}`);
  }
  throw new Error("Não foi possível gerar um código de convite único. Tente novamente.");
}

/** Permanently deletes a class owned by the current professor. Related rows
 * cascade in the database (enrollments, assignments, submissions, grades and
 * answer sheets/scans). */
export async function deleteClass(classId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("delete_class", { p_class_id: classId });
  if (error) throw new Error(`Não foi possível excluir a turma: ${error.message}`);

  revalidatePath("/professor/turmas");
}

/** Removes only the enrollment row. The student user/account is never touched. */
export async function removeStudentFromClass(classId: string, studentId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("remove_student_from_class", {
    p_class_id: classId,
    p_student_id: studentId,
  });
  if (error) throw new Error(`Não foi possível remover o aluno: ${error.message}`);

  revalidatePath(`/professor/turmas/${classId}`);
}

/** Assigns an exam or activity to a class with an optional due date (RF-P21). */
export async function assignContent(
  classId: string,
  contentType: "EXAM" | "ACTIVITY",
  contentId: string,
  dueAt: string | null,
): Promise<void> {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Perfil não encontrado.");

  if (dueAt && (!Number.isFinite(new Date(dueAt).getTime()) || new Date(dueAt).getTime() <= Date.now())) {
    throw new Error("O prazo precisa estar no futuro.");
  }
  const { data: existing } = await supabase
    .from("assignments")
    .select("id")
    .eq("class_id", classId)
    .eq("content_type", contentType)
    .eq("content_id", contentId)
    .is("deleted_at", null)
    .maybeSingle();
  if (existing) throw new Error("Este conteúdo já está atribuído a esta turma.");

  const contentTable = contentType === "EXAM" ? "exams" : "activities";
  const { data: content } = await supabase.from(contentTable).select("id").eq("id", contentId).maybeSingle();
  if (!content) throw new Error("O conteúdo não foi encontrado.");
  const questionTable = contentType === "EXAM" ? "exam_questions" : "activity_items";
  const questionParent = contentType === "EXAM" ? "exam_id" : "activity_id";
  const { data: firstQuestion } = await supabase.from(questionTable).select("question_id").eq(questionParent, contentId).limit(1).maybeSingle();
  if (!firstQuestion) throw new Error("Adicione pelo menos uma questão antes de enviar este conteúdo.");

  const { error } = await supabase.from("assignments").insert({
    tenant_id: profile.tenant_id,
    class_id: classId,
    content_type: contentType,
    content_id: contentId,
    due_at: dueAt || null,
  });
  if (error) throw new Error(`Não foi possível atribuir: ${error.message}`);

  revalidatePath(`/professor/turmas/${classId}`);
}

/** Soft-delete an assignment (un-assign) via the SECURITY DEFINER RPC (migration 0009). */
export async function unassignContent(classId: string, assignmentId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("soft_delete_assignment", { p_assignment_id: assignmentId });
  if (error) throw new Error(`Não foi possível remover a atribuição: ${error.message}`);
  revalidatePath(`/professor/turmas/${classId}`);
}
