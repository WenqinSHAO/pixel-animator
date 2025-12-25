/**
 * Undo/Redo system for managing drawing history per frame.
 */

import type { Frame, Delta } from '../types';
import { UNDO_LIMIT } from './config';

/**
 * Begin recording a new stroke.
 */
export function beginStroke(): Map<number, number> {
  return new Map();
}

/**
 * Commit the current stroke to the undo stack.
 */
export function commitStroke(
  activeStrokeMap: Map<number, number>,
  frameArr: Frame,
  undoStack: Delta[],
  redoStack: Delta[]
): void {
  if (activeStrokeMap.size === 0) {
    return;
  }

  const idxs = new Uint32Array(activeStrokeMap.size);
  const before = new Uint8Array(activeStrokeMap.size);
  const after = new Uint8Array(activeStrokeMap.size);

  let k = 0;
  for (const [idx, prev] of activeStrokeMap.entries()) {
    idxs[k] = idx;
    before[k] = prev;
    after[k] = frameArr[idx];
    k++;
  }

  undoStack.push({ idxs, before, after });
  if (undoStack.length > UNDO_LIMIT) undoStack.shift();

  redoStack.length = 0;
}

/**
 * Apply a delta (change set of pixels).
 */
export function applyDelta(frameArr: Frame, idxs: Uint32Array, values: Uint8Array): void {
  for (let i = 0; i < idxs.length; i++) {
    frameArr[idxs[i]] = values[i];
  }
}

/**
 * Undo the last action on the current frame.
 */
export function undo(
  frameArr: Frame,
  undoStack: Delta[],
  redoStack: Delta[]
): boolean {
  if (undoStack.length === 0) return false;

  const delta = undoStack.pop()!;
  applyDelta(frameArr, delta.idxs, delta.before);
  redoStack.push(delta);

  return true;
}

/**
 * Redo the last undone action on the current frame.
 */
export function redo(
  frameArr: Frame,
  undoStack: Delta[],
  redoStack: Delta[]
): boolean {
  if (redoStack.length === 0) return false;

  const delta = redoStack.pop()!;
  applyDelta(frameArr, delta.idxs, delta.after);
  undoStack.push(delta);
  if (undoStack.length > UNDO_LIMIT) undoStack.shift();

  return true;
}
