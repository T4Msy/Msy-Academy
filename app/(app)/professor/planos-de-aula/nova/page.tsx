import type { Metadata } from "next";
import { NovoPlanoTabs } from "./NovoPlanoTabs";

export const metadata: Metadata = { title: "Novo Plano de Aula" };

export default function NovoPlanoDeAulaPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Novo Plano de Aula</h1>
          <p className="page-subtitle">Gere com IA ou escreva do zero — objetivos, conteúdo e avaliação.</p>
        </div>
      </div>
      <NovoPlanoTabs />
    </>
  );
}
