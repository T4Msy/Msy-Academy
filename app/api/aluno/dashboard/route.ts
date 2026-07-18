import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getStudentDashboardStats } from "@/lib/dashboard/studentStats";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session.user || !session.roles.includes("ALUNO")) {
    return NextResponse.json({ error: "N\u00e3o autenticado." }, { status: 401 });
  }

  return NextResponse.json(await getStudentDashboardStats());
}
