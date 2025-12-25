/**
 * Main application state manager and controller.
 */

import type { AppState, Frame, Delta, Tool, Point } from '../types';
import { W, H, MAX_FRAMES } from './config';
import { makeBlankFrame, ensureStacks } from './frame';
import { clamp } from '../utils/helpers';
import { notify } from '../utils/toast';

/**
 * Create initial application state.
 */
export function createInitialState(): AppState {
  const frames: Frame[] = Array.from({ length: 12 }, () => makeBlankFrame());
  const undoStacks: Delta[][] = [];
  const redoStacks: Delta[][] = [];
  ensureStacks(undoStacks, redoStacks, frames.length);

  return {
    frames,
    undoStacks,
    redoStacks,
    current: 0,
    isPlaying: false,
    tool: 'pencil',
    brush: 1,
    gray: 0,
    onionDepth: 5,
    drawing: false,
    lastPt: null,
    activeStrokeMap: null
  };
}

/**
 * Set the current frame index.
 */
export function setCurrent(state: AppState, idx: number): void {
  state.current = clamp(idx, 0, state.frames.length - 1);
}

/**
 * Set the current drawing tool.
 */
export function setTool(state: AppState, tool: Tool): void {
  state.tool = tool;
}

/**
 * Insert a new frame after the specified index.
 */
export function insertFrame(
  state: AppState,
  afterIndex: number,
  sourceFrame: Frame | null
): void {
  if (state.isPlaying) return;
  if (state.frames.length >= MAX_FRAMES) {
    notify(`Max frames reached (${MAX_FRAMES}).`);
    return;
  }

  const insertAt = clamp(afterIndex + 1, 0, state.frames.length);

  const newFrame = makeBlankFrame();
  if (sourceFrame instanceof Uint8Array) {
    newFrame.set(sourceFrame);
  }

  state.frames.splice(insertAt, 0, newFrame);
  state.undoStacks.splice(insertAt, 0, []);
  state.redoStacks.splice(insertAt, 0, []);
  ensureStacks(state.undoStacks, state.redoStacks, state.frames.length);

  state.current = insertAt;
}

/**
 * Add a blank frame after the current frame.
 */
export function addBlankAfterCurrent(state: AppState): void {
  insertFrame(state, state.current, null);
}

/**
 * Duplicate the current frame.
 */
export function duplicateAfterCurrent(state: AppState): void {
  insertFrame(state, state.current, state.frames[state.current]);
}

/**
 * Delete the current frame.
 */
export function deleteCurrentFrame(state: AppState): boolean {
  if (state.isPlaying) return false;
  if (state.frames.length <= 1) {
    notify('Cannot delete the last remaining frame.');
    return false;
  }

  const n = state.current + 1;
  const ok = confirm(`Delete frame ${n}? This cannot be undone.`);
  if (!ok) return false;

  state.frames.splice(state.current, 1);
  state.undoStacks.splice(state.current, 1);
  state.redoStacks.splice(state.current, 1);
  ensureStacks(state.undoStacks, state.redoStacks, state.frames.length);

  // Keep selection sensible
  state.current = clamp(state.current, 0, state.frames.length - 1);

  return true;
}

/**
 * Insert a frame before the target index (for drag-and-drop reordering).
 */
export function insertFrameBefore(state: AppState, from: number, to: number): void {
  if (state.isPlaying) return;
  if (from === to || from < 0 || to < 0) return;

  let insertAt = from < to ? to - 1 : to;

  // Remove source frame and its history first
  const f = state.frames.splice(from, 1)[0];
  const u = state.undoStacks.splice(from, 1)[0];
  const r = state.redoStacks.splice(from, 1)[0];

  // After removal, clamp insertion position to valid bounds
  insertAt = clamp(insertAt, 0, state.frames.length);

  // Insert at computed position
  state.frames.splice(insertAt, 0, f);
  state.undoStacks.splice(insertAt, 0, u);
  state.redoStacks.splice(insertAt, 0, r);

  // Adjust current index to keep selection consistent
  if (state.current === from) {
    state.current = insertAt;
  } else if (from < insertAt) {
    if (state.current > from && state.current <= insertAt) state.current -= 1;
  } else {
    if (state.current >= insertAt && state.current < from) state.current += 1;
  }
}

/**
 * Create a new project with default frames.
 */
export function newProject(state: AppState): void {
  if (state.isPlaying) return;

  state.frames = Array.from({ length: 12 }, () => makeBlankFrame());
  state.undoStacks = [];
  state.redoStacks = [];
  ensureStacks(state.undoStacks, state.redoStacks, state.frames.length);
  state.current = 0;
}

/**
 * Load frames into the application state.
 */
export function loadFrames(state: AppState, frames: Frame[]): void {
  state.frames = frames;
  state.undoStacks = [];
  state.redoStacks = [];
  ensureStacks(state.undoStacks, state.redoStacks, state.frames.length);
  state.current = 0;
}

/**
 * Get pointer coordinates relative to canvas.
 */
export function getPointerXY(canvas: HTMLCanvasElement, ev: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();
  const x = (ev.clientX - rect.left) * (W / rect.width);
  const y = (ev.clientY - rect.top) * (H / rect.height);
  return {
    x: clamp(Math.floor(x), 0, W - 1),
    y: clamp(Math.floor(y), 0, H - 1)
  };
}
