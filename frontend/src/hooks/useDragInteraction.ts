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
  /** True if current ghost position is valid (floor, wall, no collision) */
  positionValid: boolean;
  /** Down arrow 3-state: 0=none, 1=parallel, 2=perpendicular (magenta) */
  parallelPerpState: ParallelPerpState;
  /** Shift-held temporary inference lock */
  shiftLocked: boolean;
  /** "From Point" reference (set by Shift while moving); axis-through-point inference */
  fromPoint: Position | null;
  /** Stamp mode (double Ctrl) mirrors SketchUp repeated copy placement */
  isStampMode: boolean;
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
  /** Called when user presses Escape with nothing to cancel (3rd escape level) - exit Move tool */
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
  /** Update ghost position from a ray (used by two-click mode document listener) */
  setGhostFromRay: (ray: THREE.Ray) => void;
  /** Place box at current ghost position (two-click mode) */
  place: () => boolean;
  /** Cancel two-click move and return to idle */
  cancelTwoClick: () => void;
  /** Toggle copy mode (for context menu) */
  copyModeToggle: () => void;
  /** Begin two-click moving phase from currently selected box */
  beginMoveFromSelection: () => void;
}

// ============================================
// UNIT PARSING (SketchUp-style)
// ============================================

/**
 * Parse a numeric value with optional unit suffix and convert to millimeters.
 * Supports:
 * - Plain numbers (assumed mm): "500" -> 500
 * - Millimeters: "500mm" -> 500
 * - Centimeters: "50cm" -> 500
 * - Meters: "0.5m" -> 500
 * - Inches: "2\"" or "2in" -> 50.8
 * - Feet: "2'" or "2ft" -> 609.6
 * - Feet and inches: "2'6\"" -> 762
 */
