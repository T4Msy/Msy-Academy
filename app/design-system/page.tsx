import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Showcase } from "./Showcase";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Design System" };

/**
 * Doc viva do Design System (decisão nº 7 do ADR): renderiza os componentes
 * REAIS de components/ui — impossível ficar desatualizada. Em produção é
 * restrita a ADMIN; em dev, qualquer usuário logado (o middleware já exige
 * sessão). Guia de referência para humanos e para a IA ao construir telas.
 */
export default async function DesignSystemPage() {
  const session = await getSession();
  if (!session.user) notFound();
  if (process.env.NODE_ENV === "production" && !session.roles.includes("ADMIN")) {
    notFound();
  }

  return <Showcase />;
}
