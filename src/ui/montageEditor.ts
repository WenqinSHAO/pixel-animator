/**
 * Montage editor UI management.
 * Handles chunk list rendering, trim bar, and montage-specific UI updates.
 */

import type { ExtendedAppState } from '../core/state';
import { computeMontageTotalFrames } from '../core/montage';
import { clamp } from '../utils/helpers';

/**
 * Render the montage chunks list in the sidebar.
 */
export function renderMontageChunks(
  state: ExtendedAppState,
  container: HTMLElement,
  onChunkSelect: (idx: number) => void,
  onChunkRemove: (idx: number) => void
): void {
  container.innerHTML = '';
  
  state.montage.chunks.forEach((chunk, idx) => {
    const item = document.createElement('div');
    item.className = 'chunk-item';
    if (idx === state.montage.selectedChunkIdx) {
      item.classList.add('active');
    }
    
    // Thumbnail
    const thumb = document.createElement('div');
    thumb.className = 'chunk-thumb';
    thumb.textContent = `${idx + 1}`;
    
    // Info
    const info = document.createElement('div');
    info.className = 'chunk-info';
    
    // Alias input
    const alias = document.createElement('input');
    alias.className = 'chunk-alias';
    alias.type = 'text';
    alias.value = chunk.alias || chunk.name;
    alias.placeholder = 'Chunk name';
    alias.addEventListener('input', () => {
      chunk.alias = alias.value;
    });
    
    // Badges
    const badges = document.createElement('div');
    badges.className = 'chunk-badges';
    
    const frameCount = (chunk.frameRange.end - chunk.frameRange.start);
    const badge = document.createElement('span');
    badge.className = 'pill';
    badge.textContent = `${frameCount}f`;
    badges.appendChild(badge);
    
    if (chunk.derived) {
      const trimmedBadge = document.createElement('span');
      trimmedBadge.className = 'pill';
      trimmedBadge.textContent = 'trimmed';
      trimmedBadge.style.fontSize = '10px';
      badges.appendChild(trimmedBadge);
    }
    
    info.appendChild(alias);
    info.appendChild(badges);
    
    // Controls
    const controls = document.createElement('div');
    controls.className = 'chunk-controls';
    
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.className = 'icon-btn';
    removeBtn.title = 'Remove chunk';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onChunkRemove(idx);
    });
    
    controls.appendChild(removeBtn);
    
    item.appendChild(thumb);
    item.appendChild(info);
    item.appendChild(controls);
    
    item.addEventListener('click', () => {
      onChunkSelect(idx);
    });
    
    container.appendChild(item);
  });
}

/**
 * Update montage metadata UI (total frames, position).
 */
export function updateMontageMetaUI(state: ExtendedAppState): void {
  const totalFramesEl = document.getElementById('montageTotalFrames');
  if (totalFramesEl) {
    totalFramesEl.textContent = String(computeMontageTotalFrames(state.montage.chunks));
  }
  
  const playPosEl = document.getElementById('montagePlayPos');
  if (playPosEl && state.montage.playing) {
    const total = computeMontageTotalFrames(state.montage.chunks);
    let pos = 1;
    
    // Calculate position based on play state
    if (state.montage.playPosition) {
      let before = 0;
      for (let i = 0; i < state.montage.playPosition.chunkIdx && i < state.montage.chunks.length; i++) {
        const c = state.montage.chunks[i];
        before += (c.frameRange.end - c.frameRange.start) || 0;
      }
      pos = before + (state.montage.playPosition.frameIdx || 0) + 1;
    }
    
    playPosEl.textContent = `${pos} / ${total}f`;
  }
}

/**
 * Update the trim bar visual representation.
 */
export function updateTrimBar(
  state: ExtendedAppState,
  trimBarCanvas: HTMLElement
): void {
  trimBarCanvas.innerHTML = '';
  
  const selectedIdx = state.montage.selectedChunkIdx;
  if (selectedIdx < 0 || selectedIdx >= state.montage.chunks.length) return;
  
  const chunk = state.montage.chunks[selectedIdx];
  if (!chunk._project) return;
  
  const project = chunk._project as { frameCount?: number; frames?: unknown[] };
  const total = project.frameCount || (project.frames && project.frames.length) || 0;
  if (total <= 0) return;
  
  // Selection area
  const sel = document.createElement('div');
  sel.className = 'trim-selection';
  const leftPercent = (chunk.frameRange.start / total) * 100;
  const rightPercent = (chunk.frameRange.end / total) * 100;
  sel.style.left = leftPercent + '%';
  sel.style.width = (rightPercent - leftPercent) + '%';
  trimBarCanvas.appendChild(sel);
  
  // Handles
  const leftH = document.createElement('div');
  leftH.className = 'trim-handle';
  leftH.style.left = `calc(${leftPercent}% - 5px)`;
  leftH.setAttribute('data-handle', 'left');
  
  const rightH = document.createElement('div');
  rightH.className = 'trim-handle';
  rightH.style.left = `calc(${rightPercent}% - 5px)`;
  rightH.setAttribute('data-handle', 'right');
  
  trimBarCanvas.appendChild(leftH);
  trimBarCanvas.appendChild(rightH);
}

/**
 * Setup trim bar drag handlers.
 */
export function setupTrimBarHandlers(
  state: ExtendedAppState,
  trimBarCanvas: HTMLElement,
  trimStartInput: HTMLInputElement,
  trimEndInput: HTMLInputElement,
  onTrimChange: () => void
): void {
  let dragging: 'left' | 'right' | null = null;
  
  const getFrameFromX = (x: number): number => {
    const selectedIdx = state.montage.selectedChunkIdx;
    if (selectedIdx < 0) return 0;
    
    const chunk = state.montage.chunks[selectedIdx];
    if (!chunk._project) return 0;
    
    const project = chunk._project as { frameCount?: number; frames?: unknown[] };
    const total = project.frameCount || (project.frames && project.frames.length) || 0;
    
    const rect = trimBarCanvas.getBoundingClientRect();
    const rel = clamp((x - rect.left) / rect.width, 0, 1);
    return Math.round(rel * total);
  };
  
  const handlePointerMove = (ev: PointerEvent) => {
    if (!dragging || state.montage.selectedChunkIdx < 0) return;
    
    const chunk = state.montage.chunks[state.montage.selectedChunkIdx];
    if (!chunk._project) return;
    
    const project = chunk._project as { frameCount?: number; frames?: unknown[] };
    const total = project.frameCount || (project.frames && project.frames.length) || 0;
    const f = getFrameFromX(ev.clientX);
    
    if (dragging === 'left') {
      const newStart = clamp(Math.min(f, chunk.frameRange.end - 1), 0, total - 1);
      chunk.frameRange.start = newStart;
      trimStartInput.value = String(newStart);
    } else if (dragging === 'right') {
      const newEnd = clamp(Math.max(f, chunk.frameRange.start + 1), 1, total);
      chunk.frameRange.end = newEnd;
      trimEndInput.value = String(newEnd);
    }
    
    updateTrimBar(state, trimBarCanvas);
  };
  
  const handlePointerUp = () => {
    if (!dragging) return;
    dragging = null;
    onTrimChange();
  };
  
  trimBarCanvas.addEventListener('pointerdown', (ev) => {
    const target = ev.target as HTMLElement;
    if (target.classList.contains('trim-handle')) {
      const handleType = target.getAttribute('data-handle') as 'left' | 'right';
      dragging = handleType;
      ev.preventDefault();
    }
  });
  
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
}
