import type { Metadata } from "next";
import { ExamForm } from "./ExamForm";

export const metadata: Metadata = { title: "Nova Prova" };

export default function NovaProvaPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Nova Prova</h1>
          <p className="page-subtitle">
            Preencha os parâmetros e a IA gera as questões — editáveis e salvas
            automaticamente ao final.
          </p>
        </div>
      </div>
      <ExamForm />
    </>
  );
}
