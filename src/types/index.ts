/**
 * Type definitions for the pixel animator application.
 */

/** Drawing tool types */
export type Tool = 'pencil' | 'eraser' | 'soft';

/** Point in 2D space */
export interface Point {
  x: number;
  y: number;
}

/** Frame data: grayscale pixel array (0 = black, 255 = white) */
export type Frame = Uint8Array;

/** Undo/Redo delta object storing changed pixels */
export interface Delta {
  idxs: Uint32Array;
  before: Uint8Array;
  after: Uint8Array;
}

/** Project file format */
export interface ProjectData {
  version: string;
  width: number;
  height: number;
  fps: number;
  frameCount: number;
  timestamp: string;
  frames: string[]; // base64-encoded frame data
}

/** Application state */
export interface AppState {
  frames: Frame[];
  undoStacks: Delta[][];
  redoStacks: Delta[][];
  current: number;
  isPlaying: boolean;
  tool: Tool;
  brush: number;
  gray: number;
  onionDepth: number;
  drawing: boolean;
  lastPt: Point | null;
  activeStrokeMap: Map<number, number> | null;
}
