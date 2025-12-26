# Frame-by-Frame Animator - TODO

## High Priority

### Montage Editor
- [ ] **Unsaved changes indicator** - Warn before closing/navigating with unsaved work (High importance for data loss prevention)
- [ ] **Chunk preview thumbnails** - Already implemented! Could be enhanced with larger previews on hover
- [ ] **Drag-and-drop import** - Allow dragging JSON files directly onto chunks panel for easier workflow
- [ ] **Keyboard shortcuts for chunks** - Arrow keys to navigate, Delete to remove, Enter to edit

### Chunk Editor
- [ ] **Unsaved changes indicator** - Warn before switching modes or loading new project
- [ ] **Copy/paste frames** - Between projects or within project for faster animation creation

### General UX
- [ ] **Tooltips enhancement** - Add helpful tooltips on all buttons and controls for better discoverability
- [ ] **Keyboard shortcuts reference** - Show cheat sheet accessible via "?" key

## Medium Priority

### Montage Editor
- [ ] **Trim preview on hover** - Show tooltip with start/end frame when hovering over trim handles
- [ ] **Chunk color coding** - Assign colors to chunks for easier visual tracking on scrubber and timeline
- [ ] **Batch chunk operations** - Multi-select chunks for delete/reorder/export operations
- [ ] **Timeline zoom** - Allow zooming in/out of scrubber for detailed frame-by-frame work

### Chunk Editor
- [ ] **Grid overlay option** - Toggle pixel grid for pixel-perfect alignment
- [ ] **Color palette** - Quick-access grayscale palette (0, 64, 128, 192, 255 values)
- [ ] **Frame range selection** - Select multiple frames for batch operations (delete, duplicate, reorder)
- [ ] **Undo history viewer** - Show undo/redo stack with small previews for better control

### General UX
- [ ] **Recent files list** - Quick access to recently loaded projects/montages (localStorage)
- [ ] **Project metadata fields** - Optional title, author, description for better organization
- [ ] **Export presets** - Save common GIF/MP4 export settings (size, quality, loop count)

## Low Priority

### Montage Editor
- [ ] **Audio sync markers** - Add audio waveform display for precise timing (would require audio file support)
- [ ] **Effects preview** - Show transition effects between chunks (fade, wipe, etc.)
- [ ] **Chunk groups/folders** - Organize chunks into logical groups for large projects

### Chunk Editor  
- [ ] **Frame rate preview toggle** - Temporarily change preview FPS without affecting export
- [ ] **Onion skin customization** - More control over previous/next frame opacity and count
- [ ] **Drawing tools expansion** - Add line, rectangle, circle, fill tools

### General UX
- [ ] **Dark/light theme toggle** - User preference for interface theme
- [ ] **Mobile/tablet support** - Touch-friendly controls and responsive layout
- [ ] **Accessibility improvements** - Better ARIA labels, keyboard navigation, screen reader support
- [ ] **Internationalization** - Support for multiple languages

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
