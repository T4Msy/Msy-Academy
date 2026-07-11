import type { Metadata } from "next";
import { JoinClassCard } from "./JoinClassCard";

export const metadata: Metadata = { title: "Entrar em turma" };

/**
 * Protected route: middleware guarantees an authenticated + onboarded user
 * by the time this renders (unauth -> /login?redirect=/entrar/CODE; no
 * role yet -> /onboarding?redirect=/entrar/CODE; both chains land back
 * here). The join itself runs client-side on mount via a server action.
 */
export default async function EntrarPage({ params }: { params: Promise<{ invite_code: string }> }) {
  const { invite_code } = await params;
  return <JoinClassCard inviteCode={invite_code} />;
}
