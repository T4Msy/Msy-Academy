import { NextResponse } from "next/server";
import { deckGenerationSchema } from "@/lib/flashcards/schemas";
import { createClient } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/ai/orchestrator";
import { FLASHCARDS_SCHEMA_V1 } from "@/lib/ai/prompts/flashcards.v1";
import { QuotaExceededError } from "@/lib/billing/quota";
import type { GeneratedFlashcardDeck } from "@/lib/ai/types";

export const runtime = "nodejs";

/**
 * POST /api/ai/flashcards/generate — RF-A09. Body: { materialId: string }.
 * Reuses `material_chunks` from Fase 4 (RAG) as the source content — the
 * student can only pick a material they already have read access to
 * (materials_select_enrolled, migration 0013), so no extra scoping needed
 * here beyond the normal RLS-scoped read.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sua sessão terminou. Entre novamente para continuar." }, { status: 401 });

  let body: { materialId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Não conseguimos entender os dados enviados. Revise as informações e tente novamente." }, { status: 400 });
  }

  // Contrato único (decisão nº 9 do ADR 13): mesmo schema Zod do client
  // valida aqui antes dos usos — os checks manuais abaixo ficam como
  // salvaguarda de tipos para o código existente.
  const schemaCheck = deckGenerationSchema.safeParse(body);
  if (!schemaCheck.success) {
    return NextResponse.json(
      { error: schemaCheck.error.issues[0]?.message ?? "Revise as informações preenchidas e tente novamente." },
      { status: 400 },
    );
  }

  const materialId = body.materialId;
  if (!materialId) return NextResponse.json({ error: "Selecione um material." }, { status: 400 });

  const { data: material } = await supabase.from("materials").select("id, title").eq("id", materialId).single();
  if (!material) return NextResponse.json({ error: "Material não encontrado." }, { status: 404 });

  const { data: chunks } = await supabase
    .from("material_chunks")
    .select("content")
    .eq("material_id", materialId)
    .order("chunk_index");
  const content = (chunks ?? []).map((c) => c.content).join(" ");
  if (!content.trim()) {
    return NextResponse.json({ error: "Este material ainda não foi processado para o Tutor IA." }, { status: 400 });
  }

  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Não encontramos seu perfil. Atualize a página e tente novamente." }, { status: 500 });

  let generated: GeneratedFlashcardDeck;
  try {
    generated = await generateStructured<GeneratedFlashcardDeck>({
      task: "FLASHCARDS",
      schema: FLASHCARDS_SCHEMA_V1,
      input: { title: material.title, content },
      tenantId: profile.tenant_id,
      userId: user.id,
    });
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
    return NextResponse.json({ error: "Não conseguimos criar os cartões agora. Tente novamente em alguns instantes." }, { status: 502 });
  }

  const { data: deck, error: deckErr } = await supabase
    .from("flashcard_decks")
    .insert({ tenant_id: profile.tenant_id, student_id: user.id, title: generated.title || material.title, source_material_id: materialId })
    .select("id")
    .single();
  if (deckErr || !deck) {
    return NextResponse.json({ error: "Os cartões foram criados, mas não conseguimos salvá-los. Tente novamente." }, { status: 500 });
  }

  if (generated.cards.length > 0) {
    const rows = generated.cards.map((c) => ({ deck_id: deck.id, front: c.front, back: c.back }));
    const { error: cardsErr } = await supabase.from("flashcards").insert(rows);
    if (cardsErr) {
      return NextResponse.json({ error: "Não conseguimos salvar os cartões. Tente novamente." }, { status: 500 });
    }
  }

  return NextResponse.json({ id: deck.id });
}
