import { PDFParse } from "pdf-parse";
import { createAdminClient } from "@/lib/supabase/server";
import { embedTexts } from "@/lib/ai/orchestrator";

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

/** Naive fixed-size sliding-window chunking — good enough for the mock provider's plumbing; a real provider may want sentence-aware splitting later. */
function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    chunks.push(clean.slice(i, i + CHUNK_SIZE));
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

/**
 * Ingests a class-attached PDF material into `material_chunks` for RAG
 * (Fase 4 scope: text extractable directly from the PDF, no OCR of scanned
 * images). Runs synchronously right after upload — a fila assíncrona é
 * trabalho futuro (ver plano). Writes via the admin client on purpose:
 * `material_chunks` has no client INSERT policy, mirroring `ai_interactions`
 * — embeddings are only ever written by the trusted server pipeline, never
 * fabricated by a client.
 *
 * No-ops (returns 0 chunks) for materials that aren't RAG-eligible: not a
 * FILE, or not attached to a class (materials.class_id null — see migration
 * 0012's note on why that's what makes content "da turma").
 */
export async function ingestMaterial(materialId: string, userId?: string): Promise<{ chunks: number }> {
  const admin = createAdminClient();

  const { data: material } = await admin
    .from("materials")
    .select("id, storage_path, class_id, kind, tenant_id")
    .eq("id", materialId)
    .single();

  if (!material || material.kind !== "FILE" || !material.storage_path || !material.class_id) {
    return { chunks: 0 };
  }

  const { data: fileBlob, error: downloadErr } = await admin.storage.from("materials").download(material.storage_path);
  if (downloadErr || !fileBlob) throw new Error(`Falha ao baixar o arquivo: ${downloadErr?.message ?? "erro desconhecido"}`);

  const arrayBuffer = await fileBlob.arrayBuffer();
  const parser = new PDFParse({ data: arrayBuffer });
  const { text } = await parser.getText();

  const chunks = chunkText(text);
  if (chunks.length === 0) return { chunks: 0 };

  const embeddings = await embedTexts({ texts: chunks, tenantId: material.tenant_id, userId, feature: "TUTOR" });

  const rows = chunks.map((content, i) => ({
    material_id: materialId,
    content,
    embedding: `[${embeddings[i].join(",")}]`,
    chunk_index: i,
  }));

  const { error: insertErr } = await admin.from("material_chunks").insert(rows);
  if (insertErr) throw new Error(`Falha ao salvar os trechos: ${insertErr.message}`);

  return { chunks: rows.length };
}
