import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * ESLint flat config (decisão nº 17 do ADR): next/core-web-vitals +
 * next/typescript (typescript-eslint recommended), formato nativo do
 * eslint-config-next 16. Lint é etapa do CI e o build não ignora mais
 * erros de lint (next.config.mjs).
 */
const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
  ...coreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Dívida quitada na Fase 2 (anys tipados na fronteira do PostgREST;
      // shell em useSyncExternalStore). Regras valem como error — exceções
      // pontuais exigem disable comentado com justificativa.
      "@typescript-eslint/no-explicit-any": "error",
      "react-hooks/set-state-in-effect": "error",
    },
  },
  {
    // Lazy require() deliberado do admin client (só carrega service-role
    // quando de fato usado, nunca no bundle de browser).
    files: ["lib/supabase/server.ts"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    // Image do @react-pdf/renderer não é <img> DOM — alt não se aplica.
    files: ["lib/exam/export/**"],
    rules: { "jsx-a11y/alt-text": "off" },
  },
];

export default eslintConfig;
