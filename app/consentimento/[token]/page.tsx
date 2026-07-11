import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { createAdminClient } from "@/lib/supabase/server";
import { ConsentForm } from "./ConsentForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Consentimento do responsável" };

export default async function ConsentimentoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: consent } = await admin
    .from("guardian_consents")
    .select("student_id, status, guardian_name, confirmed_at")
    .eq("token", token)
    .maybeSingle();

  const studentName = consent
    ? ((await admin.from("profiles").select("full_name").eq("id", consent.student_id).maybeSingle()).data?.full_name ??
      "o estudante")
    : null;

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <Logo />
          <div>
            <div className="auth-title">Consentimento do responsável</div>
            <div className="auth-subtitle">MSY Academy — plataforma educacional</div>
          </div>
        </div>

        {!consent ? (
          <div className="notice notice--error" style={{ marginTop: 8 }}>
            Link inválido ou expirado.
          </div>
        ) : consent.status === "CONFIRMED" ? (
          <div className="notice" style={{ marginTop: 8 }}>
            Este consentimento já foi confirmado por {consent.guardian_name ?? "um responsável"}.
          </div>
        ) : (
          <>
            <p className="field-hint" style={{ marginTop: 0 }}>
              <b>{studentName}</b> criou uma conta de aluno na MSY Academy e indicou ter menos de 18
              anos. Para continuar usando a plataforma, um responsável legal precisa confirmar que
              está ciente e de acordo — inclusive com o uso de inteligência artificial para tutoria,
              correção e geração de conteúdo de estudo. Leia nossos{" "}
              <a href="/termos">Termos de Uso</a> e nossa{" "}
              <a href="/privacidade">Política de Privacidade</a> antes de confirmar.
            </p>
            <ConsentForm token={token} />
          </>
        )}
      </div>
    </div>
  );
}
