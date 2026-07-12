import { DeleteAccountForm } from "./DeleteAccountForm";

/** "Meus dados" (export) + "Zona de perigo" (delete) sections shared by the professor and aluno Configurações pages. */
export function DataAndDangerZone({ returnPath, deleteError }: { returnPath: string; deleteError?: string }) {
  return (
    <>
      <section className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2 className="card-title">Meus dados</h2>
          </div>
        </div>
        <div className="card-body">
          <p className="field-hint mt-0">
            Baixe uma cópia de tudo que você criou e de todo o seu histórico na plataforma.
          </p>
          <a href="/api/settings/export" className="btn btn-ghost btn-sm">
            Exportar meus dados
          </a>
        </div>
      </section>
      <section className="card card--danger">
        <div className="card-header">
          <div className="card-title-group">
            <h2 className="card-title">Zona de perigo</h2>
          </div>
        </div>
        <div className="card-body">
          <DeleteAccountForm returnPath={returnPath} error={deleteError} />
        </div>
      </section>
    </>
  );
}
