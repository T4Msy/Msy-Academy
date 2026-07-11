"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ingestMaterial } from "@/lib/ai/rag/ingest";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB — mirrors the bucket's file_size_limit (migration 0007).

/**
 * Uploads a standalone PDF into the Biblioteca. Validates type/size
 * server-side (RNF-S08) — the Storage bucket itself also enforces this
 * (allowed_mime_types + file_size_limit, migration 0007), so this is
 * defense-in-depth, not the only check.
 *
 * Optionally attaches the material to a class (turma): that's what makes it
 * RAG-eligible for the Tutor IA (migration 0012/0013) — a material with no
 * class stays a private Biblioteca entry. When attached, ingestion runs
 * synchronously right after the upload (Fase 4 scope — a fila assíncrona é
 * trabalho futuro).
 */
export async function uploadMaterialFile(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Selecione um arquivo PDF.");
  if (file.type !== "application/pdf") throw new Error("Apenas arquivos PDF são aceitos.");
  if (file.size > MAX_SIZE_BYTES) throw new Error("O arquivo deve ter no máximo 10MB.");

  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) throw new Error("Perfil não encontrado.");

  const title = String(formData.get("title") ?? "").trim() || file.name;
  const classId = String(formData.get("classId") ?? "").trim() || null;
  const path = `${profile.tenant_id}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("materials")
    .upload(path, file, { contentType: "application/pdf" });
  if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`);

  const { data: material, error: insertError } = await supabase
    .from("materials")
    .insert({
      tenant_id: profile.tenant_id,
      owner_id: user.id,
      kind: "FILE",
      storage_path: path,
      title,
      class_id: classId,
    })
    .select("id")
    .single();
  if (insertError || !material) throw new Error(`Falha ao registrar o arquivo: ${insertError?.message}`);

  if (classId) {
    try {
      await ingestMaterial(material.id);
    } catch {
      // Upload + Biblioteca entry already succeeded; ingestion failing (e.g.
      // a PDF with no extractable text) shouldn't roll back the upload —
      // it just means this material won't surface via the Tutor IA yet.
    }
  }

  revalidatePath("/professor/biblioteca");
}

/** Signed URL (60s) to view/download a FILE-kind material — never a public URL. */
export async function getMaterialDownloadUrl(storagePath: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("materials").createSignedUrl(storagePath, 60);
  if (error || !data) throw new Error("Não foi possível gerar o link de download.");
  return data.signedUrl;
}

/** Soft-delete via the SECURITY DEFINER RPC (migration 0007). */
export async function deleteMaterial(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("soft_delete_material", { p_material_id: id });
  if (error) throw new Error(`Não foi possível excluir: ${error.message}`);
  revalidatePath("/professor/biblioteca");
}
