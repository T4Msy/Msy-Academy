import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  // O lint interno do `next build` (next lint) está deprecado e não digere
  // flat config; a cobrança acontece na etapa dedicada `npm run lint` do CI
  // (eslint.config.mjs) — que FALHA o pipeline em qualquer erro.
  eslint: { ignoreDuringBuilds: true },
  // pdf-parse pulls in pdfjs-dist, which assumes a browser/worker runtime
  // (DOMMatrix, Worker, etc.) and breaks when webpack tries to bundle it
  // into the RSC server graph. Marking it external makes Next.js `require()`
  // it directly from node_modules at runtime instead (Fase 4, RAG ingest).
  // sharp ships prebuilt native binaries per-platform (optionalDependencies)
  // rather than pure JS/WASM — marking it external avoids webpack trying to
  // bundle the native .node binary into the RSC server graph (used by the
  // OMR gabarito-scan pipeline, lib/omr/process.ts).
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "sharp"],
  // Baseline de defesa em profundidade (docs/13-adr-revisao-arquitetural-2026-07.md,
  // Fase 4 — revisão de sanitização): não há vetor de XSS ativo hoje (conteúdo de
  // IA é text/jsonb puro, escapado por JSX), mas os headers valem mesmo assim.
  // CSP usa 'unsafe-inline' em script-src/style-src de propósito — o script de
  // tema em app/layout.tsx é inline, e há style={{...}} inline em vários
  // componentes. Migrar para nonce-based fica para quando o Tiptap for
  // conectado a conteúdo de IA (docs/15-guardrail-sanitizacao-tiptap.md, item 3).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
