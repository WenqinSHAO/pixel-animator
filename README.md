# Animator

A minimal browser-based frame-by-frame animator and GIF exporter.

## What it is for ✅
- Create simple animations in the browser and export them as a project JSON or a GIF.
- Built with TypeScript and modern web technologies for better maintainability and development experience.

**GUI Screenshot**

![Animator UI screenshot](./gui.png)

**Example GIF**

![example gif](./example/animation-2025-12-24T18-25-03-681Z.gif)

## Project Structure 🔧

The project has been refactored from a monolithic HTML file into a well-organized TypeScript codebase:

### Main Files
- `index.html` — Main HTML entry point
- `src/main.ts` — Application entry point and orchestration
- `src/styles.css` — All application styles
- `public/vendor/` — GIF.js library files

### Source Code Organization
- `src/core/` — Core business logic
  - `config.ts` — Configuration constants
  - `frame.ts` — Frame creation and management
  - `renderer.ts` — Canvas rendering logic
  - `drawing.ts` — Drawing tools (pencil, eraser, soft brush)
  - `history.ts` — Undo/redo system
  - `project.ts` — Project save/load functionality
  - `gifExport.ts` — GIF export functionality
  - `playback.ts` — Animation playback
  - `state.ts` — Application state management
- `src/ui/` — UI-related modules
  - `uiState.ts` — UI state updates and management
  - `thumbnails.ts` — Thumbnail grid management
- `src/types/` — TypeScript type definitions
- `src/utils/` — Utility functions
  - `helpers.ts` — General helper functions
  - `toast.ts` — Toast notification system

### Legacy Files
- `animator.html` — Original monolithic implementation (kept for reference)

**Example projects**
- The `example/` folder contains saved project JSONs you can load from the UI using **Project Actions → Load Project**. 
- To validate example files: `node scripts/validate_examples.js` (checks `frameCount` and per-frame byte lengths).

## Data format (project JSON) 💾
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

## How to use ✨

### Development
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   This will open the application at `http://localhost:3000`

3. Build for production:
   ```bash
   npm run build
   ```
   The built files will be in the `dist/` directory.

4. Preview production build:
   ```bash
   npm run preview
   ```

### Using the Application
- Use UI buttons to add frames, play, import/export JSON, and export GIF.
- Keyboard shortcuts are available (see header hint bar).

### Using the Legacy Version
- For the original monolithic version, open `animator.html` directly in a browser (no build step required).


## Implementation details 🔍

### Architecture
The application follows a modular TypeScript architecture with clear separation of concerns:

- **Data model**: `frames` is an Array of `Uint8Array` (length `W*H`), one byte per pixel (0 = black, 255 = white). New frames are created with `makeBlankFrame()` in `src/core/frame.ts`.
- **Save / Load**: `saveProject()` in `src/core/project.ts` serializes raw bytes as base64; `loadProject()` decodes and validates dimensions and frame lengths.
- **Rendering**: Uses an offscreen canvas composed via `composeWithOnionSkin()` or `composeFrameOnly()`, then scaled to the visible canvas by `renderMain()` (all in `src/core/renderer.ts`).
- **Drawing & tools**: `src/core/drawing.ts` implements `drawDot()` (square brush) and `drawLine()` (Bresenham) for pencil/eraser, plus soft brush variants with radial falloff.
- **Undo / Redo**: `src/core/history.ts` manages per-frame undo/redo stacks with stroke deltas recorded as `{idxs, before, after}`.
- **Timeline & thumbnails**: `src/core/state.ts` and `src/ui/thumbnails.ts` handle frame operations and thumbnail grid management.
- **Playback**: `src/core/playback.ts` uses `setInterval` with configurable FPS to step through frames.
- **GIF Export**: `src/core/gifExport.ts` composes frames at 512×512 onto white background and uses gif.js library.

**Configuration & maintenance tips** ✨

- Change `W`, `H` for the internal raster size, `DISPLAY` for on-screen/export resolution, and `FPS` for playback frame rate.
- Notifications now use non-blocking in-page toasts (instead of blocking `alert()`), shown in the bottom-right.
- To support color, switch frames to RGBA arrays and update compose / draw functions accordingly.
- To change brush shape (round vs square), adjust `drawDot()` behavior.
- To add tools, add a UI control, set the new tool name in `setTool()`, and handle it in `applyStroke()`.
- For autosave or cloud sync, hook into project changes and reuse `saveProject()`/`loadProject()` logic.
- Keep `frameCount` in sync with `frames.length`; `loadProject()` checks lengths and will error on mismatch.

> Note: frames are raw byte payloads base64-encoded in the project file; if you prefer portable images (PNG) swap to data-URI encoding in `saveProject()`/`loadProject()`.