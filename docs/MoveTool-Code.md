# Move Tool – Complete Source Code

All source files that make up the SketchUp-style Move tool implementation.

**Last updated:** 2026-03-04 (post-review fixes applied)

---

## Table of Contents

1. [useDragInteraction.ts](#1-usedraginteractionts) — Core hook (drag, snap, axis lock, copy/stamp, VCB input)
2. [moveInference.ts](#2-moveinferencets) — Inference detection (snap points, colors, shapes, priorities)
3. [MoveToolIntegration.tsx](#3-movetoolintegrationtsx) — Canvas orchestrator + Screen overlay (VCB)
4. [MoveVisuals.tsx](#4-movevisualstsx) — 3D visual feedback (ghost box, axis lines, inference indicators)
5. [ScreenTip.tsx](#5-screentiptsx) — SketchUp-style cursor tooltip
6. [BoundingBoxGrips.tsx](#6-boundingboxgripstsx) — Bounding box grip points with obscured detection

---

## 1. useDragInteraction.ts

**Path:** `frontend/src/hooks/useDragInteraction.ts`

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

// ============================================
// UNIT PARSING (SketchUp-style)
// ============================================

function parseValueWithUnits(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;
  
  const feetInchesMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*['′]\s*(\d+(?:\.\d+)?)\s*["″]?$/);
  if (feetInchesMatch) {
    const feet = parseFloat(feetInchesMatch[1]);
    const inches = parseFloat(feetInchesMatch[2]);
    if (!isNaN(feet) && !isNaN(inches)) {
      return (feet * 304.8) + (inches * 25.4);
    }
  }
  
  const unitMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*(mm|cm|m|in|"|'|′|″|ft)?$/);
  if (!unitMatch) return null;
  
  const value = parseFloat(unitMatch[1]);
  if (isNaN(value)) return null;
  
  const unit = unitMatch[2] || 'mm';
  
  switch (unit) {
    case 'mm': return value;
    case 'cm': return value * 10;
    case 'm': return value * 1000;
    case 'in': case '"': case '″': return value * 25.4;
    case "'": case '′': case 'ft': return value * 304.8;
    default: return value;
  }
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

const TWO_CLICK_MOVE_THRESHOLD_PX = 8;

export function useDragInteraction(
  options: UseDragInteractionOptions
): UseDragInteractionReturn {
  const { boxId, enabled = true, interactionMode = 'twoclick', onDragStart, onDragEnd, onDragCancel, onExitTool } = options;
  
  const {
    walls, activeWallId, moveBox, duplicateBox, deleteBox, snapEnabled, snapGridSize,
  } = useDesignerStore();
  
  const [movePhase, setMovePhase] = useState<MovePhase>('idle');
  const movePhaseRef = useRef<MovePhase>('idle');
  const pointerDownClientRef = useRef<{ x: number; y: number } | null>(null);
  const twoClickPendingRef = useRef(false);
  movePhaseRef.current = movePhase;
  
  const getBox = useCallback((): Box | null => {
    for (const wall of walls) {
      if (wall.id !== activeWallId) continue;
      const box = wall.boxes.find(b => b.id === boxId);
      if (box) return box;
    }
    return null;
  }, [walls, activeWallId, boxId]);
  
  const getOtherBoxes = useCallback((): { id: string; aabb: AABB }[] => {
    const result: { id: string; aabb: AABB }[] = [];
    for (const wall of walls) {
      if (wall.id !== activeWallId) continue;
      for (const box of wall.boxes) {
        if (box.id === boxId) continue;
        result.push({
          id: box.id,
          aabb: AABBUtils.create(box.position, {
            w: box.dimensions.lenX, d: box.dimensions.lenY, h: box.dimensions.lenZ,
          }),
        });
      }
    }
    return result;
  }, [walls, activeWallId, boxId]);
  
  const defaultDragState: DragState = {
    isDragging: false, ghostPosition: null, startPosition: null, lockedAxis: null,
    snapResult: null, collisions: [], isCopyMode: false, positionValid: true,
    parallelPerpState: 0, shiftLocked: false,
  };

  const [dragState, setDragState] = useState<DragState>(defaultDragState);
  
  const isDraggingRef = useRef(false);
  const startPositionRef = useRef<Position | null>(null);
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const raycasterRef = useRef(new THREE.Raycaster());
  const lockedAxisRef = useRef<LockedAxis>(null);
  const axisLockOriginRef = useRef<Position | null>(null);
  const ghostPositionRef = useRef<Position | null>(null);
  
  const lastArrayRef = useRef<{
    ids: string[]; startPos: Position; axis: LockedAxis; spacing: number;
  } | null>(null);

  const snapStateRef = useRef<SnapHysteresisState>({ activeSnapPoint: null, isSnapped: false });
  const parallelPerpStateRef = useRef<ParallelPerpState>(0);
  const referenceEdgeDirRef = useRef<Position | null>(null);
  const shiftLockedAxisRef = useRef<LockedAxis>(null);
  
  const keyStateRef = useRef({ shift: false, ctrl: false, alt: false });
  const copyModeActiveRef = useRef(false);
  const stampModeRef = useRef(false);
  const lastCtrlTapRef = useRef(0);
  const DOUBLE_TAP_THRESHOLD_MS = 400;
  
  const isCopyModifierActive = () => copyModeActiveRef.current || keyStateRef.current.alt;
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enabled) return;
      
      if (e.key === 'Shift') {
        keyStateRef.current.shift = true;
        const isActive = isDraggingRef.current || movePhaseRef.current === 'moving';
        if (isActive && !shiftLockedAxisRef.current) {
          const ghost = ghostPositionRef.current;
          const start = startPositionRef.current;
          if (ghost && start) {
            const dx = Math.abs(ghost.x - start.x);
            const dy = Math.abs(ghost.y - start.y);
            const dz = Math.abs(ghost.z - start.z);
            const dominant: LockedAxis = dz >= dx && dz >= dy ? 'z' : (dy >= dx ? 'y' : 'x');
            shiftLockedAxisRef.current = dominant;
            if (!lockedAxisRef.current) {
              lockedAxisRef.current = dominant;
              axisLockOriginRef.current = ghost;
              setDragState(prev => ({ ...prev, lockedAxis: dominant, shiftLocked: true }));
            }
          }
        }
      }
      if (e.key === 'Alt') keyStateRef.current.alt = true;
      
      if (e.key === 'Control' && !e.repeat) {
        keyStateRef.current.ctrl = true;
        const now = Date.now();
        const timeSinceLast = now - lastCtrlTapRef.current;
        lastCtrlTapRef.current = now;

        if (timeSinceLast < DOUBLE_TAP_THRESHOLD_MS) {
          stampModeRef.current = !stampModeRef.current;
          if (stampModeRef.current) copyModeActiveRef.current = true;
        } else {
          if (!stampModeRef.current) {
            copyModeActiveRef.current = !copyModeActiveRef.current;
          } else {
            stampModeRef.current = false;
            copyModeActiveRef.current = false;
          }
        }

        if (isDraggingRef.current || movePhaseRef.current === 'moving') {
          setDragState(prev => ({ ...prev, isCopyMode: isCopyModifierActive() }));
        }
      }
      
      const isActive = isDraggingRef.current || movePhaseRef.current === 'moving';
      if (isActive) {
        let requestedAxis: LockedAxis = null;
        
        if (e.key.toLowerCase() === 'x') requestedAxis = 'x';
        else if (e.key.toLowerCase() === 'y') requestedAxis = 'y';
        else if (e.key.toLowerCase() === 'z') requestedAxis = 'z';
        else if (e.key === 'ArrowRight') requestedAxis = 'x';
        else if (e.key === 'ArrowLeft') requestedAxis = 'y';
        else if (e.key === 'ArrowUp') requestedAxis = 'z';

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          parallelPerpStateRef.current = ((parallelPerpStateRef.current + 1) % 3) as ParallelPerpState;
          const ppState = parallelPerpStateRef.current;

          if (ppState > 0) {
            const ghost = ghostPositionRef.current;
            const start = startPositionRef.current;
            if (ghost && start) {
              referenceEdgeDirRef.current = {
                x: ghost.x - start.x, y: ghost.y - start.y, z: ghost.z - start.z,
              };
            }
            lockedAxisRef.current = null;
          } else {
            referenceEdgeDirRef.current = null;
          }

          setDragState(prev => ({
            ...prev, parallelPerpState: ppState,
            lockedAxis: ppState > 0 ? null : prev.lockedAxis,
            isCopyMode: isCopyModifierActive(),
          }));
        }
        
        if (requestedAxis) {
          e.preventDefault();
          parallelPerpStateRef.current = 0;
          const newAxis = lockedAxisRef.current === requestedAxis ? null : requestedAxis;
          lockedAxisRef.current = newAxis;
          axisLockOriginRef.current = newAxis
            ? (ghostPositionRef.current ?? startPositionRef.current) : null;
          
          setDragState(prev => ({
            ...prev, lockedAxis: newAxis, parallelPerpState: 0,
            isCopyMode: isCopyModifierActive(),
          }));
        }
      }
      
      if (e.key === 'Escape') {
        if (lockedAxisRef.current) {
          lockedAxisRef.current = null;
          axisLockOriginRef.current = null;
          setDragState(prev => ({ ...prev, lockedAxis: null }));
          e.preventDefault();
        } else if (movePhaseRef.current === 'moving') {
          setMovePhase('idle');
          startPositionRef.current = null;
          ghostPositionRef.current = null;
          axisLockOriginRef.current = null;
          lastArrayRef.current = null;
          copyModeActiveRef.current = false;
          setDragState(defaultDragState);
          e.preventDefault();
        } else if (isDraggingRef.current) {
          isDraggingRef.current = false;
          lockedAxisRef.current = null;
          axisLockOriginRef.current = null;
          lastArrayRef.current = null;
          copyModeActiveRef.current = false;
          setDragState(defaultDragState);
          onDragCancel?.();
        } else {
          onExitTool?.();
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!enabled) return;
      if (e.key === 'Shift') {
        keyStateRef.current.shift = false;
        if (shiftLockedAxisRef.current) {
          const wasShiftAxis = shiftLockedAxisRef.current;
          shiftLockedAxisRef.current = null;
          if (lockedAxisRef.current === wasShiftAxis) {
            lockedAxisRef.current = null;
            axisLockOriginRef.current = null;
            setDragState(prev => ({ ...prev, lockedAxis: null, shiftLocked: false }));
          }
        }
      }
      if (e.key === 'Control') keyStateRef.current.ctrl = false;
      if (e.key === 'Alt') {
        keyStateRef.current.alt = false;
        if (isDraggingRef.current || movePhaseRef.current === 'moving') {
          setDragState(prev => ({ ...prev, isCopyMode: isCopyModifierActive() }));
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, onDragCancel, onExitTool]);

  useEffect(() => {
    if (enabled) return;
    isDraggingRef.current = false;
    startPositionRef.current = null;
    ghostPositionRef.current = null;
    clickOffsetRef.current = null;
    pointerDownClientRef.current = null;
    twoClickPendingRef.current = false;
    lockedAxisRef.current = null;
    axisLockOriginRef.current = null;
    lastArrayRef.current = null;
    copyModeActiveRef.current = false;
    parallelPerpStateRef.current = 0;
    referenceEdgeDirRef.current = null;
    shiftLockedAxisRef.current = null;
    stampModeRef.current = false;
    lastCtrlTapRef.current = 0;
    keyStateRef.current = { shift: false, ctrl: false, alt: false };
    if (movePhaseRef.current !== 'idle') setMovePhase('idle');
    setDragState(defaultDragState);
  }, [enabled]);
  
  const clickOffsetRef = useRef<Position | null>(null);
  
  const startDragMode = useCallback((box: Box, event: ThreeEvent<PointerEvent>) => {
    const planeY = box.position.z;
    dragPlaneRef.current.set(new THREE.Vector3(0, 1, 0), -planeY);
    const intersect = new THREE.Vector3();
    if (event.ray.intersectPlane(dragPlaneRef.current, intersect)) {
      const clickDataPos = threeToData({ x: intersect.x, y: intersect.y, z: intersect.z });
      clickOffsetRef.current = { x: clickDataPos.x - box.position.x, y: clickDataPos.y - box.position.y, z: 0 };
    } else {
      clickOffsetRef.current = { x: 0, y: 0, z: 0 };
    }
    isDraggingRef.current = true;
    startPositionRef.current = Vec3.clone(box.position);
    lockedAxisRef.current = null;
    axisLockOriginRef.current = Vec3.clone(box.position);
    setDragState({
      ...defaultDragState, isDragging: true,
      ghostPosition: Vec3.clone(box.position), startPosition: Vec3.clone(box.position),
      isCopyMode: isCopyModifierActive(),
    });
    onDragStart?.();
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  }, [onDragStart]);

  const computeConstrainedTarget = useCallback((box: Box, rawDataPos: Position): {
    targetPos: Position; lockedAxis: LockedAxis; snapResult: SnapResult | null;
    collisions: string[]; isValid: boolean;
  } => {
    if (!startPositionRef.current) {
      return { targetPos: rawDataPos, lockedAxis: null, snapResult: null, collisions: [], isValid: true };
    }
    const lockedAxis = lockedAxisRef.current;
    const lockOrigin = axisLockOriginRef.current ?? startPositionRef.current;
    let targetPos = lockedAxis ? applyAxisLock(rawDataPos, lockOrigin, lockedAxis) : rawDataPos;

    const ppState = parallelPerpStateRef.current;
    if (ppState > 0 && referenceEdgeDirRef.current && startPositionRef.current) {
      const dir = referenceEdgeDirRef.current;
      const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
      if (len > 0.001) {
        const norm = { x: dir.x / len, y: dir.y / len, z: dir.z / len };
        const delta = {
          x: targetPos.x - startPositionRef.current.x,
          y: targetPos.y - startPositionRef.current.y,
          z: targetPos.z - startPositionRef.current.z,
        };
        if (ppState === 1) {
          const dot = delta.x * norm.x + delta.y * norm.y + delta.z * norm.z;
          targetPos = {
            x: startPositionRef.current.x + norm.x * dot,
            y: startPositionRef.current.y + norm.y * dot,
            z: startPositionRef.current.z + norm.z * dot,
          };
        } else {
          const dot = delta.x * norm.x + delta.y * norm.y + delta.z * norm.z;
          targetPos = {
            x: startPositionRef.current.x + (delta.x - norm.x * dot),
            y: startPositionRef.current.y + (delta.y - norm.y * dot),
            z: startPositionRef.current.z + (delta.z - norm.z * dot),
          };
        }
      }
    }

    targetPos = {
      x: Math.round(targetPos.x * 10) / 10,
      y: Math.round(targetPos.y * 10) / 10,
      z: Math.round(targetPos.z * 10) / 10,
    };

    let snapResult: SnapResult | null = null;
    if (snapEnabled) {
      const activeWall = walls.find(w => w.id === activeWallId);
      const snapPoints = collectSnapPoints(activeWall?.boxes || [], boxId);
      snapResult = findBestSnap(
        box.position,
        { w: box.dimensions.lenX, d: box.dimensions.lenY, h: box.dimensions.lenZ },
        targetPos, snapPoints,
        ['grid', 'edge', 'corner', 'face', 'wall', 'floor'],
        snapStateRef.current
      );
      snapStateRef.current = { activeSnapPoint: snapResult.snapPoint, isSnapped: snapResult.snapped };
      if (snapResult.snapped && snapResult.position) {
        targetPos = {
          x: Math.round(snapResult.position.x),
          y: Math.round(snapResult.position.y),
          z: Math.round(snapResult.position.z),
        };
        if (lockedAxis) targetPos = applyAxisLock(targetPos, lockOrigin, lockedAxis);
      }
    }

    targetPos = constrainToFloor(targetPos);
    targetPos = constrainToWall(targetPos, box.dimensions.lenY);

    const otherBoxes = getOtherBoxes();
    const movingAABB = AABBUtils.create(targetPos, {
      w: box.dimensions.lenX, d: box.dimensions.lenY, h: box.dimensions.lenZ,
    });
    const collidingWith: string[] = [];
    for (const other of otherBoxes) {
      if (AABBUtils.overlaps(movingAABB, other.aabb)) collidingWith.push(other.id);
    }

    const validation = validatePosition(
      targetPos,
      { position: box.position, dimensions: { lenX: box.dimensions.lenX, lenY: box.dimensions.lenY, lenZ: box.dimensions.lenZ } },
      otherBoxes, { floor: true, wall: true, collision: true }
    );

    return { targetPos, lockedAxis, snapResult, collisions: collidingWith, isValid: validation.isValid };
  }, [getOtherBoxes, walls, activeWallId, boxId, snapEnabled]);

  const getDataPositionFromRay = useCallback((ray: THREE.Ray): Position | null => {
    if (!startPositionRef.current) return null;
    const start = startPositionRef.current;

    if (lockedAxisRef.current === 'z') {
      const axisOriginData = axisLockOriginRef.current ?? start;
      const axisOrigin = new THREE.Vector3(axisOriginData.x, axisOriginData.z, axisOriginData.y);
      const axisDir = new THREE.Vector3(0, 1, 0);
      const d = ray.direction;
      const w0 = ray.origin.clone().sub(axisOrigin);
      const b = d.dot(axisDir);
      const denom = 1 - b * b;
      let v: number;
      if (Math.abs(denom) < 1e-6) { v = w0.dot(axisDir); }
      else { const d1 = d.dot(w0); const e = axisDir.dot(w0); v = (e - b * d1) / denom; }
      const pointOnAxis = axisOrigin.clone().addScaledVector(axisDir, v);
      const projected = threeToData({ x: pointOnAxis.x, y: pointOnAxis.y, z: pointOnAxis.z });
      return { x: start.x, y: start.y, z: projected.z };
    }

    const intersect = new THREE.Vector3();
    if (!ray.intersectPlane(dragPlaneRef.current, intersect)) return null;
    let dataPos = threeToData({ x: intersect.x, y: intersect.y, z: intersect.z });
    if (clickOffsetRef.current) {
      dataPos = { x: dataPos.x - clickOffsetRef.current.x, y: dataPos.y - clickOffsetRef.current.y, z: start.z };
    }
    return dataPos;
  }, []);

  const handlePointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!enabled) return;
    event.stopPropagation();
    const box = getBox();
    if (!box) return;

    if (interactionMode === 'twoclick') {
      const native = event.nativeEvent;
      pointerDownClientRef.current = { x: native.clientX, y: native.clientY };
      twoClickPendingRef.current = true;
      const planeY = box.position.z;
      dragPlaneRef.current.set(new THREE.Vector3(0, 1, 0), -planeY);
      const intersect = new THREE.Vector3();
      if (event.ray.intersectPlane(dragPlaneRef.current, intersect)) {
        const clickDataPos = threeToData({ x: intersect.x, y: intersect.y, z: intersect.z });
        clickOffsetRef.current = { x: clickDataPos.x - box.position.x, y: clickDataPos.y - box.position.y, z: 0 };
      } else {
        clickOffsetRef.current = { x: 0, y: 0, z: 0 };
      }
      startPositionRef.current = Vec3.clone(box.position);
      (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
      return;
    }
    startDragMode(box, event);
  }, [enabled, interactionMode, getBox, startDragMode]);

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!enabled) return;
    if (twoClickPendingRef.current && !isDraggingRef.current) {
      const down = pointerDownClientRef.current;
      if (down) {
        const native = event.nativeEvent;
        const dx = native.clientX - down.x;
        const dy = native.clientY - down.y;
        if (dx * dx + dy * dy > TWO_CLICK_MOVE_THRESHOLD_PX * TWO_CLICK_MOVE_THRESHOLD_PX) {
          twoClickPendingRef.current = false;
          isDraggingRef.current = true;
          lockedAxisRef.current = null;
          setDragState({
            ...defaultDragState, isDragging: true,
            ghostPosition: Vec3.clone(startPositionRef.current!),
            startPosition: Vec3.clone(startPositionRef.current!),
            isCopyMode: isCopyModifierActive(),
          });
          onDragStart?.();
        } else { return; }
      }
    }
    if (!isDraggingRef.current) return;
    const box = getBox();
    if (!box || !startPositionRef.current) return;
    const dataPos = getDataPositionFromRay(event.ray);
    if (!dataPos) return;
    const result = computeConstrainedTarget(box, dataPos);
    ghostPositionRef.current = result.targetPos;
    setDragState(prev => ({
      ...prev, ghostPosition: result.targetPos, lockedAxis: result.lockedAxis,
      snapResult: result.snapResult, collisions: result.collisions,
      isCopyMode: isCopyModifierActive(), positionValid: result.isValid,
    }));
  }, [enabled, getBox, computeConstrainedTarget, onDragStart, getDataPositionFromRay]);

  const handlePointerUp = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (twoClickPendingRef.current && !isDraggingRef.current) {
      twoClickPendingRef.current = false;
      pointerDownClientRef.current = null;
      const box = getBox();
      if (box && startPositionRef.current) {
        lockedAxisRef.current = null;
        axisLockOriginRef.current = Vec3.clone(box.position);
        ghostPositionRef.current = Vec3.clone(box.position);
        setMovePhase('moving');
        setDragState({
          ...defaultDragState,
          ghostPosition: Vec3.clone(box.position), startPosition: Vec3.clone(box.position),
        });
      }
      (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
      return;
    }
    if (!isDraggingRef.current) return;
    const finalPosition = ghostPositionRef.current ?? dragState.ghostPosition;
    const wasCopyMode = isCopyModifierActive();
    isDraggingRef.current = false;
    clickOffsetRef.current = null;
    lockedAxisRef.current = null;
    axisLockOriginRef.current = null;
    setDragState({ ...defaultDragState, isCopyMode: copyModeActiveRef.current });
    if (finalPosition) {
      const roundedPosition = {
        x: Math.round(finalPosition.x), y: Math.round(finalPosition.y), z: Math.round(finalPosition.z),
      };
      if (wasCopyMode) duplicateBox(boxId, roundedPosition);
      else moveBox(boxId, roundedPosition);
      onDragEnd?.(roundedPosition);
    }
    (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
  }, [boxId, getBox, dragState.ghostPosition, moveBox, duplicateBox, onDragEnd]);
  
  const setLockedAxis = useCallback((axis: LockedAxis) => {
    lockedAxisRef.current = axis;
    axisLockOriginRef.current = axis ? (ghostPositionRef.current ?? startPositionRef.current) : null;
    setDragState(prev => ({ ...prev, lockedAxis: axis }));
  }, []);

  const computeTargetFromRay = useCallback((ray: THREE.Ray): Position | null => {
    const box = getBox();
    if (!box || !startPositionRef.current) return null;
    const dataPos = getDataPositionFromRay(ray);
    if (!dataPos) return null;
    const result = computeConstrainedTarget(box, dataPos);
    ghostPositionRef.current = result.targetPos;
    setDragState(prev => ({
      ...prev, ghostPosition: result.targetPos, lockedAxis: result.lockedAxis,
      snapResult: result.snapResult, collisions: result.collisions,
      isCopyMode: isCopyModifierActive(), positionValid: result.isValid,
    }));
    return result.targetPos;
  }, [getBox, computeConstrainedTarget, getDataPositionFromRay]);

  const setGhostFromRay = useCallback((ray: THREE.Ray) => {
    computeTargetFromRay(ray);
  }, [computeTargetFromRay]);

  const place = useCallback((): boolean => {
    const pos = ghostPositionRef.current ?? dragState.ghostPosition;
    if (!pos || !startPositionRef.current) return false;
    const box = getBox();
    if (!box) return false;
    const validation = validatePosition(
      pos,
      { position: box.position, dimensions: { lenX: box.dimensions.lenX, lenY: box.dimensions.lenY, lenZ: box.dimensions.lenZ } },
      getOtherBoxes(), { floor: true, wall: true, collision: true }
    );
    if (!validation.isValid) return false;
    const roundedPosition = { x: Math.round(pos.x), y: Math.round(pos.y), z: Math.round(pos.z) };
    const wasCopyMode = isCopyModifierActive();
    const isStamp = stampModeRef.current;
    if (wasCopyMode) duplicateBox(boxId, roundedPosition);
    else moveBox(boxId, roundedPosition);

    if (isStamp) {
      ghostPositionRef.current = null;
      setDragState(prev => ({ ...prev, ghostPosition: null, isCopyMode: true }));
    } else {
      setMovePhase('idle');
      startPositionRef.current = null;
      ghostPositionRef.current = null;
      lockedAxisRef.current = null;
      axisLockOriginRef.current = null;
      lastArrayRef.current = null;
      setDragState({ ...defaultDragState, isCopyMode: copyModeActiveRef.current });
    }
    onDragEnd?.(roundedPosition);
    return true;
  }, [boxId, getBox, getOtherBoxes, moveBox, duplicateBox, onDragEnd]);

  const cancelTwoClick = useCallback(() => {
    setMovePhase('idle');
    startPositionRef.current = null;
    ghostPositionRef.current = null;
    axisLockOriginRef.current = null;
    lastArrayRef.current = null;
    setDragState(defaultDragState);
  }, []);

  const applyNumericInput = useCallback((input: string): boolean => {
    if (!startPositionRef.current) return false;
    const box = getBox();
    if (!box) return false;
    if (input == null || typeof input !== 'string') return false;
    const trimmed = (input as string).trim();
    if (!trimmed) return false;
    const startPos = startPositionRef.current;
    
    // Array commands: x5, *5, 5x, /5
    const multiplyMatch = trimmed.match(/^(?:[x*]\s*(\d+)|(\d+)\s*[x*])$/i);
    const divideMatch = trimmed.match(/^\/\s*(\d+)$/);
    if (multiplyMatch || divideMatch) {
      const axis = lockedAxisRef.current ?? lastArrayRef.current?.axis ?? null;
      if (!axis) return false;
      const ghost = ghostPositionRef.current ?? dragState.ghostPosition;
      const arrayStartPos = lastArrayRef.current?.startPos ?? startPos;
      const offset = ghost ? ghost[axis] - arrayStartPos[axis]
        : (lastArrayRef.current ? lastArrayRef.current.spacing : 500);
      if (Math.abs(offset) < 1) return false;
      let copies = 0; let spacing = offset;
      if (multiplyMatch) {
        copies = Math.min(Math.max(1, parseInt((multiplyMatch[1] || multiplyMatch[2]) ?? '0', 10)), 50);
      } else if (divideMatch) {
        const segments = Math.min(Math.max(2, parseInt(divideMatch[1], 10)), 50);
        copies = segments - 1; spacing = offset / segments;
      }
      if (copies < 1) return false;
      if (lastArrayRef.current) { for (const id of lastArrayRef.current.ids) deleteBox(id); }
      const createdIds: string[] = [];
      for (let i = 1; i <= copies; i++) {
        const newPos: Position = { ...arrayStartPos };
        newPos[axis] = arrayStartPos[axis] + spacing * i;
        const newId = duplicateBox(boxId, newPos);
        if (!newId) return false;
        createdIds.push(newId);
      }
      lastArrayRef.current = { ids: createdIds, startPos: { ...arrayStartPos }, axis, spacing };
      isDraggingRef.current = false; ghostPositionRef.current = null;
      setMovePhase('idle'); setDragState(defaultDragState);
      onDragEnd?.({ ...arrayStartPos, [axis]: arrayStartPos[axis] + spacing * copies });
      return true;
    }
    
    let newPosition: Position;
    
    // <x,y,z> relative coordinates
    const relativeMatch = trimmed.match(/^<([^,]+),\s*([^,]+),\s*([^>]+)>$/);
    if (relativeMatch) {
      const rx = parseValueWithUnits(relativeMatch[1]);
      const ry = parseValueWithUnits(relativeMatch[2]);
      const rz = parseValueWithUnits(relativeMatch[3]);
      if (rx === null || ry === null || rz === null) return false;
      newPosition = { x: startPos.x + rx, y: startPos.y + ry, z: startPos.z + rz };
    } else {
      // [x,y,z] absolute coordinates
      const absoluteMatch = trimmed.match(/^\[([^,]+),\s*([^,]+),\s*([^\]]+)\]$/);
      if (absoluteMatch) {
        const x = parseValueWithUnits(absoluteMatch[1]);
        const y = parseValueWithUnits(absoluteMatch[2]);
        const z = parseValueWithUnits(absoluteMatch[3]);
        if (x === null || y === null || z === null) return false;
        newPosition = { x, y, z };
      } else {
        const parts = trimmed.split(',').map(s => parseValueWithUnits(s.trim()));
        if (parts.length === 1) {
          const distance = parseValueWithUnits(trimmed);
          if (distance === null) return false;
          const la = lockedAxisRef.current;
          if (la) { newPosition = { ...startPos }; newPosition[la] = startPos[la] + distance; }
          else if (dragState.ghostPosition) {
            const delta = { x: dragState.ghostPosition.x - startPos.x, y: dragState.ghostPosition.y - startPos.y, z: dragState.ghostPosition.z - startPos.z };
            const mag = Math.sqrt(delta.x**2 + delta.y**2 + delta.z**2);
            if (mag > 0) {
              newPosition = { x: startPos.x + (delta.x/mag)*distance, y: startPos.y + (delta.y/mag)*distance, z: startPos.z + (delta.z/mag)*distance };
            } else { newPosition = { ...startPos, x: startPos.x + distance }; }
          } else { newPosition = { ...startPos, x: startPos.x + distance }; }
        } else if (parts.length === 2 && parts.every(p => p !== null)) {
          newPosition = { x: startPos.x + (parts[0] as number), y: startPos.y + (parts[1] as number), z: startPos.z };
        } else if (parts.length === 3 && parts.every(p => p !== null)) {
          newPosition = { x: startPos.x + (parts[0] as number), y: startPos.y + (parts[1] as number), z: startPos.z + (parts[2] as number) };
        } else { return false; }
      }
    }
    
    const roundedPosition = { x: Math.round(newPosition.x), y: Math.round(newPosition.y), z: Math.round(newPosition.z) };
    const finalPosition = constrainToFloor(constrainToWall(roundedPosition, box.dimensions.lenY));
    moveBox(boxId, finalPosition);
    isDraggingRef.current = false; clickOffsetRef.current = null;
    lockedAxisRef.current = null; ghostPositionRef.current = null; lastArrayRef.current = null;
    setMovePhase('idle'); setDragState(defaultDragState);
    onDragEnd?.(finalPosition);
    return true;
  }, [boxId, getBox, getOtherBoxes, moveBox, duplicateBox, onDragEnd, dragState.ghostPosition]);
  
  return {
    dragState, movePhase,
    handlers: { onPointerDown: handlePointerDown, onPointerMove: handlePointerMove, onPointerUp: handlePointerUp },
    setLockedAxis, applyNumericInput, setGhostFromRay, place, cancelTwoClick,
  };
}

export default useDragInteraction;
```

---

## 2. moveInference.ts

**Path:** `frontend/src/lib/visualiser/moveInference.ts`

```typescript
/**
 * Move inference – detect snap points (endpoint, midpoint, center, onEdge, onFace,
 * intersection, grid, origin) for cursor-based snapping with screen-space distance threshold.
 *
 * Colors from SketchUp Ruby API documentation (exact hex values).
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
  endpoint:     '#00FF00',
  midpoint:     '#00FFFF',
  center:       '#00FF00',
  onEdge:       '#FF0000',
  onFace:       '#0000CC',
  intersection: '#FF0000',
  origin:       '#FFFF00',
  inGroup:      '#FF00FF',
  grid:         '#9CA3AF',
};

export const INFERENCE_SHAPES: Record<InferenceType, 'circle' | 'square' | 'diamond' | 'x'> = {
  endpoint: 'circle', midpoint: 'circle', center: 'circle',
  onEdge: 'square', onFace: 'diamond', intersection: 'x',
  origin: 'circle', inGroup: 'circle', grid: 'circle',
};

export const INDICATOR_SIZE = 6;   // px (spec: 6)
export const SNAP_RADIUS_PX = 10;  // px (spec: 7-10)

const PRIORITY = {
  endpoint: 10, midpoint: 8, intersection: 7, center: 6,
  onEdge: 5, onFace: 4, origin: 3, inGroup: 2, grid: 1,
};

const SCREEN_THRESHOLD_PX = SNAP_RADIUS_PX;
const EDGE_SNAP_THRESHOLD = 0.05;

function dataToThree(p: Position): THREE.Vector3 { return new THREE.Vector3(p.x, p.z, p.y); }
function threeToData(v: THREE.Vector3): Position { return { x: v.x, y: v.z, z: v.y }; }

function projectToScreen(position: Position, camera: THREE.Camera, width: number, height: number) {
  const v = dataToThree(position); v.project(camera);
  return { x: ((v.x + 1) / 2) * width, y: (1 - (v.y + 1) / 2) * height };
}

function screenDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ... (box geometry helpers: getBoxEdges, getBoxFaces, projectPointOntoEdge, isPointInFace)
// See full source file for complete implementations.

export function detectInferences(
  camera: THREE.Camera,
  size: { width: number; height: number },
  cursorPx: { x: number; y: number },
  selectedBox: Box | null,
  otherBoxes: Box[],
  aroundPosition: Position | null,
  excludeBoxId?: string,
  basePoint?: Position | null,
  /** When true, all returned points get type 'inGroup' (magenta override per spec Section 1) */
  insideGroup = false,
): InferencePoint[] {
  const result: InferencePoint[] = [];
  // ... detection for: endpoints, midpoints, onEdge, onFace, center, intersection

  // === ORIGIN (model origin 0,0,0) — added in review fix ===
  const originScreen = projectToScreen({ x: 0, y: 0, z: 0 }, camera, size.width, size.height);
  if (screenDistance(originScreen, cursorPx) <= SCREEN_THRESHOLD_PX) {
    addIfUnique({
      position: { x: 0, y: 0, z: 0 },
      type: 'origin',
      label: 'Origin',
      priority: PRIORITY.origin,
    });
  }

  // === GRID points ===
  // ...

  // Spec Section 1: inside a group/component, ALL indicators turn magenta
  if (insideGroup) {
    for (const pt of result) { pt.type = 'inGroup'; }
  }

  result.sort((a, b) => b.priority - a.priority);
  return result;
}
```

---

## 3. MoveToolIntegration.tsx

**Path:** `frontend/src/components/visualiser/designer/Canvas3D/MoveToolIntegration.tsx`

```tsx
'use client';

import React, { useEffect, useRef, useCallback, useMemo, createContext, useContext, useState } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useDesignerStore } from '@/store/designerStore';
import { Position, Box } from '@/types/visualiser';
import { useDragInteraction, DragState, MovePhase } from '@/hooks/useDragInteraction';
import { MoveVisuals } from './MoveVisuals';
import SnapIndicators from './SnapIndicators';
import { detectInferences, InferencePoint } from '@/lib/visualiser/moveInference';
import { emitScreenTip } from './ScreenTip';
import { BoundingBoxGrips } from './BoundingBoxGrips';

