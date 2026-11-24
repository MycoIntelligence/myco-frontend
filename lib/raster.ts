export class RasterGrid {
  width: number;
  height: number;
  private grid: string[][];

  constructor(width: number, height: number, defaultChar = ".") {
    this.width = width;
    this.height = height;
    this.grid = Array.from({ length: height }, () => Array(width).fill(defaultChar));
  }

  plot(x: number, y: number, ch: string) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || ix >= this.width || iy < 0 || iy >= this.height) return;
    const current = this.grid[iy][ix];
    if (current === "#" && ch === "+") return;
    this.grid[iy][ix] = ch;
  }

  line(x0: number, y0: number, x1: number, y1: number, ch: string) {
    let ix0 = Math.round(x0);
    let iy0 = Math.round(y0);
    const ix1 = Math.round(x1);
    const iy1 = Math.round(y1);

    const dx = Math.abs(ix1 - ix0);
    const dy = Math.abs(iy1 - iy0);
    const sx = ix0 < ix1 ? 1 : -1;
    const sy = iy0 < iy1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      this.plot(ix0, iy0, ch);
      if (ix0 === ix1 && iy0 === iy1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        ix0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        iy0 += sy;
      }
    }
  }

  rect(x: number, y: number, w: number, h: number, ch: string, fill = false) {
    const rx = Math.round(x);
    const ry = Math.round(y);
    const rw = Math.round(w);
    const rh = Math.round(h);

    if (fill) {
      for (let j = ry; j < ry + rh; j++) {
        for (let i = rx; i < rx + rw; i++) {
          this.plot(i, j, ch);
        }
      }
    } else {
      for (let i = rx; i < rx + rw; i++) {
        this.plot(i, ry, ch);
        this.plot(i, ry + rh - 1, ch);
      }
      for (let j = ry; j < ry + rh; j++) {
        this.plot(rx, j, ch);
        this.plot(rx + rw - 1, j, ch);
      }
    }
  }

  polyline(points: [number, number][], ch: string) {
    for (let i = 0; i < points.length - 1; i++) {
      this.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], ch);
    }
  }

  polygon(points: [number, number][], ch: string) {
    if (points.length < 2) return;
    this.polyline(points, ch);
    this.line(
      points[points.length - 1][0],
      points[points.length - 1][1],
      points[0][0],
      points[0][1],
      ch
    );
  }

  circle(cx: number, cy: number, r: number, ch: string) {
    let x = 0;
    let y = Math.round(r);
    let d = 3 - 2 * y;

    const plot8 = (xc: number, yc: number, px: number, py: number) => {
      this.plot(xc + px, yc + py, ch);
      this.plot(xc - px, yc + py, ch);
      this.plot(xc + px, yc - py, ch);
      this.plot(xc - px, yc - py, ch);
      this.plot(xc + py, yc + px, ch);
      this.plot(xc - py, yc + px, ch);
      this.plot(xc + py, yc - px, ch);
      this.plot(xc - py, yc - px, ch);
    };

    plot8(Math.round(cx), Math.round(cy), x, y);

    while (y >= x) {
      x++;
      if (d > 0) {
        y--;
        d = d + 4 * (x - y) + 10;
      } else {
        d = d + 4 * x + 6;
      }
      plot8(Math.round(cx), Math.round(cy), x, y);
    }
  }

  arc(cx: number, cy: number, r: number, a0deg: number, a1deg: number, ch: string) {
    let start = a0deg;
    let end = a1deg;
    if (end < start) end += 360;

    for (let deg = start; deg <= end; deg += 1) {
      const rad = (deg * Math.PI) / 180;
      const x = cx + r * Math.cos(rad);
      const y = cy + r * Math.sin(rad);
      this.plot(x, y, ch);
    }
  }

  arrowhead(x: number, y: number, angleDeg: number, ch: string) {
    const rad1 = ((angleDeg + 150) * Math.PI) / 180;
    const rad2 = ((angleDeg - 150) * Math.PI) / 180;

    const x1 = x + 3 * Math.cos(rad1);
    const y1 = y + 3 * Math.sin(rad1);
    const x2 = x + 3 * Math.cos(rad2);
    const y2 = y + 3 * Math.sin(rad2);

    this.line(x, y, x1, y1, ch);
    this.line(x, y, x2, y2, ch);
  }

  toRows(): string[] {
    return this.grid.map((row) => row.join(""));
  }
}

