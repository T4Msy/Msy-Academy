"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { uploadScan } from "./actions";

type CaptureState = "idle" | "starting" | "live" | "denied" | "unsupported";
type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "error"; message: string }
  | { status: "done"; scanId: string; needsReview: boolean };

/**
 * Live camera viewfinder for photographing filled answer sheets — plain
 * getUserMedia + <video>/<canvas>, no library needed. The camera is only
 * for framing/capture: one JPEG frame is grabbed per tap and uploaded via
 * uploadScan(); all the real image processing (QR/marker detection) runs
 * server-side afterward (lib/omr/process.ts), not here.
 *
 * Supports scanning a whole stack of sheets in one sitting: after each
 * successful upload the viewfinder just resets for the next capture,
 * tracking a running count for this session.
 */
export function ScanCaptureView({ assignmentId }: { assignmentId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const [scannedCount, setScannedCount] = useState(0);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCaptureState("unsupported");
      return;
    }
    setCaptureState("starting");
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCaptureState("live");
      })
      .catch(() => setCaptureState("denied"));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function onCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) {
      setUploadState({ status: "error", message: "Não foi possível capturar a foto. Tente novamente." });
      return;
    }

    setUploadState({ status: "uploading" });
    try {
      const formData = new FormData();
      formData.set("photo", new File([blob], "scan.jpg", { type: "image/jpeg" }));
      const { scanId, status } = await uploadScan(assignmentId, formData);
      setUploadState({ status: "done", scanId, needsReview: status === "NEEDS_REVIEW" });
      setScannedCount((n) => n + 1);
    } catch (err) {
      setUploadState({ status: "error", message: err instanceof Error ? err.message : "Falha ao enviar a foto." });
    }
  }

  function onScanNext() {
    setUploadState({ status: "idle" });
  }

  return (
    <section className="card">
      <div className="card-body stack-md">
        {scannedCount > 0 && (
          <p className="field-hint mt-0">{scannedCount} cartão{scannedCount > 1 ? "ões" : ""} enviado{scannedCount > 1 ? "s" : ""} nesta sessão.</p>
        )}

        {captureState === "unsupported" && (
          <div className="notice notice--error">Este navegador não tem suporte a câmera. Tente em outro dispositivo.</div>
        )}
        {captureState === "denied" && (
          <div className="notice notice--error">
            Não foi possível acessar a câmera — verifique a permissão do navegador e recarregue a página.
          </div>
        )}

        {(captureState === "starting" || captureState === "live") && uploadState.status !== "done" && (
          <>
            <div className="scan-camera">
              <video ref={videoRef} autoPlay playsInline muted className="scan-video" />
              <div className="scan-overlay-frame" aria-hidden="true" />
            </div>
            <button
              type="button"
              className="scan-shutter"
              onClick={onCapture}
              disabled={captureState !== "live" || uploadState.status === "uploading"}
              aria-label="Capturar foto do cartão-resposta"
            >
              {uploadState.status === "uploading" ? <span className="btn-loader" /> : <span className="scan-shutter-dot" />}
            </button>
            <p className="field-hint text-center">Enquadre o cartão-resposta inteiro, com boa luz, e toque para capturar.</p>
          </>
        )}

        {uploadState.status === "error" && <div className="notice notice--error">{uploadState.message}</div>}

        {uploadState.status === "done" && uploadState.needsReview && (
          <div className="notice text-center stack-sm">
            <p className="text-strong mt-0">Cartão lido! Confira as respostas detectadas antes de confirmar.</p>
            <div className="inline-gap-sm justify-center">
              <Link href={`/professor/correcao/gabarito/${uploadState.scanId}`} className="btn btn-primary btn-sm">
                Revisar respostas
              </Link>
              <button type="button" className="btn btn-ghost btn-sm" onClick={onScanNext}>
                Escanear próximo cartão
              </button>
            </div>
          </div>
        )}

        {uploadState.status === "done" && !uploadState.needsReview && (
          <div className="notice notice--error text-center stack-sm">
            <p className="text-strong mt-0">Não foi possível ler este cartão automaticamente.</p>
            <p className="field-hint mt-0">Verifique a luz e o enquadramento e tente novamente.</p>
            <div className="inline-gap-sm justify-center">
              <button type="button" className="btn btn-primary btn-sm" onClick={onScanNext}>
                Tentar novamente
              </button>
              <Link href="/professor/correcao" className="btn btn-ghost btn-sm">
                Concluir
              </Link>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </section>
  );
}
