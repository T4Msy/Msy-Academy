import type { Metadata } from "next";
import { NovoPlanoTabs } from "./NovoPlanoTabs";

export const metadata: Metadata = { title: "Novo Plano de Aula" };

export default function NovoPlanoDeAulaPage() {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Novo Plano de Aula</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">Gere com IA ou escreva do zero — objetivos, conteúdo e avaliação.</p>
        </div>
      </div>
      <NovoPlanoTabs />
    </>
  );
}
