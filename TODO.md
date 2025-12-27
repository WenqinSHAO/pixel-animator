# Frame-by-Frame Animator - TODO

## High Priority

### Montage Editor

- [ ] **Unsaved changes indicator** - Warn before closing/navigating with unsaved work (High importance for data loss prevention)
- [x] **Chunk preview thumbnails** - ✅ Implemented with 56px thumbnails spanning two rows
- [x] **Drag and drop for chunk reordering** - ✅ Implemented with visual feedback
- [ ] **Keyboard shortcuts for chunks** - Arrow keys to navigate, Delete to remove, Enter to edit
- [x] **Timeline zoom and preview on hover** - ✅ Preview on hover implemented; zoom removed (ruler density change not helpful enough)

### Chunk Editor

- [ ] **Unsaved changes indicator** - Warn before switching modes or loading new project


### General UX

- [ ] **Tooltips enhancement** - Add helpful tooltips on all buttons and controls for better discoverability
- [ ] **Keyboard shortcuts reference** - Show cheat sheet accessible via "?" key

## Medium Priority

### Montage Editor

- [x] **Chunk color coding** - ✅ Implemented with 12-color pre-allocated palette
- [x] **Playhead positioning on chunk selection** - ✅ Implemented, positions to chunk start
- [x] **Optimized chunk layout** - ✅ Two-row design with duration (Xf format), color, alias, and controls
- [x] **Alias overflow handling** - ✅ Ellipsis with hover tooltip for long names
- [x] **Time display** - ✅ Fixed to update correctly during scrubbing and playback

### Chunk Editor

- [x] **Grid overlay option** - ✅ Implemented as layout guides (rule of thirds)
- [x] **Optimized layout** - ✅ 4-column thumbnails, compact tools, project info in actions
- [x] **Color palette** - ✅ Quick-access grayscale palette (0, 64, 128, 192, 255 values) inline with tools
- [x] **Mouse wheel support** - ✅ Scroll to adjust brush size, C+wheel or Ctrl/Cmd+wheel to zoom canvas
- [x] **Canvas zoom** - ✅ Canvas zoom with reset button (50%-300%)
- [ ] **Insert-between frames** - Drag thumbnail and drop between frames for real insert (complex, needs drop zone UI)

### General UX

- [ ] **Recent files list** - Quick access to recently loaded projects/montages (localStorage)
- [ ] **Project metadata fields** - Optional title, author, description for better organization
- [ ] **Export presets** - Save common GIF/MP4 export settings (size, quality, loop count)

## Low Priority

### Montage Editor

- [ ] **Chunk groups/folders** - Organize chunks into logical groups for large projects

### Chunk Editor

- [x] **Selection tool** - ✅ Fully implemented with copy/cut/paste, drag-and-drop, and floating selection
- [ ] **Lasso selection copy/cut/paste** - Complete implementation of pixel extraction from arbitrary closed paths
  - **Algorithm**: Point-in-polygon test (ray-casting algorithm)
  - **Implementation steps**:
    1. Convert lasso path to closed polygon (already done - path is auto-closed)
    2. Compute bounding box of lasso path (min/max x,y coordinates)
    3. Implement ray-casting algorithm to test if each pixel in bounding box is inside polygon
    4. Extract only pixels inside the polygon to selectionData
    5. Update cut operation to clear only pixels inside polygon
    6. Update paste to composite only extracted pixels with alpha
  - **Ray-casting algorithm**: Cast horizontal ray from point to infinity, count intersections with polygon edges. Odd count = inside, even = outside
  - **Edge cases**: Handle horizontal edges, vertex intersections, degenerate polygons
- [ ] **Drawing tools expansion** - Add line, rectangle, circle, fill tools

### General UX

- [ ] **Mobile/tablet support** - Touch-friendly controls and responsive layout
- [ ] **Accessibility improvements** - Better ARIA labels, keyboard navigation, screen reader support
- [ ] **Internationalization** - Support for multiple languages

## Future Major Features (Requires Separate PR)

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

## Performance Optimizations

- [ ] **Lazy loading** - Load chunk frames on-demand rather than all at once
- [ ] **Web Workers** - Move GIF encoding/decoding to background threads
- [ ] **Virtual scrolling** - For long frame lists and chunk lists (100+ items)
- [ ] **Canvas optimization** - Use OffscreenCanvas where supported for better performance
- [ ] **Incremental thumbnail rendering** - Don't block UI while generating all thumbnails

## Documentation

- [ ] **Interactive tutorial** - First-time user walkthrough with guided steps
- [ ] **Video tutorial** - Screen recording demonstrating key features
- [ ] **Best practices guide** - Tips for creating smooth animations, optimal frame counts, etc.
- [ ] **Export format guide** - Explain GIF vs MP4, when to use each, quality settings
- [ ] **Keyboard shortcuts documentation** - Comprehensive list in README

## Advanced Features (May break monolithic design)

### Collaboration

- [ ] **Share via URL** - Export project as data URL for easy sharing
- [ ] **Portable HTML viewer** - Self-contained HTML file that can play animation without editor
- [ ] **Cloud sync** - Optional cloud storage integration (requires backend)

### Extensibility

- [ ] **Plugin system** - Allow custom tools/exporters via JavaScript plugins
- [ ] **Custom export formats** - WebP, APNG, sprite sheets, etc.
- [ ] **Import from video** - Convert video files to frame sequences (requires ffmpeg.wasm)

### Effects & Filters

- [ ] **Basic image processing** - Invert, brightness, contrast adjustments
- [ ] **Blur/sharpen filters** - Applied to frames or ranges
- [ ] **Color adjustments** - Grayscale curve editor
- [ ] **Interpolation** - Auto-generate in-between frames (tweening)

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
