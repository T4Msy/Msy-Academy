import { createClient } from "@/lib/supabase/server";
import type { Difficulty, QuestionType } from "./types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface QuestionBankFilters {
  type?: QuestionType;
  difficulty?: Difficulty;
  search?: string;
  bnccCodes?: string[];
}

export interface QuestionBankRow {
  id: string;
  type: QuestionType;
  statement: string;
  difficulty: Difficulty;
  tags: string[];
  created_at: string;
  bncc_codes: string[];
}

function cleanSearch(search?: string): string | null {
  const trimmed = search?.trim();
  return trimmed ? trimmed : null;
}

export async function listQuestionBank(
  supabase: Supabase,
  filters: QuestionBankFilters,
): Promise<QuestionBankRow[]> {
  const { data, error } = await supabase.rpc("search_question_bank", {
    p_type: filters.type ?? null,
    p_difficulty: filters.difficulty ?? null,
    p_search: cleanSearch(filters.search),
    p_bncc_codes: filters.bnccCodes ?? [],
  });

  if (error) throw new Error(`Nao foi possivel consultar o banco de questoes: ${error.message}`);
  return (data ?? []) as QuestionBankRow[];
}
