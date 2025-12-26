# Frame-by-frame Pixel Animator

A minimal browser-based frame-by-frame animator and GIF exporter.

## What it is for

- Create simple animations in the browser and export them as a project JSON or a GIF/webm.
- Small, dependency-light implementation using `animator.html` and `vendor/gif.js`.

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
  "version": "1.x",
  "width": 128,
  "height": 128,
  "fps": 12,
  "frameCount": 32,
  "timestamp": "2025-12-24T17:33:23.149Z",
  "frames": [ "<base64-image>", "<base64-image>", ... ]
}
```

- `version`: project format version string.
- `width`, `height`: canvas size in pixels.
- `fps`: frames per second for playback/export.
- `frameCount`: expected number of frames (should match `frames.length`).
- `timestamp`: ISO timestamp when exported.
- `frames`: ordered array of base64-encoded image payloads (one per frame).

> Note: frames are stored as base64 image data (payload strings). The app expects the array order to be the playback order.

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
- **Grid overlay**: Toggle pixel grid for precise alignment (Grid On/Off button)
- **Selection tool**: Click and drag to select an area, press Delete to clear selected pixels
- **Frame management**: Add, duplicate, delete frames; drag thumbnails to reorder
- **Onion skinning**: Adjust transparency to see previous frames while drawing

### Montage Editor Mode

- **Import chunks**: Load multiple project JSON files to assemble a montage
- **Chunk reordering**: Drag and drop chunks to change their order in the timeline
- **Color coding**: Assign colors to chunks for visual tracking on the timeline
- **Trim chunks**: Adjust start/end frames for each chunk non-destructively
- **Timeline scrubber**: Visual representation with color-coded chunk regions
- **Playback**: Preview the entire montage sequence

## Implementation details — `animator.html`

- **Data model**: `frames` is an Array of `Uint8Array` (length `W*H`), one byte per pixel (0 = black, 255 = white). New frames are created with `makeBlankFrame()`.
- **Save / Load**: `saveProject()` serializes raw bytes as base64 (`btoa(String.fromCharCode(...))`); `loadProject()` decodes with `atob()` and validates `width`, `height`, and frame lengths.
- **Rendering**: an offscreen canvas `off` (W×H) is composed via `composeWithOnionSkin()` (or `composeFrameOnly()`), then scaled and drawn to the visible `main` canvas by `renderMain()` (uses `DISPLAY` and device DPR).
- **Drawing & tools**: `drawDot()` (square brush) and `drawLine()` (Bresenham) implement strokes. Pointer events on `main` drive `applyStroke()`; the current drawing mode is controlled by `setTool()` and the `tool` variable.
- **Undo / Redo**: per-frame `undoStacks`/`redoStacks` hold stroke deltas recorded from `activeStrokeMap` and committed in `commitStroke()` as `{idxs, before, after}`; `undo()`/`redo()` apply deltas with `applyDelta()`.
- **Timeline & thumbnails**: `insertFrame()`, `duplicateAfterCurrent()`, `deleteCurrentFrame()` modify `frames`; `initThumbs()` and `renderThumb()` maintain the thumbnail grid.
- **Playback**: `setPlaying()` uses `setInterval` with `FPS` to step frames and disables editing while playing.
- **GIF Export**: `saveGif()` composes frames at `DISPLAY` (512) onto a white background and uses `gif.js`; `getGifWorkerBlobUrl()` loads `./vendor/gif.worker.js` or falls back to CDN.

## Configuration & maintenance tips

- Change `W`, `H` for the internal raster size, `DISPLAY` for on-screen/export resolution, and `FPS` for playback frame rate.
- Notifications now use non-blocking in-page toasts (instead of blocking `alert()`), shown in the bottom-right.
- To support color, switch frames to RGBA arrays and update compose / draw functions accordingly.
- To change brush shape (round vs square), adjust `drawDot()` behavior.
- To add tools, add a UI control, set the new tool name in `setTool()`, and handle it in `applyStroke()`.
- For autosave or cloud sync, hook into project changes and reuse `saveProject()`/`loadProject()` logic.
- Keep `frameCount` in sync with `frames.length`; `loadProject()` checks lengths and will error on mismatch.

> Note: frames are raw byte payloads base64-encoded in the project file; if you prefer portable images (PNG) swap to data-URI encoding in `saveProject()`/`loadProject()`.
