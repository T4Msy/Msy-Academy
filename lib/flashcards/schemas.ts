import { z } from "zod";

/** Contrato único de geração de deck de flashcards (decisão nº 9 do ADR 13). */
export const deckGenerationSchema = z.object({
  materialId: z.uuid("Selecione um material."),
});

export type DeckGenerationInput = z.infer<typeof deckGenerationSchema>;
