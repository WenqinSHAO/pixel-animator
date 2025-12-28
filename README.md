# Frame-by-frame Pixel Animator

A minimal browser-based frame-by-frame animator and GIF exporter, optimized for e-ink tablets.

## What it is for

- Create simple animations in the browser and export them as a project JSON or a GIF/webm.
- Small, dependency-light implementation using `animator.html` and `vendor/gif.js`.
- **NEW**: Optimized for e-ink tablets (reMarkable, Boox, Kindle) with light theme and touch gestures.

## Features

- **Chunk Editor**: Draw frame-by-frame animations with pencil, soft brush, and eraser tools
- **Montage Editor**: Assemble animations from multiple chunks with timeline editing
- **RGBA Color Support**: Full color with transparency/alpha channel
- **Touch Support**: Pinch-to-zoom, touch-friendly buttons (44px), and smooth scrolling without pull-to-refresh interference
- **Tool Deselection**: Click active tool again to deselect and prevent drawing
- **Zoom Lock**: Lock/unlock zoom (🔒/🔓) to prevent all accidental pinch gestures while drawing, including during fast strokes
- **E-ink Optimized**: High-contrast light theme perfect for e-ink displays (reMarkable, Boox, Kindle)
- **Responsive Layout**: Works on desktop, tablet, and mobile devices with optimized canvas scaling for maximum workspace
- **Offline Capable**: No server required, works completely offline

GUI Screenshot

![Animator UI screenshot](./gui.png)

> **Tip:** Open `animator.html` in a browser to view the UI shown above.

Example GIF
![ex 2](./example/montage-2025-12-26T15-49-22-009Z.gif)

## Project layout

