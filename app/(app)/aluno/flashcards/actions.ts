"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reviewCard, type ReviewQuality, type SrsState } from "@/lib/srs/sm2";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/** Applies the SM-2 update to a flashcard after the student reviews it. */
export async function submitReview(deckId: string, cardId: string, currentState: SrsState, quality: ReviewQuality): Promise<void> {
  const { supabase } = await requireUser();

  const nextState = reviewCard(currentState, quality);

  const { error } = await supabase.from("flashcards").update({ srs_state: nextState }).eq("id", cardId);
  if (error) throw new Error(`Não foi possível salvar a revisão: ${error.message}`);

  revalidatePath(`/aluno/flashcards/${deckId}`);
}

/** Criação manual — deck em branco, sem material de origem nem IA. */
export async function createDeck(title: string): Promise<string> {
  const clean = title.trim();
  if (!clean) throw new Error("Informe um título para o deck.");

  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) throw new Error("Perfil não encontrado.");

  const { data, error } = await supabase
    .from("flashcard_decks")
    .insert({ tenant_id: profile.tenant_id, student_id: user.id, title: clean })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Não foi possível criar o deck: ${error?.message ?? "erro"}`);

  return data.id;
}

export async function renameDeck(deckId: string, title: string): Promise<void> {
  const clean = title.trim();
  if (!clean) return;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("flashcard_decks").update({ title: clean }).eq("id", deckId);
  if (error) throw new Error(`Não foi possível renomear: ${error.message}`);
  revalidatePath(`/aluno/flashcards/${deckId}`);
}

/** Soft-delete via RPC (migration 0021). */
export async function deleteDeck(deckId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("soft_delete_flashcard_deck", { p_deck_id: deckId });
  if (error) throw new Error(`Não foi possível excluir o deck: ${error.message}`);
  revalidatePath("/aluno/flashcards");
}

export async function createCard(deckId: string, front: string, back: string): Promise<void> {
  const cleanFront = front.trim();
  const cleanBack = back.trim();
  if (!cleanFront || !cleanBack) throw new Error("Preencha a frente e o verso do cartão.");

  const { supabase } = await requireUser();
  const { error } = await supabase.from("flashcards").insert({ deck_id: deckId, front: cleanFront, back: cleanBack });
  if (error) throw new Error(`Não foi possível criar o cartão: ${error.message}`);

  revalidatePath(`/aluno/flashcards/${deckId}`);
}

export async function updateCard(deckId: string, cardId: string, front: string, back: string): Promise<void> {
  const cleanFront = front.trim();
  const cleanBack = back.trim();
  if (!cleanFront || !cleanBack) throw new Error("Preencha a frente e o verso do cartão.");

  const { supabase } = await requireUser();
  const { error } = await supabase.from("flashcards").update({ front: cleanFront, back: cleanBack }).eq("id", cardId);
  if (error) throw new Error(`Não foi possível salvar o cartão: ${error.message}`);

  revalidatePath(`/aluno/flashcards/${deckId}`);
}

/** DELETE físico direto (migration 0021) — flashcards não tem deleted_at. */
export async function deleteCard(deckId: string, cardId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("flashcards").delete().eq("id", cardId);
  if (error) throw new Error(`Não foi possível excluir o cartão: ${error.message}`);

  revalidatePath(`/aluno/flashcards/${deckId}`);
}
