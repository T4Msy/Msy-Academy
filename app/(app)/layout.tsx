import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Outer guard for the whole authenticated area: signed in + onboarded.
 * Middleware already redirects most of these cases, but layouts run for
 * every render and are the last line of defense — no visual chrome here,
 * that's owned by each environment's own layout (professor/aluno), since
 * each renders a different sidebar.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (!roles || roles.length === 0) redirect("/onboarding");

  return <>{children}</>;
}
