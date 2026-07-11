"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Generates a simulado via the SECURITY DEFINER RPC (migration 0009/0010),
 * which picks eligible questions server-side — the client never assembles
 * simulado_questions itself.
 */
export async function createSimulado(args: {
  title: string;
  mode: "MATERIA" | "DIFICULDADE" | "PERSONALIZADO";
  quantidade: number;
  subjectId?: string | null;
  difficulty?: "FACIL" | "MEDIO" | "DIFICIL" | null;
}): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: simuladoId, error } = await supabase.rpc("generate_simulado", {
    p_title: args.title,
    p_mode: args.mode,
    p_quantidade: args.quantidade,
    p_subject_id: args.subjectId ?? null,
    p_difficulty: args.difficulty ?? null,
  });
  if (error || !simuladoId) throw new Error(error?.message ?? "Não foi possível gerar o simulado.");

  return simuladoId;
}
