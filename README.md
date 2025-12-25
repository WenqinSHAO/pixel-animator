# Animator

A minimal browser-based frame-by-frame animator and GIF exporter with montage editing capabilities.

## What it is for ✅
- Create simple animations in the browser and export them as a project JSON or a GIF.
- **NEW:** Montage editor for combining multiple animation projects into sequences.
- Supports both standalone frame-by-frame editing and montage composition.

**GUI Screenshot**

![Animator UI screenshot](./gui.png)

**Example GIF**

![example gif](./example/animation-2025-12-24T18-25-03-681Z.gif)

## Project Structure 🔧

This repository contains two versions:

### 1. **animator.html** (Main/Production - Monolithic, 2,156 lines)
The primary production version with all latest features:
- Frame-by-frame animation editor
- **Montage editor** for combining animations
- Layout optimizations for better workspace
- Trim controls for montage chunks
- Import/export for both individual animations and montages
- All features in a single, self-contained HTML file

### 2. TypeScript Refactored Version (Development/Legacy)
A modular TypeScript codebase (currently behind on features):
- `index.html` — HTML entry point
- `src/main.ts` — Application entry point
- `src/core/` — Core business logic modules
- `src/ui/` — UI management modules
- `src/types/` — TypeScript type definitions
- `src/utils/` — Utility functions

**Note:** The TypeScript version does not yet include the montage editor features. It represents an earlier refactoring effort of the original single-file animator.

### Files
- `animator.html` — **Main production file** with montage editor (use this for all features)
- `index.html` + `src/` — TypeScript refactored version (legacy, missing montage features)
- `vendor/` — GIF.js library files
- `example/` — Sample project JSONs
- `scripts/` — Validation utilities 
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

### Using animator.html (Recommended - Full Features)
Open `animator.html` directly in a modern browser - no build step required!

Features:
- **Frame Editor**: Create individual frames with drawing tools
- **Montage Editor**: Combine multiple animations into sequences
- **Layout optimized** for both modes
- All keyboard shortcuts work in both modes

### Using the TypeScript Version (Legacy)
The TypeScript version requires build tools but doesn't have montage features yet:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

**Note:** For full features including montage editor, use `animator.html`.


## Implementation details 🔍

### animator.html (Monolithic - 2,156 lines)
The main implementation now includes:

**Frame Editor Mode:**
- Data model: `frames` array of `Uint8Array` (W×H bytes, grayscale pixels)
- Drawing tools: pencil, eraser, soft brush with Bresenham line algorithm
- Undo/redo: per-frame delta compression
- Onion skinning for animation preview
- Project save/load (JSON with base64-encoded frames)
- GIF export (512×512 with white background)

**Montage Editor Mode (NEW):**
- **Chunk management**: Import multiple animation projects as "chunks"
- **Non-destructive trimming**: Adjust frame ranges without modifying source
- **Sequence playback**: Play through all chunks in order
- **Visual timeline**: Trim bar with draggable handles
- **Combined export**: Save montage as single animation or with embedded chunks
- **Alias support**: Name chunks for better organization

**Mode Switching:**
- Toggle between "Chunk Editor" (single animation) and "Montage Editor" (sequence)
- Drawing disabled in montage mode (view-only)
- Shared scrubber adapts to current mode
- Layout optimizations for sidebar space management

### TypeScript Version (src/ directory)
The modular codebase (currently missing montage features):
- Organized into core/, ui/, types/, utils/ modules
- Strict TypeScript configuration
- Vite build system
- ESLint for code quality
- Same data format as monolithic version for frame projects

**Configuration & maintenance tips** ✨

**For animator.html:**
- Change `W`, `H` for internal raster size, `DISPLAY` for on-screen/export resolution, and `FPS` for playback frame rate (all near line 357).
- Notifications use non-blocking in-page toasts.
- To support color: switch frames to RGBA arrays and update compose/draw functions.
- To change brush shape: adjust `drawDot()` behavior.
- To add tools: add UI control, set the tool name in `setTool()`, and handle it in `applyStroke()`.
- **Montage mode**: chunks stored in `montageChunks` array, mode toggled via `currentMode` variable.
- **Trim functionality**: non-destructive, stores frameRange without modifying source projects.

**For TypeScript version (if continuing development):**
- Same configuration constants in `src/core/config.ts`
- Modular architecture makes it easier to add features
- Would need montage editor modules added (chunks, trimming, mode switching)
- Type definitions in `src/types/index.ts` and `src/types/montage.ts` (started but incomplete)

### Future Development
To bring the TypeScript version up to date with animator.html:
1. Extract montage functionality into `src/core/montage.ts`
2. Add mode switching logic to `src/core/state.ts`
3. Create `src/ui/montageEditor.ts` for chunk management UI
4. Update `src/main.ts` to handle both modes
5. Add montage-specific UI components to `index.html`

> Note: frames are base64-encoded raw byte payloads in project files. Montage projects can optionally embed source chunks.