- `animator.html` — main UI and app logic (canvas, frame editing, import/export).
- `vendor/gif.js`, `vendor/gif.worker.js` — GIF encoding (used for `Export GIF`). This project includes a bundled copy of gif.js [https://github.com/jnordberg/gif.js](https://github.com/jnordberg/gif.js) for offline builds — gif.js is MIT-licensed; include or reference its LICENSE when redistributing.
- The `example/` folder contains saved project JSONs you can load from the UI using **Project Actions → Load Project**. To validate those files locally, run `node scripts/validate_examples.js` (checks `frameCount` and per-frame byte lengths).
- `example/` — saved project JSONs (examples and tests).

## Data format (project JSON)

Schema (concise):

```json
{
  "version": "2.0",
  "width": 128,
  "height": 128,
  "fps": 12,
  "frameCount": 32,
  "timestamp": "2025-12-27T08:00:00.000Z",
  "frames": [ "<base64-rgba-data>", "<base64-rgba-data>", ... ]
}
```

- `version`: project format version string. Version `2.0` uses RGBA format (4 bytes per pixel). Version `1.x` used grayscale (1 byte per pixel) and is automatically converted to RGBA on load.
- `width`, `height`: canvas size in pixels.
- `fps`: frames per second for playback/export.
- `frameCount`: expected number of frames (should match `frames.length`).
- `timestamp`: ISO timestamp when exported.
- `frames`: ordered array of base64-encoded RGBA image data (one per frame, W×H×4 bytes each).

> Note: frames are stored as base64-encoded raw pixel data (RGBA format). The app expects the array order to be the playback order. Legacy v1.x grayscale projects are automatically converted to RGBA when loaded.

## Montage (Film) Editor — Draft spec

**Goal:** arrange animation "chunks" (segments from existing project JSONs) in a timeline, supporting batch import, insert-before, drag-to-reorder, non-destructive **trimming** (time-axis, by frames), and save/load of a montage project. The UI will remain **vanilla** and simple; imports must match the montage `width`/`height`/`fps` (validated, see `scripts/validate_examples.js`).

**Montage project JSON:**

```json
{
  "version": "montage-1.0",
  "width": 128,
  "height": 128,
  "fps": 12,
  "timestamp": "2025-12-25T09:00:00Z",
  "chunks": [
    {
      "id": "chunk-uuid-1",
      "name": "intro",
      "alias": "intro-cut",
      "source": {
        "type": "embedded",
        "project": { /* full original project JSON */ }
      },
      "frameRange": { "start": 0, "end": 15 },
      "derived": false
    },
    {
      "id": "chunk-uuid-2",
      "name": "scene2",
      "alias": "main-scene",
      "source": {
        "type": "embedded",
        "project": { /* full original project JSON */ }
      },
      "frameRange": { "start": 5, "end": 31 },
      "derived": true
    }
  ]
}
```

**Notes:**

- Each chunk contains a complete embedded copy of the original project JSON in `source.project`. All chunks use `source.type = "embedded"` for self-sufficiency and portability.
- **Alias (Cut Name):** Each chunk has an `alias` field (displayed as "Cut name" in the UI) which defaults to the source filename. The alias is used in overlay displays and helps identify chunks in the timeline.
- **Trimming (non-destructive):** The `frameRange` field specifies which frames from the original project are used in the montage (0-based, `[start, end)` - start inclusive, end exclusive). Trimming adjusts only the `frameRange` and sets `derived: true`; the full raw chunk data is preserved in `source.project`, so no frames are deleted. Frame indices in overlays always refer to the original chunk frame numbers, not the trimmed range.
- **Validation:** imported chunks must match the montage `width`, `height`, and `fps`; use `scripts/validate_examples.js` as a starting point for enforcement. Auto-scaling is out-of-scope for this phase.
- **Ordering:** the `chunks` array is ordered; the UI shows per-chunk duration and total timeline length, and allows drag-drop to reorder chunks and insert-before a selected chunk.
- **Interactions:** planned interactions with the existing chunk editor (e.g., insert current chunk into the montage, edit selected chunk in frame editor) are noted but deferred.
- **Saving:** use the `montage-1.0` version field for the montage project format. Example montage files can be added to `example/` and validated with the extended validator.

**Wireframes & interaction details:** See `docs/montage-wireframes.md` for ASCII wireframes, interaction notes, and a short implementation-ready API list.

## How to use

- Open `animator.html` in a browser (no build step required).
- Use UI buttons to add frames, play, import/export JSON, and export GIF.

### Chunk Editor Mode

- **Drawing tools**: Pencil, Eraser, Soft brush, and Selection tool
  - **Tool deselection**: Click active tool button again to deselect - prevents drawing when no tool is selected
- **Zoom lock button**: Lock/unlock zoom (🔒/🔓 icons) to prevent accidental pinch gestures while drawing
- **Color palette**: Quick-access grayscale buttons (0, 64, 128, 192, 255) for fast color selection
- **Mouse controls**: 
  - Scroll wheel to adjust brush size
  - C + wheel or Ctrl/Cmd + wheel to zoom canvas (50%-300%)
  - Canvas zoom reset button (Zoom 100%)
- **Touch controls**:
  - Pinch-to-zoom with two fingers (50%-300%)
  - Double-tap to reset zoom to 100%
  - Zoom lock prevents accidental pinch while drawing
- **Grid overlay**: Toggle pixel grid for precise alignment (Grid On/Off button)
- **Selection tool**: Click and drag to select an area, Ctrl+C to copy, Ctrl+V to paste, Ctrl+X to cut, Delete to clear
- **Frame management**: 
  - Add, duplicate, delete frames
  - Drag thumbnails to swap positions
  - Arrow buttons (◀ ▶) on each thumbnail for one-step repositioning
- **Onion skinning**: Adjust transparency to see previous frames while drawing

### Montage Editor Mode

- **Import chunks**: Load multiple project JSON files to assemble a montage
- **Chunk reordering**: Drag and drop chunks to change their order in the timeline
- **Color coding**: Assign colors to chunks for visual tracking on the timeline
- **Trim chunks**: Adjust start/end frames for each chunk non-destructively
- **Timeline scrubber**: Visual representation with color-coded chunk regions and frame/time rulers
- **Preview on hover**: Hover over timeline to see frame preview tooltip
- **Playback**: Preview the entire montage sequence

## Implementation details — `animator.html`

- **Data model**: `frames` is an Array of `Uint8ClampedArray` (length `W*H*4`), storing RGBA color data (4 bytes per pixel: R, G, B, A). New frames are created with `makeBlankFrame()`. Legacy v1.x grayscale projects are automatically converted to RGBA on load.
- **Save / Load**: `saveProject()` serializes raw bytes as base64 (`btoa(String.fromCharCode(...))`); `loadProject()` decodes with `atob()` and validates `width`, `height`, and frame lengths. Version 2.0 projects use RGBA format; v1.x grayscale projects are auto-converted (R=G=B=gray, A=255).
- **Rendering**: an offscreen canvas `off` (W×H) is composed via `composeWithOnionSkin()` (or `composeFrameOnly()`) with alpha blending, then scaled and drawn to the visible `main` canvas by `renderMain()` (uses `DISPLAY` and device DPR).
- **Drawing & tools**: `drawDot()` (square brush) and `drawLine()` (Bresenham) implement strokes using RGBA color objects `{r, g, b, a}`. Pointer events on `main` drive `applyStroke()`; the current drawing mode is controlled by `setTool()` and the `tool` variable.
- **Undo / Redo**: per-frame `undoStacks`/`redoStacks` hold stroke deltas recorded from `activeStrokeMap` and committed in `commitStroke()` as `{idxs, before, after}` (4 bytes per pixel); `undo()`/`redo()` apply deltas with `applyDelta()`.
- **Timeline & thumbnails**: `insertFrame()`, `duplicateAfterCurrent()`, `deleteCurrentFrame()` modify `frames`; `initThumbs()` and `renderThumb()` maintain the thumbnail grid.
- **Playback**: `setPlaying()` uses `setInterval` with `FPS` to step frames and disables editing while playing.
- **GIF Export**: `saveGif()` composes frames at `DISPLAY` (512) onto a white background and uses `gif.js`; `getGifWorkerBlobUrl()` loads `./vendor/gif.worker.js` or falls back to CDN. RGBA frames are flattened to white background for GIF export.

## Editor Mode Architecture

The application supports two editor modes: **Chunk Editor** (frame-by-frame drawing) and **Montage Editor** (timeline assembly). These modes have distinct purposes, UIs, and rendering strategies to prevent canvas/state leakage.

### Mode Switching

- **Mode state**: Tracked by global `currentMode` variable (`'chunk'` or `'montage'`)
- **Mode transition**: Handled by `setMode(mode)` function which:
  - Checks for unsaved changes and prompts user
  - Stops active playback in either mode
  - Clears chunk-editor-specific state (selection, cursor, zoom)
  - Shows/hides mode-specific UI panels
  - Disables controls not relevant to target mode
  - Renders appropriate canvas content for target mode

### UI Element Ownership

| UI Element | Chunk Editor | Montage Editor | Shared |
|------------|--------------|----------------|--------|
| Main canvas (#main) | ✓ Editable, with tools | ✓ Read-only preview | Both (different rendering) |
| Drawing panel (#drawingPanel) | ✓ Visible | ✗ Hidden | - |
| Frames sidebar (.sidebar) | ✓ Visible | ✗ Hidden | - |
| Montage sidebar (#montageSidebar) | ✗ Hidden | ✓ Visible | - |
| Trim bar (#trimBar) | ✗ Hidden | ✓ Visible | - |
| Play button | ✓ (#playBtn) | ✓ (#montagePlayBtn) | Separate buttons |
| Scrubber | ✓ Frame navigation | ✓ Global frame nav | Reused element, different logic |
| Project actions | ✓ Save/Load/New/GIF | ✗ Disabled | Chunk-only |
| Theme toggle | ✓ | ✓ | Shared |
| Editor mode toggle | ✓ | ✓ | Shared |

### Workspace and State Isolation

#### Chunk Editor State (isolated)
- `frames[]` — Frame data (Uint8ClampedArray)
- `current` — Current frame index
- `tool` — Active drawing tool
- `selection`, `selectionData` — Selection tool state
- `gridEnabled` — Grid overlay toggle
- `cursorPos` — Brush preview position
- `undoStacks[]`, `redoStacks[]` — Per-frame undo/redo history
- `chunkEditorDirty` — Unsaved changes flag

**Cleanup on mode exit**: Selection state, cursor position, and canvas zoom are cleared when switching to montage mode

#### Montage Editor State (isolated)
- `montageChunks[]` — Array of chunk objects with embedded projects
- `selectedChunkIdx` — Currently selected chunk
- `_montagePos` — Playback position {chunkIdx, frameIdx}
- `montagePlaying` — Playback state
- `montageEditorDirty` — Unsaved changes flag

**Cleanup on mode exit**: None required (montage state persists)

#### Shared State
- `currentMode` — Editor mode ('chunk' or 'montage')
- `W`, `H`, `FPS`, `DISPLAY` — Canvas dimensions and frame rate
- `main`, `ctx`, `off`, `offCtx` — Canvas elements (shared, but rendered differently)
- `lastProjectPath`, `lastMontagePath` — Save/load filename memory

### Canvas Rendering Strategy

The application uses **mode-specific rendering functions** to prevent canvas leakage between modes:

#### `renderCanvas()` — Mode-aware routing (public API)
- **Purpose**: Universal canvas renderer that routes to mode-specific functions
- **Usage**: Called on window resize, global events, mode-agnostic contexts
- **Behavior**: Checks `currentMode` and delegates to `renderMain()` or `renderMontagePreviewChunk()`

#### `renderMain()` — Chunk editor rendering (mode-specific)
- **Purpose**: Renders current frame with editing tools (onion skin, grid, selection, brush preview)
- **Usage**: Called only in chunk mode contexts (frame edits, tool changes, playback)
- **Safety**: Mode guard at function entry warns if called in montage mode
- **Renders**:
  - Current frame with onion skinning (previous frames ghosted)
  - Grid overlay (rule of thirds) if enabled
  - Selection rectangle/lasso and floating selection
  - Brush preview indicator at cursor position

#### `renderPreviewFrameBytes()` / `renderMontagePreviewChunk()` — Montage editor rendering (mode-specific)
- **Purpose**: Renders read-only chunk preview with metadata overlay
- **Usage**: Called only in montage mode contexts (chunk selection, playback, scrubbing)
- **Safety**: Mode guard at function entry warns if called in chunk mode
- **Renders**:
  - Single frame from selected chunk
  - Chunk info overlay (name, frame number)
  - No editing tools or overlays

### Function Separation Guidelines

| Function Category | Chunk Editor | Montage Editor | Shared |
|-------------------|--------------|----------------|--------|
| **Canvas Rendering** | `renderMain()` | `renderPreviewFrameBytes()`, `renderMontagePreviewChunk()` | `renderCanvas()` |
| **Playback** | `setPlaying()` | `startMontagePlayback()`, `stopMontagePlayback()` | - |
| **Frame Operations** | `insertFrame()`, `deleteCurrentFrame()`, `duplicateAfterCurrent()` | - | - |
| **Chunk Operations** | - | `addMontageChunk()`, `renderMontageChunks()`, `selectMontageChunk()` | - |
| **Project Save/Load** | `saveProject()`, `loadProject()` | `saveMontageBtn`, `montageLoadBtn` | Separate flows |
| **Mode Interaction** | `insertChunkToMontage()` | `editChunkInChunkEditor()`, `returnChunkToMontage()` | Bidirectional |
| **UI Updates** | `updateUI()`, `updateProjectMetaUI()` | `updateMontageMetaUI()`, `updateMontageScrubberUI()` | - |

### Event Handler Mode Checks

Key event handlers include mode checks to prevent unintended interactions:

- **Mouse/touch drawing**: Only active when `currentMode === 'chunk'`
- **Keyboard shortcuts**: Mode-specific (e.g., A/D/S in chunk mode, arrow keys in montage mode)
- **Wheel events**: Brush size (chunk), no-op (montage, prevents zoom leakage)
- **Window resize**: Uses `renderCanvas()` to route to correct renderer

### Best Practices for Future Development

1. **Always use `renderCanvas()` for mode-agnostic contexts** (e.g., window resize, generic refresh)
2. **Use mode-specific renderers only in mode-specific contexts** (e.g., `renderMain()` after drawing)
3. **Add mode guards to new mode-specific functions** to catch misuse early
4. **Clear editor state when exiting a mode** to prevent leakage to other mode
5. **Document mode ownership** when adding new UI elements or state variables
6. **Test mode transitions** when modifying canvas rendering or state management

## Configuration & maintenance tips

- Change `W`, `H` for the internal raster size, `DISPLAY` for on-screen/export resolution, and `FPS` for playback frame rate.
- Notifications now use non-blocking in-page toasts (instead of blocking `alert()`), shown in the bottom-right.
- **Color support**: Fully implemented with RGBA arrays and alpha channel support:
  - **Color picker**: Click the color box to open native color picker
  - **Recent colors**: 5 slots that auto-update with used colors (defaults to grayscale palette)
  - **Alpha slider**: Control transparency (0-255)
  - **Transparency**: Canvas shows checkered background pattern, eraser creates transparent pixels
  - **Blending**: Proper alpha compositing when drawing overlapping strokes
- To change brush shape (round vs square), adjust `drawDot()` behavior.
- To add tools, add a UI control, set the new tool name in `setTool()`, and handle it in `applyStroke()`.
- For autosave or cloud sync, hook into project changes and reuse `saveProject()`/`loadProject()` logic.
- Keep `frameCount` in sync with `frames.length`; `loadProject()` checks lengths and will error on mismatch.

> Note: frames are raw byte payloads base64-encoded in the project file; if you prefer portable images (PNG) swap to data-URI encoding in `saveProject()`/`loadProject()`.
