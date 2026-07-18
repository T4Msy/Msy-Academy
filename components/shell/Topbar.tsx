import { Logo } from "@/components/Logo";
import { ContextSwitcher } from "./ContextSwitcher";
import { UserMenu } from "./UserMenu";
import { NotificationBell, type NotificationItem } from "./NotificationBell";
import { GlobalSearch } from "./GlobalSearch";

type TopbarProps =
  | {
      variant?: "full";
      name: string;
      email: string;
      currentEnv: "PROFESSOR" | "ALUNO";
      hasOtherEnv: boolean;
      settingsHref: string;
      notifications: NotificationItem[];
    }
  | {
      variant: "minimal";
      subtitle?: string;
      rightSlot?: React.ReactNode;
    };

/** Full variant (professor/aluno): search + env switcher + notifications + account menu.
 * Minimal variant (admin): just the brand + a caller-supplied right-side slot — those
 * features are professor/aluno-shaped and don't apply to admin. */
export function Topbar(props: TopbarProps) {
  return (
    <header className="topbar" role="banner">
      <div className="topbar-inner">
        <div className="topbar-context">
          <div className="brand">
            <Logo />
            <div>
              <div className="brand-title">MSY Academy</div>
              <div className="brand-sub">
                {props.variant === "minimal" ? props.subtitle : props.currentEnv === "PROFESSOR" ? "Ambiente do Professor" : "Ambiente do Aluno"}
              </div>
            </div>
          </div>
          {props.variant !== "minimal" && props.hasOtherEnv && <ContextSwitcher current={props.currentEnv} />}
        </div>

        {props.variant === "minimal" ? (
          <div className="topbar-right">{props.rightSlot}</div>
        ) : (
          <>
            <GlobalSearch environment={props.currentEnv} />
            <div className="topbar-right">
              <NotificationBell notifications={props.notifications} environment={props.currentEnv} />
              <UserMenu name={props.name} email={props.email} settingsHref={props.settingsHref} />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
