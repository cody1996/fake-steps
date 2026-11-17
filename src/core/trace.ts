import { mulberry32 } from './random';

export interface Trace {
  /** SVG path（viewBox 0 0 100 78） */
  d: string;
  start: [number, number];
  end: [number, number];
  mid: [number, number];
}

const W = 100;
const H = 78;

/**
 * 随机生成一条「跑步轨迹」：从左侧出发、向右上/下随机游走，再平滑成贝塞尔曲线。
 * 同一天同 seed 结果稳定，看起来像一条真实的路线。
 */
export function makeTrace(seed: number): Trace {
  const rand = mulberry32(seed >>> 0);
  const count = 6 + Math.floor(rand() * 3);
  const pts: [number, number][] = [];

  let y = 52 + rand() * 16;
  let x = 6 + rand() * 6;
  pts.push([x, y]);

  for (let i = 1; i <= count; i += 1) {
    x += 9 + rand() * 10;
    y += (rand() - 0.45) * 40;
    y = Math.max(8, Math.min(H - 10, y));
    pts.push([x, y]);
  }

  // 缩放到画布内
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const sx = (W - 14) / Math.max(1, maxX - minX);
  const sy = (H - 16) / Math.max(1, maxY - minY);
  const s = Math.min(sx, sy);
  const dx = 7 - minX * s;
  const dy = 8 - minY * s;
  const scaled = pts.map(([px, py]) => [px * s + dx, py * s + dy] as [number, number]);

  // 用中点二次贝塞尔把折线磨圆
  let d = `M${scaled[0][0].toFixed(1)} ${scaled[0][1].toFixed(1)}`;
  for (let i = 1; i < scaled.length - 1; i += 1) {
    const [cx, cy] = scaled[i];
    const [nx, ny] = scaled[i + 1];
    const mx = (cx + nx) / 2;
    const my = (cy + ny) / 2;
    d += ` Q${cx.toFixed(1)} ${cy.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const last = scaled[scaled.length - 1];
  d += ` L${last[0].toFixed(1)} ${last[1].toFixed(1)}`;

  return {
    d,
    start: scaled[0],
    end: last,
    mid: scaled[Math.floor(scaled.length / 2)],
  };
}
