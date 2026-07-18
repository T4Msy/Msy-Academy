import { describe, expect, it } from "vitest";
import { MARKERS, MAX_QUESTIONS_PER_SHEET, PAGE_HEIGHT_PT, bubbleBox, markerCenters } from "./layout";

describe("gabarito layout", () => {
  it("keeps every printable bubble above the bottom alignment markers", () => {
    const lastBubble = bubbleBox(MAX_QUESTIONS_PER_SHEET - 1, 4);
    expect(lastBubble.y + lastBubble.size).toBeLessThan(MARKERS.bottomLeft.y - 20);
  });

  it("uses four distinct corner centers for QR and alignment markers", () => {
    const centers = markerCenters();
    expect(new Set(centers.map((center) => `${center.x}:${center.y}`)).size).toBe(4);
    expect(centers.every((center) => center.y >= 0 && center.y <= PAGE_HEIGHT_PT)).toBe(true);
  });
});
