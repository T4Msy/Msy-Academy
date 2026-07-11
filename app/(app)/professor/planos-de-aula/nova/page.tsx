import type { Metadata } from "next";
import { LessonPlanForm } from "./LessonPlanForm";

export const metadata: Metadata = { title: "Novo Plano de Aula" };

export default function NovoPlanoDeAulaPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Novo Plano de Aula</h1>
          <p className="page-subtitle">Gere um plano completo com objetivos, conteúdo e avaliação.</p>
        </div>
      </div>
      <LessonPlanForm />
    </>
  );
}
