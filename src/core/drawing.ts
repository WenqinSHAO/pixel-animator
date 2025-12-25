/**
 * Drawing tools: pencil, eraser, and soft brush implementations.
 */

import type { Frame, Tool } from '../types';
import { W, H } from './config';
import { xyToIndex, clamp } from '../utils/helpers';

/**
 * Draw a dot (square brush) at the given position.
 */
export function drawDot(
  frameArr: Frame,
  x: number,
  y: number,
  value: number,
  size: number,
  activeStrokeMap: Map<number, number> | null
): void {
  const s = Math.max(1, size | 0);
  const start = -Math.floor(s / 2);
  const end = start + s - 1;
  
  for (let dy = start; dy <= end; dy++) {
    for (let dx = start; dx <= end; dx++) {
      const xx = x + dx;
      const yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      
      const idx = xyToIndex(xx, yy, W);
      
      if (activeStrokeMap && !activeStrokeMap.has(idx)) {
        activeStrokeMap.set(idx, frameArr[idx]);
      }
      frameArr[idx] = value;
    }
  }
}

/**
 * Draw a line using Bresenham's algorithm.
 */
export function drawLine(
  frameArr: Frame,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  value: number,
  size: number,
  activeStrokeMap: Map<number, number> | null
): void {
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  
  // eslint-disable-next-line no-constant-condition
  while (true) {
    drawDot(frameArr, x0, y0, value, size, activeStrokeMap);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

/**
 * Draw a soft (blended) dot with radial falloff.
 */
export function drawSoftDot(
  frameArr: Frame,
  x: number,
  y: number,
  value: number,
  size: number,
  activeStrokeMap: Map<number, number> | null
): void {
  const s = Math.max(1, size | 0);
  const start = -Math.floor(s / 2);
  const end = start + s - 1;
  const radius = Math.max(0.5, s / 2);

  for (let dy = start; dy <= end; dy++) {
    for (let dx = start; dx <= end; dx++) {
      const xx = x + dx;
      const yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      
      const idx = xyToIndex(xx, yy, W);
      const dist = Math.hypot(dx, dy);
      let alpha = 1 - dist / radius;
      if (radius === 0) alpha = 1;
      alpha = clamp(alpha, 0, 1);
      // Slight gamma to soften edges
      alpha = Math.pow(alpha, 1.2);

      const prev = frameArr[idx];
      const blended = Math.round(prev * (1 - alpha) + value * alpha);
      
      if (activeStrokeMap && !activeStrokeMap.has(idx)) {
        activeStrokeMap.set(idx, prev);
      }
      frameArr[idx] = blended;
    }
  }
}

/**
 * Draw a soft line.
 */
export function drawLineSoft(
  frameArr: Frame,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  value: number,
  size: number,
  activeStrokeMap: Map<number, number> | null
): void {
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  
  // eslint-disable-next-line no-constant-condition
  while (true) {
    drawSoftDot(frameArr, x0, y0, value, size, activeStrokeMap);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

/**
 * Apply a stroke using the selected tool.
 */
export function applyStroke(
  frameArr: Frame,
  tool: Tool,
  from: { x: number; y: number } | null,
  to: { x: number; y: number },
  gray: number,
  brush: number,
  activeStrokeMap: Map<number, number> | null
): void {
  const value = tool === 'eraser' ? 255 : gray;

  if (tool === 'soft') {
    if (!from) {
      drawSoftDot(frameArr, to.x, to.y, value, brush, activeStrokeMap);
    } else {
      drawLineSoft(frameArr, from.x, from.y, to.x, to.y, value, brush, activeStrokeMap);
    }
  } else {
    if (!from) {
      drawDot(frameArr, to.x, to.y, value, brush, activeStrokeMap);
    } else {
      drawLine(frameArr, from.x, from.y, to.x, to.y, value, brush, activeStrokeMap);
    }
  }
}
