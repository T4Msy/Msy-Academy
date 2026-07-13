import { getSession } from "@/lib/auth/session";
import { ProfileSettingsForm } from "@/components/settings/ProfileSettingsForm";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { AiUsageCard } from "@/components/settings/AiUsageCard";
import { PlanCard } from "@/components/settings/PlanCard";
import { RolesCard } from "@/components/settings/RolesCard";
import { DataAndDangerZone } from "@/components/settings/DataAndDangerZone";

/** Shared by professor/aluno configuracoes pages — identical except returnPath. */
export async function ConfiguracoesPageContent({
  returnPath,
  deleteError,
}: {
  returnPath: string;
  deleteError?: string;
}) {
  const { user, fullName } = await getSession();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Configurações</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">Gerencie suas informações de conta.</p>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,480px))] items-start gap-4">
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
          <div className="flex flex-col gap-4.5 p-5.5">
            <ProfileSettingsForm initialName={fullName ?? ""} email={user?.email ?? ""} />
          </div>
        </section>
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Senha</h2>
            </div>
          </div>
          <div className="flex flex-col gap-4.5 p-5.5">
            <ChangePasswordForm />
            <p className="mt-1 text-xs leading-snug text-muted-foreground">
              Esqueceu a senha atual? Saia e use{" "}
              <a href="/recuperar-senha">&quot;Esqueci minha senha&quot;</a> na tela de login.
            </p>
          </div>
        </section>
        <RolesCard />
        <PlanCard returnPath={returnPath} />
        <AiUsageCard />
        <DataAndDangerZone returnPath={returnPath} deleteError={deleteError} />
      </div>
    </>
  );
}
