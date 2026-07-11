import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai/registry";
import { logAIUsage } from "@/lib/ai/orchestrator";
import { checkQuota, QuotaExceededError } from "@/lib/billing/quota";

export const runtime = "nodejs";

/**
 * POST /api/ai/tutor/chat — Fase 4 (RF-A01..A03).
 *
 * Body: { conversationId?: string, message: string }
 * Streams the response as plain text while accumulating it server-side to
 * persist as the assistant's tutor_messages row once the stream ends. The
 * new/continuing conversation id comes back in the `X-Conversation-Id`
 * header (a streaming body can't also carry a JSON envelope cleanly).
 *
 * Context comes from `search_material_chunks` (migration 0014) — a plain
 * SECURITY INVOKER function, so RLS on material_chunks does the scoping: an
 * aluno's query only ever ranks chunks from materials attached to a class
 * they're enrolled in (0012/0013). No extra filtering needed here.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Não autenticado." }), { status: 401 });

  let body: { conversationId?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Requisição inválida." }), { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) return new Response(JSON.stringify({ error: "Mensagem vazia." }), { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) return new Response(JSON.stringify({ error: "Perfil não encontrado." }), { status: 500 });

  try {
    await checkQuota(profile.tenant_id);
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return new Response(JSON.stringify({ error: err.message }), { status: 402 });
    }
    throw err;
  }

  let conversationId = body.conversationId;
  if (!conversationId) {
    const { data: conv, error: convErr } = await supabase
      .from("tutor_conversations")
      .insert({ tenant_id: profile.tenant_id, student_id: user.id, title: message.slice(0, 60) })
      .select("id")
      .single();
    if (convErr || !conv) {
      return new Response(JSON.stringify({ error: "Não foi possível iniciar a conversa." }), { status: 500 });
    }
    conversationId = conv.id;
  }

  const { error: userMsgErr } = await supabase
    .from("tutor_messages")
    .insert({ conversation_id: conversationId, role: "user", content: message });
  if (userMsgErr) {
    return new Response(JSON.stringify({ error: `Não foi possível salvar a mensagem: ${userMsgErr.message}` }), { status: 500 });
  }

  const { data: history } = await supabase
    .from("tutor_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at");

  const provider = getAIProvider();
  const [queryEmbedding] = await provider.embed({ texts: [message] });
  const { data: matches } = await supabase.rpc("search_material_chunks", {
    p_query_embedding: `[${queryEmbedding.join(",")}]`,
    p_match_count: 4,
  });
  const context = (matches ?? []).map((m: { content: string }) => m.content).join("\n---\n");

  const chatMessages = (history ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const encoder = new TextEncoder();
  let fullText = "";
  // Narrowing of the outer `let` doesn't survive the awaits above (TS
  // control-flow limitation, not a real nullability risk) — by this point
  // conversationId is always set: either passed in, or assigned from the
  // insert above (which early-returns on failure).
  const finalConversationId = conversationId as string;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const token of provider.streamChat({ messages: chatMessages, context })) {
          fullText += token;
          controller.enqueue(encoder.encode(token));
        }
      } finally {
        controller.close();
        await supabase.from("tutor_messages").insert({ conversation_id: finalConversationId, role: "assistant", content: fullText });
        await supabase.from("tutor_conversations").update({ updated_at: new Date().toISOString() }).eq("id", finalConversationId);

        await logAIUsage({
          tenantId: profile!.tenant_id,
          userId: user.id,
          feature: "TUTOR",
          provider: provider.id,
          input: { message },
          output: { response: fullText },
          tokensIn: 0,
          tokensOut: 0,
        });
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Conversation-Id": finalConversationId,
    },
  });
}
