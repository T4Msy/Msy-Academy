import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { logout } from "@/lib/auth/actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Conta suspensa" };

/** Outside app/(app)/ on purpose — that group's layout redirects suspended users here, so this page must not be inside it (would loop). */
export default async function SuspensoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("suspended_at").eq("id", user.id).single();
  if (!profile?.suspended_at) redirect("/");

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <Logo />
          <div>
            <div className="auth-title">Conta suspensa</div>
            <div className="auth-subtitle">Seu acesso foi suspenso. Entre em contato com o suporte para mais informações.</div>
          </div>
        </div>
        <form action={logout}>
          <button type="submit" className="btn btn-ghost">Sair</button>
        </form>
      </div>
    </div>
  );
}
