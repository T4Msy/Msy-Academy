import { getSession } from "@/lib/auth/session";
import { AddRoleButton } from "./AddRoleButton";

const ROLE_LABEL = { PROFESSOR: "Professor", ALUNO: "Aluno" } as const;

/** Lets a user with only one role activate the other environment — see lib/settings/roles-actions.ts. */
export async function RolesCard() {
  const { roles } = await getSession();
  const roleSet = new Set(roles);
  const missing = (["PROFESSOR", "ALUNO"] as const).find((r) => !roleSet.has(r));

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Ambientes</h2>
        </div>
      </div>
      <div className="flex flex-col gap-4.5 p-5.5">
        <p className="mt-0 text-xs leading-snug text-muted-foreground">
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
