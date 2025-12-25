/**
 * Thumbnail grid management and rendering.
 */

import type { AppState, Frame } from '../types';
import { renderThumb } from '../core/renderer';
import { setCurrent, insertFrameBefore } from '../core/state';
import { updateProjectMetaUI, updateThumbnailActive } from '../ui/uiState';
import { clamp } from '../utils/helpers';

export interface ThumbnailManager {
  thumbs: HTMLElement[];
  thumbCanvases: HTMLCanvasElement[];
}

/**
 * Initialize thumbnail grid.
 */
export function initThumbs(
  state: AppState,
  frameGrid: HTMLElement,
  manager: ThumbnailManager,
  offCanvas: HTMLCanvasElement,
  onFrameSelect: (index: number) => void,
  preserveIndex = true
): void {
  const prev = state.current;

  frameGrid.innerHTML = '';
  manager.thumbs.length = 0;
  manager.thumbCanvases.length = 0;

  for (let i = 0; i < state.frames.length; i++) {
    const el = document.createElement('div');
    el.className = 'thumb';
    el.title = `Frame ${i + 1}`;

    const idx = document.createElement('div');
    idx.className = 'idx';
    idx.textContent = String(i + 1);

    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const tctx = c.getContext('2d', { alpha: false });
    if (tctx) tctx.imageSmoothingEnabled = false;

    el.appendChild(idx);
    el.appendChild(c);

    // Click selects frame
    el.addEventListener('click', () => {
      if (state.isPlaying) return;
      onFrameSelect(i);
    });

    // Drag and drop for reordering
    el.draggable = true;

    el.addEventListener('dragstart', ev => {
      if (state.isPlaying) {
        ev.preventDefault();
        return;
      }
      try {
        ev.dataTransfer?.setData('text/plain', String(i));
      } catch (_) {
        // Ignore error
      }
      if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
      el.classList.add('dragging');
    });

    el.addEventListener('dragover', ev => {
      ev.preventDefault();
      if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
      el.classList.add('drag-over');
    });

    el.addEventListener('dragleave', () => {
      el.classList.remove('drag-over');
    });

    el.addEventListener('drop', ev => {
      ev.preventDefault();
      el.classList.remove('drag-over');
      const from = Number(ev.dataTransfer?.getData('text/plain'));
      const to = manager.thumbs.indexOf(el);
      if (Number.isNaN(from) || from === to) return;
      insertFrameBefore(state, from, to);
      
      // Re-init after reordering
      initThumbs(state, frameGrid, manager, offCanvas, onFrameSelect, true);
      renderAllThumbs(state.frames, manager.thumbCanvases, offCanvas);
      updateProjectMetaUI(state);
    });

    el.addEventListener('dragend', () => {
      manager.thumbs.forEach(t => t.classList.remove('dragging', 'drag-over'));
    });

    frameGrid.appendChild(el);
    manager.thumbs.push(el);
    manager.thumbCanvases.push(c);
  }

  const next = preserveIndex ? clamp(prev, 0, state.frames.length - 1) : 0;
  setCurrent(state, next);
  updateThumbnailActive(manager.thumbs, state.current);
  updateProjectMetaUI(state);
}

/**
 * Render all thumbnail canvases.
 */
export function renderAllThumbs(
  frames: Frame[],
  thumbCanvases: HTMLCanvasElement[],
  offCanvas: HTMLCanvasElement
): void {
  for (let i = 0; i < frames.length; i++) {
    renderThumb(thumbCanvases[i], offCanvas, frames, i);
  }
}
