"use client";

import { useState } from "react";

declare global {
  interface Window {
    html2pdf?: any;
    htmlDocx?: { asBlob: (html: string) => Blob };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.head.appendChild(s);
  });
}

/**
 * Export actions for a saved exam. Mirrors the legacy baixarPDF/baixarWord/print
 * flow: the export libraries are loaded from CDN on demand (client-only).
 */
export function ExamActions({
  html,
  iframeId,
  filename,
}: {
  html: string;
  iframeId: string;
  filename: string;
}) {
  const [busy, setBusy] = useState<null | "pdf" | "word">(null);

  async function exportPdf() {
    setBusy("pdf");
    try {
      await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js",
      );
      const container = document.createElement("div");
      container.style.cssText =
        "background:#fff;color:#000;padding:20px;font-family:Arial,sans-serif;font-size:12pt;";
      container.innerHTML = html;
      document.body.appendChild(container);
      await window
        .html2pdf()
        .set({
          margin: 10,
          filename: `${filename}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(container)
        .save();
      document.body.removeChild(container);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Falha ao gerar PDF.");
    } finally {
      setBusy(null);
    }
  }

  async function exportWord() {
    setBusy("word");
    try {
      await loadScript(
        "https://cdn.jsdelivr.net/npm/html-docx-js@0.1.0/dist/html-docx.min.js",
      );
      if (!window.htmlDocx?.asBlob) {
        throw new Error("Biblioteca de exportação Word não carregou.");
      }
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${filename}</title><style>body{font-family:Arial,sans-serif;font-size:12pt;margin:20px;}</style></head><body>${html}</body></html>`;
      const blob = window.htmlDocx.asBlob(fullHtml);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Falha ao gerar Word.");
    } finally {
      setBusy(null);
    }
  }

  function print() {
    const iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
    iframe?.contentWindow?.focus();
    iframe?.contentWindow?.print();
  }

  return (
    <div className="result-actions">
      <button type="button" className="btn btn-ghost btn-sm" onClick={exportPdf} disabled={busy !== null}>
        {busy === "pdf" ? <span className="btn-loader" /> : "PDF"}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={exportWord} disabled={busy !== null}>
        {busy === "word" ? <span className="btn-loader" /> : "Word"}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={print} disabled={busy !== null}>
        Imprimir
      </button>
    </div>
  );
}
