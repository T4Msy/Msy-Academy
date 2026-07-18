import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, BellOff } from "lucide-react";
import { getRecentNotifications } from "@/lib/auth/session";
import { NotificationList } from "@/components/notifications/NotificationList";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notificações" };

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ origem?: string }>;
}) {
  const [{ origem }, notifications] = await Promise.all([searchParams, getRecentNotifications()]);
  const backHref = origem === "professor" ? "/professor" : "/aluno";

  return (
    <main className="notifications-page">
      <header className="notifications-page-header">
        <Link href={backHref} className="flex size-11 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none transition-colors hover:bg-card-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" aria-label="Voltar">
          <ArrowLeft size={20} strokeWidth={1.8} aria-hidden />
        </Link>
        <h1 className="font-display text-xl font-bold text-foreground">Notificações</h1>
      </header>

      <div className="mx-auto w-full max-w-xl px-3.5 py-5">
        {notifications.length > 0 ? (
          <NotificationList notifications={notifications} />
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-md border border-border bg-card px-6 text-center">
            <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-card-2 text-muted-foreground" aria-hidden>
              <BellOff size={20} strokeWidth={1.8} />
            </span>
            <h2 className="font-display text-base font-bold text-foreground">Tudo tranquilo por aqui</h2>
            <p className="mt-1 max-w-64 text-sm text-muted-foreground">Quando houver novidades sobre suas turmas e atividades, elas aparecerão aqui.</p>
          </div>
        )}
      </div>
    </main>
  );
}
