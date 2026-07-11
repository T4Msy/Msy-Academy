import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "@/components/settings/ProfileSettingsForm";
import { AiUsageCard } from "@/components/settings/AiUsageCard";
import { PlanCard } from "@/components/settings/PlanCard";
import { DataAndDangerZone } from "@/components/settings/DataAndDangerZone";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ deleteError?: string }>;
}) {
  const { deleteError } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Gerencie suas informações de conta.</p>
        </div>
      </div>
      <section className="card" style={{ maxWidth: 480 }}>
        <div className="card-body">
          <ProfileSettingsForm initialName={profile?.full_name ?? ""} email={user?.email ?? ""} />
        </div>
      </section>
      <section className="card" style={{ maxWidth: 480, marginTop: 16 }}>
        <div className="card-header">
          <div className="card-title-group">
            <h2 className="card-title">Senha</h2>
          </div>
        </div>
        <div className="card-body">
          <p className="field-hint" style={{ marginTop: 0 }}>
            Para trocar sua senha, saia e use a opção &quot;Esqueci minha
            senha&quot; na tela de login.
          </p>
          <a href="/recuperar-senha" className="btn btn-ghost btn-sm">
            Redefinir senha
          </a>
        </div>
      </section>
      <PlanCard returnPath="/professor/configuracoes" />
      <AiUsageCard />
      <DataAndDangerZone returnPath="/professor/configuracoes" deleteError={deleteError} />
    </>
  );
}