// ... (MoveToolContext, MoveToolVisualsInner — unchanged)

export const MoveToolIntegration: React.FC = () => {
  // ... (setup — unchanged)

  useEffect(() => {
    if (!isMoveTool || !selectedBox) return;
    const canvasEl = gl.domElement;

    const handlePointerMove = (e: PointerEvent) => {
      // ... raycasting, inference detection

      // ScreenTip (spec Section 2) — FIXED in review:
      // Locked axis always shows "Constrained on Line from Point"
      // No lock shows inference label only
      const tipX = e.clientX - rect.left;
      const tipY = e.clientY - rect.top;

      if (dragState.lockedAxis) {
        const extra = detected.length > 0 ? ` and ${detected[0].label}` : '';
        emitScreenTip(`Constrained on Line from Point${extra}`, tipX, tipY);
      } else if (detected.length > 0) {
        emitScreenTip(detected[0].label, tipX, tipY);
      } else {
        emitScreenTip('', 0, 0);
      }
    };
    // ...
  }, [/* deps */]);

  // ... (render — unchanged)
};

export const MoveToolScreenOverlay: React.FC = () => {
  // ... (VCB overlay — unchanged)
};
```

---

## 4. MoveVisuals.tsx

**Path:** `frontend/src/components/visualiser/designer/Canvas3D/MoveVisuals.tsx`

```tsx
// ... (imports, helpers — unchanged)

