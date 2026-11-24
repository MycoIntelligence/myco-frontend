export interface DashItem {
  id: number;
  width: number;
  x: number;
  y: number;
  opacity: number;
}

export const DIAGRAM_PRESETS: DashItem[][] = [
  // Preset 01: Scattered context ingestion
  [
    { id: 1, width: 48, x: 20, y: 30, opacity: 0.8 },
    { id: 2, width: 92, x: 80, y: 30, opacity: 0.5 },
    { id: 3, width: 64, x: 190, y: 30, opacity: 0.9 },
    { id: 4, width: 120, x: 30, y: 60, opacity: 0.4 },
    { id: 5, width: 50, x: 165, y: 60, opacity: 0.85 },
    { id: 6, width: 80, x: 230, y: 60, opacity: 0.6 },
    { id: 7, width: 140, x: 50, y: 90, opacity: 0.95 },
    { id: 8, width: 70, x: 205, y: 90, opacity: 0.5 },
    { id: 9, width: 45, x: 20, y: 120, opacity: 0.7 },
    { id: 10, width: 110, x: 80, y: 120, opacity: 0.85 },
    { id: 11, width: 60, x: 210, y: 120, opacity: 0.45 },
    { id: 12, width: 85, x: 40, y: 150, opacity: 0.75 },
    { id: 13, width: 130, x: 140, y: 150, opacity: 0.9 },
    { id: 14, width: 65, x: 30, y: 180, opacity: 0.6 },
    { id: 15, width: 95, x: 110, y: 180, opacity: 0.8 },
  ],
  // Preset 02: Structured dependency layers
  [
    { id: 1, width: 160, x: 80, y: 30, opacity: 0.9 },
    { id: 2, width: 40, x: 250, y: 30, opacity: 0.4 },
    { id: 3, width: 30, x: 30, y: 30, opacity: 0.3 },
    { id: 4, width: 180, x: 60, y: 60, opacity: 0.95 },
    { id: 5, width: 50, x: 250, y: 60, opacity: 0.6 },
    { id: 6, width: 20, x: 25, y: 60, opacity: 0.4 },
    { id: 7, width: 220, x: 45, y: 90, opacity: 1 },
    { id: 8, width: 35, x: 275, y: 90, opacity: 0.5 },
    { id: 9, width: 190, x: 55, y: 120, opacity: 0.95 },
    { id: 10, width: 45, x: 255, y: 120, opacity: 0.6 },
    { id: 11, width: 25, x: 20, y: 120, opacity: 0.35 },
    { id: 12, width: 150, x: 75, y: 150, opacity: 0.85 },
    { id: 13, width: 55, x: 235, y: 150, opacity: 0.5 },
    { id: 14, width: 110, x: 95, y: 180, opacity: 0.7 },
    { id: 15, width: 40, x: 215, y: 180, opacity: 0.4 },
  ],
  // Preset 03: Focused convergent signal
  [
    { id: 1, width: 35, x: 140, y: 30, opacity: 0.4 },
    { id: 2, width: 60, x: 130, y: 45, opacity: 0.5 },
    { id: 3, width: 90, x: 115, y: 60, opacity: 0.65 },
    { id: 4, width: 130, x: 95, y: 75, opacity: 0.8 },
    { id: 5, width: 180, x: 70, y: 90, opacity: 0.95 },
    { id: 6, width: 240, x: 40, y: 105, opacity: 1 },
    { id: 7, width: 280, x: 20, y: 120, opacity: 1 },
    { id: 8, width: 240, x: 40, y: 135, opacity: 1 },
    { id: 9, width: 180, x: 70, y: 150, opacity: 0.95 },
    { id: 10, width: 130, x: 95, y: 165, opacity: 0.8 },
    { id: 11, width: 90, x: 115, y: 180, opacity: 0.65 },
    { id: 12, width: 60, x: 130, y: 195, opacity: 0.5 },
    { id: 13, width: 35, x: 140, y: 210, opacity: 0.4 },
    { id: 14, width: 20, x: 150, y: 225, opacity: 0.3 },
    { id: 15, width: 12, x: 154, y: 240, opacity: 0.2 },
  ],
];

