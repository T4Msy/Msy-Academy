import type { Metadata } from "next";
import { ConfiguracoesPageContent } from "@/components/settings/ConfiguracoesPageContent";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ deleteError?: string }>;
}) {
  const { deleteError } = await searchParams;
  return <ConfiguracoesPageContent returnPath="/aluno/configuracoes" deleteError={deleteError} />;
}
