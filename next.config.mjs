/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // pdf-parse pulls in pdfjs-dist, which assumes a browser/worker runtime
  // (DOMMatrix, Worker, etc.) and breaks when webpack tries to bundle it
  // into the RSC server graph. Marking it external makes Next.js `require()`
  // it directly from node_modules at runtime instead (Fase 4, RAG ingest).
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
