# Frame-by-Frame Animator - TODO

## High Priority

### Montage Editor

- [ ] **Keyboard shortcuts for chunks** - left, right arrow keys for per frame navigation, up down arrow key for chunk navigation. remember to update hint.


### Chunk Editor

- [ ] **hot key simplification** - remove Del for detele frame hotkey, remove G for export GIF, L for load, N for new hotkeys. remember to update hint.

### General UX

- [ ] **Unsaved changes indicator** - Warn before switching modes or loading new project
- [ ] **safeguard on pull refresh** - when page refreshed trigger by pull down, trigger unsave change indicator, applies to both montage and chunk editor


## Medium Priority

### General UX

- [ ] **Recent files list** - Quick access to recently loaded projects/montages (localStorage)
- [ ] **Project metadata fields** - Optional title, author, description for better organization
- [ ] **Export presets** - Save common GIF/MP4 export settings (size, quality, loop count)

## Low Priority

### Montage Editor

- [ ] **Chunk groups/folders** - Organize chunks into logical groups for large projects

### Chunk Editor

- [ ] **Drawing tools expansion** - Add line, rectangle, circle, fill tools


## Adavanced features

### Color and Transparency Support

- [x] **RGBA color support** - ✅ Fully implemented in December 2025
  - **File format v2.0**: Migrated from grayscale (Uint8Array, 1 byte/pixel) to RGBA (Uint8ClampedArray, 4 bytes/pixel)
  - **Backward compatibility**: Auto-detects v1.x projects and converts grayscale to RGBA on load
  - **UI changes**:
    - ✅ Clickable color box with native HTML5 color picker
    - ✅ Alpha/transparency slider (0-255)
    - ✅ 5 recent color slots (auto-updating with grayscale defaults)
    - ✅ Checkered background pattern for transparent areas
  - **Drawing improvements**:
    - ✅ Eraser creates transparent pixels (not white)
    - ✅ Soft brush applies softness via alpha channel
    - ✅ Proper alpha compositing for overlapping strokes
    - ✅ Canvas defaults to transparent (alpha=0)
  - **Selection tools**:
    - ✅ Rectangular selection with cut/copy/paste
    - ✅ Free-form (lasso) selection mode
    - ⚠️ Lasso cut/copy/paste partially implemented (visual only)
  - **Rendering**:
    - ✅ Alpha blending for onion skinning
    - ✅ GIF export flattens transparency to white background
    - ✅ Montage editor handles mixed v1.x/v2.0 chunks

### E-ink Tablet Support (December 2025)

- [x] **Light theme for e-ink displays** - ✅ High contrast black-on-white theme with toggle
- [x] **Touch-friendly scrollbars** - ✅ 16px width with custom styling
- [x] **Canvas rendering isolation** - ✅ Mode checks prevent chunk/montage canvas leakage
- [x] **Touch gesture support** - ✅ Pinch-to-zoom with multi-touch detection
- [x] **Canvas zoom positioning** - ✅ Floats on top when zoomed >100%
- [x] **Drawing tool deselection** - ✅ Click active tool to deselect, prevents drawing when no tool selected
- [x] **Zoom lock button** - ✅ Lock/unlock zoom (🔒/🔓) to prevent accidental pinch gestures
- [x] **Automatic zoom-lock** - ✅ Selecting drawing tool auto-locks zoom, deselecting auto-unlocks
- [x] **Flattened selection UI** - ✅ Dedicated Rect/Lasso buttons replace dropdown
- [x] **Compact UI layout** - ✅ Zoom lock on first row, reduced spacing for more canvas space

### Extensibility

- [ ] **Import from GIF** - Convert GIF to frame sequences
- [ ] **Import from video** - Convert video files to frame sequences (requires ffmpeg.wasm)

### Effects & Filters

- [ ] **Basic image processing** - Invert, brightness, contrast adjustments
- [ ] **Blur/sharpen filters** - Applied to frames or ranges
- [ ] **Color adjustments** - Grayscale curve editor
- [ ] **Interpolation** - Auto-generate in-between frames (tweening)

## Performance Optimizations

- [ ] **Lazy loading** - Load chunk frames on-demand rather than all at once
- [ ] **Web Workers** - Move GIF encoding/decoding to background threads
- [ ] **Virtual scrolling** - For long frame lists and chunk lists (100+ items)
- [ ] **Canvas optimization** - Use OffscreenCanvas where supported for better performance
- [ ] **Incremental thumbnail rendering** - Don't block UI while generating all thumbnails


## Completed ✅

- [x] Embedding-only saves (removed reference option)
- [x] Mandatory aliases with smart defaults
- [x] Original frame indices in overlays
- [x] Play/Pause behavior (not restart)
- [x] Enhanced scrubber with rulers and delimiters
- [x] Optimized layout (compact trim bar, Import in chunks panel)
- [x] Save filename prompts with memory
- [x] Frame info moved to scrubber area with time display
- [x] Chunk/montage editor integration (edit, insert, return)
- [x] Chunk preview thumbnails
- [x] UI layout improvements (December 2025)
  - [x] Chunk editor: Larger frame thumbnails (4 columns instead of 6)
  - [x] Chunk editor: Compressed project info panel
  - [x] Montage editor: Fixed "Frames" text appearing in wrong context
  - [x] Montage editor: Fixed play button width to prevent scrubber movement
