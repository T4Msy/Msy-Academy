import { z } from "zod";

/**
 * Validates required env vars once, at import time, so a missing secret
 * fails loudly at startup instead of silently as a runtime 500 deep inside a
 * route handler — important once the AI Orchestration Service (Fase 1+)
 * depends on provider keys that are easy to forget in a new environment.
 */
const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

/** Call from server-only code (route handlers, server actions) that needs these vars. */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Variáveis de ambiente ausentes/ inválidas: ${missing}`);
  }
  cached = parsed.data;
  return cached;
}
