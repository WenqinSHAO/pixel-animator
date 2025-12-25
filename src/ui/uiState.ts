/**
 * UI state management and updates.
 */

import type { AppState } from '../types';
import { FPS } from '../core/config';
import { roundTo } from '../utils/helpers';

/**
 * Update project metadata UI elements.
 */
export function updateProjectMetaUI(state: AppState): void {
  const count = state.frames.length;
  
  const frameTotalEl = document.getElementById('frameTotal');
  const framesPill = document.getElementById('framesPill');
  const lengthPill = document.getElementById('lengthPill');
  const selectedFramePill = document.getElementById('selectedFramePill');
  const frameScrubber = document.getElementById('frameScrubber') as HTMLInputElement;

  if (frameTotalEl) frameTotalEl.textContent = String(count);
  if (framesPill) framesPill.textContent = String(count);
  if (lengthPill) lengthPill.textContent = `${roundTo(count / FPS, 2)} sec`;
  if (selectedFramePill) selectedFramePill.textContent = String(state.current + 1);

  if (frameScrubber) {
    frameScrubber.max = String(count);
    frameScrubber.value = String(state.current + 1);
  }
}

/**
 * Update frame label.
 */
export function updateFrameLabel(current: number): void {
  const frameLabel = document.getElementById('frameLabel');
  if (frameLabel) frameLabel.textContent = String(current + 1);
}

/**
 * Update undo/redo button states.
 */
export function updateUndoRedoButtons(state: AppState): void {
  const canU = !state.isPlaying && 
    state.undoStacks[state.current] && 
    state.undoStacks[state.current].length > 0;
  const canR = !state.isPlaying && 
    state.redoStacks[state.current] && 
    state.redoStacks[state.current].length > 0;

  const undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
  const redoBtn = document.getElementById('redoBtn') as HTMLButtonElement;

  if (undoBtn) undoBtn.disabled = !canU;
  if (redoBtn) redoBtn.disabled = !canR;
}

/**
 * Update all UI elements.
 */
export function updateUI(state: AppState): void {
  updateFrameLabel(state.current);
  const selectedFramePill = document.getElementById('selectedFramePill');
  if (selectedFramePill) selectedFramePill.textContent = String(state.current + 1);
  updateProjectMetaUI(state);
  updateUndoRedoButtons(state);
}

/**
 * Update tool button states.
 */
export function updateToolButtons(state: AppState): void {
  const toolPencil = document.getElementById('toolPencil');
  const toolEraser = document.getElementById('toolEraser');
  const toolSoft = document.getElementById('toolSoft');

  if (toolPencil) {
    toolPencil.classList.toggle('primary', state.tool === 'pencil');
    toolPencil.setAttribute('aria-pressed', String(state.tool === 'pencil'));
  }
  if (toolEraser) {
    toolEraser.classList.toggle('primary', state.tool === 'eraser');
    toolEraser.setAttribute('aria-pressed', String(state.tool === 'eraser'));
  }
  if (toolSoft) {
    toolSoft.classList.toggle('primary', state.tool === 'soft');
    toolSoft.setAttribute('aria-pressed', String(state.tool === 'soft'));
  }
}

/**
 * Set UI elements disabled/enabled based on playing state.
 */
