import { getSession } from "@/lib/auth/session";
import { AddRoleButton } from "./AddRoleButton";

const ROLE_LABEL = { PROFESSOR: "Professor", ALUNO: "Aluno" } as const;

/** Lets a user with only one role activate the other environment — see lib/settings/roles-actions.ts. */
export async function RolesCard() {
  const { roles } = await getSession();
  const roleSet = new Set(roles);
  const missing = (["PROFESSOR", "ALUNO"] as const).find((r) => !roleSet.has(r));

  return (
    <section className="card">
      <div className="card-header">
        <div className="card-title-group">
          <h2 className="card-title">Ambientes</h2>
        </div>
      </div>
      <div className="card-body">
        <p className="field-hint mt-0">
          Você tem acesso ao ambiente de{" "}
          {(["PROFESSOR", "ALUNO"] as const)
            .filter((r) => roleSet.has(r))
            .map((r) => ROLE_LABEL[r])
            .join(" e ")}
          . Ter os dois ambientes é gratuito — não depende do seu plano.
        </p>
        {missing && <AddRoleButton role={missing} label={ROLE_LABEL[missing]} />}
      </div>
    </section>
  );
}
