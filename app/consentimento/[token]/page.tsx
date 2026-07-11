import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { createAdminClient } from "@/lib/supabase/server";
import { ConsentForm } from "./ConsentForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Consentimento do responsável" };

function StatusIcon({ variant }: { variant: "shield" | "check" | "alert" }) {
  const paths: Record<typeof variant, React.ReactNode> = {
    shield: (
      <path
        d="M12 2 4 6v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    check: <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
    alert: (
      <path
        d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  };
  return (
    <div
      aria-hidden="true"
      style={{
        width: 56,
        height: 56,
        margin: "0 auto 16px",
        borderRadius: "50%",
        background: variant === "alert" ? "var(--danger-dim)" : "var(--accent-dim)",
        border: `1px solid ${variant === "alert" ? "var(--danger-border)" : "var(--accent-border)"}`,
        display: "grid",
        placeItems: "center",
        color: variant === "alert" ? "var(--danger-text)" : "var(--accent-text)",
      }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        {paths[variant]}
      </svg>
    </div>
  );
}

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
      <div className="auth-card" style={{ textAlign: consent && consent.status !== "PENDING" ? "center" : undefined }}>
        {!consent ? (
          <>
            <StatusIcon variant="alert" />
            <div className="auth-title" style={{ textAlign: "center" }}>
              Link inválido ou expirado
            </div>
            <p className="field-hint" style={{ textAlign: "center", marginTop: 8 }}>
              Peça ao estudante para gerar um novo link de confirmação nas configurações da conta dele.
            </p>
          </>
        ) : consent.status === "CONFIRMED" ? (
          <>
            <StatusIcon variant="check" />
            <div className="auth-title">Consentimento confirmado</div>
            <p className="field-hint" style={{ marginTop: 8 }}>
              {consent.guardian_name ?? "Um responsável"} já confirmou este consentimento. Nada mais é
              necessário — o estudante pode continuar usando a plataforma normalmente.
            </p>
          </>
        ) : (
          <>
            <div className="auth-brand">
              <Logo />
              <div>
                <div className="auth-title">Consentimento do responsável</div>
                <div className="auth-subtitle">MSY Academy — plataforma educacional</div>
              </div>
            </div>

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