- [x] Montage editor: Drag and drop chunk reordering (December 2025)
- [x] Montage editor: Chunk color coding system (December 2025)
- [x] Montage editor: Playhead positioning on chunk selection (December 2025)
- [x] Chunk editor: Grid overlay toggle (December 2025)
- [x] Chunk editor: Selection tool (basic implementation) (December 2025)
- [x] UI/UX improvements (December 2025)
  - [x] Compact color palette inline with drawing tools
  - [x] Mouse wheel support for brush size adjustment
  - [x] Canvas zoom with C+wheel or Ctrl/Cmd+wheel (50%-300%)
  - [x] Canvas zoom reset button
  - [x] Timeline preview on hover (montage editor)
  - [x] Thumbnail drag-drop optimizations (swap behavior, arrow buttons)
  - [x] Insert to Montage button visibility fix
  - [x] Enhanced selection tool hints (Ctrl+C/V)
  - [x] Incremental thumbnail rendering for performance
- [x] RGBA color and transparency support (December 2025)
  - [x] File format v2.0 with backward compatibility
  - [x] Native color picker with recent color slots
  - [x] Alpha slider and checkered background for transparency
  - [x] Proper alpha compositing throughout drawing system
  - [x] Free-form (lasso) selection tool (basic implementation)
  - [x] Improved UI layout (grid/zoom button grouping, panel alignment)
  - [x] Color picker behavior improvements
- [x] Bug fixes (December 2025)
  - [x] Fixed canvas zoom/transform persisting when switching from chunk to montage editor
  - [x] Fixed playback state carrying over when switching between editors
  - [x] Improved card stage and sidebar height alignment for better browser window fitting
  - [x] Made UI responsive to browser window size changes
  - [x] Fixed montage playback chunk sync - chunk panel selection now stays in sync during playback
  - [x] Fixed montage scrubber position sync - scrubber position now updates when selecting a chunk
- [x] **Narrow mode scrolling** - ✅ Fixed: Changed body to `overflow:auto` with fixed positioning to allow scrolling without triggering pull-to-refresh
  - **Solution**: Body now uses `overflow:auto` with `position:fixed` and proper min-heights for flexible content
  - **Impact**: Users can now scroll on narrow screens (tablets/phones) without triggering browser pull-to-refresh
- [x] **Zoom lock improvements** - ✅ Fixed: Zoom lock now prevents all pinch gestures including during fast drawing
  - **Solution**: Added zoom lock checks in both touchstart and touchmove handlers, disabled double-tap zoom reset when locked
  - **Impact**: Drawing tools work reliably without accidental zoom interference
- [x] **Canvas scaling optimization** - ✅ Fixed: Canvas now properly scales to maximize window space and show entire canvas by default
  - **Solution**: Updated responsive breakpoints to use `calc(100vw - Xpx)` for better space utilization, increased max canvas sizes
  - **Impact**: Canvas uses available screen space more efficiently across all device sizes
- [x] **Selection UI consolidation** - ✅ Fixed: Removed redundant Select button, keeping only Rect/Lasso buttons
  - **Reason**: Select tool is primarily a mode switcher; Rect/Lasso directly set selection mode
  - **Impact**: Simplified UI, more direct access to selection tools
- [x] **Chunk color coding** - ✅ Implemented with 12-color pre-allocated palette
- [x] **Playhead positioning on chunk selection** - ✅ Implemented, positions to chunk start
- [x] **Optimized chunk layout** - ✅ Two-row design with duration (Xf format), color, alias, and controls
- [x] **Alias overflow handling** - ✅ Ellipsis with hover tooltip for long names
- [x] **Time display** - ✅ Fixed to update correctly during scrubbing and playback
- [x] **Chunk preview thumbnails** - ✅ Implemented with 56px thumbnails spanning two rows
- [x] **Drag and drop for chunk reordering** - ✅ Implemented with visual feedback
- [x] **Timeline zoom and preview on hover** - ✅ Preview on hover implemented; zoom removed (ruler density change not helpful enough)
- [x] **Grid overlay option** - ✅ Implemented as layout guides (rule of thirds)
- [x] **Optimized layout** - ✅ 4-column thumbnails, compact tools, project info in actions
- [x] **Color palette** - ✅ Quick-access grayscale palette (0, 64, 128, 192, 255 values) inline with tools
- [x] **Mouse wheel support** - ✅ Scroll to adjust brush size, C+wheel or Ctrl/Cmd+wheel to zoom canvas
- [x] **Canvas zoom** - ✅ Canvas zoom with reset button (50%-300%)

## Notes

**Design Principles:**

- Maintain monolithic, self-sufficient architecture
- Single HTML file with embedded CSS/JS
- No external dependencies beyond gif.js (and MP4 encoder if implemented)
- Vanilla JavaScript only
- Works completely offline
- No server-side processing required

**Priority Definitions:**

- **High**: Critical for usability, frequently requested, or prevents data loss
- **Medium**: Improves workflow efficiency, nice-to-have features
- **Low**: Polish, alternative workflows, or specialized use cases

**Adding New Items:**
Add new feature requests using this format:
```markdown
- [ ] **Feature name** - Brief description (Priority reason if not obvious)
```

Keep items organized by theme and update priority as needed based on user feedback.
