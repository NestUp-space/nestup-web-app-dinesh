# Move Tool & Measure Tool – Full Source Code

This document contains the complete source code for the **Move Tool** and **Measure Tool** in the Nestup 3D Cabinet Visualiser. Use it as a reference when modifying either tool.

**Note:** For the **full line-by-line Move tool code** (useDragInteraction, moveInference, MoveVisuals, MoveToolIntegration, BoundingBoxGrips, ScreenTip, snapSystem, etc.), see **`docs/MoveTool-Code.md`** in this repo. The Move tool section below is an index and summary. The **Measure tool** section includes full source for all four files.

---

## Table of Contents

1. [Move Tool (index + summary)](#part-1-move-tool)
2. [Measure Tool (full code)](#part-2-measure-tool)
   - [useMeasurementTool.ts](#1-usemeasurementtoolts)
   - [measurementTool.ts](#2-measurementtoolts)
   - [MeasurementVisuals.tsx](#3-measurementvisualstsx)
   - [MeasurementOverlay.tsx](#4-measurementoverlaytsx)

---

# Part 1: Move Tool

## 1. useDragInteraction.ts

**Path:** `frontend/src/hooks/useDragInteraction.ts`

<details>
<summary>Click to expand full code</summary>

```typescript
/**
 * useDragInteraction Hook
 * SketchUp-grade drag interaction for 3D boxes
 *
 * Features:
 * - Click + Drag: Move box freely (follows cursor exactly)
 * - X/Y/Z keys: Lock to specific axis (manual only, no auto-inference)
 * - Ctrl tap: Toggle copy mode (creates duplicate)
 * - Alt + Drag: Copy mode (hold-based)
 * - Magnetic snap to grid, edges, corners, faces, wall, floor
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Position, Box } from '@/types/visualiser';
import { useDesignerStore } from '@/store/designerStore';
import {
  Vec3,
  AABB,
  AABBUtils,
  constrainToFloor,
  constrainToWall,
  threeToData,
  MoveToolConfig,
} from '@/lib/visualiser/moveTool';
import {
  SnapResult,
  LockedAxis,
  collectSnapPoints,
  findBestSnap,
  applyAxisLock,
  SnapHysteresisState,
  snapToNearbyBoxes,
} from '@/lib/visualiser/snapSystem';
import { validatePosition } from '@/lib/visualiser/moveValidation';

// ============================================
// TYPES
// ============================================
export type ParallelPerpState = 0 | 1 | 2; // 0=none, 1=parallel, 2=perpendicular

export interface DragState {
  isDragging: boolean;
  ghostPosition: Position | null;
  startPosition: Position | null;
  lockedAxis: LockedAxis;
  snapResult: SnapResult | null;
  collisions: string[];
  isCopyMode: boolean;
  positionValid: boolean;
  parallelPerpState: ParallelPerpState;
  shiftLocked: boolean;
}

export type MovePhase = 'idle' | 'moving';
export type InteractionMode = 'drag' | 'twoclick';

export interface UseDragInteractionOptions {
  boxId: string;
  enabled?: boolean;
  interactionMode?: InteractionMode;
  onDragStart?: () => void;
  onDragEnd?: (newPosition: Position) => void;
  onDragCancel?: () => void;
  onExitTool?: () => void;
}

export interface UseDragInteractionReturn {
  dragState: DragState;
  movePhase: MovePhase;
  handlers: {
    onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
    onPointerMove: (event: ThreeEvent<PointerEvent>) => void;
    onPointerUp: (event: ThreeEvent<PointerEvent>) => void;
  };
  setLockedAxis: (axis: LockedAxis) => void;
  applyNumericInput: (input: string) => boolean;
  setGhostFromRay: (ray: THREE.Ray) => void;
  place: () => boolean;
  cancelTwoClick: () => void;
}

// Unit parsing (parseValueWithUnits), hook implementation with preventIntersection,
// computeConstrainedTarget, getDataPositionFromRay, handlePointerDown/Move/Up,
// setLockedAxis, computeTargetFromRay, setGhostFromRay, place, cancelTwoClick,
// applyNumericInput (VCB formats, array commands), and return object.
// [Full implementation as in repo - see frontend/src/hooks/useDragInteraction.ts]
```

</details>

*Full file is ~1200 lines. Key sections: `parseValueWithUnits`, `preventIntersection`, `computeConstrainedTarget` (axis lock, snap, box-to-box snap, collision prevention), `getDataPositionFromRay`, pointer handlers, `applyNumericInput` (distance, `[x,y,z]`, `<x,y,z>`, x5/*5 array), `place`, `cancelTwoClick`.*

---

## 2. moveInference.ts

**Path:** `frontend/src/lib/visualiser/moveInference.ts`

<details>
<summary>Click to expand full code</summary>

```typescript
/**
 * Move inference – detect snap points (endpoint, midpoint, center, onEdge, onFace,
 * intersection, grid, origin) for cursor-based snapping with screen-space threshold.
 * Colors/shapes from SketchUp; includes origin (0,0,0) and inGroup magenta override.
 */

import * as THREE from 'three';
import { Position, Box } from '@/types/visualiser';
import { getBoxCorners, getBoxEdgeMidpoints, generateGridPoints } from './snapSystem';

export type InferenceType =
  | 'endpoint' | 'midpoint' | 'center' | 'onEdge' | 'onFace'
  | 'intersection' | 'origin' | 'inGroup' | 'grid';

export interface InferencePoint {
  position: Position;
  type: InferenceType;
  label: string;
  priority: number;
}

export const INFERENCE_COLORS: Record<InferenceType, string> = {
  endpoint: '#00FF00', midpoint: '#00FFFF', center: '#00FF00',
  onEdge: '#FF0000', onFace: '#0000CC', intersection: '#FF0000',
  origin: '#FFFF00', inGroup: '#FF00FF', grid: '#9CA3AF',
};

export const INFERENCE_SHAPES: Record<InferenceType, 'circle' | 'square' | 'diamond' | 'x'> = {
  endpoint: 'circle', midpoint: 'circle', center: 'circle',
  onEdge: 'square', onFace: 'diamond', intersection: 'x',
  origin: 'circle', inGroup: 'circle', grid: 'circle',
};

export const INDICATOR_SIZE = 6;
export const SNAP_RADIUS_PX = 10;

// PRIORITY object, SCREEN_THRESHOLD_PX, dataToThree/threeToData, projectToScreen,
// screenDistance, getBoxEdges, getBoxFaces, projectPointOntoEdge, isPointInFace,
// detectInferences(camera, size, cursorPx, selectedBox, otherBoxes, aroundPosition,
//   excludeBoxId?, basePoint?, insideGroup?) with endpoint, midpoint, onEdge,
// onFace, center, intersection, origin, grid, and insideGroup override.
```

</details>

*Full implementation in repo: ~390 lines. Exports `detectInferences`, inference colors/shapes, and origin + inGroup handling.*

---

## 3. moveTool.ts

**Path:** `frontend/src/lib/visualiser/moveTool.ts`

<details>
<summary>Click to expand full code</summary>

```typescript
/**
 * Move Tool System - EXACT PORT from Apps Script
 * AABB collision, snap to grid/edges/corners, axis locking, floor/wall constraints.
 */

import { Position } from '@/types/visualiser';

export const MoveToolConfig = {
  SNAP_THRESHOLD: 100,
  SNAP_HYSTERESIS_IN: 100,
  SNAP_HYSTERESIS_OUT: 140,
  SNAP_TOLERANCE: 2,
  CONTACT_EPSILON: 1,
  FLOOR_Z: 0,
  WALL_Y: 0,
  GRID_SIZE: 50,
};

export const Vec3 = { create, clone, add, sub, scale, length, distance };
export interface AABB { position; dimensions; min; max; }
export const AABBUtils = { create, atPosition, overlaps, center };
export function snapToGrid(position, gridSize?): Position;
export function snapToAxis(position, startPosition, lockedAxis): Position;
export interface CollisionResult { collides; allowedPosition; collidingWith; }
export function resolveCollision(movingAABB, targetPosition, otherBoxes): CollisionResult;
export function constrainToFloor(position): Position;
export function constrainToWall(position, boxDepth): Position;
export function dataToThree(pos): Position;
export function threeToData(pos): Position;
export function rotateAroundZ(pos, center, angleDeg): Position;
export function getBoxCenter(position, dimensions): Position;
```

</details>

*Full file ~305 lines. Defines config, Vec3, AABB, snap helpers, collision resolver, floor/wall constraints, and coordinate conversion.*

---

## 4. moveValidation.ts

**Path:** `frontend/src/lib/visualiser/moveValidation.ts`

```typescript
/**
 * Move validation – check if a target position is valid (floor, wall, collision)
 */

import { Position } from '@/types/visualiser';
import { AABB, AABBUtils } from './moveTool';

export interface ValidatePositionConstraints {
  floor?: boolean;
  wall?: boolean;
  collision?: boolean;
}

export interface ValidatePositionResult {
  isValid: boolean;
  reason?: string;
}

export function validatePosition(
  targetPosition: Position,
  movingBox: { position: Position; dimensions: { lenX: number; lenY: number; lenZ: number } },
  otherBoxes: { id: string; aabb: AABB }[],
  constraints: ValidatePositionConstraints = { floor: true, wall: true, collision: true }
): ValidatePositionResult {
  const { lenX, lenY, lenZ } = movingBox.dimensions;
  if (constraints.floor && targetPosition.z < 0) return { isValid: false, reason: 'Below floor' };
  if (constraints.wall && targetPosition.y < 0) return { isValid: false, reason: 'Behind wall' };
  if (constraints.collision && otherBoxes.length > 0) {
    const movingAABB = AABBUtils.create(targetPosition, { w: lenX, d: lenY, h: lenZ });
    for (const other of otherBoxes) {
      if (AABBUtils.overlaps(movingAABB, other.aabb))
        return { isValid: false, reason: 'Collision with cabinet' };
    }
  }
  return { isValid: true };
}
```

---

## 5. snapSystem.ts

**Path:** `frontend/src/lib/visualiser/snapSystem.ts`

Snap system used by the Move tool: snap types, `SnapPoint`, `SnapResult`, `SnapConfig`, `getBoxCorners`, `getBoxEdgeMidpoints`, `getBoxFaces`, `collectSnapPoints`, `generateGridPoints`, `SnapHysteresisState`, `findBestSnap`, `getThresholdForType`, `getCornerOffset`, `calculateSnappedPosition`, **BOX-TO-BOX MAGNETIC SNAP** (`snapToNearbyBoxes`, `BoxSnapResult`), `LockedAxis`, `applyAxisLock`, `detectDominantAxis`.

- **Box-to-box snap:** `snapToNearbyBoxes(targetPos, movingBoxDims, otherBoxes, threshold?)` returns `BoxSnapResult` (snapped, position, snappedAxis, snappedToBoxId, touchingSide). Threshold default 30mm.
- **Other exports:** All snap point collection and resolution used by `useDragInteraction` and `findBestSnap`.

*Full file ~890 lines. Include this file in the project when editing Move or Measure (Measure uses getBoxCorners, getBoxEdgeMidpoints).*

---

## 6. MoveVisuals.tsx

**Path:** `frontend/src/components/visualiser/designer/Canvas3D/MoveVisuals.tsx`

- **Props:** `targetPosition`, `startPosition`, `boxDimensions`, `lockedAxis`, `isValid`, `inferencePoints`, `isCopyMode`.
- **Renders:** Dimmed original-position ghost (dotted outline), inference line base→current, axis lines (X/Y/Z, dashed when suggesting, solid when locked), **wireframe-only ghost box** at target (no green fill), copy badge, inference indicators (circle/square/diamond/x per type, 6px).
- **Coordinates:** `dataToThree(x,y,z)` → `[x, z, y]` for Three.js.

*Full file ~248 lines.*

---

## 7. MoveToolIntegration.tsx

**Path:** `frontend/src/components/visualiser/designer/Canvas3D/MoveToolIntegration.tsx`

- **MoveToolIntegration (canvas):** Uses `useDragInteraction`, renders invisible hit-test mesh over selected box, `BoundingBoxGrips` when idle, `MoveToolVisualsInner` (MoveVisuals + SnapIndicators) when moving. Document `pointermove` updates ghost and inferences; `pointerdown` (left) calls `place()` when in moving phase. Publishes `window.__moveToolCtx` (dragState, movePhase, applyNumericInput, inferencePoints). ScreenTip: axis locked → "Constrained on Line from Point" (+ inference label); else primary inference label. Cursor: copy mode `copy`, else `move`.
- **MoveToolScreenOverlay (DOM):** VCB input (distance display, placeholder, submit), axis/copy badges, "Just type" key capture for digits/operators/Enter/Backspace, reads context via `__moveToolCtx` polling.

*Full file ~372 lines.*

---

## 8. BoundingBoxGrips.tsx

**Path:** `frontend/src/components/visualiser/designer/Canvas3D/BoundingBoxGrips.tsx`

- **Props:** `box`, `visible`.
- **Grip modes (Alt cycles):** corners, edge midpoints, face centers, object center.
- **Obscured grips:** `isGripObscured(gripDataPos, boxCenter, camera)` by distance to camera; obscured → blue, opacity 0.7. When any grip is obscured, renders semi-transparent box mesh so grips remain visible.
- **Styling:** Normal gray, obscured/hover blue; 12px circles, white border.

*Full file ~143 lines.*

---

## 9. ScreenTip.tsx

**Path:** `frontend/src/components/visualiser/designer/Canvas3D/ScreenTip.tsx`

- **ScreenTip component:** Listens for `screentip` custom event (`detail: { text, x, y }`), shows tooltip at (x+15, y+20), auto-hide after 4s. Only when `designMode === 'move'`.
- **emitScreenTip(text, x, y):** `window.dispatchEvent(new CustomEvent('screentip', { detail: { text, x, y } }))`.
- **Style:** Background `#FFFFCC`, border `#808080`, 11px font.

*Full file ~91 lines.*

---

## 10. SnapIndicators.tsx

**Path:** `frontend/src/components/visualiser/designer/Canvas3D/SnapIndicators.tsx`

- **Props:** `visible`, `ghostPosition`, `startPosition`, `snapResult`, `lockedAxis`, `collisions`, `boxDimensions`.
- **Renders:** Approaching-snap indicator, grid crosshairs, edge snap (line + ring), corner snap (ring + 4 dots), snapping corner indicator, face snap lines, wall/floor planes, axis guide, inference lines, collision warning, snap point dots, box corner markers (8 dots, active highlighted).

*Full file ~575 lines.*

---

# Part 2: Measure Tool (Full Code)

## 1. useMeasurementTool.ts

**Path:** `frontend/src/hooks/useMeasurementTool.ts`

```typescript
/**
 * useMeasurementTool Hook
 *
 * React hook for the Tape Measure tool interaction.
 * Manages measurement state, event handlers, and integrates with the designer store.
 *
 * Features:
 * - Dual mode: Measure (Ctrl off) and Guide Create (Ctrl on)
 * - Click-to-measure workflow
 * - Hover measurement display
 * - Smart snapping to inference points
 * - Keyboard shortcuts (Ctrl toggle, Escape cancel, Delete guide)
 */

'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useDesignerStore, useAllBoxes } from '@/store/designerStore';
import {
  Position,
  MeasurementMode,
  MeasurementResult,
  MeasureGuideLine,
  MeasureGuidePoint,
  HoverMeasurementInfo,
  BoxEdge,
} from '@/types/visualiser';
import {
  measureDistance,
  getDominantAxis,
  detectHoverMeasurement,
  detectMeasurementInferences,
  findNearestEdge,
  createParallelGuide,
  createAxisGuide,
  createPointToPointGuide,
  getFloorPosition,
  MeasurementInferencePoint,
  MEASUREMENT_CONFIG,
} from '@/lib/visualiser/measurementTool';

export interface MeasurementToolState {
  mode: MeasurementMode;
  isActive: boolean;
  startPoint: Position | null;
  currentPoint: Position | null;
  hoverInfo: HoverMeasurementInfo | null;
  snapPoint: MeasurementInferencePoint | null;
  nearestEdge: BoxEdge | null;
  currentDistance: number | null;
  dominantAxis: 'x' | 'y' | 'z' | '3d' | null;
  isCtrlPressed: boolean;
  isShiftPressed: boolean;
  guideOffset: number | null;
}

export interface MeasurementToolHandlers {
  handlePointerMove: (
    event: PointerEvent,
    raycaster: THREE.Raycaster,
    camera: THREE.Camera,
    canvasSize: { width: number; height: number }
  ) => void;
  handlePointerDown: (
    event: PointerEvent,
    raycaster: THREE.Raycaster,
    camera: THREE.Camera,
    canvasSize: { width: number; height: number }
  ) => void;
  handleKeyDown: (event: KeyboardEvent) => void;
  handleKeyUp: (event: KeyboardEvent) => void;
  cancelMeasurement: () => void;
  setGuideOffset: (offset: number) => void;
  finishGuideWithOffset: () => void;
}

export interface UseMeasurementToolReturn {
  state: MeasurementToolState;
  handlers: MeasurementToolHandlers;
  measurementHistory: MeasurementResult[];
  measureGuideLines: MeasureGuideLine[];
  measureGuidePoints: MeasureGuidePoint[];
  measureGuidesVisible: boolean;
}

export function useMeasurementTool(): UseMeasurementToolReturn {
  const {
    designMode,
    measurementMode,
    measurementHistory,
    measureGuideLines,
    measureGuidePoints,
    measureGuidesVisible,
    activeMeasurement,
    setMeasurementMode,
    addMeasurement,
    addMeasureGuideLine,
    setActiveMeasurement,
    deleteMeasureGuideLine,
    selectedMeasureGuideId,
    selectMeasureGuide,
  } = useDesignerStore();

  const boxes = useAllBoxes();

  const [startPoint, setStartPoint] = useState<Position | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Position | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverMeasurementInfo | null>(null);
  const [snapPoint, setSnapPoint] = useState<MeasurementInferencePoint | null>(null);
  const [nearestEdge, setNearestEdge] = useState<BoxEdge | null>(null);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [guideOffset, setGuideOffsetState] = useState<number | null>(null);

  const startPointRef = useRef(startPoint);
  startPointRef.current = startPoint;

  const isActive = designMode === 'measure';

  const currentDistance = useMemo(() => {
    if (!startPoint || !currentPoint) return null;
    const result = measureDistance(startPoint, currentPoint);
    return result.distance;
  }, [startPoint, currentPoint]);

  const dominantAxis = useMemo(() => {
    if (!startPoint || !currentPoint) return null;
    return getDominantAxis(startPoint, currentPoint);
  }, [startPoint, currentPoint]);

  useEffect(() => {
    if (startPoint && currentPoint) {
      setActiveMeasurement({ startPoint, currentPoint });
    } else {
      setActiveMeasurement(null);
    }
  }, [startPoint, currentPoint, setActiveMeasurement]);

  useEffect(() => {
    if (isActive) {
      const newMode = isCtrlPressed ? 'guide_create' : 'measure';
      if (measurementMode !== newMode) {
        setMeasurementMode(newMode);
      }
    }
  }, [isCtrlPressed, isActive, measurementMode, setMeasurementMode]);

  useEffect(() => {
    if (!isActive) {
      setStartPoint(null);
      setCurrentPoint(null);
      setHoverInfo(null);
      setSnapPoint(null);
      setNearestEdge(null);
      setGuideOffsetState(null);
    }
  }, [isActive]);

  const handlePointerMove = useCallback((
    event: PointerEvent,
    raycaster: THREE.Raycaster,
    camera: THREE.Camera,
    canvasSize: { width: number; height: number }
  ) => {
    if (!isActive) return;

    const cursorPx = { x: event.clientX, y: event.clientY };

    const inferences = detectMeasurementInferences(
      camera,
      canvasSize,
      cursorPx,
      boxes
    );

    const bestSnap = inferences.length > 0 ? inferences[0] : null;
    setSnapPoint(bestSnap);

    const rawPosition = getFloorPosition(raycaster, 0);
    const position = bestSnap ? bestSnap.position : rawPosition;

    if (position) {
      setCurrentPoint(position);
    }

    if (!startPointRef.current) {
      const hover = detectHoverMeasurement(camera, canvasSize, cursorPx, boxes);
      setHoverInfo(hover);

      if (measurementMode === 'guide_create') {
        const edge = findNearestEdge(camera, canvasSize, cursorPx, boxes);
        setNearestEdge(edge);
      } else {
        setNearestEdge(null);
      }
    } else {
      setHoverInfo(null);
    }
  }, [isActive, boxes, measurementMode]);

  const handlePointerDown = useCallback((
    event: PointerEvent,
    raycaster: THREE.Raycaster,
    camera: THREE.Camera,
    canvasSize: { width: number; height: number }
  ) => {
    if (!isActive) return;
    if (event.button !== 0) return;

    const cursorPx = { x: event.clientX, y: event.clientY };

    const inferences = detectMeasurementInferences(
      camera,
      canvasSize,
      cursorPx,
      boxes
    );

    const bestSnap = inferences.length > 0 ? inferences[0] : null;
    const rawPosition = getFloorPosition(raycaster, 0);
    const position = bestSnap ? bestSnap.position : rawPosition;

    if (!position) return;

    if (measurementMode === 'measure') {
      if (!startPoint) {
        setStartPoint(position);
        setCurrentPoint(position);
      } else {
        const result = measureDistance(startPoint, position);
        addMeasurement(result);
        setStartPoint(null);
        setCurrentPoint(null);
      }
    } else {
      if (!startPoint) {
        setStartPoint(position);
        setCurrentPoint(position);

        if (nearestEdge && event.detail === 2) {
          const guide = createPointToPointGuide(nearestEdge.start, nearestEdge.end);
          addMeasureGuideLine(guide);
          setStartPoint(null);
          setCurrentPoint(null);
        }
      } else {
        const guide = createPointToPointGuide(startPoint, position);
        addMeasureGuideLine(guide);
        setStartPoint(null);
        setCurrentPoint(null);
        setGuideOffsetState(null);
      }
    }
  }, [
    isActive,
    measurementMode,
    startPoint,
    boxes,
    nearestEdge,
    addMeasurement,
    addMeasureGuideLine
  ]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive) return;

    switch (event.key) {
      case 'Control':
        setIsCtrlPressed(true);
        break;
      case 'Shift':
        setIsShiftPressed(true);
        break;
      case 'Escape':
        setStartPoint(null);
        setCurrentPoint(null);
        setGuideOffsetState(null);
        break;
      case 'Delete':
      case 'Backspace':
        if (selectedMeasureGuideId) {
          deleteMeasureGuideLine(selectedMeasureGuideId);
        }
        break;
      case 'h':
      case 'H':
        useDesignerStore.getState().toggleMeasureGuidesVisible();
        break;
      case 'x':
      case 'X':
        if (measurementMode === 'guide_create' && currentPoint) {
          const guide = createAxisGuide(currentPoint, 'x');
          addMeasureGuideLine(guide);
        }
        break;
      case 'y':
      case 'Y':
        if (measurementMode === 'guide_create' && currentPoint) {
          const guide = createAxisGuide(currentPoint, 'y');
          addMeasureGuideLine(guide);
        }
        break;
      case 'z':
      case 'Z':
        if (measurementMode === 'guide_create' && currentPoint) {
          const guide = createAxisGuide(currentPoint, 'z');
          addMeasureGuideLine(guide);
        }
        break;
      case 'Enter':
        if (guideOffset !== null && nearestEdge) {
          const guide = createParallelGuide(nearestEdge, guideOffset);
          addMeasureGuideLine(guide);
          setGuideOffsetState(null);
          setStartPoint(null);
          setCurrentPoint(null);
        }
        break;
    }
  }, [
    isActive,
    measurementMode,
    currentPoint,
    selectedMeasureGuideId,
    guideOffset,
    nearestEdge,
    deleteMeasureGuideLine,
    addMeasureGuideLine
  ]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'Control':
        setIsCtrlPressed(false);
        break;
      case 'Shift':
        setIsShiftPressed(false);
        break;
    }
  }, []);

  const cancelMeasurement = useCallback(() => {
    setStartPoint(null);
    setCurrentPoint(null);
    setGuideOffsetState(null);
  }, []);

  const setGuideOffset = useCallback((offset: number) => {
    setGuideOffsetState(offset);
  }, []);

  const finishGuideWithOffset = useCallback(() => {
    if (guideOffset !== null && nearestEdge) {
      const guide = createParallelGuide(nearestEdge, guideOffset);
      addMeasureGuideLine(guide);
      setGuideOffsetState(null);
      setStartPoint(null);
      setCurrentPoint(null);
    }
  }, [guideOffset, nearestEdge, addMeasureGuideLine]);

  const state: MeasurementToolState = {
    mode: measurementMode,
    isActive,
    startPoint,
    currentPoint,
    hoverInfo,
    snapPoint,
    nearestEdge,
    currentDistance,
    dominantAxis,
    isCtrlPressed,
    isShiftPressed,
    guideOffset,
  };

  const handlers: MeasurementToolHandlers = {
    handlePointerMove,
    handlePointerDown,
    handleKeyDown,
    handleKeyUp,
    cancelMeasurement,
    setGuideOffset,
    finishGuideWithOffset,
  };

  return {
    state,
    handlers,
    measurementHistory,
    measureGuideLines,
    measureGuidePoints,
    measureGuidesVisible,
  };
}

export default useMeasurementTool;
```

---

## 2. measurementTool.ts

**Path:** `frontend/src/lib/visualiser/measurementTool.ts`

*(Full file ~460 lines: MEASUREMENT_COLORS, MEASUREMENT_CONFIG, measureDistance, getDominantAxis, getBoxEdges, getAllBoxEdges, getBoxFaces, detectHoverMeasurement, MeasurementInferencePoint, detectMeasurementInferences, createParallelGuide, createAxisGuide, createPointToPointGuide, createGuidePoint, findNearestEdge, getFloorPosition, getPositionAtHeight, createChainMeasurement, measureAngle. See repo file for complete implementation.)*

---

## 3. MeasurementVisuals.tsx

**Path:** `frontend/src/components/visualiser/designer/Canvas3D/MeasurementVisuals.tsx`

```tsx
/**
 * MeasurementVisuals Component
 * Three.js visual components for the Tape Measure tool.
 */

'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { Position, MeasureGuideLine, MeasureGuidePoint } from '@/types/visualiser';
import { MEASUREMENT_COLORS, MEASUREMENT_CONFIG } from '@/lib/visualiser/measurementTool';
import { INFERENCE_COLORS } from '@/lib/visualiser/moveInference';
import { MeasurementInferencePoint } from '@/lib/visualiser/measurementTool';

function dataToThree(x: number, y: number, z: number): [number, number, number] {
  return [x, z, y];
}

function positionToThree(p: Position): [number, number, number] {
  return dataToThree(p.x, p.y, p.z);
}

interface MeasurementLineProps {
  start: Position;
  end: Position;
  temporary?: boolean;
}

export const MeasurementLine: React.FC<MeasurementLineProps> = ({
  start, end, temporary = false,
}) => {
  const points = useMemo(() => [positionToThree(start), positionToThree(end)], [start, end]);
  return (
    <Line
      points={points}
      color={MEASUREMENT_COLORS.measureLine}
      lineWidth={temporary ? 2 : 3}
      transparent
      opacity={temporary ? 0.7 : 1}
    />
  );
};

interface MeasurementEndpointsProps {
  points: (Position | null)[];
}

export const MeasurementEndpoints: React.FC<MeasurementEndpointsProps> = ({ points }) => {
  const validPoints = points.filter((p): p is Position => p !== null);
  return (
    <>
      {validPoints.map((point, index) => (
        <mesh key={index} position={positionToThree(point)}>
          <sphereGeometry args={[8, 16, 16]} />
          <meshBasicMaterial color={MEASUREMENT_COLORS.endpoint} />
        </mesh>
      ))}
    </>
  );
};

interface InfiniteGuideLineProps {
  guide: MeasureGuideLine;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const InfiniteGuideLine: React.FC<InfiniteGuideLineProps> = ({
  guide, isSelected = false, onSelect,
}) => {
  if (!guide.visible) return null;

  const points = useMemo(() => {
    const { origin, direction } = guide;
    const halfLength = MEASUREMENT_CONFIG.GUIDE_LINE_LENGTH / 2;
    const start: Position = {
      x: origin.x - direction.x * halfLength,
      y: origin.y - direction.y * halfLength,
      z: origin.z - direction.z * halfLength,
    };
    const end: Position = {
      x: origin.x + direction.x * halfLength,
      y: origin.y + direction.y * halfLength,
      z: origin.z + direction.z * halfLength,
    };
    return [positionToThree(start), positionToThree(end)];
  }, [guide]);

  const midpoint = useMemo(() => positionToThree(guide.origin), [guide.origin]);

  return (
    <group>
      <Line
        points={points}
        color={isSelected ? '#FFFFFF' : guide.color}
        lineWidth={isSelected ? 2 : 1}
        dashed dashScale={10} dashSize={30} gapSize={20}
        transparent opacity={0.6}
      />
      {onSelect && (
        <mesh position={midpoint} onClick={onSelect}>
          <cylinderGeometry args={[15, 15, MEASUREMENT_CONFIG.GUIDE_LINE_LENGTH, 8]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
      <mesh position={positionToThree(guide.origin)}>
        <sphereGeometry args={[10, 8, 8]} />
        <meshBasicMaterial color={guide.color} transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

interface GuidePointMarkerProps {
  point: MeasureGuidePoint;
}

export const GuidePointMarker: React.FC<GuidePointMarkerProps> = ({ point }) => {
  const color = point.type === 'endpoint' ? '#22C55E' : point.type === 'midpoint' ? '#06B6D4' : '#F59E0B';
  return (
    <mesh position={positionToThree(point.position)}>
      <sphereGeometry args={[6, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
};

interface SnapIndicatorProps {
  point: MeasurementInferencePoint;
}

export const SnapIndicator: React.FC<SnapIndicatorProps> = ({ point }) => {
  const color = INFERENCE_COLORS[point.type] || '#FFFFFF';
  return (
    <group position={positionToThree(point.position)}>
      <mesh>
        <sphereGeometry args={[6, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh>
        <ringGeometry args={[10, 12, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.5} />
      </mesh>
    </group>
  );
};

interface EdgeHighlightProps {
  start: Position;
  end: Position;
  color?: string;
}

export const EdgeHighlight: React.FC<EdgeHighlightProps> = ({
  start, end, color = '#FFFF00',
}) => {
  const points = useMemo(() => [positionToThree(start), positionToThree(end)], [start, end]);
  return (
    <Line points={points} color={color} lineWidth={4} transparent opacity={0.8} />
  );
};

interface MeasurementVisualsProps {
  startPoint: Position | null;
  currentPoint: Position | null;
  snapPoint: MeasurementInferencePoint | null;
  measureGuideLines: MeasureGuideLine[];
  measureGuidePoints: MeasureGuidePoint[];
  measureGuidesVisible: boolean;
  selectedGuideId: string | null;
  nearestEdge: { start: Position; end: Position } | null;
  mode: 'measure' | 'guide_create';
  onSelectGuide?: (id: string) => void;
}

export const MeasurementVisuals: React.FC<MeasurementVisualsProps> = ({
  startPoint,
  currentPoint,
  snapPoint,
  measureGuideLines,
  measureGuidePoints,
  measureGuidesVisible,
  selectedGuideId,
  nearestEdge,
  mode,
  onSelectGuide,
}) => (
  <group>
    {startPoint && currentPoint && (
      <>
        <MeasurementLine start={startPoint} end={currentPoint} temporary />
        <MeasurementEndpoints points={[startPoint, currentPoint]} />
      </>
    )}
    {snapPoint && <SnapIndicator point={snapPoint} />}
    {measureGuidesVisible &&
      measureGuideLines.map((guide) => (
        <InfiniteGuideLine
          key={guide.id}
          guide={guide}
          isSelected={guide.id === selectedGuideId}
          onSelect={() => onSelectGuide?.(guide.id)}
        />
      ))}
    {measureGuidesVisible &&
      measureGuidePoints.map((point) => (
        <GuidePointMarker key={point.id} point={point} />
      ))}
    {mode === 'guide_create' && nearestEdge && !startPoint && (
      <EdgeHighlight start={nearestEdge.start} end={nearestEdge.end} color="#00FFFF" />
    )}
  </group>
);

export default MeasurementVisuals;
```

---

## 4. MeasurementOverlay.tsx

**Path:** `frontend/src/components/visualiser/designer/Canvas3D/MeasurementOverlay.tsx`

*(Full component set: MeasurementLabel, HoverTooltip, SnapLabel, ModeIndicator, MeasurementHistoryPanel, GuideOffsetInput, MeasurementOverlay, MeasurementScreenOverlay. See repo file `frontend/src/components/visualiser/designer/Canvas3D/MeasurementOverlay.tsx` for the complete ~385 lines.)*

---

## Canvas Integration (reference)

- **Move tool:** When `designMode === 'move'`, canvas renders `MoveToolIntegration`; OrbitControls left button disabled so left-drag moves box only; middle/right still rotate/pan. Screen: `MoveToolOverlay`, `ScreenTip`.
- **Measure tool:** When `designMode === 'measure'`, `MeasurementToolVisuals` (in canvas) and `MeasurementToolScreenOverlay` (DOM) use `useMeasurementTool`; pointer events and keyboard wired in canvas index/effect.

---

## File List Summary

| Tool    | File                     | Purpose |
|--------|--------------------------|--------|
| Move   | useDragInteraction.ts    | Drag state, axis lock, VCB, snap/collision, place/cancel |
| Move   | moveInference.ts         | Inference detection, colors/shapes, origin, inGroup |
| Move   | moveTool.ts              | Config, Vec3, AABB, constraints, coordinate conversion |
| Move   | moveValidation.ts        | validatePosition (floor, wall, collision) |
| Move   | snapSystem.ts            | Snap points, findBestSnap, snapToNearbyBoxes, axis lock |
| Move   | MoveVisuals.tsx          | Ghost wireframe, axes, inference line, indicators |
| Move   | MoveToolIntegration.tsx  | Hook wiring, hit mesh, grips, context, ScreenTip |
| Move   | BoundingBoxGrips.tsx     | Grips, Alt cycle, obscured styling |
| Move   | ScreenTip.tsx            | Tooltip + emitScreenTip |
| Move   | SnapIndicators.tsx       | Snap/collision/axis visuals |
| Measure| useMeasurementTool.ts   | Measure/guide state and event handlers |
| Measure| measurementTool.ts       | Distance, hover, inferences, guides, getFloorPosition |
| Measure| MeasurementVisuals.tsx   | Lines, endpoints, guides, snap, edge highlight |
| Measure| MeasurementOverlay.tsx   | Labels, tooltips, history, mode, offset input |

Use this document as the reference for Move and Measure tool code. For full Move tool source see docs/MoveTool-Code.md; for measurementTool.ts and MeasurementOverlay.tsx open the repo files.
