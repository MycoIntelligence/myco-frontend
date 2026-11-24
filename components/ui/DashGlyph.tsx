import React from "react";

export type DashGlyphProps = {
  rows: string[];
  unit?: number; // dash height in px, default 8
  gap?: number; // gap between cells in px, default 4
  className?: string; // color comes from currentColor
  label?: string; // accessible name; omit to mark decorative
  stagger?: boolean; // row-by-row reveal using --i
};

export function DashGlyph({
  rows,
  unit = 8,
  gap = 4,
  className,
  label,
  stagger = false,
}: DashGlyphProps) {
  const cell = unit + gap;
  const cols = Math.max(...rows.map((r) => r.length), 1);
  const w = cols * cell - gap;
  const h = rows.length * cell - gap;
  const rects: React.ReactNode[] = [];

  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === ".") {
        x++;
        continue;
      }
      let end = x;
      while (end + 1 < row.length && row[end + 1] === ch) end++;
      const run = end - x + 1;
      rects.push(
        <rect
          key={`${y}-${x}`}
          x={x * cell}
          y={y * cell}
          width={run * cell - gap}
          height={unit}
          rx={unit / 2}
          opacity={ch === "+" ? 0.3 : 1}
          style={
            stagger
              ? ({ ["--i" as string]: y } as React.CSSProperties)
              : undefined
          }
          className={stagger ? "dash-row" : undefined}
        />
      );
      x = end + 1;
    }
  });

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      fill="currentColor"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className}
    >
      {rects}
    </svg>
  );
}

