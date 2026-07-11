import { Logo } from "@/components/Logo";
import { ContextSwitcher } from "./ContextSwitcher";
import { UserMenu } from "./UserMenu";
import { NotificationBell, type NotificationItem } from "./NotificationBell";
import { GlobalSearch } from "./GlobalSearch";

export function Topbar({
  name,
  email,
  currentEnv,
  hasOtherEnv,
  settingsHref,
  notifications,
}: {
  name: string;
  email: string;
  currentEnv: "PROFESSOR" | "ALUNO";
  hasOtherEnv: boolean;
  settingsHref: string;
  notifications: NotificationItem[];
}) {
  return (
    <header className="topbar" role="banner">
      <div className="topbar-inner">
        <div className="brand">
          <Logo />
          <div>
            <div className="brand-title">MSY Academy</div>
            <div className="brand-sub">
              {currentEnv === "PROFESSOR" ? "Ambiente do Professor" : "Ambiente do Aluno"}
            </div>
          </div>
        </div>

        <GlobalSearch environment={currentEnv} />

        <div className="topbar-right">
          {hasOtherEnv && <ContextSwitcher current={currentEnv} />}
          <NotificationBell notifications={notifications} />
          <UserMenu name={name} email={email} settingsHref={settingsHref} />
        </div>
      </div>
    </header>
  );
}
