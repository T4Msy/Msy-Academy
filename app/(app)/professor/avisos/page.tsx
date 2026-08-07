import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/classes/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Avisos" };

export default async function ProfessorAvisosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: classes } = user ? await supabase.from("classes").select("id, name").eq("owner_id", user.id).order("name") : { data: [] as { id: string; name: string }[] };
  const classRows = classes ?? [];
  const ids = classRows.map((item) => item.id);
  const { data: announcements } = ids.length ? await supabase.from("class_announcements").select("id, class_id, message, created_at").in("class_id", ids).order("created_at", { ascending: false }) : { data: [] as { id: string; class_id: string; message: string; created_at: string }[] };
  const byClass = new Map(ids.map((id) => [id, (announcements ?? []).filter((item) => item.class_id === id)]));
  return <><PageHeader title="Avisos" subtitle="Comunicados publicados para suas turmas." />{classRows.length === 0 ? <Empty /> : <div className="space-y-6">{classRows.map((classroom) => { const items = byClass.get(classroom.id) ?? []; return <section key={classroom.id} className="rounded-lg border border-border bg-card p-5"><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="font-display text-lg font-bold text-foreground">{classroom.name}</h2><p className="text-sm text-muted-foreground">{items.length} aviso{items.length === 1 ? "" : "s"}</p></div><Link href={`/professor/turmas/${classroom.id}/avisos`} className="text-sm font-semibold text-brand-text">Abrir turma</Link></div>{items.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum aviso publicado.</p> : <ul className="space-y-2">{items.slice(0, 3).map((item) => <li key={item.id} className="rounded-md border border-border p-3"><p className="line-clamp-2 whitespace-pre-wrap text-sm text-foreground">{item.message}</p><p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p></li>)}</ul>}</section>; })}</div>}</>;
}

function Empty() { return <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center"><Megaphone className="mx-auto size-6 text-brand-text" aria-hidden /><p className="mt-3 font-display text-base font-bold text-foreground">Nenhum aviso publicado</p><p className="mt-1 text-sm text-muted-foreground">Mantenha sua turma informada sobre novidades e lembretes.</p></div>; }
