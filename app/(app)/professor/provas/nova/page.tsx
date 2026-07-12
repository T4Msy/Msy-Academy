import type { Metadata } from "next";
import { NovaProvaTabs } from "./NovaProvaTabs";

export const metadata: Metadata = { title: "Nova Prova" };

export default function NovaProvaPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Nova Prova</h1>
          <p className="page-subtitle">
            Gere com IA ou crie do zero — as questões são editáveis e salvas
            automaticamente ao final.
          </p>
        </div>
      </div>
      <NovaProvaTabs />
    </>
  );
}
