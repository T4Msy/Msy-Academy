import jsQR from "jsqr";
import sharp from "sharp";
import { MARKERS, OPTION_LETTERS, bubbleCenter, markerCenters } from "./layout";

export type Point = { x: number; y: number };

export type DecodedPixels = { pixels: Uint8ClampedArray; width: number; height: number };

/**
 * Decodes an arbitrary image buffer (JPEG/PNG/etc, including with EXIF
 * orientation) into raw RGBA pixels — the only place sharp is used in the
 * OMR pipeline, kept separate so the geometry/CV code below can be unit
 * tested against pixels built any way (including synthetic test images)
 * without needing sharp at all.
 */
export async function decodeImageToPixels(imageBuffer: Buffer): Promise<DecodedPixels> {
  const { data, info } = await sharp(imageBuffer).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return {
    pixels: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
    width: info.width,
    height: info.height,
  };
}

export type LocateResult =
  | { ok: true; qrData: string; homography: Homography; sampleRadius: number }
  | { ok: false; error: string };

/**
 * Pure computer-vision step: finds the QR code and the 3 corner markers in
 * a decoded photo and derives the perspective transform (homography) back
 * to the printed template's coordinate space. No Supabase/IO here — only
 * pixels in, geometry out — so it can be exercised directly against a
 * synthetic test image.
 *
 * HONESTY NOTE: QR decoding (jsqr) and the homography math are solved,
 * well-trodden problems. Locating the 3 plain square markers under real
 * lighting/photo conditions is NOT — no library does this for us, and the
 * "largest dark region within a search window" approach below is a
 * deliberately simple heuristic, not a robust computer-vision algorithm.
 * Expect this to need real tuning (marker size/contrast, search window,
 * ink threshold) once tested against actual printed-and-photographed
 * sheets.
 */
export function locateAnswerSheet(pixels: Uint8ClampedArray, width: number, height: number): LocateResult {
  const qrResult = jsQR(pixels, width, height);
  if (!qrResult) return { ok: false, error: "Não foi possível ler o QR code na foto — tente com mais luz e o cartão mais reto." };

  const qrCenter: Point = averagePoint([
    qrResult.location.topLeftCorner,
    qrResult.location.topRightCorner,
    qrResult.location.bottomLeftCorner,
    qrResult.location.bottomRightCorner,
  ]);

  // Coarse similarity transform (rotation + scale + translation) derived
  // from the QR alone, to predict roughly where the other 3 markers should
  // be — refined below by an actual local search, not trusted as final.
  const templateQrTopLeft = { x: MARKERS.qr.x, y: MARKERS.qr.y };
  const templateQrTopRight = { x: MARKERS.qr.x + MARKERS.qr.size, y: MARKERS.qr.y };
  const photoQrTopLeft = qrResult.location.topLeftCorner;
  const photoQrTopRight = qrResult.location.topRightCorner;

  const templateVec = { x: templateQrTopRight.x - templateQrTopLeft.x, y: templateQrTopRight.y - templateQrTopLeft.y };
  const photoVec = { x: photoQrTopRight.x - photoQrTopLeft.x, y: photoQrTopRight.y - photoQrTopLeft.y };
  const scale = Math.hypot(photoVec.x, photoVec.y) / Math.hypot(templateVec.x, templateVec.y);
  const angle = Math.atan2(photoVec.y, photoVec.x) - Math.atan2(templateVec.y, templateVec.x);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  function estimatePhotoPoint(templatePoint: Point): Point {
    const dx = templatePoint.x - templateQrTopLeft.x;
    const dy = templatePoint.y - templateQrTopLeft.y;
    return {
      x: photoQrTopLeft.x + scale * (cos * dx - sin * dy),
      y: photoQrTopLeft.y + scale * (sin * dx + cos * dy),
    };
  }

  const templateCenters = markerCenters(); // [qr, topRight, bottomLeft, bottomRight] in template pt space
  const baseRadius = Math.max(24, scale * MARKERS.topRight.size * 1.8);

  // The similarity transform above is derived only from the QR's own
  // orientation — it's a good local estimate near the QR, but a real photo
  // (unlike a pure in-plane rotation) has genuine perspective skew that
  // this similarity model can't capture, so the estimate's error grows
  // with distance from the QR anchor. Scale the search radius accordingly
  // instead of using one fixed size for every corner.
  function searchRadiusFor(templatePoint: Point): number {
    const templateDistance = distance(templateCenters[0], templatePoint);
    return Math.max(baseRadius, templateDistance * scale * 0.25);
  }

  const topRight = findDarkBlobCentroid(pixels, width, height, estimatePhotoPoint(templateCenters[1]), searchRadiusFor(templateCenters[1]));
  const bottomLeft = findDarkBlobCentroid(pixels, width, height, estimatePhotoPoint(templateCenters[2]), searchRadiusFor(templateCenters[2]));
  const bottomRight = findDarkBlobCentroid(pixels, width, height, estimatePhotoPoint(templateCenters[3]), searchRadiusFor(templateCenters[3]));
  if (!topRight || !bottomLeft || !bottomRight) {
    return { ok: false, error: "Não foi possível localizar os marcadores dos cantos — tente uma foto mais nítida, com o cartão inteiro visível." };
  }

  const photoPoints = [qrCenter, topRight, bottomLeft, bottomRight];
  const homography = computeHomography(templateCenters, photoPoints);

  // Approximate photo-space spacing between adjacent bubbles, to size the
  // ink-sampling window relative to this specific photo's resolution.
  const bubbleSpacingPhoto = distance(applyHomography(homography, bubbleCenter(0, 0)), applyHomography(homography, bubbleCenter(0, 1)));
  const sampleRadius = Math.max(3, bubbleSpacingPhoto * 0.32);

  return { ok: true, qrData: qrResult.data.trim(), homography, sampleRadius };
}

