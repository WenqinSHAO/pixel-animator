# Architecture: Dual-Mode Editor System

This document provides detailed technical information about the dual-mode editor architecture in the Frame-by-Frame Animator. It explains the design principles, implementation details, and guidelines for maintaining and extending the mode switching system.

## Table of Contents
- [Design Principles](#design-principles)
- [Mode Switching Architecture](#mode-switching-architecture)
- [UI Layout System](#ui-layout-system)
- [Responsive UI Adaptation](#responsive-ui-adaptation)
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

## Responsive UI Adaptation

The application implements a comprehensive responsive design system to provide optimal user experience across different device types, from desktop workstations to touch-enabled tablets and e-ink devices.

### Design Philosophy

**Multi-Device Support Goals**:
- **Desktop/Laptop**: Maximize canvas size, side-by-side layout, keyboard-optimized
- **Touch Tablets**: Touch-friendly controls, gesture support, adaptive layout
- **E-ink Devices**: High-contrast theme, minimal animations, touch-optimized
- **Mobile Phones**: Vertical stacking, compact controls, essential features only

### Breakpoint Strategy

**Location**: `animator.html` lines ~148-234 (CSS media queries)

The application uses a **mobile-first responsive design** with four breakpoint tiers:

| Breakpoint | Target Devices | Layout Strategy | Canvas Size |
|------------|----------------|-----------------|-------------|
| **≥981px** | Desktop/Laptop | Two-column (stage + sidebar), height-constrained | 512×512px (480×480 in montage) |
| **768-980px** | Tablet Landscape | Single-column, width-constrained, scrollable | up to 800×800px |
| **481-767px** | Tablet Portrait / Large Phone | Single-column, compact controls | up to 500×500px |
| **≤480px** | Small Phone | Ultra-compact, vertical stack | up to 400×400px |

**Implementation**:
```css
/* Wide screens: Two-column layout with fixed height */
@media (min-width:981px) {
  .wrap {
    display: grid;
    grid-template-columns: 1fr 320px;
    height: calc(100vh - 60px);
  }
  body.montage-mode canvas#main {
    width: 480px; height: 480px; /* Reduced for scrubber visibility */
  }
}

/* Narrow screens: Single-column with dynamic width */
@media (max-width:980px) {
  .wrap {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
  canvas#main {
    width: min(calc(100vw - 40px), 700px);
    height: min(calc(100vw - 40px), 700px);
  }
}
```

### Touch-Friendly Enhancements

**Location**: `animator.html` lines ~66-74 (CSS), ~4706-4865 (JavaScript)

#### CSS Adaptations

**Media Query**: `@media (pointer: coarse)` - Targets touch-enabled devices

**Enhancements**:
```css
@media (pointer: coarse) {
  button {
    min-height: 44px;    /* Apple's touch target minimum */
    min-width: 44px;
    padding: 10px 12px;
    font-size: 13px;
  }
  .iconBtn {
    min-width: 44px;
    min-height: 44px;
  }
  input[type="range"] {
    height: 44px;        /* Easier slider thumb grabbing */
  }
  .thumb {
    min-height: 60px;
    cursor: grab;        /* Visual affordance for dragging */
  }
  .thumb:active {
    cursor: grabbing;
  }
}
```

**Rationale**: Touch targets below 44×44px are difficult to tap accurately (Apple HIG, Material Design)

#### Smooth Scrolling

**Implementation**:
```css
.sidebar, .framesWrap, #montageChunks {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;  /* iOS momentum scrolling */
  scroll-behavior: smooth;            /* Smooth programmatic scrolls */
}
```

**Benefit**: Native-like scrolling feel on mobile devices

### Touch Gesture Support

#### Pinch-to-Zoom

**Location**: `animator.html` lines ~4706-4832

**Purpose**: Canvas zoom via two-finger pinch gesture (chunk mode only)

**Key Variables**:
```javascript
let touchStartDistance = 0;      // Distance between touch points at start
let touchStartZoom = 1.0;        // Zoom level at gesture start
let isPinching = false;          // Flag to prevent drawing during pinch
let activeTouchIds = new Set();  // Track active touch IDs
let zoomLocked = false;          // User-controlled zoom lock
```

**Implementation Flow**:
```
touchstart (2+ fingers)
  ├─> Check zoomLocked (abort if locked)
  ├─> Calculate initial touch distance
  ├─> Set isPinching = true
  └─> Store touchStartZoom

touchmove (2 fingers)
  ├─> Check zoomLocked (abort if locked)
  ├─> Calculate current touch distance
  ├─> Compute scale = currentDistance / touchStartDistance
  ├─> Apply newZoom = touchStartZoom × scale (clamped 0.5-3.0)
  ├─> Update canvas transform
  └─> Update zoom button label

touchend (< 2 fingers remaining)
  ├─> Clear touchStartDistance
  ├─> Set isPinching = false (with 200ms delay)
  └─> Double-tap detection → reset zoom to 100%
```

**Mode Safety**: Pinch gesture only active in chunk mode
```javascript
function handleTouchStart(e) {
  if(currentMode !== 'chunk') return; // Guard
  if(zoomLocked && e.touches.length >= 2) {
    e.preventDefault();
    return; // Respect zoom lock
  }
  // ... gesture handling
}
```

**Drawing Protection**: Prevents accidental strokes during pinch
```javascript
function startDraw(ev) {
  if(isPinching) return;
  if(ev.pointerType === 'touch' && activeTouchIds.size > 1) return;
  // ... drawing logic
}
```

#### Zoom Lock Feature

**Location**: `animator.html` line ~330 (UI button), ~2344 (handler)

**Purpose**: Prevent accidental pinch-zoom when drawing with stylus on tablets

**UI Control**:
```html
<button id="zoomLockBtn">🔓 Zoom Unlocked</button>
```

**Behavior**:
- **Manual Toggle**: User clicks button to lock/unlock zoom
- **Automatic Lock**: Selecting drawing tool (pencil/soft/eraser) auto-locks
- **Automatic Unlock**: Deselecting tool (click active tool again) auto-unlocks

**Implementation**:
```javascript
function setTool(next) {
  const prevTool = tool;
  tool = (tool === next) ? null : next;
  
  // Auto zoom lock on drawing tool selection
  if(tool !== null && tool !== 'select' && prevTool === null) {
    zoomLocked = true;
    zoomLockBtn.textContent = '🔒 Zoom Locked';
  } else if(tool === null && prevTool !== null) {
    zoomLocked = false;
    zoomLockBtn.textContent = '🔓 Zoom Unlocked';
  }
}
```

**Rationale**: Artists using stylus on tablets often accidentally trigger pinch gestures while drawing. Auto-lock prevents this frustration.

### E-ink Device Optimizations

**Location**: `animator.html` lines ~13-34 (CSS theme)

#### Light Theme

**Purpose**: High-contrast black-on-white theme for e-ink displays (e.g., reMarkable, Boox tablets)

**CSS Variables**:
```css
/* Dark theme (default) */
:root {
  --bg: #0b0f17;
  --text: #e6eefc;
  --accent: #5aa2ff;
}

/* Light theme for e-ink */
body.light-theme {
  --bg: #f5f5f5;
  --text: #000000;
  --accent: #0066cc;
  --panel: #ffffff;
  --border: #cccccc;
}
```

**Key Characteristics**:
- Pure white backgrounds (#ffffff) - maximizes e-ink contrast
- Pure black text (#000000) - no gradients, no gray text
- Simplified shadows - e-ink doesn't render gradients well
- No blur effects - backdrop-filter removed

**Toggle UI**:
```html
<button id="themeToggleBtn">☀️ Light</button>
```

**Persistence**:
```javascript
// Save theme to localStorage
localStorage.setItem('theme', theme);

// Restore on page load
const currentTheme = localStorage.getItem('theme') || 'dark';
applyTheme(currentTheme);
```

#### Touch-Friendly Scrollbars

**Implementation**:
```css
/* Custom scrollbar styling (not shown in code, but implicit) */
/* Wider scrollbars (16px) for easier touch dragging */
```

### Canvas Scaling Strategy

**Location**: `animator.html` lines ~148-234 (responsive media queries)

**Challenge**: Canvas must scale to maximize screen space while maintaining aspect ratio

**Solution**: Dynamic size calculation with breakpoint-specific maximums

**Desktop Strategy** (≥981px):
```css
canvas#main {
  width: 512px;
  height: 512px;
}
body.montage-mode canvas#main {
  width: 480px;  /* Reduced to ensure scrubber visible */
  height: 480px;
}
```

**Mobile Strategy** (≤980px):
```css
canvas#main {
  width: min(calc(100vw - 40px), 700px);
  height: min(calc(100vw - 40px), 700px);
  max-width: calc(100vw - 40px);
}
```

**Benefits**:
- Adapts to actual viewport width
- Leaves margin for UI chrome
- Prevents horizontal scrolling
- Maintains square aspect ratio

### Responsive Frame Grid

**Location**: `animator.html` line ~118 (CSS)

**Adaptation Strategy**:

| Screen Width | Grid Columns | Thumbnail Size | Rationale |
|--------------|--------------|----------------|-----------|
| ≥981px (Desktop) | 4 columns | ~120px | Maximize preview detail |
| 481-980px (Tablet) | 4 columns | ~100px | Balance detail vs space |
| ≤480px (Phone) | 2 columns | ~80px | Fit narrow screens |

**CSS Implementation**:
```css
.frames {
  display: grid;
  grid-template-columns: repeat(4, 1fr);  /* Default */
  gap: 12px;
}

@media (max-width:768px) {
  .frames {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width:480px) {
  .frames {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### Header Double-Tap Scroll

**Location**: `animator.html` lines ~4836-4865

**Purpose**: Quick scroll-to-top on narrow layouts where header is off-screen

**Implementation**:
```javascript
let headerLastTouchTime = 0;

headerElement.addEventListener('touchend', (e) => {
  const now = Date.now();
  const timeSinceLastTap = now - headerLastTouchTime;
  
  if(timeSinceLastTap < 300 && timeSinceLastTap > 0) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    notify('Scrolled to top');
    headerLastTouchTime = 0; // Reset
  } else {
    headerLastTouchTime = now;
  }
});
```

**UX Enhancement**: On long pages (tablets in portrait), users can quickly return to top by double-tapping sticky header

### Pull-to-Refresh Prevention

**Location**: `animator.html` line ~37 (CSS)

**Problem**: Mobile browsers trigger pull-to-refresh when scrolling past top

**Solution**:
```css
body {
  overscroll-behavior: none;  /* Prevent pull-to-refresh */
  overflow: auto;             /* Allow scrolling */
  min-height: 100vh;
}
```

**Benefit**: Drawing gestures don't accidentally trigger browser refresh

### Performance Considerations

#### Touch Event Optimization

**Passive Event Listeners**: Used where possible to improve scroll performance
```javascript
// Passive listeners for non-blocking scroll
headerElement.addEventListener('touchend', handler, {passive: true});

// Non-passive where preventDefault needed
main.addEventListener('touchstart', handleTouchStart, {passive: false});
```

#### Canvas Transform vs Redraw

**Strategy**: Use CSS transforms for zoom (GPU-accelerated) rather than redrawing
```javascript
// Fast: Transform existing canvas
main.style.transform = `translate(-50%, -50%) scale(${canvasZoom})`;

// Slow: Redraw at new size (avoided)
// main.width = DISPLAY * canvasZoom;  // ❌ Triggers expensive redraw
```

### Testing Responsive Behavior

**Browser DevTools**:
1. Open Chrome DevTools → Device Toolbar (Ctrl+Shift+M)
2. Test breakpoints: 1200px, 980px, 768px, 480px, 320px
3. Test touch emulation: Enable touch simulation
4. Test zoom: Use pinch gesture emulation

**Real Device Testing**:
- **iPad/Android Tablet**: Test pinch-to-zoom, zoom lock, touch targets
- **E-ink Tablet**: Test light theme contrast, scrollbar visibility
- **Phone**: Test vertical scrolling, compact layout, button sizes

### Known Responsive Issues

1. **Canvas Zoom in Montage Mode**: Not implemented (by design - read-only preview)
2. **Zoom Lock Persistence**: Not saved to localStorage (resets on page reload)
3. **Touch Rejection**: May not distinguish palm vs finger on all devices
4. **Landscape Phone Layout**: Uses portrait strategy (could be optimized)

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

> **Note**: This section is synchronized with TODO.md. Items marked "See TODO.md" are tracked as future work.

### 1. Single Canvas Element

**Limitation**: Both modes share the same `<canvas>` DOM element

**Implication**: Canvas state (transform, zoom) must be fully reset during mode switches

**Workaround**: `setMode()` explicitly resets canvas transforms when leaving chunk mode

**Future**: Consider canvas pool architecture (see Future Improvements #3)

### 2. No Undo Across Mode Switches

**Limitation**: Undo history is per-mode (chunk frames vs montage chunks)

**Implication**: Users can't undo actions after switching modes

**Rationale**: Undo stacks are structurally incompatible (pixel deltas vs chunk operations)

**Status**: By design - unlikely to change

### 3. Mode State Not Persisted

**Limitation**: Chunk editor state (zoom, selection, tool) is cleared on mode exit

**Implication**: Users must reconfigure UI after returning to chunk mode

**Rationale**: Simplifies state management and prevents edge cases

**Future**: State restoration feature proposed (see Future Improvements #1)

### 4. Canvas Zoom Only in Chunk Mode

**Limitation**: Pinch-to-zoom and canvas zoom controls are chunk-mode only

**Implication**: Montage mode always shows canvas at 100% zoom

**Rationale**: Montage previews are meant to be read-only at fixed scale

**Status**: By design

### 5. Lasso Selection Incomplete

**Limitation**: Lasso cut/copy/paste partially implemented (visual selection only)

**Implication**: Users can draw lasso selection but can't extract/paste the selected region

**Status**: See TODO.md - Low Priority enhancement

### 6. No Recent Files List

**Limitation**: No persistent history of recently loaded projects/montages

**Implication**: Users must navigate file system to reload recent work

**Status**: See TODO.md - Medium Priority enhancement (localStorage-based)

### 7. Limited Drawing Tools

**Limitation**: Only pencil, soft brush, and eraser available

**Implication**: No line, rectangle, circle, or fill tools

**Status**: See TODO.md - Low Priority enhancement

### 8. No Import from GIF/Video

**Limitation**: Can't import existing GIF or video files as frame sequences

**Implication**: Only supports creating animations from scratch or loading project JSON

**Status**: See TODO.md - Extensibility feature (requires gif.js decoder / ffmpeg.wasm)

### 9. Zoom Lock Not Persistent

**Limitation**: Zoom lock state resets on page reload

**Implication**: Users must re-enable zoom lock each session

**Rationale**: Simplifies state management; unclear if users want persistent lock

**Future**: Could be added to localStorage preferences

### 10. No Performance Optimizations for Large Projects

**Limitation**: All frames/chunks loaded in memory; no lazy loading or virtual scrolling

**Implication**: Performance degrades with 100+ frames or chunks

**Status**: See TODO.md - Performance Optimizations (lazy loading, virtual scrolling, web workers)

---

## Future Improvements

> **Note**: This section is synchronized with TODO.md. For implementation status, check TODO.md.

### Architecture & Core Features

1. **State Restoration**
   - **Goal**: Remember chunk editor state (zoom, tool, selection) when returning from montage
   - **Implementation**: Save chunk state snapshot on mode exit, restore on return
   - **Benefit**: Better user experience for round-trip editing workflows
   - **Status**: TODO.md - Not scheduled

2. **Unified Playback System**
   - **Goal**: Single playback engine that handles both modes
   - **Implementation**: Abstract playback into `Playback` class with mode-specific renderers
   - **Benefit**: Simpler code, easier to maintain
   - **Status**: TODO.md - Not scheduled

3. **Canvas Pool Architecture**
   - **Goal**: Separate `<canvas>` elements for chunk and montage modes
   - **Implementation**: Two canvas elements, swap visibility on mode switch
   - **Benefit**: Eliminates need for canvas state cleanup, faster mode switches
   - **Status**: TODO.md - Not scheduled

4. **Lazy UI Initialization**
   - **Goal**: Don't create montage UI until first use
   - **Implementation**: Defer montage sidebar rendering until mode switch
   - **Benefit**: Faster initial load, smaller DOM tree
   - **Status**: TODO.md - Performance Optimizations

5. **Mode Transition Animations**
   - **Goal**: Smooth fade/slide transitions between modes
   - **Implementation**: CSS transitions on visibility changes
   - **Benefit**: More polished user experience
   - **Status**: TODO.md - Not scheduled

6. **Mode-Specific Keyboard Maps**
   - **Goal**: More extensive keyboard shortcuts per mode
   - **Implementation**: Keyboard shortcut registry with mode filtering
   - **Benefit**: Power users can work faster
   - **Status**: TODO.md - Not scheduled

### User Experience Enhancements

7. **Recent Files List**
   - **Goal**: Quick access to recently loaded projects/montages
   - **Implementation**: localStorage-based history with file paths
   - **Benefit**: Faster workflow for users working on multiple projects
   - **Status**: TODO.md - Medium Priority

8. **Project Metadata Fields**
   - **Goal**: Optional title, author, description for better organization
   - **Implementation**: Add metadata fields to project JSON schema
   - **Benefit**: Better project management, especially in montage assembly
   - **Status**: TODO.md - Medium Priority

9. **Export Presets**
   - **Goal**: Save common GIF/WebM export settings
   - **Implementation**: localStorage presets with size, quality, loop count
   - **Benefit**: Faster exports for users with standard output formats
   - **Status**: TODO.md - Medium Priority

### Drawing Tools & Features

10. **Drawing Tools Expansion**
    - **Goal**: Add line, rectangle, circle, fill tools
    - **Implementation**: Extend `tool` variable and `applyStroke()` logic
    - **Benefit**: More creative flexibility for artists
    - **Status**: TODO.md - Low Priority

11. **Lasso Selection Completion**
    - **Goal**: Implement cut/copy/paste for lasso selections
    - **Implementation**: Extend selection logic to extract polygon-bounded pixels
    - **Benefit**: More flexible selection workflow
    - **Status**: TODO.md - Low Priority (partially implemented)

### Extensibility & Import/Export

12. **Import from GIF**
    - **Goal**: Convert GIF to frame sequences
    - **Implementation**: Use gif.js decoder or similar library
    - **Benefit**: Allows editing existing GIF animations
    - **Status**: TODO.md - Extensibility

13. **Import from Video**
    - **Goal**: Convert video files to frame sequences
    - **Implementation**: Use ffmpeg.wasm for frame extraction
    - **Benefit**: Enables video-to-animation workflow
    - **Status**: TODO.md - Extensibility

### Effects & Filters

14. **Basic Image Processing**
    - **Goal**: Invert, brightness, contrast adjustments
    - **Implementation**: Canvas pixel manipulation with ImageData
    - **Benefit**: Quick corrections without external tools
    - **Status**: TODO.md - Effects & Filters

15. **Blur/Sharpen Filters**
    - **Goal**: Applied to frames or ranges
    - **Implementation**: Convolution filters on pixel data
    - **Benefit**: Post-processing effects
    - **Status**: TODO.md - Effects & Filters

16. **Color Adjustments**
    - **Goal**: Grayscale curve editor
    - **Implementation**: Lookup table-based color remapping
    - **Benefit**: Fine-tuned color grading
    - **Status**: TODO.md - Effects & Filters

17. **Interpolation (Tweening)**
    - **Goal**: Auto-generate in-between frames
    - **Implementation**: Linear or ease-based pixel interpolation
    - **Benefit**: Smoother animations with less manual work
    - **Status**: TODO.md - Effects & Filters

### Performance Optimizations

18. **Lazy Loading**
    - **Goal**: Load chunk frames on-demand rather than all at once
    - **Implementation**: Async frame decoding with loading indicators
    - **Benefit**: Faster montage loading, lower memory usage
    - **Status**: TODO.md - Performance Optimizations

19. **Web Workers**
    - **Goal**: Move GIF encoding/decoding to background threads
    - **Implementation**: Offload heavy computation to workers
    - **Benefit**: Non-blocking UI during export/import
    - **Status**: TODO.md - Performance Optimizations (GIF encoding already uses worker)

20. **Virtual Scrolling**
    - **Goal**: Render only visible chunks/frames in lists
    - **Implementation**: Intersection Observer API with dynamic DOM updates
    - **Benefit**: Better performance with 100+ items
    - **Status**: TODO.md - Performance Optimizations

21. **Canvas Optimization**
    - **Goal**: Use OffscreenCanvas where supported
    - **Implementation**: Feature detection + worker-based rendering
    - **Benefit**: Better performance, reduced main thread blocking
    - **Status**: TODO.md - Performance Optimizations

22. **Incremental Thumbnail Rendering**
    - **Goal**: Don't block UI while generating all thumbnails
    - **Implementation**: requestIdleCallback or chunked rendering
    - **Benefit**: Smoother UI during project load
    - **Status**: TODO.md - Performance Optimizations

### Code Organization

23. **Extract Mode Logic to Modules**
    - **Goal**: Split monolithic HTML file into maintainable modules
    - **Implementation**: 
      - `ChunkEditorMode.js` - Chunk-specific logic
      - `MontageEditorMode.js` - Montage-specific logic
      - `ModeManager.js` - Mode switching orchestration
    - **Benefit**: Better code organization, easier testing, clearer separation of concerns
    - **Status**: Long-term refactoring (would break self-contained architecture)

24. **Formalize Mode API**
    - **Goal**: Define `IEditorMode` interface with standard methods
    - **Implementation**: Each mode implements: `enter()`, `exit()`, `render()`, `handleEvent()`
    - **Benefit**: Consistent mode behavior, easier to add new modes
    - **Status**: Dependent on #23 (module extraction)

### Montage-Specific

25. **Chunk Groups/Folders**
    - **Goal**: Organize chunks into logical groups for large projects
    - **Implementation**: Add grouping metadata to montage JSON
    - **Benefit**: Better organization for complex montages (50+ chunks)
    - **Status**: TODO.md - Low Priority

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
