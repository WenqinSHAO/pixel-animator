/**
 * Frame management: creating, manipulating, and managing animation frames.
 */

import type { Frame, Delta } from '../types';
import { W, H } from './config';

/**
 * Creates a blank white frame (all pixels set to 255).
 */
export function makeBlankFrame(): Frame {
  const a = new Uint8Array(W * H);
  a.fill(255);
  return a;
}

/**
 * Ensures undo/redo stacks match the frame count.
 */
export function ensureStacks(
  undoStacks: Delta[][],
  redoStacks: Delta[][],
  count: number
): void {
  while (undoStacks.length < count) undoStacks.push([]);
  while (redoStacks.length < count) redoStacks.push([]);
  if (undoStacks.length > count) undoStacks.length = count;
  if (redoStacks.length > count) redoStacks.length = count;
}
