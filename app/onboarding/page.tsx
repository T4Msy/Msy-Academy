import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { OnboardingForm } from "./OnboardingForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bem-vindo" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectTo } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Already onboarded (e.g. revisiting the URL) — send to the right shell.
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (roles && roles.length > 0) {
    redirect(redirectTo?.startsWith("/") ? redirectTo : roles.some((r) => r.role === "PROFESSOR") ? "/professor" : "/aluno");
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card max-w-560">
        <div className="auth-brand">
          <Logo />
          <div>
            <div className="auth-title">Como você vai usar a MSY Academy?</div>
            <div className="auth-subtitle">Isso define seu ambiente inicial — você pode ter os dois.</div>
          </div>
        </div>
        <OnboardingForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
