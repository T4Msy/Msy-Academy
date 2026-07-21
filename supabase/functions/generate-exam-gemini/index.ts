const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

type Question = {
  type: "MULTIPLA" | "VF" | "DISCURSIVA";
  statement: string;
  options?: { id: string; text: string }[];
  correctAnswer: string | string[];
  explanation?: string;
  difficulty: "FACIL" | "MEDIO" | "DIFICIL";
  tags?: string[];
  bnccCodes?: string[];
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function parseModelJson(value: string): unknown {
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}

function validateExam(value: unknown, expectedQuestionCount?: number): { title: string; questions: Question[] } {
  const exam = value as { title?: unknown; questions?: unknown };
  if (!exam || typeof exam.title !== "string" || !exam.title.trim() || !Array.isArray(exam.questions) || exam.questions.length === 0) throw new Error("Resposta sem título ou questões.");
  const questions = exam.questions.map((raw) => {
    const question = raw as Question;
    if (!["MULTIPLA", "VF", "DISCURSIVA"].includes(question.type) || typeof question.statement !== "string" || !question.statement.trim() || !["FACIL", "MEDIO", "DIFICIL"].includes(question.difficulty)) throw new Error("Questão fora do formato esperado.");
    if (question.type !== "DISCURSIVA") {
      if (!Array.isArray(question.options) || question.options.length < 2 || question.options.some((option) => !option.id || !option.text?.trim())) throw new Error("Alternativas inválidas.");
      if (!question.options.some((option) => option.id === question.correctAnswer)) throw new Error("Resposta correta ausente nas alternativas.");
    }
    return { ...question, tags: Array.isArray(question.tags) ? question.tags : [], bnccCodes: Array.isArray(question.bnccCodes) ? question.bnccCodes : [] };
  });
  if (expectedQuestionCount && questions.length !== expectedQuestionCount) {
    throw new Error(`Quantidade de quest\u00f5es inv\u00e1lida: esperadas ${expectedQuestionCount}, recebidas ${questions.length}.`);
  }
  return { title: exam.title.trim(), questions };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "Provider Gemini não configurado." }, 500);

  try {
    const payload = await request.json() as { task?: string; schema?: unknown; input?: Record<string, unknown> };
    if (!payload.input || (payload.task !== "EXAM_GEN" && payload.task !== "ACTIVITY_GEN")) return json({ error: "Payload de geração inválido." }, 400);
    const input = payload.input;
    const subject = String(input.materia ?? "").trim();
    const topic = String(input.assunto ?? "").trim();
    const grade = String(input.serie ?? input.publico ?? "não informado").trim();
    const difficulty = String(input.nivel ?? "médio").trim();
    const requestedType = String(input.tipo ?? "mista").trim();
    const requestedCount = Number(input.quantidade);
    const countInstruction = Number.isInteger(requestedCount) && requestedCount > 0
      ? `Gere EXATAMENTE ${requestedCount} questões.`
      : "Gere a quantidade de questões pedida no contexto.";
    const prompt = `Você é um elaborador de avaliações escolares brasileiras. Retorne somente JSON válido no schema fornecido.

REQUISITOS INEGOCIÁVEIS:
- Disciplina: "${subject}".
- Assunto/tema: "${topic}".
- Série ou público: "${grade}".
- Dificuldade: "${difficulty}".
- Tipo de questão pedido: "${requestedType}".
- ${countInstruction}
- Cada questão deve avaliar diretamente "${topic}" dentro de "${subject}". Não use fatos ou perguntas de outra disciplina/tema.
- Crie questões originais, específicas e adequadas ao nível informado. Em objetivas, use alternativas plausíveis e exatamente uma resposta correta.
- Nunca use placeholders, frases genéricas, nem mencione o provider.

Contexto completo do professor:
${JSON.stringify(input)}

Schema de saída:
${JSON.stringify(payload.schema ?? {})}`;
    const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.7 } }),
    });
    if (!geminiResponse.ok) return json({ error: "Falha ao consultar o Gemini." }, 502);
    const raw = await geminiResponse.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[]; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } };
    const text = raw.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
    if (!text) return json({ error: "O Gemini não retornou uma prova estruturada." }, 502);
    const expectedQuestionCount = Number.isInteger(requestedCount) && requestedCount > 0 ? requestedCount : undefined;
    const data = validateExam(parseModelJson(text), expectedQuestionCount);
    return json({ data, tokensIn: raw.usageMetadata?.promptTokenCount ?? 0, tokensOut: raw.usageMetadata?.candidatesTokenCount ?? 0 });
  } catch (error) {
    console.error("[generate-exam-gemini] erro", error instanceof Error ? error.message : String(error));
    return json({ error: "Não foi possível gerar a prova com o Gemini." }, 500);
  }
});
