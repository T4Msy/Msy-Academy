import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GamePlayer } from "../GamePlayer";
import { toStudyGameRun } from "@/lib/study-game/serialize";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Missão do Saber" };

export default async function StudyGameRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: row } = await supabase.from("study_game_runs").select("id, subject, topic, questions, status, current_question_index, score, combo, lives_remaining, correct_count").eq("id", id).maybeSingle();
  if (!row) notFound();
  return <GamePlayer initialRun={toStudyGameRun(row)} />;
}
