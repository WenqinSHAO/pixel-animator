/**
 * Montage editor types and interfaces.
 */

/** Montage chunk source types */
export type ChunkSourceType = 'ref' | 'project';

/** Frame range for a chunk */
export interface FrameRange {
  start: number;
  end: number;
}

/** Chunk source definition */
export interface ChunkSource {
  type: ChunkSourceType;
  ref?: string;
  project?: unknown;
}

/** Montage chunk definition */
export interface MontageChunk {
  id: string;
  name: string;
  source: ChunkSource;
  frameRange: FrameRange;
  derived: boolean;
  _project?: unknown;
  alias?: string;
}

/** Montage state */
export interface MontageState {
  chunks: MontageChunk[];
  playing: boolean;
  selectedChunkIdx: number;
  trimDragging: 'left' | 'right' | null;
  playPosition: { chunkIdx: number; frameIdx: number };
}

/** Application mode */
export type AppMode = 'chunk' | 'montage';
