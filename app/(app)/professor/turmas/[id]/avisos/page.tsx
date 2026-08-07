import { Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/classes/format";
import { NewAnnouncementDialog } from "@/components/announcements/NewAnnouncementDialog";

export const dynamic = "force-dynamic";

export default async function ProfessorTurmaAvisosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: announcements }, { data: classroom }] = await Promise.all([
    supabase.from("class_announcements").select("id, message, created_at").eq("class_id", id).order("created_at", { ascending: false }),
    supabase.from("classes").select("name").eq("id", id).maybeSingle(),
  ]);
  const className = classroom?.name ?? "Turma atual";
  return <section className="rounded-lg border border-border bg-card p-5"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="flex items-center gap-2 font-display text-xl font-bold text-foreground"><Megaphone className="size-5 text-brand-text" aria-hidden />Avisos</h1><p className="mt-1 text-sm text-muted-foreground">Comunicados já publicados nesta turma.</p></div><NewAnnouncementDialog className={className} /></div>{(announcements ?? []).length === 0 ? <div className="py-8 text-center"><p className="font-semibold text-foreground">Nenhum aviso publicado</p><p className="mt-1 text-sm text-muted-foreground">Mantenha seus alunos informados sobre novidades, prazos e lembretes.</p><div className="mt-4 flex justify-center"><NewAnnouncementDialog className={className} showAllLink={false} firstNotice /></div></div> : <ul className="space-y-3">{announcements?.map((item) => <li key={item.id} className="rounded-md border border-border p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{item.message}</p><p className="mt-3 text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p></li>)}</ul>}</section>;
}
