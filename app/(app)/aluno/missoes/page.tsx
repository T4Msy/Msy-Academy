import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { STUDENT_MISSIONS } from "@/lib/dashboard/studentMissions";

export default function StudentMissionsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Guia inicial"
        subtitle="Consulte novamente os caminhos principais da área do aluno quando precisar."
        actions={
          <Link href="/aluno" className="inline-flex items-center gap-2 rounded-sm border border-border px-3.5 py-2 text-sm font-bold text-foreground transition-colors hover:border-border-hover hover:bg-card-2 focus-visible:ring-2 focus-visible:ring-ring">
            <ArrowLeft className="size-4" aria-hidden />
            Voltar ao início
          </Link>
        }
      />

      <Card className="border-border bg-card shadow-elevated">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
          {STUDENT_MISSIONS.map((mission) => (
            <Link
              key={mission.id}
              href={mission.href}
              className="group flex items-start gap-3 rounded-md border border-border p-4 transition-colors hover:border-border-hover hover:bg-card-2 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-text" aria-hidden />
              <span className="min-w-0">
                <span className="block font-display text-sm font-bold text-foreground">{mission.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{mission.description}</span>
                <span className="mt-3 block text-xs font-bold text-brand-text group-hover:text-brand-hover">{mission.actionLabel} →</span>
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
