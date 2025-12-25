/**
 * Main application entry point.
 * Initializes the pixel animator application and sets up all event handlers.
 */

import './styles.css';
import type { ExtendedAppState } from './core/state';
import { W, H } from './core/config';
import { createInitialState, setCurrent, setTool, setMode, addBlankAfterCurrent, duplicateAfterCurrent, deleteCurrentFrame, newProject, loadFrames, getPointerXY } from './core/state';
import { renderMain, renderThumb } from './core/renderer';
import { applyStroke } from './core/drawing';
import { beginStroke, commitStroke, undo, redo } from './core/history';
import { saveProject, loadProject } from './core/project';
import { saveGif } from './core/gifExport';
import { setPlaying } from './core/playback';
import { initThumbs, renderAllThumbs, type ThumbnailManager } from './ui/thumbnails';
import { updateUI, updateToolButtons, updateThumbnailActive, setExportingUI } from './ui/uiState';
import { notify } from './utils/toast';
import { importChunks, addChunk, removeChunk, selectChunk, updateChunkRange, resetChunkRange, exportMontage, getFrameAtMontagePosition } from './core/montage';
import { renderMontageChunks, updateMontageMetaUI, updateTrimBar, setupTrimBarHandlers } from './ui/montageEditor';

// Initialize application state
const state: ExtendedAppState = createInitialState();

// Canvas elements
const mainCanvas = document.getElementById('main') as HTMLCanvasElement;
const offCanvas = document.createElement('canvas');
offCanvas.width = W;
offCanvas.height = H;
const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
if (offCtx) offCtx.imageSmoothingEnabled = false;

// Thumbnail manager
const thumbnailManager: ThumbnailManager = {
  thumbs: [],
  thumbCanvases: []
};

// DOM elements
const frameGrid = document.getElementById('frameGrid') as HTMLElement;
const loadProjectInput = document.getElementById('loadProjectInput') as HTMLInputElement;

// Montage DOM elements
const montageImportInput = document.getElementById('montageImportInput') as HTMLInputElement;
const montageChunksContainer = document.getElementById('montageChunks') as HTMLElement;
const trimBarCanvas = document.getElementById('trimBarCanvas') as HTMLElement;
const trimStartInput = document.getElementById('trimStartInput') as HTMLInputElement;
const trimEndInput = document.getElementById('trimEndInput') as HTMLInputElement;
const chunkSidebar = document.getElementById('chunkSidebar') as HTMLElement;
const montageSidebar = document.getElementById('montageSidebar') as HTMLElement;
const drawingPanel = document.getElementById('drawingPanel') as HTMLElement;
const trimBar = document.getElementById('trimBar') as HTMLElement;

/**
 * Setup all event handlers.
 */
