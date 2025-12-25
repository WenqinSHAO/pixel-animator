/**
 * Playback control for animation preview.
 */

import type { AppState } from '../types';
import { FPS } from '../core/config';
import { setPlayingUI, updateUI, updateThumbnailActive } from '../ui/uiState';
import { renderMain } from '../core/renderer';

let playTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start or stop playback.
 */
export function setPlaying(
  state: AppState,
  isPlaying: boolean,
  mainCanvas: HTMLCanvasElement,
  offCanvas: HTMLCanvasElement,
  thumbs: HTMLElement[]
): void {
  state.isPlaying = isPlaying;
  setPlayingUI(isPlaying, state);

  if (isPlaying) {
    let idx = state.current;
    const interval = Math.round(1000 / FPS);
    
    playTimer = setInterval(() => {
      state.current = idx;
      updateThumbnailActive(thumbs, state.current);
      updateUI(state);
      renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
      idx = (idx + 1) % state.frames.length;
    }, interval);
  } else {
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
    renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
    updateUI(state);
  }
}
