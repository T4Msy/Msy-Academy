import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import { ClassSettingsForm } from "./ClassSettingsForm";
import { PendingJoinRequests, type PendingJoinRequest } from "./PendingJoinRequests";
import { deleteClass } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ProfessorTurmaConfiguracoesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: klass } = await supabase.from("classes").select("id, name, owner_id, invite_code, join_mode").eq("id", id).maybeSingle();
  if (!klass || user?.id !== klass.owner_id) notFound();

  // RPC dedicada (security definer): profiles_select_enrolled_student só
  // libera aluno já MATRICULADO — uma solicitação pendente ainda não criou
  // enrollment, então uma query direta em profiles aqui voltaria vazia.
  const { data: joinRequests } = await supabase.rpc("class_pending_join_requests", { p_class_id: id });
  const requests: PendingJoinRequest[] = (joinRequests ?? []).map(
    (r: { id: string; full_name: string | null; created_at: string }) => ({
      id: r.id,
      studentName: r.full_name,
      createdAt: r.created_at,
    }),
  );

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const inviteUrl = origin ? `${origin}/entrar/${klass.invite_code}` : null;
  const joinMode = klass.join_mode === "approval" ? "approval" : "auto";

  return (
    <>
      <PageHeader title="Configurações da turma" subtitle={`Gerencie o acesso e as informações de ${klass.name}.`} />
      <div className="flex flex-col gap-4">
        <ClassSettingsForm classId={id} inviteCode={klass.invite_code} inviteUrl={inviteUrl} joinMode={joinMode} />
        {joinMode === "approval" && <PendingJoinRequests classId={id} requests={requests} />}

        <section className="overflow-hidden rounded-lg border border-danger-border bg-card shadow-elevated">
          <div className="border-b border-danger-border px-5.5 pt-5 pb-4">
            <h2 className="font-display text-lg font-bold text-danger-text">Zona de risco</h2>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-5.5">
            <div>
              <p className="text-sm font-semibold text-foreground">Excluir turma</p>
              <p className="mt-1 text-xs text-muted-foreground">Remove a turma, matrículas, atribuições e dados relacionados.</p>
            </div>
            <ConfirmActionButton
              triggerLabel="Excluir turma"
              title="Excluir turma?"
              description="Esta ação é irreversível. A turma, matrículas, atribuições e dados relacionados serão removidos."
              confirmLabel="Excluir turma"
              pendingLabel="Excluindo..."
              successMessage="Turma excluída."
              action={deleteClass.bind(null, id)}
              redirectTo="/professor/turmas"
              variant="destructive-ghost"
            />
          </div>
        </section>
      </div>
    </>
  );
}