function setupEventHandlers(): void {
  // Tool buttons
  document.getElementById('toolPencil')?.addEventListener('click', () => {
    setTool(state, 'pencil');
    updateToolButtons(state);
  });
  
  document.getElementById('toolEraser')?.addEventListener('click', () => {
    setTool(state, 'eraser');
    updateToolButtons(state);
  });
  
  document.getElementById('toolSoft')?.addEventListener('click', () => {
    setTool(state, 'soft');
    updateToolButtons(state);
  });

  // Undo/Redo buttons
  document.getElementById('undoBtn')?.addEventListener('click', () => {
    if (state.isPlaying) return;
    const success = undo(state.frames[state.current], state.undoStacks[state.current], state.redoStacks[state.current]);
    if (success) {
      renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
      renderThumb(thumbnailManager.thumbCanvases[state.current], offCanvas, state.frames, state.current);
      updateUI(state);
    }
  });

  document.getElementById('redoBtn')?.addEventListener('click', () => {
    if (state.isPlaying) return;
    const success = redo(state.frames[state.current], state.undoStacks[state.current], state.redoStacks[state.current]);
    if (success) {
      renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
      renderThumb(thumbnailManager.thumbCanvases[state.current], offCanvas, state.frames, state.current);
      updateUI(state);
    }
  });

  // Frame management buttons
  document.getElementById('addFrameBtn')?.addEventListener('click', () => {
    addBlankAfterCurrent(state);
    initThumbs(state, frameGrid, thumbnailManager, offCanvas, handleFrameSelect, true);
    renderAllThumbs(state.frames, thumbnailManager.thumbCanvases, offCanvas);
    renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
    updateUI(state);
  });

  document.getElementById('dupFrameBtn')?.addEventListener('click', () => {
    duplicateAfterCurrent(state);
    initThumbs(state, frameGrid, thumbnailManager, offCanvas, handleFrameSelect, true);
    renderAllThumbs(state.frames, thumbnailManager.thumbCanvases, offCanvas);
    renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
    updateUI(state);
  });

  document.getElementById('delFrameBtn')?.addEventListener('click', () => {
    const deleted = deleteCurrentFrame(state);
    if (deleted) {
      initThumbs(state, frameGrid, thumbnailManager, offCanvas, handleFrameSelect, true);
      renderAllThumbs(state.frames, thumbnailManager.thumbCanvases, offCanvas);
      renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
      updateUI(state);
    }
  });

  // Playback button
  document.getElementById('playBtn')?.addEventListener('click', () => {
    setPlaying(state, !state.isPlaying, mainCanvas, offCanvas, thumbnailManager.thumbs);
  });

  // Frame scrubber
  const frameScrubber = document.getElementById('frameScrubber') as HTMLInputElement;
  if (frameScrubber) {
    frameScrubber.addEventListener('pointerdown', () => {
      if (state.isPlaying) setPlaying(state, false, mainCanvas, offCanvas, thumbnailManager.thumbs);
    });
    frameScrubber.addEventListener('input', () => {
      if (state.isPlaying) setPlaying(state, false, mainCanvas, offCanvas, thumbnailManager.thumbs);
      handleFrameSelect(Number(frameScrubber.value) - 1);
    });
  }

  // Project actions
  document.getElementById('saveProjectBtn')?.addEventListener('click', () => {
    if (state.isPlaying) return;
    saveProject(state.frames);
  });

  document.getElementById('loadProjectBtn')?.addEventListener('click', () => {
    if (state.isPlaying) return;
    loadProjectInput.value = '';
    loadProjectInput.click();
  });

  loadProjectInput.addEventListener('change', async () => {
    if (state.isPlaying) return;
    const file = loadProjectInput.files?.[0];
    if (!file) return;
    try {
      const frames = await loadProject(file);
      loadFrames(state, frames);
      initThumbs(state, frameGrid, thumbnailManager, offCanvas, handleFrameSelect, false);
      renderAllThumbs(state.frames, thumbnailManager.thumbCanvases, offCanvas);
      renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
      updateUI(state);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(err);
      notify(`Failed to load project: ${errorMsg}`);
    }
  });

  document.getElementById('saveBtn')?.addEventListener('click', () => {
    if (state.isPlaying) return;
    saveGif(state.frames, offCanvas, setExportingUI);
  });

  document.getElementById('newBtn')?.addEventListener('click', () => {
    if (state.isPlaying) return;
    newProject(state);
    initThumbs(state, frameGrid, thumbnailManager, offCanvas, handleFrameSelect, false);
    renderAllThumbs(state.frames, thumbnailManager.thumbCanvases, offCanvas);
    renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
    updateUI(state);
  });

  // Brush size slider
  const brushSize = document.getElementById('brushSize') as HTMLInputElement;
  const brushSizeLabel = document.getElementById('brushSizeLabel');
  brushSize?.addEventListener('input', () => {
    state.brush = Number(brushSize.value);
    if (brushSizeLabel) brushSizeLabel.textContent = String(state.brush);
  });

  // Gray value slider
  const graySlider = document.getElementById('gray') as HTMLInputElement;
  const grayLabel = document.getElementById('grayLabel');
  graySlider?.addEventListener('input', () => {
    state.gray = Number(graySlider.value);
    if (grayLabel) grayLabel.textContent = String(state.gray);
  });

  // Onion skin depth slider
  const onionSlider = document.getElementById('onion') as HTMLInputElement;
  const onionLabel = document.getElementById('onionLabel');
  onionSlider?.addEventListener('input', () => {
    state.onionDepth = Number(onionSlider.value);
    if (onionLabel) onionLabel.textContent = String(state.onionDepth);
    if (!state.isPlaying) {
      renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
    }
  });

  // Drawing on main canvas
  mainCanvas.addEventListener('pointerdown', (ev) => {
    if (state.isPlaying) return;
    state.drawing = true;
    mainCanvas.setPointerCapture(ev.pointerId);

    state.activeStrokeMap = beginStroke();
    const pt = getPointerXY(mainCanvas, ev);
    state.lastPt = pt;
    applyStroke(state.frames[state.current], state.tool, null, pt, state.gray, state.brush, state.activeStrokeMap);
    renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
    renderThumb(thumbnailManager.thumbCanvases[state.current], offCanvas, state.frames, state.current);
  });

  mainCanvas.addEventListener('pointermove', (ev) => {
    if (!state.drawing || state.isPlaying) return;
    const pt = getPointerXY(mainCanvas, ev);
    applyStroke(state.frames[state.current], state.tool, state.lastPt, pt, state.gray, state.brush, state.activeStrokeMap);
    state.lastPt = pt;
    renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
    renderThumb(thumbnailManager.thumbCanvases[state.current], offCanvas, state.frames, state.current);
  });

  const endDraw = (ev: PointerEvent) => {
    if (!state.drawing) return;
    state.drawing = false;
    state.lastPt = null;

    if (state.activeStrokeMap) {
      commitStroke(state.activeStrokeMap, state.frames[state.current], state.undoStacks[state.current], state.redoStacks[state.current]);
      state.activeStrokeMap = null;
      updateUI(state);
    }

    try {
      mainCanvas.releasePointerCapture(ev.pointerId);
    } catch (_) {
      // Ignore error
    }
  };

  mainCanvas.addEventListener('pointerup', endDraw);
  mainCanvas.addEventListener('pointercancel', endDraw);

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
    if (e.target && (e.target as HTMLElement).tagName === 'TEXTAREA') return;

    // Undo/Redo
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !state.isPlaying) {
      const k = e.key.toLowerCase();
      if (k === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          const success = redo(state.frames[state.current], state.undoStacks[state.current], state.redoStacks[state.current]);
          if (success) {
            renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
            renderThumb(thumbnailManager.thumbCanvases[state.current], offCanvas, state.frames, state.current);
            updateUI(state);
          }
        } else {
          const success = undo(state.frames[state.current], state.undoStacks[state.current], state.redoStacks[state.current]);
          if (success) {
            renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
            renderThumb(thumbnailManager.thumbCanvases[state.current], offCanvas, state.frames, state.current);
            updateUI(state);
          }
        }
        return;
      }
      if (k === 'y') {
        e.preventDefault();
        const success = redo(state.frames[state.current], state.undoStacks[state.current], state.redoStacks[state.current]);
        if (success) {
          renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
          renderThumb(thumbnailManager.thumbCanvases[state.current], offCanvas, state.frames, state.current);
          updateUI(state);
        }
        return;
      }
    }

    if (e.code === 'Space') {
      e.preventDefault();
      setPlaying(state, !state.isPlaying, mainCanvas, offCanvas, thumbnailManager.thumbs);
      return;
    }

    // Frame navigation
    if (!state.isPlaying) {
      if (e.key === '[' || e.code === 'ArrowLeft') {
        e.preventDefault();
        handleFrameSelect(state.current - 1);
        return;
      }
      if (e.key === ']' || e.code === 'ArrowRight') {
        e.preventDefault();
        handleFrameSelect(state.current + 1);
        return;
      }
    }

    // Delete current frame
    if (!state.isPlaying && (e.code === 'Delete' || e.code === 'Backspace')) {
      e.preventDefault();
      const deleted = deleteCurrentFrame(state);
      if (deleted) {
        initThumbs(state, frameGrid, thumbnailManager, offCanvas, handleFrameSelect, true);
        renderAllThumbs(state.frames, thumbnailManager.thumbCanvases, offCanvas);
        renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
        updateUI(state);
      }
      return;
    }

    const k = e.key.toLowerCase();
    const hasModifier = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey;
    if (!hasModifier) {
      if (k === 's') {
        if (!state.isPlaying) {
          e.preventDefault();
          saveProject(state.frames);
        }
      } else if (k === 'g') {
        if (!state.isPlaying) {
          e.preventDefault();
          saveGif(state.frames, offCanvas, setExportingUI);
        }
      } else if (k === 'l') {
        if (!state.isPlaying) {
          e.preventDefault();
          loadProjectInput.value = '';
          loadProjectInput.click();
        }
      } else if (k === 'n') {
        if (!state.isPlaying) {
          e.preventDefault();
          newProject(state);
          initThumbs(state, frameGrid, thumbnailManager, offCanvas, handleFrameSelect, false);
          renderAllThumbs(state.frames, thumbnailManager.thumbCanvases, offCanvas);
          renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
          updateUI(state);
        }
      } else if (k === 'a') {
        if (!state.isPlaying) {
          e.preventDefault();
          addBlankAfterCurrent(state);
          initThumbs(state, frameGrid, thumbnailManager, offCanvas, handleFrameSelect, true);
          renderAllThumbs(state.frames, thumbnailManager.thumbCanvases, offCanvas);
          renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
          updateUI(state);
        }
      } else if (k === 'd') {
        if (!state.isPlaying) {
          e.preventDefault();
          duplicateAfterCurrent(state);
          initThumbs(state, frameGrid, thumbnailManager, offCanvas, handleFrameSelect, true);
          renderAllThumbs(state.frames, thumbnailManager.thumbCanvases, offCanvas);
          renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
          updateUI(state);
        }
      }
    }
  });

  // Allow dropping on the grid background to move a frame to the end
  frameGrid.addEventListener('dragover', (ev) => {
    ev.preventDefault();
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
  });
  
  frameGrid.addEventListener('drop', (ev) => {
    ev.preventDefault();
    const from = Number(ev.dataTransfer?.getData('text/plain'));
    if (Number.isNaN(from)) return;
    // insertFrameBefore is called in thumbnail drop handler, this handles dropping to end
    // We would need to call it here too but that's already handled in thumbnails.ts
  });

  // Resize handler
  window.addEventListener('resize', () => {
    renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
  });

  // Mode switching
  document.getElementById('modeChunkBtn')?.addEventListener('click', () => {
    setMode(state, 'chunk');
    updateModeUI();
    notify('Switched to Chunk Editor');
  });

  document.getElementById('modeMontageBtn')?.addEventListener('click', () => {
    setMode(state, 'montage');
    updateModeUI();
    notify('Switched to Montage Editor');
  });

  // Montage import
  document.getElementById('montageImportBtn')?.addEventListener('click', () => {
    montageImportInput?.click();
  });

  montageImportInput?.addEventListener('change', async (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    const chunks = await importChunks(files);
    chunks.forEach(chunk => addChunk(state.montage, chunk));
    
    renderMontageChunks(state, montageChunksContainer, handleChunkSelect, handleChunkRemove);
    updateMontageMetaUI(state);
    notify(`Imported ${chunks.length} chunk(s)`);

    montageImportInput.value = '';
  });

  // Montage save
  document.getElementById('montageSaveBtn')?.addEventListener('click', () => {
    const embedCheckbox = document.getElementById('montageEmbedCheckbox') as HTMLInputElement;
    const embed = embedCheckbox?.checked || false;
    
    const project = exportMontage(state.montage.chunks, embed);
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `montage-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Montage saved!');
  });

  // Trim controls
  document.getElementById('trimApplyBtn')?.addEventListener('click', () => {
    const start = Number(trimStartInput.value);
    const end = Number(trimEndInput.value);
    if (updateChunkRange(state.montage, state.montage.selectedChunkIdx, start, end)) {
      renderMontageChunks(state, montageChunksContainer, handleChunkSelect, handleChunkRemove);
      updateMontageMetaUI(state);
      updateTrimBar(state, trimBarCanvas);
      notify('Chunk trimmed (non-destructive)');
    }
  });

  document.getElementById('trimResetBtn')?.addEventListener('click', () => {
    if (resetChunkRange(state.montage, state.montage.selectedChunkIdx)) {
      const chunk = state.montage.chunks[state.montage.selectedChunkIdx];
      trimStartInput.value = String(chunk.frameRange.start);
      trimEndInput.value = String(chunk.frameRange.end);
      renderMontageChunks(state, montageChunksContainer, handleChunkSelect, handleChunkRemove);
      updateMontageMetaUI(state);
      updateTrimBar(state, trimBarCanvas);
      notify('Trim reset (restored full range)');
    }
  });

  // Setup trim bar drag handlers
  if (trimBarCanvas && trimStartInput && trimEndInput) {
    setupTrimBarHandlers(state, trimBarCanvas, trimStartInput, trimEndInput, () => {
      renderMontageChunks(state, montageChunksContainer, handleChunkSelect, handleChunkRemove);
      updateMontageMetaUI(state);
    });
  }
}

/**
 * Update UI based on current mode.
 */
function updateModeUI(): void {
  const isChunk = state.mode === 'chunk';
  const isMontage = state.mode === 'montage';

  if (chunkSidebar) chunkSidebar.style.display = isChunk ? '' : 'none';
  if (montageSidebar) montageSidebar.style.display = isMontage ? '' : 'none';
  if (drawingPanel) drawingPanel.style.display = isChunk ? '' : 'none';
  if (trimBar) trimBar.style.display = isMontage ? '' : 'none';

  const chunkBtn = document.getElementById('modeChunkBtn');
  const montageBtn = document.getElementById('modeMontageBtn');
  if (chunkBtn) chunkBtn.classList.toggle('primary', isChunk);
  if (montageBtn) montageBtn.classList.toggle('primary', isMontage);
}

/**
 * Handle chunk selection in montage mode.
 */
function handleChunkSelect(idx: number): void {
  selectChunk(state.montage, idx);
  renderMontageChunks(state, montageChunksContainer, handleChunkSelect, handleChunkRemove);
  
  const chunk = state.montage.chunks[idx];
  if (chunk) {
    trimStartInput.value = String(chunk.frameRange.start);
    trimEndInput.value = String(chunk.frameRange.end);
    
    const trimApply = document.getElementById('trimApplyBtn') as HTMLButtonElement;
    const trimReset = document.getElementById('trimResetBtn') as HTMLButtonElement;
    if (trimApply) trimApply.disabled = !chunk._project;
    if (trimReset) trimReset.disabled = !chunk._project;
  }
  
  updateTrimBar(state, trimBarCanvas);
  
  // Render preview of first frame in selected chunk
  if (chunk && chunk._project) {
    const result = getFrameAtMontagePosition(state.montage.chunks, idx);
    if (result.frame) {
      renderMain(mainCanvas, offCanvas, [result.frame], 0, false, 0);
    }
  }
}

/**
 * Handle chunk removal in montage mode.
 */
function handleChunkRemove(idx: number): void {
  if (removeChunk(state.montage, idx)) {
    renderMontageChunks(state, montageChunksContainer, handleChunkSelect, handleChunkRemove);
    updateMontageMetaUI(state);
    updateTrimBar(state, trimBarCanvas);
    notify('Chunk removed');
  }
}

/**
 * Handle frame selection.
 */
function handleFrameSelect(index: number): void {
  setCurrent(state, index);
  updateThumbnailActive(thumbnailManager.thumbs, state.current);
  updateUI(state);
  renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
}

/**
 * Initialize the application.
 */
function init(): void {
  // Set initial slider values
  const brushSize = document.getElementById('brushSize') as HTMLInputElement;
  const brushSizeLabel = document.getElementById('brushSizeLabel');
  const graySlider = document.getElementById('gray') as HTMLInputElement;
  const grayLabel = document.getElementById('grayLabel');
  const onionSlider = document.getElementById('onion') as HTMLInputElement;
  const onionLabel = document.getElementById('onionLabel');

  if (brushSize && brushSizeLabel) {
    state.brush = Number(brushSize.value);
    brushSizeLabel.textContent = brushSize.value;
  }
  if (graySlider && grayLabel) {
    state.gray = Number(graySlider.value);
    grayLabel.textContent = graySlider.value;
  }
  if (onionSlider && onionLabel) {
    state.onionDepth = Number(onionSlider.value);
    onionLabel.textContent = onionSlider.value;
  }

  // Initialize UI
  updateToolButtons(state);
  initThumbs(state, frameGrid, thumbnailManager, offCanvas, handleFrameSelect, false);
  renderAllThumbs(state.frames, thumbnailManager.thumbCanvases, offCanvas);
  renderMain(mainCanvas, offCanvas, state.frames, state.current, state.isPlaying, state.onionDepth);
  updateUI(state);

  // Setup event handlers
  setupEventHandlers();
}

// Start the application
init();
