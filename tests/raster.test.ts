import { describe, it, expect } from "vitest";
import { RasterGrid } from "@/lib/raster";

describe("RasterGrid", () => {
  it("computes rectangle outline cell count accurately", () => {
    const grid = new RasterGrid(20, 20);
    // rect outline of 5x5: top (5), bottom (5), left (3 interior), right (3 interior) = 16 cells
    grid.rect(2, 2, 5, 5, "#", false);
    const rows = grid.toRows();
    const hashCount = rows.reduce(
      (acc, row) => acc + (row.match(/#/g) || []).length,
      0
    );
    expect(hashCount).toBe(16);
  });

  it("plots arc without crashing and sets cells", () => {
    const grid = new RasterGrid(32, 22);
    grid.arc(16, 11, 8, 20, 160, "#");
    const rows = grid.toRows();
    const hashCount = rows.reduce(
      (acc, row) => acc + (row.match(/#/g) || []).length,
      0
    );
    expect(hashCount).toBeGreaterThan(0);
  });

  it("prevents ghost character + from overwriting solid #", () => {
    const grid = new RasterGrid(10, 10);
    grid.plot(5, 5, "#");
    grid.plot(5, 5, "+");
    const rows = grid.toRows();
    expect(rows[5][5]).toBe("#");
  });
});