export type BubbleReading = { letter: string | null; confidence: number };

/**
 * Reads one filled-in answer per question row by sampling ink darkness at
 * each of the 5 bubble positions (transformed into photo space via the
 * homography) and picking the darkest one, provided it's clearly darker
 * than the others — otherwise leaves the question unanswered rather than
 * guessing, letting the review screen surface it for the teacher.
 */
export function readBubbleAnswers(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  homography: Homography,
  sampleRadius: number,
  questionCount: number,
): BubbleReading[] {
  const results: BubbleReading[] = [];
  for (let questionIndex = 0; questionIndex < questionCount; questionIndex += 1) {
    const darknesses = OPTION_LETTERS.map((_, optionIndex) => {
      const photoPoint = applyHomography(homography, bubbleCenter(questionIndex, optionIndex));
      return sampleDarkness(pixels, width, height, photoPoint, sampleRadius);
    });
    const maxDarkness = Math.max(...darknesses);
    const sorted = [...darknesses].sort((a, b) => b - a);
    const margin = sorted[0] - sorted[1];
    const bestIndex = darknesses.indexOf(maxDarkness);

    const letter = maxDarkness > 60 && margin > 25 ? OPTION_LETTERS[bestIndex] : null;
    results.push({ letter, confidence: margin });
  }
  return results;
}

function averagePoint(points: Point[]): Point {
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
  };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function luminanceAt(pixels: Uint8ClampedArray, width: number, height: number, x: number, y: number): number | null {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi < 0 || yi < 0 || xi >= width || yi >= height) return null;
  const i = (yi * width + xi) * 4;
  // Standard luma weights; alpha ignored (photos are always opaque).
  return 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
}

/**
 * Finds the centroid of the LARGEST connected dark region inside a square
 * window around `center` (4-connected flood fill over thresholded pixels).
 * A wide search window (needed to tolerate a perspective estimate's error
 * growing with distance from the QR anchor) can easily contain more than
 * one dark thing — a corner marker plus a stray bubble, say — so picking
 * the biggest contiguous blob, rather than a global darkness-weighted
 * centroid, keeps a bubble's small ink mass from pulling the result away
 * from the actual (much larger, solid) marker. Returns null if nothing
 * dark enough is found (photo too bright/blurry, or the estimate missed).
 */
