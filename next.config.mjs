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
};

export default nextConfig;