function parseValueWithUnits(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;
  
  // Feet and inches combined: 2'6" or 2' 6"
  const feetInchesMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*['′]\s*(\d+(?:\.\d+)?)\s*["″]?$/);
  if (feetInchesMatch) {
    const feet = parseFloat(feetInchesMatch[1]);
    const inches = parseFloat(feetInchesMatch[2]);
    if (!isNaN(feet) && !isNaN(inches)) {
      return (feet * 304.8) + (inches * 25.4);
    }
  }
  
  // Single value with unit suffix
  const unitMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*(mm|cm|m|in|"|'|′|″|ft)?$/);
  if (!unitMatch) return null;
  
  const value = parseFloat(unitMatch[1]);
  if (isNaN(value)) return null;
  
  const unit = unitMatch[2] || 'mm';
  
  switch (unit) {
    case 'mm':
      return value;
    case 'cm':
      return value * 10;
    case 'm':
      return value * 1000;
    case 'in':
    case '"':
    case '″':
      return value * 25.4;
    case "'":
    case '′':
    case 'ft':
      return value * 304.8;
    default:
      return value; // Assume mm
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
  
  // Store access
  const {
    walls,
    activeWallId,
    moveBox,
    duplicateBox,
    deleteBox,
    runInHistoryTransaction,
    snapEnabled,
    snapGridSize,
  } = useDesignerStore();
  
  // Two-click mode: phase and click detection
  const [movePhase, setMovePhase] = useState<MovePhase>('idle');
  const movePhaseRef = useRef<MovePhase>('idle');
  const pointerDownClientRef = useRef<{ x: number; y: number } | null>(null);
  const twoClickPendingRef = useRef(false);
  movePhaseRef.current = movePhase;
  
  // Get the box being dragged
  const getBox = useCallback((): Box | null => {
    for (const wall of walls) {
      if (wall.id !== activeWallId) continue;
      const box = wall.boxes.find(b => b.id === boxId);
      if (box) return box;
    }
    return null;
  }, [walls, activeWallId, boxId]);
  
  // Get other boxes for collision detection
  const getOtherBoxes = useCallback((): { id: string; aabb: AABB }[] => {
    const result: { id: string; aabb: AABB }[] = [];
    for (const wall of walls) {
      if (wall.id !== activeWallId) continue;
      for (const box of wall.boxes) {
        if (box.id === boxId) continue;
        result.push({
          id: box.id,
          aabb: AABBUtils.create(box.position, {
            w: box.dimensions.lenX,
            d: box.dimensions.lenY,
            h: box.dimensions.lenZ,
          }),
        });
      }
    }
    return result;
  }, [walls, activeWallId, boxId]);
  
  const defaultDragState: DragState = {
    isDragging: false,
    ghostPosition: null,
    startPosition: null,
    lockedAxis: null,
    snapResult: null,
    collisions: [],
    isCopyMode: false,
    positionValid: true,
    parallelPerpState: 0,
    shiftLocked: false,
    fromPoint: null,
    isStampMode: false,
  };

  // Drag state
  const [dragState, setDragState] = useState<DragState>(defaultDragState);
  
  // Refs for tracking
  const isDraggingRef = useRef(false);
  const startPositionRef = useRef<Position | null>(null);
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const raycasterRef = useRef(new THREE.Raycaster());
  
  // Use ref for locked axis to avoid stale closure issues in handlePointerMove
  const lockedAxisRef = useRef<LockedAxis>(null);
  // Anchor used when axis lock is active; updated at lock-time to prevent jump-backs.
  const axisLockOriginRef = useRef<Position | null>(null);
  // Ref for latest ghost position so place() always has current value
  const ghostPositionRef = useRef<Position | null>(null);
  
  // Array revision: stores the last-created array so typing x10 after x5 replaces instead of adding
  const lastArrayRef = useRef<{
    ids: string[];
    startPos: Position;
    axis: LockedAxis;
    spacing: number;
  } | null>(null);

  // Snap hysteresis: prevents flicker when near snap boundary
  const snapStateRef = useRef<SnapHysteresisState>({ activeSnapPoint: null, isSnapped: false, snappedFrames: 0 });

  // Down arrow parallel/perpendicular state (spec Section 5)
  const parallelPerpStateRef = useRef<ParallelPerpState>(0);
  const referenceEdgeDirRef = useRef<Position | null>(null);

  // Shift temporary lock (spec Section 5): while held, locks current inference
  const shiftLockedAxisRef = useRef<LockedAxis>(null);
  // "From Point" reference: set when Shift pressed while moving, cleared on Shift release
  const fromPointRef = useRef<Position | null>(null);
  
  // Keyboard state
  const keyStateRef = useRef({
    shift: false,
    ctrl: false,
    alt: false,
  });
  
  // SketchUp-style STICKY copy mode: Ctrl tap toggles, persists across operations
  const copyModeActiveRef = useRef(false);

  // Stamp mode: double-tap Ctrl/Option (spec Section 9)
  const stampModeRef = useRef(false);
  const lastCtrlTapRef = useRef(0);
  const DOUBLE_TAP_THRESHOLD_MS = 400;
  
  // Check if copy mode is active (sticky toggle OR Alt held)
  const isCopyModifierActive = () => copyModeActiveRef.current || keyStateRef.current.alt;
  
  // Track keyboard state with SketchUp-style axis locking and sticky copy mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enabled) return;
      
      // Modifier keys - track state
      if (e.key === 'Shift') {
        keyStateRef.current.shift = true;
        const isActive = isDraggingRef.current || movePhaseRef.current === 'moving';
        if (isActive) {
          const ghost = ghostPositionRef.current;
          if (ghost) {
            fromPointRef.current = { ...ghost };
            setDragState(prev => ({ ...prev, fromPoint: fromPointRef.current }));
          }
          if (!shiftLockedAxisRef.current) {
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
      }
      if (e.key === 'Alt') keyStateRef.current.alt = true;
      
      // SketchUp-style STICKY Ctrl toggle for copy mode (spec Section 9)
      // Single tap: toggle copy mode ON/OFF
      // Double tap: enter/exit Stamp mode (each click places a copy)
      if (e.key === 'Control' && !e.repeat) {
        keyStateRef.current.ctrl = true;
        const now = Date.now();
        const timeSinceLast = now - lastCtrlTapRef.current;
        lastCtrlTapRef.current = now;

        if (timeSinceLast < DOUBLE_TAP_THRESHOLD_MS) {
          // Double tap: toggle Stamp mode
          stampModeRef.current = !stampModeRef.current;
          if (stampModeRef.current) {
            copyModeActiveRef.current = true;
          }
        } else {
          // Single tap: toggle copy mode
          if (!stampModeRef.current) {
            copyModeActiveRef.current = !copyModeActiveRef.current;
          } else {
            // Tap while in stamp mode: exit stamp mode
            stampModeRef.current = false;
            copyModeActiveRef.current = false;
          }
        }

        if (isDraggingRef.current || movePhaseRef.current === 'moving') {
          setDragState(prev => ({
            ...prev,
            isCopyMode: isCopyModifierActive(),
            isStampMode: stampModeRef.current,
          }));
        }
      }
      
      // Axis locking - SketchUp style with toggle behavior
      // Active during both drag mode and two-click moving phase
      const isActive = isDraggingRef.current || movePhaseRef.current === 'moving';
      if (isActive) {
        let requestedAxis: LockedAxis = null;
        
        // Letter keys for axis lock
        if (e.key.toLowerCase() === 'x') requestedAxis = 'x';
        else if (e.key.toLowerCase() === 'y') requestedAxis = 'y';
        else if (e.key.toLowerCase() === 'z') requestedAxis = 'z';
        // Arrow keys (SketchUp style — spec Section 5)
        // Right arrow = X (red axis)
        // Left arrow = Y (green axis)
        // Up arrow = Z (blue axis)
        else if (e.key === 'ArrowRight') requestedAxis = 'x';
        else if (e.key === 'ArrowLeft') requestedAxis = 'y';
        else if (e.key === 'ArrowUp') requestedAxis = 'z';

        // Down arrow = 3-state toggle: parallel → perpendicular → off (spec Section 5)
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          parallelPerpStateRef.current = ((parallelPerpStateRef.current + 1) % 3) as ParallelPerpState;
          const ppState = parallelPerpStateRef.current;

          if (ppState > 0) {
            // Store reference edge direction (use movement direction as proxy)
            const ghost = ghostPositionRef.current;
            const start = startPositionRef.current;
            if (ghost && start) {
              referenceEdgeDirRef.current = {
                x: ghost.x - start.x,
                y: ghost.y - start.y,
                z: ghost.z - start.z,
              };
            }
            lockedAxisRef.current = null;
          } else {
            referenceEdgeDirRef.current = null;
          }

          setDragState(prev => ({
            ...prev,
            parallelPerpState: ppState,
            lockedAxis: ppState > 0 ? null : prev.lockedAxis,
            isCopyMode: isCopyModifierActive(),
            isStampMode: stampModeRef.current,
          }));
        }
        
        // Toggle axis lock: if same axis pressed again, unlock
        if (requestedAxis) {
          e.preventDefault();
          parallelPerpStateRef.current = 0;
          const newAxis = lockedAxisRef.current === requestedAxis ? null : requestedAxis;
          lockedAxisRef.current = newAxis;
          axisLockOriginRef.current = newAxis
            ? (ghostPositionRef.current ?? startPositionRef.current)
            : null;
          
          setDragState(prev => ({
            ...prev,
            lockedAxis: newAxis,
            parallelPerpState: 0,
            isCopyMode: isCopyModifierActive(),
            isStampMode: stampModeRef.current,
          }));
        }
      }
      
      // Escape: progressive cancel - SketchUp style (3 levels)
      // Level 1: If axis locked -> unlock axis
      // Level 2: If moving/dragging -> cancel, return to original
      // Level 3: If idle in move mode -> exit Move tool entirely
      if (e.key === 'Escape') {
        if (lockedAxisRef.current) {
          // Level 1: Unlock axis
          lockedAxisRef.current = null;
          axisLockOriginRef.current = null;
          setDragState(prev => ({ ...prev, lockedAxis: null }));
          e.preventDefault();
        } else if (movePhaseRef.current === 'moving') {
          // Level 2: Cancel two-click move
          setMovePhase('idle');
          startPositionRef.current = null;
          ghostPositionRef.current = null;
          axisLockOriginRef.current = null;
          lastArrayRef.current = null;
          copyModeActiveRef.current = false;
          setDragState(defaultDragState);
          e.preventDefault();
        } else if (isDraggingRef.current) {
          // Level 2: Cancel drag
          isDraggingRef.current = false;
          lockedAxisRef.current = null;
          axisLockOriginRef.current = null;
          lastArrayRef.current = null;
          copyModeActiveRef.current = false;
          setDragState(defaultDragState);
          onDragCancel?.();
        } else {
          // Level 3: Exit Move tool entirely
          onExitTool?.();
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!enabled) return;
      if (e.key === 'Shift') {
        keyStateRef.current.shift = false;
        fromPointRef.current = null;
        setDragState(prev => ({ ...prev, fromPoint: null }));
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
        // Alt release updates copy mode (Alt is hold-based, Ctrl is sticky toggle)
        if (isDraggingRef.current || movePhaseRef.current === 'moving') {
          setDragState(prev => ({ ...prev, isCopyMode: isCopyModifierActive(), isStampMode: stampModeRef.current }));
        }
      }
      // Note: Ctrl release does NOT affect copy mode - it's a sticky toggle
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, onDragCancel, onExitTool]);

  // Hard-disable move state when tool is not enabled.
  // Prevents lingering move phase/ghost/keys outside Move mode.
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
    fromPointRef.current = null;
    keyStateRef.current = { shift: false, ctrl: false, alt: false };
    if (movePhaseRef.current !== 'idle') {
      setMovePhase('idle');
    }
    setDragState(defaultDragState);
  }, [enabled]);
  
  // Store initial click offset for precise dragging
  const clickOffsetRef = useRef<Position | null>(null);
  
  // Helper: start drag mode (shared by drag mode and two-click fallback)
  const startDragMode = useCallback((box: Box, event: ThreeEvent<PointerEvent>) => {
    const planeY = box.position.z;
    dragPlaneRef.current.set(new THREE.Vector3(0, 1, 0), -planeY);

    const intersect = new THREE.Vector3();
    if (event.ray.intersectPlane(dragPlaneRef.current, intersect)) {
      const clickDataPos = threeToData({ x: intersect.x, y: intersect.y, z: intersect.z });
      clickOffsetRef.current = {
        x: clickDataPos.x - box.position.x,
        y: clickDataPos.y - box.position.y,
        z: 0,
      };
    } else {
      clickOffsetRef.current = { x: 0, y: 0, z: 0 };
    }

    isDraggingRef.current = true;
    startPositionRef.current = Vec3.clone(box.position);
    lockedAxisRef.current = null;
    axisLockOriginRef.current = Vec3.clone(box.position);

    setDragState({
      ...defaultDragState,
      isDragging: true,
      ghostPosition: Vec3.clone(box.position),
      startPosition: Vec3.clone(box.position),
      isCopyMode: isCopyModifierActive(),
      isStampMode: stampModeRef.current,
    });

    onDragStart?.();
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  }, [onDragStart]);

  // Prevent box intersection: push back to the edge of a colliding box
  function preventIntersection(
    targetPos: Position,
    movingBoxDims: { w: number; d: number; h: number },
    otherBoxes: { id: string; aabb: AABB }[],
    startPos: Position
  ): Position {
    let adj = { ...targetPos };
    const deltaX = targetPos.x - startPos.x;
    const deltaY = targetPos.y - startPos.y;
    const deltaZ = targetPos.z - startPos.z;

    for (const other of otherBoxes) {
      const mMin = { x: adj.x, y: adj.y, z: adj.z };
      const mMax = { x: adj.x + movingBoxDims.w, y: adj.y + movingBoxDims.d, z: adj.z + movingBoxDims.h };
      const oMin = other.aabb.min;
      const oMax = other.aabb.max;

      const oX = mMin.x < oMax.x && mMax.x > oMin.x;
      const oY = mMin.y < oMax.y && mMax.y > oMin.y;
      const oZ = mMin.z < oMax.z && mMax.z > oMin.z;

      if (oX && oY && oZ) {
        const penR = mMax.x - oMin.x;
        const penL = oMax.x - mMin.x;
        const penF = mMax.y - oMin.y;
        const penB = oMax.y - mMin.y;
        const penT = mMax.z - oMin.z;
        const penBt = oMax.z - mMin.z;

        if (Math.abs(deltaX) >= Math.abs(deltaY) && Math.abs(deltaX) >= Math.abs(deltaZ)) {
          if (deltaX > 0 && penR > 0 && penR < movingBoxDims.w) adj.x = oMin.x - movingBoxDims.w;
          else if (deltaX < 0 && penL > 0 && penL < movingBoxDims.w) adj.x = oMax.x;
        } else if (Math.abs(deltaY) >= Math.abs(deltaX) && Math.abs(deltaY) >= Math.abs(deltaZ)) {
          if (deltaY > 0 && penF > 0 && penF < movingBoxDims.d) adj.y = oMin.y - movingBoxDims.d;
          else if (deltaY < 0 && penB > 0 && penB < movingBoxDims.d) adj.y = oMax.y;
        } else {
          if (deltaZ > 0 && penT > 0 && penT < movingBoxDims.h) adj.z = oMin.z - movingBoxDims.h;
          else if (deltaZ < 0 && penBt > 0 && penBt < movingBoxDims.h) adj.z = oMax.z;
        }
      }
    }
    return adj;
  }

  // Helper: compute constrained target from raw data position
  const computeConstrainedTarget = useCallback((box: Box, rawDataPos: Position): {
    targetPos: Position;
    lockedAxis: LockedAxis;
    snapResult: SnapResult | null;
    collisions: string[];
    isValid: boolean;
  } => {
    if (!startPositionRef.current) {
      return { targetPos: rawDataPos, lockedAxis: null, snapResult: null, collisions: [], isValid: true };
    }

    // Axis lock only from explicit keyboard input (X/Y/Z keys)
    const lockedAxis = lockedAxisRef.current;

    const lockOrigin = axisLockOriginRef.current ?? startPositionRef.current;
    let targetPos = lockedAxis
      ? applyAxisLock(rawDataPos, lockOrigin, lockedAxis)
      : rawDataPos;

    // Parallel/perpendicular constraint (Down arrow 3-state, spec Section 5)
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
          // Parallel: project delta onto reference direction
          const dot = delta.x * norm.x + delta.y * norm.y + delta.z * norm.z;
          targetPos = {
            x: startPositionRef.current.x + norm.x * dot,
            y: startPositionRef.current.y + norm.y * dot,
            z: startPositionRef.current.z + norm.z * dot,
          };
        } else {
          // Perpendicular: remove parallel component
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
        targetPos,
        snapPoints,
        ['grid', 'edge', 'corner', 'face', 'wall', 'floor'],
        snapStateRef.current
      );
      snapStateRef.current = {
        activeSnapPoint: snapResult.snapPoint,
        isSnapped: snapResult.snapped,
        snappedFrames: snapResult.snapped
          ? ((snapStateRef.current.isSnapped && snapStateRef.current.activeSnapPoint?.position === snapResult.snapPoint?.position)
              ? snapStateRef.current.snappedFrames + 1
              : 1)
          : 0,
      };
      if (snapResult.snapped && snapResult.position) {
        targetPos = {
          x: Math.round(snapResult.position.x),
          y: Math.round(snapResult.position.y),
          z: Math.round(snapResult.position.z),
        };
        // Preserve strict axis-lock behavior even when snapping is active.
        // Without this, a snap could nudge non-locked axes and feel "off-axis".
        if (lockedAxis) {
          targetPos = applyAxisLock(targetPos, lockOrigin, lockedAxis);
        }
      }
    }

    // Box-to-box magnetic snap (touch snapping)
    const otherBoxes = getOtherBoxes();
    const boxDims = { w: box.dimensions.lenX, d: box.dimensions.lenY, h: box.dimensions.lenZ };

    const otherBoxesForSnap = walls
      .find(w => w.id === activeWallId)?.boxes
      .filter(b => b.id !== boxId)
      .map(b => ({
        id: b.id,
        position: b.position,
        dimensions: { w: b.dimensions.lenX, d: b.dimensions.lenY, h: b.dimensions.lenZ },
      })) || [];

    const boxSnapResult = snapToNearbyBoxes(targetPos, boxDims, otherBoxesForSnap, 30);
    if (boxSnapResult.snapped) {
      targetPos = boxSnapResult.position;
    }

    // Collision prevention: boxes can touch but not overlap
    const startPos = startPositionRef.current;
    targetPos = preventIntersection(targetPos, boxDims, otherBoxes, startPos);

    targetPos = constrainToFloor(targetPos);
    targetPos = constrainToWall(targetPos, box.dimensions.lenY);

    // Collision detection for visual feedback (should now rarely trigger)
    const movingAABB = AABBUtils.create(targetPos, boxDims);
    const collidingWith: string[] = [];
    for (const other of otherBoxes) {
      if (AABBUtils.overlaps(movingAABB, other.aabb)) {
        collidingWith.push(other.id);
      }
    }

    const validation = validatePosition(
      targetPos,
      { position: box.position, dimensions: { lenX: box.dimensions.lenX, lenY: box.dimensions.lenY, lenZ: box.dimensions.lenZ } },
      otherBoxes,
      { floor: true, wall: true, collision: true }
    );

    return {
      targetPos,
      lockedAxis,
      snapResult,
      collisions: collidingWith,
      isValid: validation.isValid,
    };
  }, [getOtherBoxes, walls, activeWallId, boxId, snapEnabled]);

  // Convert pointer ray to data-space position.
  // For Z lock, use projection onto the vertical axis through the start point
  // so mouse movement can drive Z reliably (instead of the floor drag plane).
  const getDataPositionFromRay = useCallback((ray: THREE.Ray): Position | null => {
    if (!startPositionRef.current) return null;
    const start = startPositionRef.current;

    if (lockedAxisRef.current === 'z') {
      const axisOriginData = axisLockOriginRef.current ?? start;
      const axisOrigin = new THREE.Vector3(axisOriginData.x, axisOriginData.z, axisOriginData.y); // data -> three
      const axisDir = new THREE.Vector3(0, 1, 0); // Three Y == data Z

      const d = ray.direction;
      const w0 = ray.origin.clone().sub(axisOrigin);
      const b = d.dot(axisDir);
      const denom = 1 - b * b;

      let v: number;
      if (Math.abs(denom) < 1e-6) {
        v = w0.dot(axisDir);
      } else {
        const d1 = d.dot(w0);
        const e = axisDir.dot(w0);
        v = (e - b * d1) / denom;
      }

      const pointOnAxis = axisOrigin.clone().addScaledVector(axisDir, v);
      const projected = threeToData({ x: pointOnAxis.x, y: pointOnAxis.y, z: pointOnAxis.z });
      return { x: start.x, y: start.y, z: projected.z };
    }

    const intersect = new THREE.Vector3();
    if (!ray.intersectPlane(dragPlaneRef.current, intersect)) return null;

    let dataPos = threeToData({ x: intersect.x, y: intersect.y, z: intersect.z });
    if (clickOffsetRef.current) {
      dataPos = {
        x: dataPos.x - clickOffsetRef.current.x,
        y: dataPos.y - clickOffsetRef.current.y,
        z: start.z,
      };
    }
    return dataPos;
  }, []);

  // Handle pointer down
  // Two-click mode: record click + prepare drag plane (so drag can start if user moves)
  // Drag mode: start drag immediately
  const handlePointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!enabled) return;
    event.stopPropagation();

    const box = getBox();
    if (!box) return;

    if (interactionMode === 'twoclick') {
      // Record click position and prepare drag plane for potential drag
      const native = event.nativeEvent;
      pointerDownClientRef.current = { x: native.clientX, y: native.clientY };
      twoClickPendingRef.current = true;

      // Pre-compute drag plane and click offset so drag can start in pointerMove
      const planeY = box.position.z;
      dragPlaneRef.current.set(new THREE.Vector3(0, 1, 0), -planeY);
      const intersect = new THREE.Vector3();
      if (event.ray.intersectPlane(dragPlaneRef.current, intersect)) {
        const clickDataPos = threeToData({ x: intersect.x, y: intersect.y, z: intersect.z });
        clickOffsetRef.current = {
          x: clickDataPos.x - box.position.x,
          y: clickDataPos.y - box.position.y,
          z: 0,
        };
      } else {
        clickOffsetRef.current = { x: 0, y: 0, z: 0 };
      }
      startPositionRef.current = Vec3.clone(box.position);

      // Capture pointer so we get move/up events even if cursor leaves the box
      (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
      return;
    }

    // Drag mode: start immediately
    startDragMode(box, event);
  }, [enabled, interactionMode, getBox, startDragMode]);

  // Handle pointer move
  // If twoclick pending and cursor moved enough, transition to drag mode
  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!enabled) return;

    // Two-click mode: detect if user started dragging
    if (twoClickPendingRef.current && !isDraggingRef.current) {
      const down = pointerDownClientRef.current;
      if (down) {
        const native = event.nativeEvent;
        const dx = native.clientX - down.x;
        const dy = native.clientY - down.y;
        if (dx * dx + dy * dy > TWO_CLICK_MOVE_THRESHOLD_PX * TWO_CLICK_MOVE_THRESHOLD_PX) {
          // User dragged — transition to live drag mode
          twoClickPendingRef.current = false;
          isDraggingRef.current = true;
          lockedAxisRef.current = null;

          setDragState({
            ...defaultDragState,
            isDragging: true,
            ghostPosition: Vec3.clone(startPositionRef.current!),
            startPosition: Vec3.clone(startPositionRef.current!),
            isCopyMode: isCopyModifierActive(),
            isStampMode: stampModeRef.current,
          });
          onDragStart?.();
          // Fall through to process this move event as a drag
        } else {
          return; // Not enough movement yet
        }
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
      ...prev,
      ghostPosition: result.targetPos,
      lockedAxis: result.lockedAxis,
      snapResult: result.snapResult,
      collisions: result.collisions,
      isCopyMode: isCopyModifierActive(),
      positionValid: result.isValid,
    }));
  }, [enabled, getBox, computeConstrainedTarget, onDragStart, getDataPositionFromRay]);

  // Handle pointer up
  // Quick click (< threshold): enter two-click moving phase
  // After drag: finalize position
  const handlePointerUp = useCallback((event: ThreeEvent<PointerEvent>) => {
    // Two-click quick-click: enter moving phase
    // Keep clickOffsetRef from pointerDown so the box moves from the exact grab point
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
          ghostPosition: Vec3.clone(box.position),
          startPosition: Vec3.clone(box.position),
        });
      }
      (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
      return;
    }

    if (!isDraggingRef.current) return;

    // Finalize drag
    const finalPosition = ghostPositionRef.current ?? dragState.ghostPosition;
    const wasCopyMode = isCopyModifierActive(); // Use current ref value for sticky copy mode

    isDraggingRef.current = false;
    clickOffsetRef.current = null;
    lockedAxisRef.current = null;
    axisLockOriginRef.current = null;

    setDragState({
      ...defaultDragState,
      isCopyMode: copyModeActiveRef.current,
      isStampMode: stampModeRef.current,
    });

    if (finalPosition) {
      const roundedPosition = {
        x: Math.round(finalPosition.x),
        y: Math.round(finalPosition.y),
        z: Math.round(finalPosition.z),
      };
      if (wasCopyMode) {
        duplicateBox(boxId, roundedPosition);
      } else {
        moveBox(boxId, roundedPosition);
      }
      onDragEnd?.(roundedPosition);
    }

    (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
  }, [boxId, getBox, dragState.ghostPosition, moveBox, duplicateBox, onDragEnd]);
  
  // Set locked axis manually
  const setLockedAxis = useCallback((axis: LockedAxis) => {
    lockedAxisRef.current = axis;
    axisLockOriginRef.current = axis
      ? (ghostPositionRef.current ?? startPositionRef.current)
      : null;
    setDragState(prev => ({ ...prev, lockedAxis: axis }));
  }, []);

  // Compute target position from ray (used by setGhostFromRay for two-click mode)
  const computeTargetFromRay = useCallback((ray: THREE.Ray): Position | null => {
    const box = getBox();
    if (!box || !startPositionRef.current) return null;
    const dataPos = getDataPositionFromRay(ray);
    if (!dataPos) return null;

    const result = computeConstrainedTarget(box, dataPos);
    ghostPositionRef.current = result.targetPos;
    setDragState(prev => ({
      ...prev,
      ghostPosition: result.targetPos,
      lockedAxis: result.lockedAxis,
      snapResult: result.snapResult,
      collisions: result.collisions,
      isCopyMode: isCopyModifierActive(),
      positionValid: result.isValid,
    }));
    return result.targetPos;
  }, [getBox, computeConstrainedTarget, getDataPositionFromRay]);

  /** Update ghost from ray (two-click mode: document pointermove) */
  const setGhostFromRay = useCallback((ray: THREE.Ray) => {
    computeTargetFromRay(ray);
  }, [computeTargetFromRay]);

  /** Place at current ghost position (two-click mode: second click) */
  const place = useCallback((): boolean => {
    const pos = ghostPositionRef.current ?? dragState.ghostPosition;
    console.log('[DragInteraction] place() called, ghostPos:', pos, 'startPos:', startPositionRef.current);
    if (!pos || !startPositionRef.current) {
      console.log('[DragInteraction] place() early return - no position');
      return false;
    }
    const box = getBox();
    if (!box) {
      console.log('[DragInteraction] place() early return - no box');
      return false;
    }
    const validation = validatePosition(
      pos,
      { position: box.position, dimensions: { lenX: box.dimensions.lenX, lenY: box.dimensions.lenY, lenZ: box.dimensions.lenZ } },
      getOtherBoxes(),
      { floor: true, wall: true, collision: true }
    );
    if (!validation.isValid) return false;
    const roundedPosition = {
      x: Math.round(pos.x),
      y: Math.round(pos.y),
      z: Math.round(pos.z),
    };
    const wasCopyMode = isCopyModifierActive();
    const isStamp = stampModeRef.current;

    if (wasCopyMode) {
      duplicateBox(boxId, roundedPosition);
    } else {
      moveBox(boxId, roundedPosition);
    }

    if (isStamp) {
      // Stamp mode: stay in moving phase, each click places another copy
      // Don't reset - allow next click to place again
      ghostPositionRef.current = null;
      setDragState(prev => ({
        ...prev,
        ghostPosition: null,
        isCopyMode: true,
        isStampMode: true,
      }));
    } else {
      setMovePhase('idle');
      startPositionRef.current = null;
      ghostPositionRef.current = null;
      lockedAxisRef.current = null;
      axisLockOriginRef.current = null;
      lastArrayRef.current = null;
      setDragState({
        ...defaultDragState,
        isCopyMode: copyModeActiveRef.current,
        isStampMode: stampModeRef.current,
      });
    }

    onDragEnd?.(roundedPosition);
    return true;
  }, [boxId, getBox, getOtherBoxes, moveBox, duplicateBox, onDragEnd]);

  /** Cancel two-click move */
  const cancelTwoClick = useCallback(() => {
    setMovePhase('idle');
    startPositionRef.current = null;
    ghostPositionRef.current = null;
    axisLockOriginRef.current = null;
    lastArrayRef.current = null;
    setDragState(defaultDragState);
  }, []);

  /** Toggle copy mode (e.g. from context menu) */
  const copyModeToggle = useCallback(() => {
    copyModeActiveRef.current = !copyModeActiveRef.current;
    setDragState((prev) => ({ ...prev, isCopyMode: isCopyModifierActive(), isStampMode: stampModeRef.current }));
  }, []);

  const beginMoveFromSelection = useCallback((): void => {
    const box = getBox();
    if (!box || !enabled) return;
    startPositionRef.current = Vec3.clone(box.position);
    ghostPositionRef.current = Vec3.clone(box.position);
    lockedAxisRef.current = null;
    axisLockOriginRef.current = Vec3.clone(box.position);
    setMovePhase('moving');
    setDragState({
      ...defaultDragState,
      ghostPosition: Vec3.clone(box.position),
      startPosition: Vec3.clone(box.position),
      isCopyMode: isCopyModifierActive(),
      isStampMode: stampModeRef.current,
    });
  }, [enabled, getBox]);

  /**
   * Apply numeric input for precise positioning
   * Supports formats:
   * - "100" - Move 100mm in the direction of movement (or along locked axis)
   * - "100,200" - Move 100mm in X, 200mm in Y (relative)
   * - "100,200,50" - Move 100mm in X, 200mm in Y, 50mm in Z (relative)
   * - "[100,200,50]" - Move to absolute position
   */
  const applyNumericInput = useCallback((input: string): boolean => {
    if (!startPositionRef.current) return false;
    
    const box = getBox();
    if (!box) return false;
    
    if (input == null || typeof input !== 'string') return false;
    const trimmed = (input as string).trim();
    if (!trimmed) return false;
    
    const startPos = startPositionRef.current;
    
    // SketchUp-style arrays after setting a direction:
    // - x5, *5, 5x => multiple copies at equal spacing
    // - /5 => divide current offset into 5 equal segments
    const multiplyMatch = trimmed.match(/^(?:[x*]\s*(\d+)|(\d+)\s*[x*])$/i);
    const divideMatch = trimmed.match(/^\/\s*(\d+)$/);
    if (multiplyMatch || divideMatch) {
      // Array revision: use stored axis/offset from previous array if no active move
      const axis = lockedAxisRef.current ?? lastArrayRef.current?.axis ?? null;
      if (!axis) return false;
      const ghost = ghostPositionRef.current ?? dragState.ghostPosition;
      const arrayStartPos = lastArrayRef.current?.startPos ?? startPos;
      const offset = ghost ? ghost[axis] - arrayStartPos[axis]
        : (lastArrayRef.current ? lastArrayRef.current.spacing : 500);
      if (Math.abs(offset) < 1) return false;

      let copies = 0;
      let spacing = offset;
      if (multiplyMatch) {
        const parsed = parseInt((multiplyMatch[1] || multiplyMatch[2]) ?? '0', 10);
        copies = Math.min(Math.max(1, parsed), 50);
        spacing = offset;
      } else if (divideMatch) {
        const segments = Math.min(Math.max(2, parseInt(divideMatch[1], 10)), 50);
        copies = segments - 1;
        spacing = offset / segments;
      }

      if (copies < 1) return false;

      // Group array revisions into one undo/redo step.
      const arrayResult = runInHistoryTransaction(() => {
        // Delete previous array copies if revising (x5 -> x10)
        if (lastArrayRef.current) {
          for (const id of lastArrayRef.current.ids) {
            deleteBox(id);
          }
        }

        const createdIds: string[] = [];
        for (let i = 1; i <= copies; i++) {
          const newPos: Position = { ...arrayStartPos };
          newPos[axis] = arrayStartPos[axis] + spacing * i;
          const newId = duplicateBox(boxId, newPos);
          if (!newId) return null;
          createdIds.push(newId);
        }

        return createdIds;
      });
      if (!arrayResult) return false;

      lastArrayRef.current = { ids: arrayResult, startPos: { ...arrayStartPos }, axis, spacing };

      isDraggingRef.current = false;
      ghostPositionRef.current = null;
      setMovePhase('idle');
      setDragState(defaultDragState);
      onDragEnd?.({ ...arrayStartPos, [axis]: arrayStartPos[axis] + spacing * copies });
      return true;
    }
    
    let newPosition: Position;
    
    // SketchUp-style angle brackets <x,y,z> = relative to start point (spec Section 8)
    const relativeMatch = trimmed.match(/^<([^,]+),\s*([^,]+),\s*([^>]+)>$/);
    if (relativeMatch) {
      const rx = parseValueWithUnits(relativeMatch[1]);
      const ry = parseValueWithUnits(relativeMatch[2]);
      const rz = parseValueWithUnits(relativeMatch[3]);
      if (rx === null || ry === null || rz === null) return false;
      newPosition = {
        x: startPos.x + rx,
        y: startPos.y + ry,
        z: startPos.z + rz,
      };
    } else {
      // Square brackets [x,y,z] = absolute from origin (spec Section 8)
      const absoluteMatch = trimmed.match(/^\[([^,]+),\s*([^,]+),\s*([^\]]+)\]$/);
      if (absoluteMatch) {
        const x = parseValueWithUnits(absoluteMatch[1]);
        const y = parseValueWithUnits(absoluteMatch[2]);
        const z = parseValueWithUnits(absoluteMatch[3]);
        if (x === null || y === null || z === null) return false;
        newPosition = { x, y, z };
      } else {
        // Comma-separated relative or single-distance format
        const parts = trimmed.split(',').map(s => parseValueWithUnits(s.trim()));
        
        if (parts.length === 1) {
          const distance = parseValueWithUnits(trimmed);
          if (distance === null) return false;
          
          const lockedAxis = lockedAxisRef.current;
          
          if (lockedAxis) {
            newPosition = { ...startPos };
            newPosition[lockedAxis] = startPos[lockedAxis] + distance;
          } else if (dragState.ghostPosition) {
            const delta = {
              x: dragState.ghostPosition.x - startPos.x,
              y: dragState.ghostPosition.y - startPos.y,
              z: dragState.ghostPosition.z - startPos.z,
            };
            const magnitude = Math.sqrt(delta.x * delta.x + delta.y * delta.y + delta.z * delta.z);
            if (magnitude > 0) {
              const normalized = {
                x: delta.x / magnitude,
                y: delta.y / magnitude,
                z: delta.z / magnitude,
              };
              newPosition = {
                x: startPos.x + normalized.x * distance,
                y: startPos.y + normalized.y * distance,
                z: startPos.z + normalized.z * distance,
              };
            } else {
              newPosition = { ...startPos, x: startPos.x + distance };
            }
          } else {
            newPosition = { ...startPos, x: startPos.x + distance };
          }
        } else if (parts.length === 2 && parts.every(p => p !== null)) {
          newPosition = {
            x: startPos.x + (parts[0] as number),
            y: startPos.y + (parts[1] as number),
            z: startPos.z,
          };
        } else if (parts.length === 3 && parts.every(p => p !== null)) {
          newPosition = {
            x: startPos.x + (parts[0] as number),
            y: startPos.y + (parts[1] as number),
            z: startPos.z + (parts[2] as number),
          };
        } else {
          return false;
        }
      }
    }
    
    // Round to whole millimeters
    const roundedPosition = {
      x: Math.round(newPosition.x),
      y: Math.round(newPosition.y),
      z: Math.round(newPosition.z),
    };
    
    const finalPosition = constrainToFloor(constrainToWall(roundedPosition, box.dimensions.lenY));

    // Move-by-distance without second click: when in moving phase, set ghost and place() so no target click needed
    if (movePhaseRef.current === 'moving') {
      ghostPositionRef.current = finalPosition;
      const validation = validatePosition(
        finalPosition,
        { position: box.position, dimensions: { lenX: box.dimensions.lenX, lenY: box.dimensions.lenY, lenZ: box.dimensions.lenZ } },
        getOtherBoxes(),
        { floor: true, wall: true, collision: true }
      );
      setDragState((prev) => ({ ...prev, ghostPosition: finalPosition, positionValid: validation.isValid }));
      const placed = place();
      return placed;
    }

    moveBox(boxId, finalPosition);
    
    isDraggingRef.current = false;
    clickOffsetRef.current = null;
    lockedAxisRef.current = null;
    ghostPositionRef.current = null;
    lastArrayRef.current = null;
    setMovePhase('idle');
    setDragState(defaultDragState);
    
    onDragEnd?.(finalPosition);
    return true;
  }, [boxId, getBox, getOtherBoxes, moveBox, duplicateBox, onDragEnd, dragState.ghostPosition, place]);
  
  return {
    dragState,
    movePhase,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
    setLockedAxis,
    applyNumericInput,
    setGhostFromRay,
    place,
    cancelTwoClick,
    copyModeToggle,
    beginMoveFromSelection,
  };
}

export default useDragInteraction;
