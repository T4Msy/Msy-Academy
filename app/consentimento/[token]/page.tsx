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
    <div aria-hidden="true" className={`status-icon${variant === "alert" ? " status-icon--alert" : ""}`}>
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
    <div className="grid min-h-screen place-items-center px-5 py-10">
      <div className={`auth-card${consent && consent.status !== "PENDING" ? " text-center" : ""}`}>
        {!consent ? (
          <>
            <StatusIcon variant="alert" />
            <div className="auth-title text-center">Link inválido ou expirado</div>
            <p className="mt-1 text-center text-xs leading-snug text-muted-foreground">
              Peça ao estudante para gerar um novo link de confirmação nas configurações da conta dele.
            </p>
          </>
        ) : consent.status === "CONFIRMED" ? (
          <>
            <StatusIcon variant="check" />
            <div className="font-display text-2xl font-extrabold tracking-[-0.4px] text-foreground">Consentimento confirmado</div>
            <p className="mt-1 text-xs leading-snug text-muted-foreground">
              {consent.guardian_name ?? "Um responsável"} já confirmou este consentimento. Nada mais é
              necessário — o estudante pode continuar usando a plataforma normalmente.
            </p>
          </>
        ) : (
          <>
            <div className="mb-5.5 flex items-center gap-[11px]">
              <Logo />
              <div>
                <div className="font-display text-2xl font-extrabold tracking-[-0.4px] text-foreground">Consentimento do responsável</div>
                <div className="mt-1 text-[13.5px] text-muted-foreground">MSY Academy — plataforma educacional</div>
              </div>
            </div>

            <p className="mt-0 text-xs leading-snug text-muted-foreground">
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