// Snap indicators — FIXED in review: use INDICATOR_SIZE directly (6px, not 12px)
{inferencePoints.map((p, i) => {
  const color = inferenceColor(p.type);
  const shape = INFERENCE_SHAPES[p.type as InferenceType] || 'circle';
  const sz = INDICATOR_SIZE;  // 6px per spec (was INDICATOR_SIZE * 2)
  return (
    <Html key={i} position={dataToThree(p.position.x, p.position.y, p.position.z)} center style={{ pointerEvents: 'none' }}>
      <InferenceIndicator color={color} shape={shape} size={sz} label={p.label} />
    </Html>
  );
})}
```

---

## 5. ScreenTip.tsx

**Path:** `frontend/src/components/visualiser/designer/Canvas3D/ScreenTip.tsx`

*(Unchanged from initial implementation)*

```tsx
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDesignerStore } from '@/store/designerStore';

const DISPLAY_DURATION_MS = 4000;

// ... (full implementation — see source file)

export function emitScreenTip(text: string, x: number, y: number): void {
  window.dispatchEvent(new CustomEvent('screentip', { detail: { text, x, y } }));
}
```

---

## 6. BoundingBoxGrips.tsx

**Path:** `frontend/src/components/visualiser/designer/Canvas3D/BoundingBoxGrips.tsx`

```tsx
'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Position, Box } from '@/types/visualiser';
import { getBoxCorners, getBoxEdgeMidpoints } from '@/lib/visualiser/snapSystem';

