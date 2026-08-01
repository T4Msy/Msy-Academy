import type { SupabaseClient } from "@supabase/supabase-js";

export type ClassChatMessage = {
  id: string;
  classId: string;
  authorId: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
};

type ClassChatMessageRow = {
  id: string;
  class_id: string;
  author_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

function toMessage(row: ClassChatMessageRow): ClassChatMessage {
  return {
    id: row.id,
    classId: row.class_id,
    authorId: row.author_id,
    content: row.content,
    createdAt: row.created_at,
    editedAt: row.edited_at,
    deletedAt: row.deleted_at,
  };
}

export const CLASS_CHAT_PAGE_SIZE = 40;

/**
 * Uma página de mensagens, mais antiga primeiro (para renderizar direto na
 * lista). Sem `beforeCreatedAt`, busca a página mais recente. Usada tanto no
 * prefetch do Server Component (client autenticado via cookies) quanto no
 * client component (client do browser) — mesma função, RLS decide o que
 * cada um vê.
 */
export async function fetchClassChatPage(
  supabase: SupabaseClient,
  classId: string,
  opts: { beforeCreatedAt?: string; limit?: number } = {},
): Promise<ClassChatMessage[]> {
  let query = supabase
    .from("class_chat_messages")
    .select("id, class_id, author_id, content, created_at, edited_at, deleted_at")
    .eq("class_id", classId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? CLASS_CHAT_PAGE_SIZE);

  if (opts.beforeCreatedAt) {
    query = query.lt("created_at", opts.beforeCreatedAt);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Não foi possível carregar as mensagens: ${error.message}`);
  return ((data ?? []) as ClassChatMessageRow[]).map(toMessage).reverse();
}

export type ClassParticipant = {
  userId: string;
  fullName: string | null;
  role: "professor" | "aluno";
};

type ClassRosterRow = { user_id: string; full_name: string | null; role: string };

/** Professor (owner) + alunos ativamente matriculados — via RPC class_roster (security definer). */
export async function fetchClassParticipants(
  supabase: SupabaseClient,
  classId: string,
): Promise<ClassParticipant[]> {
  const { data, error } = await supabase.rpc("class_roster", { p_class_id: classId });
  if (error) throw new Error(`Não foi possível carregar os participantes: ${error.message}`);
  return ((data ?? []) as ClassRosterRow[]).map((row) => ({
    userId: row.user_id,
    fullName: row.full_name,
    role: row.role === "professor" ? "professor" : "aluno",
  }));
}
