"use server";

import { createClient } from "@/lib/supabase/server";

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // mirrors the answer-sheet-scans bucket's file_size_limit (migration 0022).
const JPEG_MAGIC = new Uint8Array([0xff, 0xd8, 0xff]);

/** Same real-content check as isRealPdf in biblioteca/actions.ts, adapted for JPEG. */
async function isRealJpeg(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, JPEG_MAGIC.length).arrayBuffer());
  return JPEG_MAGIC.every((byte, i) => head[i] === byte);
}

/**
 * Uploads one captured photo of a filled answer sheet. The scan doesn't
 * know which student it belongs to yet — only the assignment (chosen by the
 * teacher before opening the camera) — the QR code printed on the sheet is
 * what identifies the student, decoded by the processing pipeline
 * (lib/omr/process.ts) right after this upload completes.
 */
export async function uploadScan(assignmentId: string, formData: FormData): Promise<{ scanId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) throw new Error("Nenhuma foto capturada.");
  if (file.size > MAX_SIZE_BYTES) throw new Error("A foto é grande demais (máximo 8MB).");
  if (!(await isRealJpeg(file))) throw new Error("Formato de imagem inválido — envie uma foto JPEG.");

  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, content_type")
    .eq("id", assignmentId)
    .single();
  if (!assignment || assignment.content_type !== "EXAM") throw new Error("Atribuição inválida.");

  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) throw new Error("Perfil não encontrado.");

  const path = `${profile.tenant_id}/${assignmentId}/${crypto.randomUUID()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("answer-sheet-scans")
    .upload(path, file, { contentType: "image/jpeg" });
  if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`);

  const { data: scan, error: insertError } = await supabase
    .from("answer_sheet_scans")
    .insert({ assignment_id: assignmentId, storage_path: path, status: "PROCESSING" })
    .select("id")
    .single();
  if (insertError || !scan) throw new Error(`Falha ao registrar a digitalização: ${insertError?.message}`);

  return { scanId: scan.id };
}
