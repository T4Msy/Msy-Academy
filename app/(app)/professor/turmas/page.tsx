import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CreateClassForm } from "./CreateClassForm";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import { deleteClass } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Turmas" };

export default async function TurmasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: classes } = user
    ? await supabase.from("classes").select("id, name, invite_code, owner_id, created_at").eq("owner_id", user.id).order("created_at", { ascending: false })
    : { data: [] as { id: string; name: string; invite_code: string; owner_id: string; created_at: string }[] };
  const list = classes ?? [];
  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Turmas</h1><p className="mt-1 text-[13.5px] text-muted-foreground">{list.length > 0 ? `${list.length} turma${list.length > 1 ? "s" : ""}` : "Crie uma turma e convide seus alunos por código."}</p></div><CreateClassForm /></div>
    {list.length === 0 ? <EmptyState variant="turma" title="Nenhuma turma ainda" text="Crie sua primeira turma para começar a atribuir conteúdo aos alunos." /> : <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3.5">{list.map((klass) => { const isOwner = user?.id === klass.owner_id; const content = <><div className="font-display text-base font-bold tracking-[-0.2px] text-foreground">{klass.name}</div><div className="mt-0.5 flex flex-wrap gap-1.5"><span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">Código: {klass.invite_code}</span>{!isOwner && <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">Somente visualização</span>}</div></>; return <div key={klass.id} className={`flex flex-col gap-3 rounded-md border border-border bg-card p-4.5 ${isOwner ? "transition-all hover:-translate-y-0.5 hover:border-border-hover hover:bg-card-2" : ""}`}>{isOwner ? <Link href={`/professor/turmas/${klass.id}`} className="flex min-h-20 flex-col gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-glow">{content}</Link> : <div className="flex min-h-20 flex-col gap-2.5">{content}</div>}{isOwner && <div className="flex justify-end border-t border-border pt-3"><ConfirmActionButton triggerLabel="Excluir turma" title="Excluir turma?" description="Esta ação é irreversível. A turma, matrículas, atribuições e dados relacionados serão removidos." confirmLabel="Excluir turma" pendingLabel="Excluindo..." successMessage="Turma excluída." action={deleteClass.bind(null, klass.id)} variant="destructive-ghost" /></div>}</div>; })}</div>}
  </>;
}
