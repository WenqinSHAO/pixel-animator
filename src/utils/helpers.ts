/**
 * Utility functions for the pixel animator.
 */

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function roundTo(n: number, decimals = 2): number {
  const p = Math.pow(10, decimals);
  return Math.round(n * p) / p;
}

/**
 * Convert 2D coordinates to 1D array index.
 */
export function xyToIndex(x: number, y: number, width: number): number {
  return y * width + x;
}
