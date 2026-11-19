import { describe, it, expect } from "vitest";
import { composeDigits } from "@/lib/glyphs";

describe("Glyphs and DashGlyph run merging", () => {
  it("merges consecutive characters into single runs", () => {
    // Test row run merging algorithm:
    const row = ".###.";
    let x = 0;
    const runs: { start: number; length: number; ch: string }[] = [];

    while (x < row.length) {
      const ch = row[x];
      if (ch === ".") {
        x++;
        continue;
      }
      let end = x;
      while (end + 1 < row.length && row[end + 1] === ch) end++;
      const run = end - x + 1;
      runs.push({ start: x, length: run, ch });
      x = end + 1;
    }

    expect(runs.length).toBe(1);
    expect(runs[0].length).toBe(3);
    expect(runs[0].ch).toBe("#");
  });

  it("composes digit bitmaps correctly", () => {
    const rows = composeDigits("01");
    expect(rows.length).toBe(7);
    expect(rows[0].length).toBe(11); // 5 cols + 1 dot + 5 cols
    expect(rows[0]).toContain("#");
  });
});

