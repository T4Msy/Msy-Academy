"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Camera, ImagePlus, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { removeAvatar, updateAvatar, updateProfile, type AvatarState, type UpdateProfileState } from "@/lib/settings/actions";
import { PROFILE_LIMITS } from "@/lib/settings/profileValidation";
import { useRouter } from "next/navigation";

const emptyState: UpdateProfileState = {};
const emptyAvatarState: AvatarState = {};

type Profile = {
  display_name?: string | null;
  bio?: string | null;
  institution?: string | null;
  discipline?: string | null;
  grade_interest?: string | null;
  study_goal?: string | null;
  show_avatar?: boolean | null;
  avatar_path?: string | null;
};

export function ProfileSettingsForm({
  initialName,
  profile,
  avatarUrl,
  roles,
}: {
  initialName: string;
  profile: Profile | null;
  avatarUrl: string | null;
  roles: string[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [institution, setInstitution] = useState(profile?.institution ?? "");
  const [discipline, setDiscipline] = useState(profile?.discipline ?? "");
  const [gradeInterest, setGradeInterest] = useState(profile?.grade_interest ?? "");
  const [studyGoal, setStudyGoal] = useState(profile?.study_goal ?? "");
  const [showAvatar, setShowAvatar] = useState(profile?.show_avatar !== false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [avatarState, avatarAction, avatarPending] = useActionState(updateAvatar, emptyAvatarState);
  const [removePending, startRemove] = useTransition();
  const [state, formAction, pending] = useActionState(updateProfile, emptyState);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarRefreshRef = useRef(false);

  const dirty = useMemo(() => [
    name !== initialName,
    displayName !== (profile?.display_name ?? ""),
    bio !== (profile?.bio ?? ""),
    institution !== (profile?.institution ?? ""),
    discipline !== (profile?.discipline ?? ""),
    gradeInterest !== (profile?.grade_interest ?? ""),
    studyGoal !== (profile?.study_goal ?? ""),
    showAvatar !== (profile?.show_avatar !== false),
  ].some(Boolean), [name, initialName, displayName, profile, bio, institution, discipline, gradeInterest, studyGoal, showAvatar]);

  const isProfessor = roles.includes("PROFESSOR");
  const isStudent = roles.includes("ALUNO") && !isProfessor;
  const shownAvatar = preview ?? avatarUrl;
  const initials = (name || "?").split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

  useEffect(() => {
    if (avatarState.ok && !avatarRefreshRef.current) {
      avatarRefreshRef.current = true;
      router.refresh();
    }
  }, [avatarState.ok, router]);

  function chooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setPreview(null);
      setFileError("Use uma imagem JPG, PNG ou WebP de até 2 MB.");
      return;
    }
    setFileError(null);
    avatarRefreshRef.current = false;
    setPreview(URL.createObjectURL(file));
  }

  function removePhoto() {
    startRemove(async () => {
      await removeAvatar();
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  }

  return (
    <section className="col-span-full overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
      <div className="border-b border-border px-5.5 py-5">
        <h2 className="font-display text-lg font-bold tracking-[-0.2px] text-foreground">Perfil</h2>
        <p className="mt-1 text-sm text-muted-foreground">Edite as informações que representam você dentro da MSY Academy.</p>
      </div>

      <div className="grid gap-6 p-5.5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-[rgba(var(--overlay-rgb),0.025)] p-5 text-center lg:items-start lg:text-left">
          <div className="avatar h-24 w-24 text-2xl" aria-label={shownAvatar ? "Foto de perfil" : `Iniciais de ${name}`}>
            {shownAvatar ? <img src={shownAvatar} alt={`Foto de perfil de ${name}`} className="h-full w-full rounded-full object-cover" /> : initials || "?"}
          </div>
          <div>
            <p className="font-semibold text-foreground">{name || "Seu nome"}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{isProfessor ? "Professor" : isStudent ? "Aluno" : "Usuário"}</p>
          </div>
          <form action={avatarAction} className="flex w-full flex-col gap-2">
            <input ref={fileRef} name="avatar" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={chooseFile} aria-label="Selecionar foto de perfil" />
            <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-[rgba(var(--overlay-rgb),0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-glow">
              <Camera className="h-4 w-4" aria-hidden /> Alterar foto
            </button>
            {avatarUrl && <button type="button" onClick={removePhoto} disabled={removePending} className="inline-flex items-center gap-1.5 rounded-sm px-2 py-2 text-sm font-semibold text-danger-text transition-colors hover:bg-danger-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-border disabled:opacity-50"><Trash2 className="h-4 w-4" aria-hidden /> Remover</button>}
            </div>
            {preview && <button type="submit" disabled={avatarPending} className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"><ImagePlus className="h-4 w-4" aria-hidden /> {avatarPending ? "Enviando…" : "Salvar foto"}</button>}
          </form>
          {avatarState.error && <p role="alert" className="text-xs text-danger-text">{avatarState.error}</p>}
          {fileError && <p role="alert" className="text-xs text-danger-text">{fileError}</p>}
          {avatarState.ok && <p role="status" className="text-xs text-brand-text">Foto atualizada com sucesso.</p>}
          <p className="text-xs leading-snug text-muted-foreground">JPG, PNG ou WebP. Até 2 MB.</p>
        </div>

        <form action={formAction} className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2 flex items-center gap-2 border-b border-border pb-3 text-sm font-semibold text-foreground"><UserRound className="h-4 w-4 text-brand-text" aria-hidden /> Informações pessoais</div>
          <Field id="full_name" label="Nome completo"><input id="full_name" name="full_name" value={name} onChange={(event) => setName(event.target.value)} maxLength={PROFILE_LIMITS.fullName} required className={inputClass} placeholder="Seu nome completo" /></Field>
          <Field id="display_name" label="Nome de exibição" help="Opcional. Como você prefere ser chamado."><input id="display_name" name="display_name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={PROFILE_LIMITS.displayName} className={inputClass} placeholder="Nome exibido" /></Field>
          <Field id="institution" label="Escola ou instituição"><input id="institution" name="institution" value={institution} onChange={(event) => setInstitution(event.target.value)} maxLength={PROFILE_LIMITS.institution} className={inputClass} placeholder="Opcional" /></Field>
          <Field id="bio" label="Apresentação curta" help={`${bio.length}/${PROFILE_LIMITS.bio} caracteres`}><textarea id="bio" name="bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={PROFILE_LIMITS.bio} rows={3} className={inputClass} placeholder="Conte um pouco sobre você" /></Field>
          {isProfessor && <Field id="discipline" label="Disciplina principal"><input id="discipline" name="discipline" value={discipline} onChange={(event) => setDiscipline(event.target.value)} maxLength={PROFILE_LIMITS.discipline} className={inputClass} placeholder="Ex.: Matemática" /></Field>}
          {isStudent && <Field id="grade_interest" label="Ano ou série de interesse"><input id="grade_interest" name="grade_interest" value={gradeInterest} onChange={(event) => setGradeInterest(event.target.value)} maxLength={PROFILE_LIMITS.gradeInterest} className={inputClass} placeholder="Ex.: 9º ano" /></Field>}
          {isStudent && <Field id="study_goal" label="Objetivo de estudo"><textarea id="study_goal" name="study_goal" value={studyGoal} onChange={(event) => setStudyGoal(event.target.value)} maxLength={PROFILE_LIMITS.studyGoal} rows={3} className={inputClass} placeholder="Opcional" /></Field>}
          <div className="md:col-span-2 border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground">Preferências do perfil</p>
            <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-foreground">
              <input type="checkbox" name="show_avatar" checked={showAvatar} onChange={(event) => setShowAvatar(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
              <span><span className="font-medium">Exibir minha foto de perfil</span><span className="mt-0.5 block text-xs text-muted-foreground">Quando desativada, a plataforma usa suas iniciais no menu e nos demais espaços.</span></span>
            </label>
          </div>
          <div className="md:col-span-2 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-brand-text" aria-hidden /> As informações deste perfil podem aparecer em turmas, atividades e outras interações na plataforma.</div>
          {state.error && <div role="alert" className="md:col-span-2 rounded-md border border-danger-border bg-danger-dim px-4 py-3 text-sm text-danger-text">{state.error}</div>}
          {state.ok && <div role="status" className="md:col-span-2 rounded-md border border-brand-border bg-brand-dim px-4 py-3 text-sm text-brand-text">Perfil atualizado com sucesso.</div>}
          {state.warning && <div role="status" className="md:col-span-2 rounded-md border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-4 py-3 text-sm text-muted-foreground">{state.warning}</div>}
          <div className="md:col-span-2"><button type="submit" disabled={pending || !dirty} className="inline-flex items-center justify-center rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] transition-all hover:-translate-y-px hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-glow disabled:pointer-events-none disabled:opacity-50">{pending ? "Salvando…" : "Salvar perfil"}</button></div>
        </form>
      </div>
    </section>
  );
}

const inputClass = "w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow disabled:cursor-not-allowed disabled:opacity-60";

function Field({ id, label, help, children }: { id: string; label: string; help?: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><label htmlFor={id} className="text-sm font-semibold text-foreground">{label}</label>{children}{help && <p className="text-xs leading-snug text-muted-foreground">{help}</p>}</div>;
}
