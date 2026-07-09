import { ExamForm } from "./ExamForm";

export default function NovaProvaPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Nova Prova</h1>
          <p className="page-subtitle">
            Preencha os parâmetros e a IA gera sua prova — salva automaticamente ao
            final.
          </p>
        </div>
      </div>
      <ExamForm />
    </>
  );
}
