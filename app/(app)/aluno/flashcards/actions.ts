"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reviewCard, type ReviewQuality, type SrsState } from "@/lib/srs/sm2";

/** Applies the SM-2 update to a flashcard after the student reviews it. */
export async function submitReview(deckId: string, cardId: string, currentState: SrsState, quality: ReviewQuality): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nextState = reviewCard(currentState, quality);

  const { error } = await supabase.from("flashcards").update({ srs_state: nextState }).eq("id", cardId);
  if (error) throw new Error(`Não foi possível salvar a revisão: ${error.message}`);

  revalidatePath(`/aluno/flashcards/${deckId}`);
}
