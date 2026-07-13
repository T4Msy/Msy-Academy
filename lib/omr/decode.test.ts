import { randomUUID } from "crypto";
import QRCode from "qrcode";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { applyHomography, computeHomography, decodeImageToPixels, locateAnswerSheet, readBubbleAnswers } from "./decode";
import { MARKERS, OPTION_LETTERS, PAGE_HEIGHT_PT, PAGE_WIDTH_PT, bubbleCenter } from "./layout";

const SCALE = 3; // px per pt — arbitrary "camera resolution" for the synthetic photo
const QUESTION_COUNT = 10;

/**
 * Builds a synthetic "photo" of a filled gabarito directly at pixel level
 * (QR + 3 square markers + bubble grid, some bubbles inked), optionally
 * rotated to simulate a photo not taken perfectly square-on. This exercises
 * the whole decode pipeline (QR read, marker localization, homography,
 * bubble-darkness reading) without needing a printer, a camera, or Supabase.
 */
async function buildSyntheticPhoto(answers: (string | null)[], rotationDegrees: number): Promise<{ sheetId: string; jpeg: Buffer }> {
  const sheetId = randomUUID();
  const W = Math.round(PAGE_WIDTH_PT * SCALE);
  const H = Math.round(PAGE_HEIGHT_PT * SCALE);

  let svgBubbles = "";
  for (let q = 0; q < answers.length; q += 1) {
    for (let o = 0; o < OPTION_LETTERS.length; o += 1) {
      const c = bubbleCenter(q, o);
      const filled = OPTION_LETTERS[o] === answers[q];
      svgBubbles += `<circle cx="${c.x * SCALE}" cy="${c.y * SCALE}" r="${6 * SCALE}" fill="${filled ? "black" : "none"}" stroke="black" stroke-width="${1 * SCALE}" />`;
    }
  }
  const svgMarkers = [MARKERS.topRight, MARKERS.bottomLeft, MARKERS.bottomRight]
    .map((m) => `<rect x="${m.x * SCALE}" y="${m.y * SCALE}" width="${m.size * SCALE}" height="${m.size * SCALE}" fill="black" />`)
    .join("");
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="white" />${svgMarkers}${svgBubbles}</svg>`;

  const qrPngBuffer = await QRCode.toBuffer(sheetId, { margin: 1, width: Math.round(MARKERS.qr.size * SCALE) });

  const composed = sharp(Buffer.from(svg)).composite([
    { input: qrPngBuffer, left: Math.round(MARKERS.qr.x * SCALE), top: Math.round(MARKERS.qr.y * SCALE) },
  ]);

  const jpeg = await composed
    .jpeg({ quality: 95 })
    .toBuffer()
    .then((buf) => sharp(buf).rotate(rotationDegrees, { background: "white" }).jpeg({ quality: 95 }).toBuffer());

  return { sheetId, jpeg };
}

/**
 * Warps a straight (undistorted) synthetic sheet image into a true keystone
 * perspective distortion — as opposed to the plain in-plane rotation used
 * elsewhere in this file — by mapping the page's 4 corners to a trapezoid
 * (simulating a camera held at an angle, top edge farther away) and
 * resampling every output pixel via the inverse homography. This exercises
 * the actual projective (not just similarity) part of the pipeline's math.
 */
async function applyPerspectiveWarp(straightJpeg: Buffer, width: number, height: number): Promise<Buffer> {
  const { data: srcPixels } = await sharp(straightJpeg).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const srcCorners = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: 0, y: height },
    { x: width, y: height },
  ];
  // Top edge compressed inward and shifted down, as if the camera looks
  // slightly upward at the sheet — a real keystone effect, not a rotation.
  const dstCorners = [
    { x: width * 0.06, y: height * 0.02 },
    { x: width * 0.94, y: 0 },
    { x: 0, y: height },
    { x: width, y: height * 0.98 },
  ];

  const dstToSrc = computeHomography(dstCorners, srcCorners);
  const outPixels = Buffer.alloc(width * height * 4, 255); // white background

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const src = applyHomography(dstToSrc, { x, y });
      const sx = Math.round(src.x);
      const sy = Math.round(src.y);
      if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
      const outIdx = (y * width + x) * 4;
      const srcIdx = (sy * width + sx) * 4;
      outPixels[outIdx] = srcPixels[srcIdx];
      outPixels[outIdx + 1] = srcPixels[srcIdx + 1];
      outPixels[outIdx + 2] = srcPixels[srcIdx + 2];
      outPixels[outIdx + 3] = 255;
    }
  }

  return sharp(outPixels, { raw: { width, height, channels: 4 } }).jpeg({ quality: 95 }).toBuffer();
}

describe("OMR decode pipeline (synthetic photo)", () => {
  it("reads QR id and all filled bubbles correctly, including a rotated photo", async () => {
    const expectedAnswers = Array.from({ length: QUESTION_COUNT }, (_, i) => OPTION_LETTERS[i % OPTION_LETTERS.length]);
    const { sheetId, jpeg } = await buildSyntheticPhoto(expectedAnswers, 12);

    const { pixels, width, height } = await decodeImageToPixels(jpeg);
    const located = locateAnswerSheet(pixels, width, height);
    expect(located.ok).toBe(true);
    if (!located.ok) return;
    expect(located.qrData).toBe(sheetId);

    const readings = readBubbleAnswers(pixels, width, height, located.homography, located.sampleRadius, QUESTION_COUNT);
    expect(readings.map((r) => r.letter)).toEqual(expectedAnswers);
  });

  it("leaves every question unanswered on a blank sheet (no false positives)", async () => {
    const blankAnswers: (string | null)[] = Array.from({ length: QUESTION_COUNT }, () => null);
    const { jpeg } = await buildSyntheticPhoto(blankAnswers, 0);

    const { pixels, width, height } = await decodeImageToPixels(jpeg);
    const located = locateAnswerSheet(pixels, width, height);
    expect(located.ok).toBe(true);
    if (!located.ok) return;

    const readings = readBubbleAnswers(pixels, width, height, located.homography, located.sampleRadius, QUESTION_COUNT);
    expect(readings.every((r) => r.letter === null)).toBe(true);
  });

  it("reads correctly under a true keystone perspective distortion (camera at an angle, not just rotated)", async () => {
    const expectedAnswers = Array.from({ length: QUESTION_COUNT }, (_, i) => OPTION_LETTERS[i % OPTION_LETTERS.length]);
    const { sheetId, jpeg: straightJpeg } = await buildSyntheticPhoto(expectedAnswers, 0);
    const W = Math.round(PAGE_WIDTH_PT * SCALE);
    const H = Math.round(PAGE_HEIGHT_PT * SCALE);

    const warpedJpeg = await applyPerspectiveWarp(straightJpeg, W, H);

    const { pixels, width, height } = await decodeImageToPixels(warpedJpeg);
    const located = locateAnswerSheet(pixels, width, height);
    expect(located.ok).toBe(true);
    if (!located.ok) return;
    expect(located.qrData).toBe(sheetId);

    const readings = readBubbleAnswers(pixels, width, height, located.homography, located.sampleRadius, QUESTION_COUNT);
    expect(readings.map((r) => r.letter)).toEqual(expectedAnswers);
  });
});
