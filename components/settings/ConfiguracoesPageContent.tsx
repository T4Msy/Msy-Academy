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
      <div className="page-head">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Gerencie suas informações de conta.</p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="card">
          <div className="card-body">
            <ProfileSettingsForm initialName={fullName ?? ""} email={user?.email ?? ""} />
          </div>
        </section>
        <section className="card">
          <div className="card-header">
            <div className="card-title-group">
              <h2 className="card-title">Senha</h2>
            </div>
          </div>
          <div className="card-body">
            <ChangePasswordForm />
            <p className="field-hint">
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
