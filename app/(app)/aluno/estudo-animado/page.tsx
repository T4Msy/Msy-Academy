import type { Metadata } from "next";
import { Trophy, Flame, Gamepad2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GameStartForm } from "./GameStartForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Estudo Animado" };

export default async function EstudoAnimadoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: records }, { data: subjects }] = await Promise.all([
    supabase.from("study_game_profiles").select("xp, total_games, current_streak").maybeSingle(),
    supabase.from("study_game_subject_records").select("subject, best_score, games_played, best_combo").order("best_score", { ascending: false }).limit(6),
    supabase.from("subjects").select("name").order("name").limit(8),
  ]);
  if (!user) return null;
  return <><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Estudo Animado</h1><p className="mt-1 text-[13.5px] text-muted-foreground">Missões rápidas para aprender, conquistar pontos e superar seu recorde.</p></div><div className="flex gap-2 text-sm"><span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5"><Trophy size={16} className="text-brand" />{profile?.xp ?? 0} XP</span><span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5"><Flame size={16} className="text-warning" />{profile?.current_streak ?? 0} dias</span></div></div><GameStartForm suggestions={(subjects ?? []).map((item) => item.name)} /><section className="mt-7"><div className="mb-3 flex items-center gap-2"><Gamepad2 size={19} className="text-brand" /><h2 className="font-display text-xl font-bold">Seus recordes</h2></div>{records?.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{records.map((record) => <article key={record.subject} className="rounded-lg border border-border bg-card p-4"><p className="font-display text-base font-bold">{record.subject}</p><div className="mt-3 flex items-baseline justify-between"><span className="text-2xl font-extrabold text-brand-text">{record.best_score}</span><span className="text-xs text-muted-foreground">melhor pontuação</span></div><p className="mt-2 text-xs text-muted-foreground">{record.games_played} missões · melhor combo {record.best_combo}</p></article>)}</div> : <div className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">Sua primeira missão vai aparecer aqui como recorde. Escolha uma matéria e comece!</div>}</section></>;
}
