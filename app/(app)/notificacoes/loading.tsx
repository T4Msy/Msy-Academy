import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="notifications-page" aria-busy="true" aria-label="Carregando notificações">
      <header className="notifications-page-header">
        <Skeleton className="size-11 rounded-sm" />
        <Skeleton className="h-6 w-32" />
      </header>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-2.5 px-3.5 py-5">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex min-h-20 items-start gap-3 rounded-md border border-border bg-card px-3.5 py-3">
            <Skeleton className="size-10 shrink-0 rounded-sm" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
