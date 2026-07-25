"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { duplicateActivity } from "../actions";
import { Button } from "@/components/ui/button";

export function ActivityActions({ activityId }: { activityId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <Button type="button" variant="outline" disabled={pending} onClick={() => startTransition(async () => { const id = await duplicateActivity(activityId); router.push(`/professor/atividades/${id}`); })}>{pending ? "Duplicando…" : "Duplicar"}</Button>;
}
