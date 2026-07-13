import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getProfessorClassStats } from "@/lib/dashboard/classStats";

export const dynamic = "force-dynamic";

/** Refetch do dashboard do professor (useClassStats). RLS já restringe as
 *  turmas ao tenant/autor; o guard aqui só corta não-professores cedo. */
export async function GET() {
  const session = await getSession();
  if (!session.user || !session.roles.includes("PROFESSOR")) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  return NextResponse.json(await getProfessorClassStats());
}
