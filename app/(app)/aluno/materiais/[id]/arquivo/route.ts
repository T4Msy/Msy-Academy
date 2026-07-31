import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

function getMimeType(path: string, kind: string) {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[extension] ?? (kind === "IMAGE" ? "image/*" : "application/pdf");
}

function getDownloadName(title: string, mimeType: string) {
  const safeTitle = title.replace(/[\\/:*?"<>|\r\n]+/g, "-").trim() || "material";
  const extension = mimeType === "application/pdf" ? "pdf" : mimeType.split("/")[1] ?? "bin";
  return `${safeTitle}.${extension}`;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: material, error: materialError } = await supabase
    .from("materials")
    .select("id, kind, title, storage_path, class_id")
    .eq("id", id)
    .eq("kind", "FILE")
    .not("class_id", "is", null)
    .maybeSingle();

  // The authenticated client applies the existing enrollment policies.
  if (materialError || !material?.storage_path || !material.class_id) {
    return NextResponse.json({ error: "Material não encontrado." }, { status: 404 });
  }

  const { data: file, error: downloadError } = await supabase.storage.from("materials").download(material.storage_path);
  if (downloadError || !file) {
    if (process.env.NODE_ENV === "development") {
      console.error("[student/materials/file] falha ao baixar material", { id, code: downloadError?.name });
    }
    return NextResponse.json({ error: "Não foi possível carregar o material." }, { status: 404 });
  }

  const mimeType = getMimeType(material.storage_path, material.kind);
  const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";

  if (process.env.NODE_ENV === "development") {
    console.debug("[student/material-viewer] arquivo pronto", {
      materialId: id,
      sourceUrl: request.url,
      responseUrl: request.url,
      redirected: false,
      status: 200,
      contentType: mimeType,
    });
  }

  return new NextResponse(file, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `${disposition}; filename="${getDownloadName(material.title, mimeType)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "frame-ancestors 'self'",
    },
  });
}
