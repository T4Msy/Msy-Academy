/**
 * Robust parser for the exam HTML returned by n8n / the AI providers.
 * Ported verbatim (logic-preserving) from the legacy script.js
 * extractHtmlProva(). Kept isolated so it is unit-testable and reusable.
 *
 * NOTE: In this slice the AI still returns HTML. The immediate fast-follow is
 * to have it return structured data (questions), at which point this parser
 * evolves into a structured extractor — see docs/12-adr-stack.md.
 */
export function extractHtmlProva(data: unknown): string {
  const d = (data ?? {}) as Record<string, any>;

  // 1) Direct field names from n8n/webhook
  let html: any =
    d?.htmlprova ??
    d?.html_prova ??
    d?.htmlProva ??
    d?.examString ??
    d?.prova_html;

  // 2) If value is a nested object, dig into common sub-keys
  if (html && typeof html === "object") {
    html = html.html ?? html.content ?? html.data ?? html.value ?? null;
  }

  // 3) OpenAI / Groq wrapped response
  if (!html) {
    const content: any =
      d?.choices?.[0]?.message?.content ?? d?.choices?.[0]?.text;

    if (typeof content === "string" && content.trim()) {
      if (
        content.includes("<html") ||
        content.includes("<!DOCTYPE") ||
        content.includes("<body")
      ) {
        html = content;
      } else {
        try {
          const parsed = JSON.parse(content);
          html =
            parsed?.htmlprova ?? parsed?.html_prova ?? parsed?.examString ?? null;
        } catch {
          /* not JSON */
        }
      }
    }
  }

  // 4) Final validation
  if (typeof html !== "string" || !html.trim() || html.trim() === "undefined") {
    const keys = d && typeof d === "object" ? Object.keys(d) : [];
    throw new Error(
      `Resposta sem HTML válido. Keys recebidas: ${keys.join(", ")}`,
    );
  }

  return html;
}
