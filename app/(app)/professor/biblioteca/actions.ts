"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ingestMaterial } from "@/lib/ai/rag/ingest";
import { checkQuota } from "@/lib/billing/quota";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB — mirrors the bucket's file_size_limit (migration 0007).
const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // "%PDF-"

/**
 * `File.type` is whatever MIME the browser guessed from the extension at
 * select time — trivially spoofable by anyone crafting the multipart
 * request directly. The upload below hardcodes `contentType:
 * "application/pdf"` regardless of what's actually inside, so the storage
 * bucket's own `allowed_mime_types` check never sees real content either.
 * Reading the first bytes and checking the real PDF magic number is what
 * actually verifies file *content*, not just a client-supplied label.
 */
async function isRealPdf(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, PDF_MAGIC.length).arrayBuffer());
  return PDF_MAGIC.every((byte, i) => head[i] === byte);
}

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
  if (!(await isRealPdf(file))) throw new Error("O arquivo não é um PDF válido.");

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
      // ingestMaterial calls provider.embed() per chunk — not currently a
      // real cost (mock/echo/anthropic all embed via a local hash, see
      // lib/ai/providers/anthropic.ts), but it's the one AI-consuming path
      // in the app that doesn't run through generateStructured, so it's the
      // one place quota enforcement (RF-IA02) doesn't come for free. Check
      // it explicitly now so a future real embeddings provider doesn't
      // silently reopen an uncapped cost vector on file upload.
      await checkQuota(profile.tenant_id);
      await ingestMaterial(material.id);
    } catch {
      // Upload + Biblioteca entry already succeeded; ingestion failing (e.g.
      // a PDF with no extractable text, or quota exceeded) shouldn't roll
      // back the upload — it just means this material won't surface via
      // the Tutor IA yet.
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