function findDarkBlobCentroid(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  center: Point,
  radius: number,
): Point | null {
  const threshold = 110; // luminance 0-255; a black-ink marker on white paper sits well below this

  const minX = Math.max(0, Math.floor(center.x - radius));
  const maxX = Math.min(width - 1, Math.ceil(center.x + radius));
  const minY = Math.max(0, Math.floor(center.y - radius));
  const maxY = Math.min(height - 1, Math.ceil(center.y + radius));
  const winWidth = maxX - minX + 1;
  const winHeight = maxY - minY + 1;
  if (winWidth <= 0 || winHeight <= 0) return null;

  const isDark = new Uint8Array(winWidth * winHeight);
  for (let y = 0; y < winHeight; y += 1) {
    for (let x = 0; x < winWidth; x += 1) {
      const lum = luminanceAt(pixels, width, height, minX + x, minY + y);
      isDark[y * winWidth + x] = lum !== null && lum < threshold ? 1 : 0;
    }
  }

  const visited = new Uint8Array(winWidth * winHeight);
  let best: { count: number; sumX: number; sumY: number } | null = null;
  const stack: number[] = [];

  for (let start = 0; start < isDark.length; start += 1) {
    if (!isDark[start] || visited[start]) continue;

    let count = 0;
    let sumX = 0;
    let sumY = 0;
    stack.length = 0;
    stack.push(start);
    visited[start] = 1;

    while (stack.length > 0) {
      const idx = stack.pop() as number;
      const x = idx % winWidth;
      const y = Math.floor(idx / winWidth);
      count += 1;
      sumX += x;
      sumY += y;

      const neighbors = [idx - 1, idx + 1, idx - winWidth, idx + winWidth];
      for (const n of neighbors) {
        if (n < 0 || n >= isDark.length) continue;
        if (n % winWidth === 0 && idx % winWidth === winWidth - 1) continue; // wrapped row edge (left)
        if (idx % winWidth === 0 && n % winWidth === winWidth - 1) continue; // wrapped row edge (right)
        if (!isDark[n] || visited[n]) continue;
        visited[n] = 1;
        stack.push(n);
      }
    }

    if (!best || count > best.count) best = { count, sumX, sumY };
  }

  if (!best) return null;
  return { x: minX + best.sumX / best.count, y: minY + best.sumY / best.count };
}

/** Average darkness (255 - luminance, higher = darker) in a small window — used to score bubble fill. */
function sampleDarkness(pixels: Uint8ClampedArray, width: number, height: number, center: Point, radius: number): number {
  let sum = 0;
  let count = 0;
  const minX = Math.max(0, Math.floor(center.x - radius));
  const maxX = Math.min(width - 1, Math.ceil(center.x + radius));
  const minY = Math.max(0, Math.floor(center.y - radius));
  const maxY = Math.min(height - 1, Math.ceil(center.y + radius));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const lum = luminanceAt(pixels, width, height, x, y);
      if (lum === null) continue;
      sum += 255 - lum;
      count += 1;
    }
  }
  return count === 0 ? 0 : sum / count;
}

/**
 * 3x3 projective transform (homography) mapping `from` points to `to`
 * points, via the standard 4-point direct linear transform (DLT) — solves
 * an 8x8 linear system for h11..h32 (h33 fixed to 1). Well-documented,
 * textbook computer vision; not the risky part of this file.
 */
export type Homography = number[]; // [h11,h12,h13,h21,h22,h23,h31,h32], h33=1

/** Exported for tests that need to build a synthetic perspective-warped image (see decode.test.ts). */
export function computeHomography(from: Point[], to: Point[]): Homography {
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i += 1) {
    const { x, y } = from[i];
    const { x: u, y: v } = to[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  return solveLinearSystem(A, b);
}

/** Gaussian elimination with partial pivoting for an 8x8 system. */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col += 1) {
    let pivotRow = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivotRow][col])) pivotRow = row;
    }
    [M[col], M[pivotRow]] = [M[pivotRow], M[col]];

    const pivot = M[col][col];
    if (Math.abs(pivot) < 1e-12) continue; // degenerate — leave as best-effort
    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = M[row][col] / pivot;
      for (let k = col; k <= n; k += 1) M[row][k] -= factor * M[col][k];
    }
  }

  return M.map((row, i) => row[n] / (row[i] || 1));
}

export function applyHomography(H: Homography, point: Point): Point {
  const [h11, h12, h13, h21, h22, h23, h31, h32] = H;
  const denominator = h31 * point.x + h32 * point.y + 1;
  return {
    x: (h11 * point.x + h12 * point.y + h13) / denominator,
    y: (h21 * point.x + h22 * point.y + h23) / denominator,
  };
}
