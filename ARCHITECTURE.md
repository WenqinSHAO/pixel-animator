# Architecture: Dual-Mode Editor System

This document provides detailed technical information about the dual-mode editor architecture in the Frame-by-Frame Animator. It explains the design principles, implementation details, and guidelines for maintaining and extending the mode switching system.

## Table of Contents
- [Design Principles](#design-principles)
- [Mode Switching Architecture](#mode-switching-architecture)
- [UI Layout System](#ui-layout-system)
- [State Management](#state-management)
- [Canvas Rendering Strategy](#canvas-rendering-strategy)
- [Key Implementation Details](#key-implementation-details)
- [Best Practices](#best-practices)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)

---

## Design Principles

### High-Level Intentions

The application implements a **dual-mode architecture** to support two distinct workflows:

1. **Chunk Editor Mode**: Frame-by-frame animation creation with drawing tools
2. **Montage Editor Mode**: Timeline assembly of multiple animation chunks

Key design goals:

- **Isolation**: Each mode has isolated state to prevent cross-contamination
- **Safety**: Mode guards prevent incorrect function calls across modes
- **Clarity**: Clear UI ownership - each element belongs to one mode or is shared
- **Flexibility**: Bidirectional workflow - edit chunks, return to montage, repeat
- **Performance**: Efficient canvas rendering without memory leaks or state drift

### Core Challenges Addressed

1. **Canvas Leakage**: Preventing drawing tools from appearing in montage mode
2. **State Conflicts**: Avoiding undo/redo stack corruption between modes
3. **Playback Isolation**: Ensuring each mode has independent playback systems
4. **UI Synchronization**: Showing/hiding mode-specific controls cleanly
5. **User Experience**: Smooth transitions without losing work or context

---

## Mode Switching Architecture

### Entry Point: `setMode(mode)`

**Location**: `animator.html` line ~3515

**Purpose**: Central mode switching orchestrator that safely transitions between chunk and montage modes

**Function Signature**:
```javascript
function setMode(mode) {
  // mode: 'chunk' | 'montage'
}
```

**Execution Flow**:

```
setMode(mode)
  ├─> Check if already in target mode (early return)
  ├─> Check for unsaved changes (prompt user, allow cancel)
  ├─> Update currentMode variable
  ├─> Stop all active playback (both modes)
  ├─> Clean up source mode state
  │   ├─> If leaving chunk mode:
  │   │   ├─ Clear selection tool state
  │   │   ├─ Clear cursor position
  │   │   ├─ Reset canvas zoom/transform
  │   │   └─ Update toolbar visibility
  │   └─> If leaving montage mode:
  │       └─ (no cleanup needed - state persists)
  ├─> Show/hide mode-specific UI panels
  │   ├─ Toggle drawing panel visibility
  │   ├─ Toggle frame sidebar visibility
  │   ├─ Toggle montage sidebar visibility
  │   ├─ Toggle trim bar visibility
  │   └─ Toggle play buttons
  ├─> Update header hint text
  ├─> Disable/enable mode-specific actions
  ├─> Update CSS body class (chunk-mode vs montage-mode)
  ├─> Render canvas for target mode
  └─> Notify user of mode switch
```

### Key Variables

| Variable | Type | Purpose | Scope |
|----------|------|---------|-------|
| `currentMode` | `'chunk' \| 'montage'` | Tracks active editor mode | Global |
| `chunkEditorDirty` | `boolean` | Unsaved changes flag for chunk editor | Global |
| `montageEditorDirty` | `boolean` | Unsaved changes flag for montage editor | Global |

### Mode Guard Pattern

Functions that should only run in specific modes include guards:

```javascript
function renderMain() {
  // Mode guard: only render chunk content in chunk mode
  if(currentMode !== 'chunk'){
    console.warn('renderMain() called in montage mode - use renderCanvas() instead');
    return;
  }
  // ... chunk rendering logic
}

function renderPreviewFrameBytes(bytes, chunkInfo) {
  // Mode guard: only render montage content in montage mode
  if(currentMode !== 'montage'){
    console.warn('renderPreviewFrameBytes() called in chunk mode');
    return;
  }
  // ... montage rendering logic
}
```

---

## UI Layout System

### UI Element Ownership Matrix

The application's UI elements are categorized by mode ownership:

| UI Element | Chunk Editor | Montage Editor | Shared | Implementation |
|------------|--------------|----------------|--------|----------------|
| **Main canvas** (`#main`) | ✓ Editable, with tools | ✓ Read-only preview | Both (different rendering) | `renderMain()` vs `renderPreviewFrameBytes()` |
| **Drawing panel** (`#drawingPanel`) | ✓ Visible | ✗ Hidden | - | `style.display` toggled |
| **Frames sidebar** (`.sidebar`) | ✓ Visible | ✗ Hidden | - | `style.display` toggled |
| **Montage sidebar** (`#montageSidebar`) | ✗ Hidden | ✓ Visible | - | `style.display` toggled |
| **Trim bar** (`#trimBar`) | ✗ Hidden | ✓ Visible | - | `style.display` toggled |
| **Play button** | ✓ `#playBtn` | ✓ `#montagePlayBtn` | Separate buttons | Different playback systems |
| **Scrubber** (`#montageScrubber`) | ✓ Frame navigation | ✓ Global frame nav | Reused element | Different logic |
| **Project actions** | ✓ Save/Load/New/GIF | ✗ Disabled | Chunk-only | Buttons disabled in montage |
| **Theme toggle** (`#themeToggleBtn`) | ✓ | ✓ | Shared | Works in both modes |
| **Editor mode toggle** (`#editorToggle`) | ✓ | ✓ | Shared | Triggers `setMode()` |

### CSS Body Class Strategy

The `<body>` element receives a mode-specific class for CSS-based layout control:

```javascript
// In setMode()
if(isMontage){
  document.body.classList.add('montage-mode');
  document.body.classList.remove('chunk-mode');
} else {
  document.body.classList.add('chunk-mode');
  document.body.classList.remove('montage-mode');
}
```

**CSS Usage Examples**:
```css
/* Compact layout for montage mode */
body.montage-mode .stage {
  gap: 6px;
  padding: 10px;
}

/* Smaller canvas in montage mode on desktop */
body.montage-mode canvas#main {
  width: 480px;
  height: 480px;
}
```

### Dynamic Visibility Control

UI panels are shown/hidden using direct style manipulation:

```javascript
// Show/hide mode-specific panels
document.getElementById('drawingPanel').style.display = isMontage ? 'none' : '';
document.querySelector('.sidebar').style.display = isMontage ? 'none' : '';
document.getElementById('montageSidebar').style.display = isMontage ? '' : 'none';
document.getElementById('trimBar').style.display = isMontage ? '' : 'none';
```

---

## State Management

### Chunk Editor State (Isolated)

**Purpose**: Manages frame-by-frame drawing workflow

**Key Variables** (all global):

```javascript
// Frame data
let frames = [];              // Array<Uint8ClampedArray> - RGBA pixel data
let current = 0;              // Current frame index

// Drawing state
let tool = 'pencil';          // Active tool: 'pencil' | 'eraser' | 'soft' | 'select'
let brush = 1;                // Brush size (1-8)
let currentColor = {r, g, b, a}; // Active color

// Selection state
let selection = null;         // {x1, y1, x2, y2} or {path: [{x,y}...]}
let selectionData = null;     // Uint8ClampedArray of selected pixels
let selectionFloating = false; // true when selection can be dragged
let selectionDragging = false; // true during drag operation
let lassoPath = [];           // Array of {x, y} points

// UI state
let gridEnabled = false;      // Grid overlay toggle
let cursorPos = null;         // Brush preview position {x, y}
let canvasZoom = 1.0;         // Canvas zoom level (0.5-3.0)
let zoomLocked = false;       // Prevent accidental pinch-zoom

// History
let undoStacks = [];          // Per-frame undo stacks
let redoStacks = [];          // Per-frame redo stacks

// Dirty tracking
let chunkEditorDirty = false; // Unsaved changes flag
```

**Cleanup on Mode Exit**:

When switching from chunk to montage mode, `setMode()` clears:
- Selection state (`selection`, `selectionData`, `selectionFloating`, `selectionDragging`, `lassoPath`)
- Cursor position (`cursorPos`)
- Canvas zoom/transform (reset to 1.0)

**Rationale**: These are UI-specific states that don't need to persist when not in drawing mode. Frame data and undo history are preserved.

### Montage Editor State (Isolated)

**Purpose**: Manages timeline assembly workflow

**Key Variables** (all global):

```javascript
// Montage data
let montageChunks = [];       // Array of chunk objects
let selectedChunkIdx = -1;    // Currently selected chunk index

// Playback
let montagePlaying = false;   // Playback state
let _montagePos = {           // Playback position
  chunkIdx: 0,
  frameIdx: 0
};
let _montageTimer = null;     // setInterval timer handle

// UI state
let _trimDragging = null;     // Trim handle drag state
let _pendingInsertPosition = null; // Insertion point for batch import

// Dirty tracking
let montageEditorDirty = false; // Unsaved changes flag

// Integration state
let _editingChunkContext = null; // {chunkIdx: number} when editing chunk in chunk mode
```

**Cleanup on Mode Exit**:

When switching from montage to chunk mode:
- No cleanup needed - montage state persists
- Exception: Playback is stopped (`stopMontagePlayback()`)

**Rationale**: Montage data is expensive to rebuild and should persist across mode switches.

### Shared State

**Purpose**: Canvas infrastructure and configuration used by both modes

**Key Variables**:

```javascript
// Mode tracking
let currentMode = 'chunk';    // 'chunk' | 'montage'

// Canvas configuration (constants)
const W = 128, H = 128;       // Internal frame resolution
const DISPLAY = 512;          // On-screen canvas size
const FPS = 12;               // Playback frame rate

// Canvas elements (shared DOM)
const main = document.getElementById('main');
const ctx = main.getContext('2d');
const off = document.createElement('canvas'); // Offscreen buffer
const offCtx = off.getContext('2d');

// File paths (for save/load memory)
let lastProjectPath = null;
let lastMontagePath = null;

// Playback state (chunk mode)
let isPlaying = false;
```

---

## Canvas Rendering Strategy

### The Problem: Canvas Leakage

**Challenge**: The main canvas (`#main`) is shared between modes but needs to render completely different content:
- **Chunk mode**: Drawing canvas with tools (grid, selection, onion skin)
- **Montage mode**: Read-only preview with chunk metadata

**Anti-pattern** (what we avoid):
```javascript
// BAD: Direct rendering without mode awareness
function render() {
  // This might render chunk content in montage mode!
  offCtx.putImageData(frames[current]);
  ctx.drawImage(off, 0, 0);
}
```

### The Solution: Mode-Specific Rendering Functions

#### `renderCanvas()` - Mode-Aware Router (Public API)

**Location**: `animator.html` line ~1074

**Purpose**: Universal entry point that routes to correct mode-specific renderer

**When to Use**:
- Window resize events
- Global refresh events
- Any context where current mode is unknown

**Implementation**:
```javascript
function renderCanvas() {
  if(currentMode === 'montage'){
    renderMontagePreviewChunk(selectedChunkIdx);
  } else {
    renderMain();
  }
}
```

#### `renderMain()` - Chunk Editor Renderer (Mode-Specific)

**Location**: `animator.html` line ~1088

**Purpose**: Renders current frame with editing tools

**Safety**: Mode guard at entry warns if called in wrong mode

**Rendering Pipeline**:
```
renderMain()
  ├─> Check device pixel ratio
  ├─> Compose offscreen canvas:
  │   ├─ If playing: single frame
  │   └─ If editing: frame + onion skinning
  ├─> Draw to main canvas (scaled)
  ├─> Draw grid overlay (if enabled)
  ├─> Draw selection (if active)
  └─> Draw brush preview (if cursor visible)
```

**What it Renders**:
- Current frame with alpha blending
- Onion skin layers (ghosted previous frames)
- Grid overlay (rule of thirds)
- Selection rectangle/lasso
- Floating selection (if dragging)
- Brush preview indicator

#### `renderPreviewFrameBytes()` / `renderMontagePreviewChunk()` - Montage Editor Renderers (Mode-Specific)

**Location**: `animator.html` lines ~4473, ~4562

**Purpose**: Renders read-only chunk preview with metadata

**Safety**: Mode guard at entry warns if called in wrong mode

**Rendering Pipeline**:
```
renderMontagePreviewChunk(chunkIdx)
  ├─> Get chunk data
  ├─> Decode first frame of chunk
  ├─> Call renderPreviewFrameBytes(bytes, chunkInfo)
  │   ├─> Put image data on offscreen canvas
  │   ├─> Draw to main canvas (scaled)
  │   └─> Draw chunk info overlay (name, frame number)
  └─> Handle missing data (show placeholder)
```

**What it Renders**:
- Single frame from selected chunk
- Chunk name and frame number overlay
- No editing tools or overlays

### Rendering Function Reference

| Function | Mode | Called By | Purpose |
|----------|------|-----------|---------|
| `renderCanvas()` | Both | Window resize, generic refresh | Router to correct renderer |
| `renderMain()` | Chunk | Drawing, tool changes, frame nav | Render with editing tools |
| `renderPreviewFrameBytes()` | Montage | Chunk selection, playback | Render chunk preview |
| `renderMontagePreviewChunk()` | Montage | Mode switch, chunk selection | Wrapper for preview rendering |
| `composeWithOnionSkin()` | Chunk | `renderMain()` | Compose frame with onion layers |
| `composeFrameOnly()` | Chunk | `renderMain()` during playback | Single frame (no onion) |

---

## Key Implementation Details

### Mode Switching Event Handlers

**Toggle Buttons**:
```javascript
// Located around line ~3486-3487
toggleChunkBtn.addEventListener('click', () => setMode('chunk'));
toggleMontageBtn.addEventListener('click', () => setMode('montage'));
```

### Keyboard Shortcuts (Mode-Specific)

**Location**: `animator.html` line ~3046

**Implementation**:
```javascript
document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  
  // Chunk mode shortcuts
  if(currentMode === 'chunk'){
    if(k === 'a') addBlankAfterCurrent();
    if(k === 'd') duplicateAfterCurrent();
    if(k === 's') saveProject();
  }
  
  // Montage mode shortcuts
  if(currentMode === 'montage'){
    if(k === 'ArrowLeft') navigateMontageFrame(-1);
    if(k === 'ArrowRight') navigateMontageFrame(1);
    if(k === 'ArrowUp') navigateMontageChunk(-1);
    if(k === 'ArrowDown') navigateMontageChunk(1);
  }
});
```

### Event Handler Mode Guards

**Mouse/Touch Drawing**:
```javascript
// Only process drawing events in chunk mode
main.addEventListener('pointerdown', startDraw);

function startDraw(ev) {
  if(currentMode !== 'chunk') return; // Guard
  // ... drawing logic
}
```

**Wheel Events**:
```javascript
// Brush size adjustment only in chunk mode
main.addEventListener('wheel', e => {
  if(currentMode !== 'chunk') return; // Guard
  if(e.ctrlKey || e.metaKey || cKeyPressed){
    // Canvas zoom
  } else {
    // Brush size adjustment
  }
});
```

### Unsaved Changes Detection

**Location**: `animator.html` line ~1477

**Implementation**:
```javascript
function checkUnsavedChanges(action, skipOppositeMode = false) {
  const hasDirtyChanges = (currentMode === 'chunk') 
    ? chunkEditorDirty 
    : montageEditorDirty;
  
  if(hasDirtyChanges){
    return confirm(`You have unsaved changes in ${currentMode} editor. ${action} will lose these changes. Continue?`);
  }
  return true;
}
```

**Usage**:
- Before mode switch
- Before loading new project/montage
- Before creating new project
- On page unload (`beforeunload` event)

### Bidirectional Mode Integration

**Chunk → Montage**:
```javascript
// Insert current chunk into montage
function insertChunkToMontage() {
  const project = /* current chunk project */;
  setMode('montage');
  addMontageChunk(project);
}
```

**Montage → Chunk → Montage**:
```javascript
// Edit chunk in chunk editor
function editChunkInChunkEditor(chunkIdx) {
  _editingChunkContext = {chunkIdx};
  loadChunkIntoEditor(chunkIdx);
  setMode('chunk');
}

// Return edited chunk to montage
function returnChunkToMontage() {
  const updatedProject = saveProject();
  updateChunkInMontage(_editingChunkContext.chunkIdx, updatedProject);
  _editingChunkContext = null;
  setMode('montage');
}
```

---

## Best Practices

### 1. Always Use Mode-Aware Rendering

✅ **Good**:
```javascript
window.addEventListener('resize', renderCanvas); // Routes to correct mode
```

❌ **Bad**:
```javascript
window.addEventListener('resize', renderMain); // Always renders chunk mode!
```

### 2. Add Mode Guards to New Mode-Specific Functions

✅ **Good**:
```javascript
function newChunkFeature() {
  if(currentMode !== 'chunk'){
    console.warn('newChunkFeature() called in wrong mode');
    return;
  }
  // ... implementation
}
```

### 3. Clear State When Exiting a Mode

✅ **Good** (in `setMode()`):
```javascript
if(leavingChunkMode){
  selection = null;       // Clear UI state
  cursorPos = null;       // Clear UI state
  // Keep: frames, undoStacks (data)
}
```

❌ **Bad**:
```javascript
if(leavingChunkMode){
  frames = [];           // DON'T clear data!
  undoStacks = [];       // DON'T clear history!
}
```

### 4. Document Mode Ownership for New UI Elements

When adding new UI elements, document in this file:
- Which mode(s) own the element
- How visibility is controlled (CSS class vs `style.display`)
- State variables associated with the element

### 5. Test Mode Transitions After Canvas Changes

After modifying rendering code, test:
1. Switch to chunk mode → draw → switch to montage → verify no artifacts
2. Switch to montage mode → import chunk → switch to chunk → verify no leakage
3. Resize window in both modes → verify correct rendering

### 6. Use Separate Playback Systems

Each mode has its own playback:
- **Chunk**: `setPlaying()`, `isPlaying`, frame array playback
- **Montage**: `startMontagePlayback()`, `montagePlaying`, multi-chunk playback

Never mix playback states or timers between modes.

---

## Known Limitations

### 1. Single Canvas Element

**Limitation**: Both modes share the same `<canvas>` DOM element

**Implication**: Canvas state (transform, zoom) must be fully reset during mode switches

**Workaround**: `setMode()` explicitly resets canvas transforms when leaving chunk mode

### 2. No Undo Across Mode Switches

**Limitation**: Undo history is per-mode (chunk frames vs montage chunks)

**Implication**: Users can't undo actions after switching modes

**Rationale**: Undo stacks are structurally incompatible (pixel deltas vs chunk operations)

### 3. Mode State Not Persisted

**Limitation**: Chunk editor state (zoom, selection, tool) is cleared on mode exit

**Implication**: Users must reconfigure UI after returning to chunk mode

**Rationale**: Simplifies state management and prevents edge cases

### 4. Canvas Zoom Only in Chunk Mode

**Limitation**: Pinch-to-zoom and canvas zoom controls are chunk-mode only

**Implication**: Montage mode always shows canvas at 100% zoom

**Rationale**: Montage previews are meant to be read-only at fixed scale

---

## Future Improvements

### Potential Enhancements

1. **State Restoration**
   - **Goal**: Remember chunk editor state (zoom, tool, selection) when returning from montage
   - **Implementation**: Save chunk state snapshot on mode exit, restore on return
   - **Benefit**: Better user experience for round-trip editing workflows

2. **Unified Playback System**
   - **Goal**: Single playback engine that handles both modes
   - **Implementation**: Abstract playback into `Playback` class with mode-specific renderers
   - **Benefit**: Simpler code, easier to maintain

3. **Canvas Pool Architecture**
   - **Goal**: Separate `<canvas>` elements for chunk and montage modes
   - **Implementation**: Two canvas elements, swap visibility on mode switch
   - **Benefit**: Eliminates need for canvas state cleanup, faster mode switches

4. **Lazy UI Initialization**
   - **Goal**: Don't create montage UI until first use
   - **Implementation**: Defer montage sidebar rendering until mode switch
   - **Benefit**: Faster initial load, smaller DOM tree

5. **Mode Transition Animations**
   - **Goal**: Smooth fade/slide transitions between modes
   - **Implementation**: CSS transitions on visibility changes
   - **Benefit**: More polished user experience

6. **Mode-Specific Keyboard Maps**
   - **Goal**: More extensive keyboard shortcuts per mode
   - **Implementation**: Keyboard shortcut registry with mode filtering
   - **Benefit**: Power users can work faster

### Performance Optimizations

1. **Defer Canvas Clears**
   - Only clear canvas when actually switching modes (not on mode check)
   - Reduces unnecessary redraws

2. **Throttle Mode Guards**
   - Cache mode check results for high-frequency event handlers
   - Reduces conditional checks in tight loops

3. **Virtual Scrolling for Montage**
   - Render only visible chunks in montage sidebar
   - Improves performance with 100+ chunks

### Code Organization

1. **Extract Mode Logic to Modules**
   - `ChunkEditorMode.js` - Chunk-specific logic
   - `MontageEditorMode.js` - Montage-specific logic
   - `ModeManager.js` - Mode switching orchestration

2. **Formalize Mode API**
   - Define `IEditorMode` interface
   - Each mode implements: `enter()`, `exit()`, `render()`, `handleEvent()`

---

## Code Exploration Guide

### Finding Mode-Related Code

**Search patterns**:
```bash
# Find mode switching logic
grep -n "function setMode" animator.html

# Find mode guards
grep -n "if(currentMode" animator.html

# Find chunk-specific functions
grep -n "function.*[Ff]rame" animator.html

# Find montage-specific functions
grep -n "function.*[Mm]ontage" animator.html
```

**Key line numbers** (approximate):
- Mode switching: Lines ~3515-3610
- Chunk rendering: Lines ~1088-1230
- Montage rendering: Lines ~4473-4620
- Keyboard handlers: Lines ~3046-3080
- Event guards: Throughout pointer/wheel handlers

### Debugging Mode Issues

**Console checks**:
```javascript
// Check current mode
console.log('Current mode:', currentMode);

// Check mode state
console.log('Chunk dirty:', chunkEditorDirty);
console.log('Montage dirty:', montageEditorDirty);

// Check canvas state
console.log('Canvas zoom:', canvasZoom);
console.log('Selection active:', !!selection);
```

**Breakpoint locations**:
- `setMode()` entry - trace mode switches
- `renderCanvas()` - verify routing
- `renderMain()` / `renderPreviewFrameBytes()` - check rendering logic

---

## Appendix: Function Reference

### Mode Management Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `setMode(mode)` | ~3515 | Central mode switching orchestrator |
| `checkUnsavedChanges(action, skipOppositeMode)` | ~1477 | Prompt before losing work |

### Chunk Mode Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `renderMain()` | ~1088 | Render chunk canvas with tools |
| `composeWithOnionSkin(idx, depth)` | ~1006 | Compose frame with onion layers |
| `setPlaying(playing)` | ~1861 | Start/stop chunk playback |
| `applyStroke(ev)` | ~2149 | Handle drawing events |
| `insertFrame(afterIndex)` | ~1355 | Add new frame |
| `deleteCurrentFrame()` | ~1382 | Remove current frame |

### Montage Mode Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `renderMontagePreviewChunk(idx)` | ~4562 | Render montage canvas preview |
| `renderPreviewFrameBytes(bytes, info)` | ~4473 | Low-level preview rendering |
| `startMontagePlayback()` | ~4595 | Start montage playback |
| `stopMontagePlayback()` | ~4658 | Stop montage playback |
| `addMontageChunk(chunk, insertPos)` | ~3272 | Add chunk to timeline |
| `selectMontageChunk(idx, render)` | ~3331 | Select chunk in timeline |

### Shared Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `renderCanvas()` | ~1074 | Mode-aware rendering router |
| `notify(msg)` | ~1451 | Show toast notification |
| `saveProject()` | ~1497 | Export chunk project JSON |
| `loadProject(file)` | ~1557 | Import chunk project JSON |

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Maintainer**: Frame-by-Frame Animator team

For questions or clarifications, please open an issue on the GitHub repository.
