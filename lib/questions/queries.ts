import { createClient } from "@/lib/supabase/server";
import type { Difficulty, QuestionType } from "./types";
import { normalizeQuestionTags } from "./tags";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface QuestionBankFilters {
  type?: QuestionType;
  difficulty?: Difficulty;
  search?: string;
  bnccCodes?: string[];
  tags?: string[];
  authorId?: string;
  subjectId?: string;
  content?: string;
}

export interface QuestionOrigin {
  sourceType: "Prova" | "Atividade";
  sourceTitle: string;
  date: string | null;
  className: string | null;
  teacherId: string;
  teacherName: string | null;
  subjectId: string | null;
  subject: string | null;
  content: string | null;
}

export interface QuestionBankRow {
  id: string;
  type: QuestionType;
  statement: string;
  difficulty: Difficulty;
  tags: string[];
  created_at: string;
  bncc_codes: string[];
  author_id: string;
  author_name: string | null;
  origins: QuestionOrigin[];
}

function cleanSearch(search?: string): string | null {
  const trimmed = search?.trim();
  return trimmed ? trimmed : null;
}

export async function listQuestionBank(
  supabase: Supabase,
  filters: QuestionBankFilters,
): Promise<QuestionBankRow[]> {
  const { data, error } = await supabase.rpc("search_question_bank_with_context", {
    p_type: filters.type ?? null,
    p_difficulty: filters.difficulty ?? null,
    p_search: cleanSearch(filters.search),
    p_bncc_codes: filters.bnccCodes ?? [],
    p_tags: normalizeQuestionTags(filters.tags) ?? [],
    p_author_id: filters.authorId ?? null,
    p_subject_id: filters.subjectId ?? null,
    p_content: cleanSearch(filters.content),
  });

  if (error) throw new Error(`Nao foi possivel consultar o banco de questoes: ${error.message}`);
  return (data ?? []) as QuestionBankRow[];
}
