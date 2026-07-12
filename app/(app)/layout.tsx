import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

/**
 * Outer guard for the whole authenticated area: signed in + onboarded.
 * Middleware already redirects most of these cases, but layouts run for
 * every render and are the last line of defense — no visual chrome here,
 * that's owned by each environment's own layout (professor/aluno), since
 * each renders a different sidebar.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, suspendedAt, roles } = await getSession();
  if (!user) redirect("/login");
  if (suspendedAt) redirect("/suspenso");
  if (roles.length === 0) redirect("/onboarding");

  return <>{children}</>;
}
