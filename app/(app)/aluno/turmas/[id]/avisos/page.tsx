import Link from "next/link";
import { Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/classes/format";

export const dynamic = "force-dynamic";

export default async function AlunoTurmaAvisosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: announcements } = await supabase.from("class_announcements").select("id, message, created_at").eq("class_id", id).order("created_at", { ascending: false });
  return <section className="rounded-lg border border-border bg-card p-5"><div className="mb-5 flex items-start justify-between gap-3"><div><h1 className="flex items-center gap-2 font-display text-xl font-bold text-foreground"><Megaphone className="size-5 text-brand-text" aria-hidden />Avisos</h1><p className="mt-1 text-sm text-muted-foreground">Comunicados publicados nesta turma.</p></div><Link href="/aluno/avisos" className="shrink-0 text-sm font-semibold text-brand-text">Ver todos</Link></div>{(announcements ?? []).length === 0 ? <div className="py-8 text-center"><p className="font-semibold text-foreground">Nenhum aviso por enquanto</p><p className="mt-1 text-sm text-muted-foreground">Os comunicados dos seus professores aparecerão aqui.</p></div> : <ul className="space-y-3">{announcements?.map((item) => <li key={item.id} className="rounded-md border border-border p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{item.message}</p><p className="mt-3 text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p></li>)}</ul>}</section>;
}
