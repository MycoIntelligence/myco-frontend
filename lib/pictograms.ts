import { RasterGrid } from "./raster";

export function createServicesAndSchedulers(): string[] {
  const g = new RasterGrid(32, 22);
  g.rect(2, 3, 11, 10, "#", false);
  g.rect(19, 3, 11, 10, "#", false);
  g.rect(6, 6, 3, 3, "#", true);
  g.rect(23, 6, 3, 3, "#", true);
  g.line(13, 8, 19, 8, "+");
  g.line(3, 16, 12, 16, "#");
  g.line(20, 16, 29, 16, "#");
  g.line(7, 19, 25, 19, "+");
  return g.toRows();
}

export function createFailurePaths(): string[] {
  const g = new RasterGrid(32, 22);
  g.polyline(
    [
      [2, 11],
      [10, 11],
      [10, 5],
      [19, 5],
      [19, 11],
      [30, 11],
    ],
    "#"
  );
  g.polyline(
    [
      [19, 11],
      [19, 18],
      [27, 18],
    ],
    "+"
  );

  const nodes: [number, number][] = [
    [10, 11],
    [10, 5],
    [19, 5],
    [19, 11],
    [30, 11],
  ];
  for (const [nx, ny] of nodes) {
    g.rect(nx - 1, ny - 1, 3, 3, "#", true);
  }
  return g.toRows();
}

export function createPredictBeforeRelease(): string[] {
  const g = new RasterGrid(32, 22);
  g.circle(12, 11, 8, "#");
  g.line(12, 11, 12, 5, "#");
  g.line(12, 11, 17, 13, "#");
  g.polyline(
    [
      [23, 6],
      [28, 11],
      [23, 16],
    ],
    "+"
  );
  g.polyline(
    [
      [26, 6],
      [31, 11],
      [26, 16],
    ],
    "+"
  );
  return g.toRows();
}

export function createVerifiedFindings(): string[] {
  const g = new RasterGrid(32, 22);
  g.polygon(
    [
      [16, 1],
      [27, 4],
      [27, 12],
      [16, 21],
      [5, 12],
      [5, 4],
    ],
    "#"
  );
  g.polyline(
    [
      [11, 11],
      [15, 15],
      [22, 8],
    ],
    "#"
  );
  g.line(8, 21, 24, 21, "+");
  return g.toRows();
}

export function createLearningLoop(): string[] {
  const g = new RasterGrid(32, 22);
  g.circle(16, 11, 10, "+");
  g.arc(16, 11, 8, 200, 340, "#");
  g.arc(16, 11, 8, 20, 160, "#");

  const rad1 = (340 * Math.PI) / 180;
  const x1 = 16 + 8 * Math.cos(rad1);
  const y1 = 11 + 8 * Math.sin(rad1);
  g.arrowhead(x1, y1, 70, "#");

  const rad2 = (160 * Math.PI) / 180;
  const x2 = 16 + 8 * Math.cos(rad2);
  const y2 = 11 + 8 * Math.sin(rad2);
  g.arrowhead(x2, y2, 250, "#");

  g.rect(15, 10, 2, 2, "#", true);
  return g.toRows();
}

export const PICTOGRAMS: Record<string, string[]> = {
  "services-and-schedulers": createServicesAndSchedulers(),
  "failure-paths": createFailurePaths(),
  "predict-before-release": createPredictBeforeRelease(),
  "verified-findings": createVerifiedFindings(),
  "learning-loop": createLearningLoop(),
};

