import { getSession } from "@/lib/auth/session";
import { ProfileSettingsForm } from "@/components/settings/ProfileSettingsForm";

export async function PerfilPageContent() {
  const { fullName, profile, avatarUrl, roles } = await getSession();
  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Perfil</h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">Edite as informações que representam você dentro da MSY Academy.</p>
      </div>
      <ProfileSettingsForm initialName={fullName ?? ""} profile={profile} avatarUrl={avatarUrl} roles={roles} />
    </>
  );
}
