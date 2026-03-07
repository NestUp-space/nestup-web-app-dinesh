# Move Tool & Measurement Tool — Full PRD

**Product Requirements Document** for the Nestup 3D Cabinet Visualiser **Move Tool** and **Tape Measure (Measurement) Tool**. This document describes the complete user experience, shortcuts, behavior, flows, and what each tool does.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack (pin-to-pin)](#2-tech-stack-pin-to-pin)
3. [Designer-Wide Shortcuts](#3-designer-wide-shortcuts)
4. [Move Tool — Full PRD](#4-move-tool--full-prd)
5. [Measurement Tool — Full PRD](#5-measurement-tool--full-prd)
6. [File & Code Reference](#6-file--code-reference)

---

## 1. Overview

| Tool | Purpose | Activation |
|------|---------|------------|
| **Move Tool** | Move or copy cabinet boxes in 3D with snapping, axis lock, and numeric input. | Press **M** or select from toolbar. |
| **Measurement Tool** | Measure distances (point-to-point), create guide lines, and see hover dimensions on edges/faces. | Press **T** or select from toolbar. |

Both tools integrate with the same 3D canvas, store (designer store), and share global shortcuts (Undo/Redo, Delete, Escape, tool keys).

---

## 2. Tech Stack (pin-to-pin)

Technologies used by the **Designer**, **Move Tool**, and **Measurement Tool**, with a clear pin-to-pin mapping: **Technology → Where it’s used**.

### 2.1 High-level stack

| Layer | Technology | Version (approx.) | Notes |
|-------|------------|-------------------|--------|
| **Framework** | Next.js | 14.x | App router, pages, API routes. |
| **UI library** | React | 18.x | Components, hooks. |
| **Language** | TypeScript | 5.x | All frontend and tool logic. |
| **3D engine** | Three.js | 0.169.x | Scene, camera, rays, meshes, geometry. |
| **3D–React bridge** | React Three Fiber (@react-three/fiber) | 8.x | Canvas, `useFrame`, `useThree`, declarative 3D. |
| **3D helpers** | React Three Drei (@react-three/drei) | 9.x | `Line`, `Html`, raycasting helpers. |
| **State** | Zustand | 5.x | Designer store (boxes, walls, mode, undo/redo). |
| **Styling** | Tailwind CSS | 3.x | Overlays, VCB, panels, tooltips. |

### 2.2 Pin-to-pin: Technology → Tool / Feature

| Technology | Used in | What it does (pin-to-pin) |
|------------|--------|---------------------------|
| **Three.js** | Move, Measurement, Designer | 3D scene, `Raycaster`, `Ray`, `Plane`, `Vector3`, `BoxGeometry`, `MeshBasicMaterial`; ray–plane intersection for cursor→world position; coordinate conversion (data ↔ Three). |
| **@react-three/fiber** | Move, Measurement, Designer | `<Canvas>`, `useThree()` (camera, gl, size), `useFrame()`; pointer events on meshes (`onPointerDown`/`Move`/`Up`); R3F event types (`ThreeEvent`). |
| **@react-three/drei** | Move, Measurement | `<Line>` for measurement line, axis lines, guide lines; `<Html>` for 3D-space labels (measurement label, hover tooltip, snap label). |
| **Zustand** | Move, Measurement, Designer | Single designer store: `designMode`, `selectedBoxId`, `walls`, `moveBox`, `duplicateBox`, `measurementHistory`, `measureGuideLines`, `undo`/`redo`, `snapGridSize`, etc. |
| **React (hooks)** | Move, Measurement | `useState`, `useCallback`, `useEffect`, `useRef`, `useMemo`; `useDragInteraction`, `useMeasurementTool`, `useDesignerShortcuts`. |
| **TypeScript** | All | Types: `Position`, `Box`, `AABB`, `DragState`, `SnapResult`, `MeasurementResult`, `InferencePoint`, etc.; type-safe VCB parsing and store. |
| **Tailwind CSS** | Move overlay, Measurement overlay | VCB input, context menu, distance badge, axis/copy badges, mode indicator, history panel, tooltip styling. |
| **Next.js** | Designer page | Route for designer/visualiser; no tool-specific API—tools run fully in client. |

### 2.3 Pin-to-pin: Move Tool only

| Technology | Where in Move Tool |
|------------|---------------------|
| **Three.js** | `moveTool.ts`: Vec3, AABB, collision; `useDragInteraction`: `THREE.Ray`, `THREE.Plane`, `intersectPlane`; coordinate conversion `dataToThree` / `threeToData`. |
| **Zustand** | `useDesignerStore()`: `moveBox`, `duplicateBox`, `walls`, `activeWallId`, `snapEnabled`, `snapGridSize`, `setDesignMode`. |
| **React Three Fiber** | `MoveToolIntegration`: `useThree()` for camera/size; pointer on invisible hit-test mesh; `MoveVisuals` / `SnapIndicators` / `BoundingBoxGrips` inside canvas. |
| **Drei** | `MoveVisuals`: `<Line>` for axis lines; inference indicators (HTML/div). |
| **Tailwind** | `MoveToolScreenOverlay`: VCB form, axis badge (e.g. `bg-red-100`), copy badge, context menu. |

### 2.4 Pin-to-pin: Measurement Tool only

| Technology | Where in Measurement Tool |
|------------|---------------------------|
| **Three.js** | `measurementTool.ts`: `THREE.Camera`, `project()`, ray–plane for `getFloorPosition` / `getPositionAtHeight`; `measureDistance`, `getBoxEdges`, `getBoxFaces`; vector math for guides and angles. |
| **Zustand** | `useDesignerStore()`: `measurementMode`, `measurementHistory`, `measureGuideLines`, `addMeasurement`, `addMeasureGuideLine`, `deleteMeasureGuideLine`, `measureGuidesVisible`, `activeMeasurement`. |
| **React Three Fiber** | Canvas integration: `useMeasurementTool`; pointer move/down wired to canvas or document; `MeasurementVisuals` (lines, endpoints, guides) inside canvas. |
| **Drei** | `MeasurementVisuals`: `<Line>` for measurement line and infinite guide lines; `MeasurementOverlay`: `<Html>` for MeasurementLabel, HoverTooltip, SnapLabel. |
| **Tailwind** | `MeasurementOverlay` / `MeasurementScreenOverlay`: Length readout, mode indicator, history panel, hover tooltip (e.g. `bg-yellow-400`, `bg-gray-900/90`). |

### 2.5 Key dependencies (from package.json)

| Package | Purpose for Move / Measurement |
|---------|-------------------------------|
| `three` | 3D math, rays, planes, meshes. |
| `@react-three/fiber` | React renderer for Three.js; canvas and hooks. |
| `@react-three/drei` | `Line`, `Html`, and other 3D UI primitives. |
| `zustand` | Designer state (selection, move, measure, guides, undo). |
| `next` | App shell and designer route. |
| `react`, `react-dom` | Components and DOM. |
| `tailwindcss` | Overlay and form styling. |
| `typescript` | Static typing across all tool code. |

---

## 3. Designer-Wide Shortcuts

These apply across the designer when focus is not in an input/textarea.

| Shortcut | Action |
|----------|--------|
| **Ctrl+Z** | Undo |
| **Ctrl+Y** or **Ctrl+Shift+Z** | Redo |
| **Delete** / **Backspace** | Delete selected item (guideline → plank → box → wall, in that priority). |
| **Escape** | Deselect all; cancel guideline placement if placing; switch to **Select** mode. |
| **V** or **Space** | Select tool |
| **M** | Move tool |
| **R** | Rotate tool |
| **G** | Guidelines tool |
| **P** | Paint tool |
| **T** | Measure tool (Tape Measure) |
| **Arrow keys** (Select mode) | Nudge selected box by grid size (default 50mm). |
| **Shift + Arrow keys** (Select mode) | Nudge selected box by 1mm. |
| **Page Up / Page Down** (Select mode) | Move box up/down (Z); Shift = 1mm. |

When **Move tool** is active, arrow keys are used for **axis lock** (see Move Tool section) and are not used for nudging.

---

## 4. Move Tool — Full PRD

### 4.1 What the Move Tool Does

- **Move** a selected cabinet box to a new position in 3D.
- **Copy** a box (duplicate) when Copy mode is on; optional **linear array** (e.g. type `x5` to create 5 copies).
- Enforce **floor** (Z ≥ 0) and **wall** (back face) constraints; prevent **collision** with other boxes.
- **Snap** to grid, edges, corners, faces, wall, and floor; **magnetic** snap when near other boxes.
- **Lock** movement to Red (X), Green (Y), or Blue (Z) axis; **parallel/perpendicular** constraint (Down arrow).
- **Value Control Box (VCB)**: type a distance or expression and press Enter to move/copy by that value or to an absolute/relative position.

### 4.2 How You Use It (Experience)

1. **Select a box** (e.g. with Select tool), then press **M** to activate Move tool.
2. **Idle**: Selected box shows **bounding-box grips**. Cursor is **move** (or **copy** if Copy mode is on). Screen tip: *"Select point to move from"*.
3. **Click the box** (or drag slightly):
   - **Quick click** (no drag): Enters **moving** phase. A **ghost** of the box follows the cursor; you can lock axis, type a distance, or snap.
   - **Drag**: Same as above but you are already dragging the ghost.
4. **Moving phase**:
   - **Mouse**: Ghost follows cursor. Snaps to grid/edges/corners/wall/floor and to nearby boxes.
   - **Left-click** (or **Enter** after typing in VCB): **Place** the box at the ghost position (or create a copy if Copy mode is on).
5. **Escape** (3 levels):
   - If axis is locked → **unlock axis**.
   - If in moving/dragging → **cancel** move (ghost back to start, no move/copy).
   - If idle in Move tool → **exit Move tool** (back to Select).

### 4.3 Move Tool — Shortcuts & Modifiers

| Shortcut / Modifier | Action |
|---------------------|--------|
| **M** | Activate Move tool. |
| **Left-click on box** | Start move (two-click: enter moving phase; or start drag if you drag). |
| **Left-click (during moving)** | Place box at ghost (or place copy if Copy mode). |
| **X** | Lock movement to **Red (X)** axis. Press again to unlock. |
| **Y** | Lock to **Green (Y)** axis. Toggle. |
| **Z** | Lock to **Blue (Z)** axis. Toggle. |
| **Arrow Right** | Lock to X. |
| **Arrow Left** | Lock to Y. |
| **Arrow Up** | Lock to Z. |
| **Arrow Down** | 3-state: **Parallel** → **Perpendicular** → Off (to movement direction). |
| **Ctrl** (tap) | **Toggle Copy mode** (sticky). Ghost shows blue; next place creates a copy. |
| **Ctrl** (double-tap) | **Stamp mode**: each click places a copy. |
| **Alt** (hold) | Copy mode while held (hold-based copy). |
| **Shift** (hold while moving) | Temporarily lock to current **inference axis** and set **“From Point”** (magenta); release to unlock. |
| **Escape** | Unlock axis → Cancel move → Exit Move tool (see above). |
| **Right-click** | Context menu: Cancel Move, Lock to X/Y/Z, Copy Mode toggle. |

### 4.4 Value Control Box (VCB) — Move Tool

The VCB is the **Distance** input at bottom-right when Move tool is active.

- **While moving**: Shows current distance (mm) from start to ghost. You can **type** a value and press **Enter** to place at that distance (or at typed coordinates).
- **“Just type”**: When Move tool is active and in moving phase, digit/operator keys (and Enter/Backspace) are captured and sent to the VCB even if the input is not focused (unless focus is in another input/textarea).

**Supported formats (units: mm, cm, m, in, ", ', ft; default mm):**

| Input | Meaning |
|-------|--------|
| `500` or `500mm` | Move **500 mm** in current direction (or along locked axis). |
| `100,200` | Move **100** in X, **200** in Y (relative); Z unchanged. |
| `100,200,50` | Move **100** in X, **200** in Y, **50** in Z (relative). |
| `[100,200,50]` | Move to **absolute** position (100, 200, 50). |
| `<100,200,50>` | Move **relative** to start: start + (100, 200, 50). |
| `x5` or `5x` or `*5` | **Linear array**: 5 copies along current locked axis at current spacing (replace previous array if you had just done x3). |
| `/5` | **Divide** current offset into 5 segments; place 4 copies at those positions (axis must be locked). |

**Units:** e.g. `2'6"`, `50cm`, `0.5m`, `2in` are supported.

### 4.5 What You See (Visual Feedback)

- **Idle**: **Bounding-box grips** on the selected box.
- **Moving/Dragging**:
  - **Ghost** wireframe: **green** = valid position, **red** = invalid (e.g. collision), **blue** = Copy mode.
  - **Axis lines** (Red / Green / Blue): solid when that axis is locked, dashed otherwise.
  - **Snap indicators** (dots/lines) at snap points.
  - **Inference points** with labels (Endpoint, Midpoint, On Red/Green/Blue Axis, etc.).
  - **Screen tip**: e.g. *"On Red Axis from Point"*, *"Endpoint"*, *"Select point to move from"*, or *"Cannot place: Collision"*.
- **VCB**: Distance readout, axis badge (X/Y/Z), “+ COPY” when Copy mode is on.

### 4.6 Snap Types (Move Tool)

Snaps are applied when the ghost is near (with hysteresis to avoid flicker):

1. **Grid** — 50 mm increments.
2. **Edge** — Box edge midpoints align.
3. **Corner** — Box corners align.
4. **Wall** — Back face to wall (Y=0).
5. **Floor** — Bottom to floor (Z=0).
6. **Face** — Face-to-face (magnetic).
7. **Magnet** — Box-to-box when very close.

### 4.7 How It Works (Flow Summary)

1. User selects a box and presses **M** → `designMode === 'move'`; **MoveToolIntegration** mounts.
2. User **clicks** the (invisible) hit-test mesh on the box → **useDragInteraction** either enters **moving** phase (quick click) or starts **drag** (if pointer moves past threshold).
3. **Document** `pointermove`: Raycast from cursor; compute target position; apply axis lock, parallel/perp, snap, floor/wall, collision; update **ghost** and **inference points**; emit screen tip.
4. **Document** `pointerdown` (left, during moving): Call **place()** → update box position (or duplicate in Copy mode); clear ghost and return to idle (or stay in Move tool with box still selected).
5. **VCB** or “just type” + Enter → **applyNumericInput** parses input and either moves/places or creates array copies.
6. **Escape** handled in **useDragInteraction**: axis unlock → cancel move → **onExitTool** (set design mode back to Select).

---

## 5. Measurement Tool — Full PRD

### 5.1 What the Measurement Tool Does

- **Measure** distance between two points (click–click); show length and deltas (ΔX, ΔY, ΔZ).
- **Hover** over an edge or face to see **edge length** or **face area** in a tooltip.
- **Create guide lines**: axis-aligned (X/Y/Z), point-to-point, or **parallel to an edge** (with optional offset).
- **Snap** to endpoints, midpoints, box centers, and **guide-line intersections** when guides exist.
- **Axis lock** while measuring (arrow keys) to constrain the second point to X, Y, or Z.
- **History**: Last N measurements are kept; user can copy value or clear history.

### 5.2 Modes

| Mode | How to activate | What it does |
|------|-----------------|--------------|
| **Measure** | **T** (default when entering tool) | Click–click to measure distance; hover for edge/face dimensions. |
| **Guide Create** | **Hold Ctrl** while in Measure tool | Click to create guides (axis, point-to-point, or parallel from edge). |

Mode is shown in the UI (e.g. “Measure” vs “Guide Create (Ctrl)”).

### 5.3 How You Use It (Experience)

**Measure mode**

1. Press **T**; cursor changes when over canvas.
2. **Hover** over an **edge** → tooltip shows edge length (e.g. `600mm`). **Hover** over a **face** → tooltip shows area (e.g. `120000mm²`).
3. **First click**: Sets **start point** (snaps to endpoint/midpoint/center/guide intersection). A green line and red endpoints appear; moving the cursor updates the line and the length readout.
4. **Second click**: Sets **end point**; measurement is **completed** and added to **history**; line stays as a completed measurement label (distance + axis info + ΔX, ΔY, ΔZ).
5. **Arrow keys** (after first click): Lock second point to **X** (Right), **Y** (Left), **Z** (Up). Press same key again to unlock.

**Guide Create mode (Ctrl held)**

1. Hold **Ctrl**; mode indicator shows “Guide Create”.
2. **Axis guide**: Click a point, then press **X**, **Y**, or **Z** → creates an infinite axis guide (Red/Green/Blue) through that point.
3. **Point-to-point guide**: Click **first point**, then **second point** → creates a guide line through those two points.
4. **Parallel from edge**: **Click an edge** (highlights); move cursor to set offset; **second click** or **Enter** creates a parallel guide at that offset. **Double-click same edge** → instant guide along that edge.
5. **Enter** (when edge selected and offset set): Finalize parallel guide at current/typed offset.

### 5.4 Measurement Tool — Shortcuts

| Shortcut | Action |
|----------|--------|
| **T** | Activate Measure tool. |
| **Ctrl** (hold) | Switch to **Guide Create** mode. |
| **Ctrl** (release) | Switch back to **Measure** mode. |
| **Escape** | Cancel current measurement (clear start/current point); or cancel edge selection for parallel guide. |
| **Arrow Right** | Lock measurement to **X** (after first click). Toggle. |
| **Arrow Left** | Lock to **Y**. Toggle. |
| **Arrow Up** | Lock to **Z**. Toggle. |
| **Delete** / **Backspace** | Delete **selected guide line** (if one is selected). |
| **H** | Toggle **guide lines visibility** (show/hide all guides). |
| **X** (in Guide Create, with current point) | Create **X-axis** guide at current point. |
| **Y** (in Guide Create) | Create **Y-axis** guide at current point. |
| **Z** (in Guide Create) | Create **Z-axis** guide at current point. |
| **Enter** (in Guide Create, edge selected) | Create **parallel guide** at current offset. |

### 5.5 What You See (Visual Feedback)

- **Green** measurement line and **red** endpoint spheres during active measure.
- **Floating label** at midpoint: distance (e.g. `500.0mm`), axis if locked, ΔX/ΔY/ΔZ.
- **Hover tooltip**: Yellow; shows edge length or face area.
- **Snap label** near cursor when over an inference point (Endpoint, Midpoint, Center, Guide Intersection).
- **Guide lines**: Cyan (default) or axis color (Red/Green/Blue); infinite lines; selectable for deletion.
- **Screen overlay**: “Length: X.Xmm” (last or current), mode (Measure / Guide Create), **measurement history** list with copy/clear.

### 5.6 Inference Points (Measurement Tool)

Snap targets (within pixel threshold of cursor):

- **Endpoint** (box corners)
- **Midpoint** (edge midpoints)
- **Center** (box center)
- **Guide Intersection** (where two guide lines cross, when guides are visible)

Sorted by priority and distance; best snap is used for the next point.

### 5.7 How It Works (Flow Summary)

1. User presses **T** → `designMode === 'measure'`; **useMeasurementTool** and **MeasurementOverlay** / **MeasurementVisuals** are used.
2. **Pointer move**: Raycast + snap detection → **detectMeasurementInferences**; if not in active measure, **detectHoverMeasurement** for edge/face hover; update **snapPoint**, **hoverInfo**, **currentPoint** (if measuring).
3. **Pointer down** (left):
   - **Measure mode**: First click sets **startPoint** and **currentPoint**; second click calls **measureDistance**, **addMeasurement**, and clears start/current.
   - **Guide Create**: First click can set start point or select edge (for parallel); second click or Enter creates **createAxisGuide**, **createPointToPointGuide**, or **createParallelGuide** and calls **addMeasureGuideLine**.
4. **Keyboard**: Ctrl/Shift state, Escape (cancel), Arrow (axis lock), Delete (delete selected guide), X/Y/Z (axis guides in Guide Create), Enter (parallel guide), H (toggle guide visibility).
5. **History** and **Length** readout come from store (`measurementHistory`, last measurement); overlay shows list and copy/clear.

---

## 6. File & Code Reference

### 6.1 Move Tool

| File | Responsibility |
|------|----------------|
| `frontend/src/lib/visualiser/moveTool.ts` | Config, Vec3, AABB, collision, floor/wall, coordinate conversion. |
| `frontend/src/lib/visualiser/snapSystem.ts` | Snap types, collectSnapPoints, findBestSnap, hysteresis, box-to-box magnet, axis lock helpers. |
| `frontend/src/lib/visualiser/moveValidation.ts` | validatePosition (floor, wall, collision). |
| `frontend/src/lib/visualiser/moveInference.ts` | Inference points and labels for Move tool. |
| `frontend/src/hooks/useDragInteraction.ts` | Drag/move state, two-click vs drag, axis lock, Copy/Stamp, VCB parsing (applyNumericInput), place(), Escape levels. |
| `frontend/src/components/visualiser/designer/Canvas3D/MoveToolIntegration.tsx` | Renders hit-test mesh, BoundingBoxGrips, MoveVisuals + SnapIndicators; document pointermove/pointerdown; publishes `__moveToolCtx` for overlay. |
| `frontend/src/components/visualiser/designer/Canvas3D/MoveToolScreenOverlay` (in same file) | VCB input, distance display, axis/copy badges, “just type” key capture, context menu (Cancel, Lock X/Y/Z, Copy). |
| `frontend/src/components/visualiser/designer/Canvas3D/MoveVisuals.tsx` | Ghost box, axis lines, inference dots, from-point line. |
| `frontend/src/components/visualiser/designer/Canvas3D/SnapIndicators.tsx` | Snap feedback. |
| `frontend/src/components/visualiser/designer/Canvas3D/BoundingBoxGrips.tsx` | Idle bounding box grips. |
| `frontend/src/components/visualiser/designer/Canvas3D/ScreenTip.tsx` | Screen tip for Move (and others). |

### 6.2 Measurement Tool

| File | Responsibility |
|------|----------------|
| `frontend/src/lib/visualiser/measurementTool.ts` | measureDistance, getDominantAxis, getBoxEdges/getBoxFaces, detectHoverMeasurement, detectMeasurementInferences, createParallelGuide, createAxisGuide, createPointToPointGuide, constrainToAxis, guide intersection, chain/angle helpers. |
| `frontend/src/hooks/useMeasurementTool.ts` | State (mode, startPoint, currentPoint, hoverInfo, snapPoint, axis lock, clickedEdge, guideOffset); handlers (pointer move/down, key down/up); cancelMeasurement; sync with store. |
| `frontend/src/components/visualiser/designer/Canvas3D/MeasurementVisuals.tsx` | Measurement line, endpoints, infinite guide lines, snap indicator. |
| `frontend/src/components/visualiser/designer/Canvas3D/MeasurementOverlay.tsx` | MeasurementLabel, HoverTooltip, SnapLabel, ModeIndicator, MeasurementHistoryPanel; MeasurementScreenOverlay (Length readout, mode, history, clear). |

### 6.3 Shared

| File | Responsibility |
|------|----------------|
| `frontend/src/hooks/useDesignerShortcuts.ts` | Global shortcuts: Undo/Redo, Delete, Escape, V/M/R/G/P/T, Arrow/PageUp-Down nudge. |
| `frontend/src/store/designerStore.ts` | designMode, selectedBoxId, walls/boxes, moveBox, duplicateBox, measurement state, guide lines/points, etc. |
| `frontend/src/components/visualiser/designer/Canvas3D/index.tsx` | Mounts MoveToolIntegration, MoveToolOverlay, MeasurementOverlay, MeasurementToolScreenOverlay, ScreenTip; OrbitControls behavior when Move tool active. |

---

## Summary Table

| Aspect | Move Tool | Measurement Tool |
|--------|-----------|------------------|
| **Activation** | M | T |
| **Primary action** | Move/copy box | Measure distance; create guides |
| **Click** | Start move / place | Set start/end point; or create guide |
| **Axis lock** | X, Y, Z, Arrow keys, Down=parallel/perp | Arrow keys (X/Y/Z) after first click |
| **Copy / mode** | Ctrl = Copy; Alt = hold copy; double Ctrl = Stamp | Ctrl = Guide Create mode |
| **Numeric input** | VCB: distance, [x,y,z], \<x,y,z>, x5, /5 | — |
| **Escape** | Unlock → Cancel move → Exit tool | Cancel measure / edge selection |
| **Snap** | Grid, edge, corner, wall, floor, face, magnet | Endpoint, midpoint, center, guide intersection |
| **Visuals** | Ghost, axes, snap dots, inference, screen tip | Green line, red endpoints, labels, hover tooltip, guides |

This PRD and the file references above define the full experience and behavior of the Move and Measurement tools in the Nestup 3D Cabinet Visualiser.