const GRIP_COLORS = {
  normal: '#808080',    // Gray
  obscured: '#0066FF',  // Blue (behind object per spec Section 4)
  hover: '#0066FF',
};

const GRIP_SIZE = 6;

// ... (GripMode, helpers — unchanged)

/**
 * Test whether a grip point is occluded by the box mesh.
 * Added in review fix for spec Section 4 obscured behavior.
 */
function isGripObscured(
  gripDataPos: Position,
  boxCenter: THREE.Vector3,
  camera: THREE.Camera,
): boolean {
  const gripWorld = new THREE.Vector3(...dataToThree(gripDataPos.x, gripDataPos.y, gripDataPos.z));
  const camPos = camera.position;
  const distGrip = gripWorld.distanceTo(camPos);
  const distCenter = boxCenter.distanceTo(camPos);
  return distGrip > distCenter + 1;
}

export const BoundingBoxGrips: React.FC<BoundingBoxGripsProps> = ({ box, visible }) => {
  const { camera } = useThree();
  const [gripMode, setGripMode] = useState<GripMode>('corners');

  // ... (Alt key cycling — unchanged)

  const boxCenter = useMemo(() => {
    return new THREE.Vector3(...dataToThree(pos.x + w / 2, pos.y + d / 2, pos.z + h / 2));
  }, [pos, w, d, h]);

  const hasObscured = useMemo(() => {
    return gripPositions.some(p => isGripObscured(p, boxCenter, camera));
  }, [gripPositions, boxCenter, camera]);

  return (
    <group>
      {gripPositions.map((p, i) => {
        const [x, y, z] = dataToThree(p.x, p.y, p.z);
        const obscured = isGripObscured(p, boxCenter, camera);
        return (
          <Html key={`${gripMode}-${i}`} position={[x, y, z]} center style={{ pointerEvents: 'none' }}>
            <div style={{
              width: GRIP_SIZE * 2, height: GRIP_SIZE * 2, borderRadius: '50%',
              backgroundColor: obscured ? GRIP_COLORS.obscured : GRIP_COLORS.normal,
              border: '1px solid white',
              opacity: obscured ? 0.7 : 1,
            }} />
          </Html>
        );
      })}
      {/* When any grip is obscured, overlay semi-transparent box so grips are visible */}
      {hasObscured && (
        <mesh position={boxCenter}>
          <boxGeometry args={[w, h, d]} />
          <meshBasicMaterial transparent opacity={0.15} color={0x888888} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
};
```

---

## Review Fixes Applied (2026-03-04)

| # | Issue | Fix |
|---|-------|-----|
| 1 | Indicator size doubled (12px instead of 6px) | Changed `INDICATOR_SIZE * 2` → `INDICATOR_SIZE` in MoveVisuals.tsx |
| 2 | Missing Origin (0,0,0) snap point | Added origin detection block in `detectInferences()` |
| 3 | ScreenTip didn't show "Constrained on Line" when locked | Locked axis now always shows "Constrained on Line from Point" |
| 4 | No magenta override for in-group inferences | Added `insideGroup` param; when true, all points get `'inGroup'` type |
| 5 | Grip obscured behavior missing | Added depth test `isGripObscured()` + blue color + transparency overlay |
