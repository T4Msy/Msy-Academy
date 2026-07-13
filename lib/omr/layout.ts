/**
 * Single source of truth for the printed gabarito's geometry — every
 * coordinate here is in PDF points (1/72"), matching @react-pdf/renderer's
 * default unit on an A4 page. `lib/exam/export/gabaritoDocument.tsx` draws
 * from these constants; `lib/omr/process.ts` (the scan-reading pipeline)
 * expects the printed sheet to match them exactly — if either side changes
 * independently, detection silently breaks. Never hardcode a position in
 * either file; import it from here.
 *
 * Layout: A4 portrait, one QR code (top-left, encodes the answer_sheet id)
 * plus three plain black square markers (top-right, bottom-left,
 * bottom-right) as the other 3 corners of the perspective-correction
 * quadrilateral. A grid of question rows follows, each with 5 bubbles
 * (A-E) — every row always prints all 5 slots regardless of how many
 * options the question actually has, so the grid geometry never depends
 * on per-question data (a student bubbling a slot beyond the question's
 * real option count just can't ever match `correct_answer`).
 */

export const PAGE_WIDTH_PT = 595.28;
export const PAGE_HEIGHT_PT = 841.89;

export const MARGIN_PT = 28;
export const QR_SIZE_PT = 72;
export const MARKER_SIZE_PT = 28;

export const OPTION_LETTERS = ["A", "B", "C", "D", "E"] as const;
export type OptionLetter = (typeof OPTION_LETTERS)[number];

export const GRID_TOP_PT = 160;
export const ROW_HEIGHT_PT = 28;
export const BUBBLE_DIAMETER_PT = 14;
export const BUBBLE_GAP_PT = 30;
export const QUESTION_LABEL_X_PT = MARGIN_PT + 12;
export const GRID_START_X_PT = MARGIN_PT + 60;

/** Corner marker positions (top-left corner of each marker's bounding box). */
export const MARKERS = {
  qr: { x: MARGIN_PT, y: MARGIN_PT, size: QR_SIZE_PT },
  topRight: { x: PAGE_WIDTH_PT - MARGIN_PT - MARKER_SIZE_PT, y: MARGIN_PT, size: MARKER_SIZE_PT },
  bottomLeft: { x: MARGIN_PT, y: PAGE_HEIGHT_PT - MARGIN_PT - MARKER_SIZE_PT, size: MARKER_SIZE_PT },
  bottomRight: {
    x: PAGE_WIDTH_PT - MARGIN_PT - MARKER_SIZE_PT,
    y: PAGE_HEIGHT_PT - MARGIN_PT - MARKER_SIZE_PT,
    size: MARKER_SIZE_PT,
  },
} as const;

/** The 4 corners used as the homography destination (center of each marker), in a fixed order. */
export function markerCenters(): { x: number; y: number }[] {
  return [
    { x: MARKERS.qr.x + MARKERS.qr.size / 2, y: MARKERS.qr.y + MARKERS.qr.size / 2 },
    { x: MARKERS.topRight.x + MARKERS.topRight.size / 2, y: MARKERS.topRight.y + MARKERS.topRight.size / 2 },
    { x: MARKERS.bottomLeft.x + MARKERS.bottomLeft.size / 2, y: MARKERS.bottomLeft.y + MARKERS.bottomLeft.size / 2 },
    {
      x: MARKERS.bottomRight.x + MARKERS.bottomRight.size / 2,
      y: MARKERS.bottomRight.y + MARKERS.bottomRight.size / 2,
    },
  ];
}

/** Max rows that fit on one page before the grid would collide with the bottom markers. */
export const MAX_QUESTIONS_PER_SHEET = Math.floor(
  (MARKERS.bottomLeft.y - 24 - GRID_TOP_PT) / ROW_HEIGHT_PT,
);

/** Center of the bubble for a given question row (0-based) and option index (0=A .. 4=E). */
export function bubbleCenter(questionIndex: number, optionIndex: number): { x: number; y: number } {
  return {
    x: GRID_START_X_PT + optionIndex * BUBBLE_GAP_PT + BUBBLE_DIAMETER_PT / 2,
    y: GRID_TOP_PT + questionIndex * ROW_HEIGHT_PT + BUBBLE_DIAMETER_PT / 2,
  };
}

/** Top-left position for rendering the bubble as a fixed-size box (PDF drawing only). */
export function bubbleBox(questionIndex: number, optionIndex: number): { x: number; y: number; size: number } {
  const c = bubbleCenter(questionIndex, optionIndex);
  return { x: c.x - BUBBLE_DIAMETER_PT / 2, y: c.y - BUBBLE_DIAMETER_PT / 2, size: BUBBLE_DIAMETER_PT };
}
