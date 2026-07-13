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
    <div className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-[560px] rounded-lg border border-border bg-card p-7 pt-8 shadow-elevated">
        <div className="mb-5.5 flex items-center gap-[11px]">
          <Logo />
          <div>
            <div className="font-display text-2xl font-extrabold tracking-[-0.4px] text-foreground">Como você vai usar a MSY Academy?</div>
            <div className="mt-1 text-[13.5px] text-muted-foreground">Isso define seu ambiente inicial — você pode ter os dois.</div>
          </div>
        </div>
        <OnboardingForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