export function setPlayingUI(isPlaying: boolean, state: AppState): void {
  const playBtn = document.getElementById('playBtn');
  if (playBtn) playBtn.textContent = isPlaying ? 'Stop' : 'Play';

  const disable = isPlaying;

  // Project buttons
  const saveProjectBtn = document.getElementById('saveProjectBtn') as HTMLButtonElement;
  const loadProjectBtn = document.getElementById('loadProjectBtn') as HTMLButtonElement;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const newBtn = document.getElementById('newBtn') as HTMLButtonElement;

  if (saveProjectBtn) saveProjectBtn.disabled = disable;
  if (loadProjectBtn) loadProjectBtn.disabled = disable;
  if (saveBtn) saveBtn.disabled = disable;
  if (newBtn) newBtn.disabled = disable;

  // Frame buttons
  const addFrameBtn = document.getElementById('addFrameBtn') as HTMLButtonElement;
  const dupFrameBtn = document.getElementById('dupFrameBtn') as HTMLButtonElement;
  const delFrameBtn = document.getElementById('delFrameBtn') as HTMLButtonElement;

  if (addFrameBtn) addFrameBtn.disabled = disable;
  if (dupFrameBtn) dupFrameBtn.disabled = disable;
  if (delFrameBtn) delFrameBtn.disabled = disable;

  // Drawing controls
  const toolPencil = document.getElementById('toolPencil') as HTMLButtonElement;
  const toolEraser = document.getElementById('toolEraser') as HTMLButtonElement;
  const toolSoft = document.getElementById('toolSoft') as HTMLButtonElement;
  const brushSize = document.getElementById('brushSize') as HTMLInputElement;
  const graySlider = document.getElementById('gray') as HTMLInputElement;
  const onionSlider = document.getElementById('onion') as HTMLInputElement;

  if (toolPencil) toolPencil.disabled = disable;
  if (toolEraser) toolEraser.disabled = disable;
  if (toolSoft) toolSoft.disabled = disable;
  if (brushSize) brushSize.disabled = disable;
  if (graySlider) graySlider.disabled = disable;
  if (onionSlider) onionSlider.disabled = disable;

  // Undo/redo
  if (disable) {
    const undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
    const redoBtn = document.getElementById('redoBtn') as HTMLButtonElement;
    if (undoBtn) undoBtn.disabled = true;
    if (redoBtn) redoBtn.disabled = true;
  } else {
    updateUndoRedoButtons(state);
  }

  // Scrubber
  const frameScrubber = document.getElementById('frameScrubber') as HTMLInputElement;
  if (frameScrubber) frameScrubber.disabled = disable;
}

/**
 * Set UI elements disabled/enabled based on export state.
 */
export function setExportingUI(isExporting: boolean): void {
  const disable = isExporting;

  const saveProjectBtn = document.getElementById('saveProjectBtn') as HTMLButtonElement;
  const loadProjectBtn = document.getElementById('loadProjectBtn') as HTMLButtonElement;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const newBtn = document.getElementById('newBtn') as HTMLButtonElement;
  const addFrameBtn = document.getElementById('addFrameBtn') as HTMLButtonElement;
  const dupFrameBtn = document.getElementById('dupFrameBtn') as HTMLButtonElement;
  const delFrameBtn = document.getElementById('delFrameBtn') as HTMLButtonElement;
  const toolPencil = document.getElementById('toolPencil') as HTMLButtonElement;
  const toolEraser = document.getElementById('toolEraser') as HTMLButtonElement;
  const toolSoft = document.getElementById('toolSoft') as HTMLButtonElement;
  const brushSize = document.getElementById('brushSize') as HTMLInputElement;
  const graySlider = document.getElementById('gray') as HTMLInputElement;
  const onionSlider = document.getElementById('onion') as HTMLInputElement;
  const undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
  const redoBtn = document.getElementById('redoBtn') as HTMLButtonElement;
  const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
  const frameScrubber = document.getElementById('frameScrubber') as HTMLInputElement;

  if (saveProjectBtn) saveProjectBtn.disabled = disable;
  if (loadProjectBtn) loadProjectBtn.disabled = disable;
  if (saveBtn) {
    saveBtn.disabled = disable;
    saveBtn.textContent = disable ? 'Exporting...' : 'Save GIF';
  }
  if (newBtn) newBtn.disabled = disable;
  if (addFrameBtn) addFrameBtn.disabled = disable;
  if (dupFrameBtn) dupFrameBtn.disabled = disable;
  if (delFrameBtn) delFrameBtn.disabled = disable;
  if (toolPencil) toolPencil.disabled = disable;
  if (toolEraser) toolEraser.disabled = disable;
  if (toolSoft) toolSoft.disabled = disable;
  if (brushSize) brushSize.disabled = disable;
  if (graySlider) graySlider.disabled = disable;
  if (onionSlider) onionSlider.disabled = disable;
  if (undoBtn) undoBtn.disabled = disable;
  if (redoBtn) redoBtn.disabled = disable;
  if (playBtn) playBtn.disabled = disable;
  if (frameScrubber) frameScrubber.disabled = disable;
}

/**
 * Update thumbnail active state.
 */
export function updateThumbnailActive(thumbs: HTMLElement[], current: number): void {
  thumbs.forEach((el, i) => el.classList.toggle('active', i === current));
}
