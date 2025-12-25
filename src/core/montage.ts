/**
 * Montage editor core functionality.
 * Handles chunk management, import/export, trimming, and montage playback.
 */

import type { MontageChunk, MontageState } from '../types/montage';
import type { Frame, ProjectData } from '../types';
import { W, H, FPS } from './config';
import { notify } from '../utils/toast';
import { clamp } from '../utils/helpers';

/**
 * Create initial montage state.
 */
export function createMontageState(): MontageState {
  return {
    chunks: [],
    playing: false,
    selectedChunkIdx: -1,
    trimDragging: null,
    playPosition: { chunkIdx: 0, frameIdx: 0 }
  };
}

/**
 * Generate a unique ID for a chunk.
 */
export function generateChunkId(prefix = 'chunk'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 0x10000).toString(16)}`;
}

/**
 * Compute total frames across all chunks.
 */
export function computeMontageTotalFrames(chunks: MontageChunk[]): number {
  return chunks.reduce((sum, ch) => {
    const range = ch.frameRange;
    return sum + Math.max(0, (range && (range.end - range.start)) || 0);
  }, 0);
}

/**
 * Select a montage chunk by index.
 */
export function selectChunk(state: MontageState, idx: number): void {
  if (typeof idx !== 'number' || state.chunks.length === 0) {
    state.selectedChunkIdx = -1;
  } else {
    state.selectedChunkIdx = clamp(idx, 0, state.chunks.length - 1);
  }
}

/**
 * Add a chunk to the montage.
 */
export function addChunk(state: MontageState, chunk: MontageChunk): void {
  state.chunks.push(chunk);
}

/**
 * Remove a chunk from the montage.
 */
export function removeChunk(state: MontageState, idx: number): boolean {
  if (idx < 0 || idx >= state.chunks.length) return false;
  state.chunks.splice(idx, 1);
  // Adjust selection
  if (state.selectedChunkIdx >= state.chunks.length) {
    state.selectedChunkIdx = state.chunks.length - 1;
  }
  return true;
}

/**
 * Update chunk frame range (trim).
 */
export function updateChunkRange(
  state: MontageState,
  idx: number,
  start: number,
  end: number
): boolean {
  if (idx < 0 || idx >= state.chunks.length) return false;
  const chunk = state.chunks[idx];
  chunk.frameRange = { start, end };
  chunk.derived = true;
  return true;
}

/**
 * Reset chunk to original frame range.
 */
export function resetChunkRange(state: MontageState, idx: number): boolean {
  if (idx < 0 || idx >= state.chunks.length) return false;
  const chunk = state.chunks[idx];
  if (!chunk._project) return false;
  
  const project = chunk._project as ProjectData;
  chunk.frameRange = { start: 0, end: project.frameCount };
  chunk.derived = false;
  return true;
}

/**
 * Create a chunk from a project.
 */
export function createChunkFromProject(project: ProjectData, name?: string): MontageChunk {
  const id = generateChunkId();
  const chunkName = name || `Chunk ${id.slice(-6)}`;
  
  return {
    id,
    name: chunkName,
    source: {
      type: 'project',
      project
    },
    frameRange: {
      start: 0,
      end: project.frameCount
    },
    derived: false,
    _project: project,
    alias: chunkName
  };
}

/**
 * Get frame at a global montage position.
 */
export function getFrameAtMontagePosition(
  chunks: MontageChunk[],
  globalFrameIdx: number
): { chunkIdx: number; frameIdx: number; frame: Frame | null } {
  let accum = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const range = chunk.frameRange;
    const chunkLen = (range && (range.end - range.start)) || 0;
    
    if (globalFrameIdx < accum + chunkLen) {
      const localIdx = globalFrameIdx - accum;
      const actualFrameIdx = range.start + localIdx;
      
      // Get frame from chunk's project
      if (chunk._project) {
        const project = chunk._project as ProjectData;
        if (actualFrameIdx < project.frames.length) {
          // Decode frame from base64
          const base64 = project.frames[actualFrameIdx];
          const binary = atob(base64);
          const frame = new Uint8Array(W * H);
          for (let j = 0; j < binary.length && j < frame.length; j++) {
            frame[j] = binary.charCodeAt(j);
          }
          return { chunkIdx: i, frameIdx: localIdx, frame };
        }
      }
      
      return { chunkIdx: i, frameIdx: localIdx, frame: null };
    }
    
    accum += chunkLen;
  }
  
  return { chunkIdx: -1, frameIdx: -1, frame: null };
}

/**
 * Export montage as a single project.
 */
export function exportMontage(
  chunks: MontageChunk[],
  _embedChunks: boolean
): ProjectData {
  const allFrames: string[] = [];
  
  for (const chunk of chunks) {
    if (!chunk._project) continue;
    
    const project = chunk._project as ProjectData;
    const range = chunk.frameRange;
    
    for (let i = range.start; i < range.end && i < project.frames.length; i++) {
      allFrames.push(project.frames[i]);
    }
  }
  
  return {
    version: '1.3',
    width: W,
    height: H,
    fps: FPS,
    frameCount: allFrames.length,
    timestamp: new Date().toISOString(),
    frames: allFrames
  };
}

/**
 * Import multiple projects as chunks.
 */
export async function importChunks(files: FileList): Promise<MontageChunk[]> {
  const chunks: MontageChunk[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const text = await file.text();
      const project: ProjectData = JSON.parse(text);
      
      if (!project || !project.frames || !Array.isArray(project.frames)) {
        notify(`Skipped ${file.name}: Invalid format`);
        continue;
      }
      
      if (project.width !== W || project.height !== H) {
        notify(`Skipped ${file.name}: Wrong dimensions (${project.width}×${project.height})`);
        continue;
      }
      
      const chunk = createChunkFromProject(project, file.name.replace('.json', ''));
      chunks.push(chunk);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      notify(`Failed to load ${file.name}: ${errorMsg}`);
    }
  }
  
  return chunks;
}
