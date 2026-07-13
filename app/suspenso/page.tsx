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
    <div className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-[420px] rounded-lg border border-border bg-card p-7 pt-8 shadow-elevated">
        <div className="mb-5.5 flex items-center gap-[11px]">
          <Logo />
          <div>
            <div className="font-display text-2xl font-extrabold tracking-[-0.4px] text-foreground">Conta suspensa</div>
            <div className="mt-1 text-[13.5px] text-muted-foreground">Seu acesso foi suspenso. Entre em contato com o suporte para mais informações.</div>
          </div>
        </div>
        <form action={logout}>
          <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-4 py-2.5">Sair</button>
        </form>
      </div>
    </div>
  );
}
