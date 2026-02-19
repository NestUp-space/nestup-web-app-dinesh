/**
 * useDragInteraction Hook
 * SketchUp-grade drag interaction for 3D boxes
 * 
 * Features:
 * - Click + Drag: Move box freely
 * - Shift + Drag: Lock to dominant axis
 * - X/Y/Z + Drag: Lock to specific axis
 * - Ctrl + Drag: Disable snap (free move)
 * - Alt + Drag: Copy mode (creates duplicate)
 * - Collision detection with other boxes
 * - Snap to grid, edges, corners, wall, floor
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
  snapToGrid,
  resolveCollision,
  constrainToFloor,
  constrainToWall,
  threeToData,
  MoveToolConfig,
} from '@/lib/visualiser/moveTool';
import {
  SnapPoint,
  SnapResult,
  LockedAxis,
  collectSnapPoints,
  findBestSnap,
  applyAxisLock,
  detectDominantAxis,
  SnapConfig,
} from '@/lib/visualiser/snapSystem';

// ============================================
// TYPES
// ============================================

export interface DragState {
  isDragging: boolean;
  ghostPosition: Position | null;
  startPosition: Position | null;
  lockedAxis: LockedAxis;
  snapResult: SnapResult | null;
  collisions: string[];
  isCopyMode: boolean;
}

export interface UseDragInteractionOptions {
  boxId: string;
  enabled?: boolean;
  onDragStart?: () => void;
  onDragEnd?: (newPosition: Position) => void;
  onDragCancel?: () => void;
}

export interface UseDragInteractionReturn {
  dragState: DragState;
  handlers: {
    onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
    onPointerMove: (event: ThreeEvent<PointerEvent>) => void;
    onPointerUp: (event: ThreeEvent<PointerEvent>) => void;
  };
  setLockedAxis: (axis: LockedAxis) => void;
  applyNumericInput: (input: string) => boolean; // Returns true if input was valid and applied
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useDragInteraction(
  options: UseDragInteractionOptions
): UseDragInteractionReturn {
  const { boxId, enabled = true, onDragStart, onDragEnd, onDragCancel } = options;
  
  // Store access
  const {
    walls,
    activeWallId,
    selectedBoxId,
    moveBox,
    snapEnabled,
    snapGridSize,
  } = useDesignerStore();
  
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
  
  // Drag state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    ghostPosition: null,
    startPosition: null,
    lockedAxis: null,
    snapResult: null,
    collisions: [],
    isCopyMode: false,
  });
  
  // Refs for tracking
  const isDraggingRef = useRef(false);
  const startPositionRef = useRef<Position | null>(null);
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const raycasterRef = useRef(new THREE.Raycaster());
  
  // Use ref for locked axis to avoid stale closure issues in handlePointerMove
  const lockedAxisRef = useRef<LockedAxis>(null);
  
  // Keyboard state
  const keyStateRef = useRef({
    shift: false,
    ctrl: false,
    alt: false,
  });
  
  // Track keyboard state with SketchUp-style axis locking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Modifier keys
      if (e.key === 'Shift') keyStateRef.current.shift = true;
      if (e.key === 'Control') keyStateRef.current.ctrl = true;
      if (e.key === 'Alt') keyStateRef.current.alt = true;
      
      // Axis locking - SketchUp style with toggle behavior
      // X/Y/Z keys or Arrow keys
      if (isDraggingRef.current) {
        let requestedAxis: LockedAxis = null;
        
        // Letter keys for axis lock
        if (e.key.toLowerCase() === 'x') requestedAxis = 'x';
        else if (e.key.toLowerCase() === 'y') requestedAxis = 'y';
        else if (e.key.toLowerCase() === 'z') requestedAxis = 'z';
        // Arrow keys (SketchUp style)
        // Right arrow = X (red axis, left-right)
        // Left arrow = Y (green axis, front-back)  
        // Up arrow = Z (blue axis, up-down)
        else if (e.key === 'ArrowRight') requestedAxis = 'x';
        else if (e.key === 'ArrowLeft') requestedAxis = 'y';
        else if (e.key === 'ArrowUp') requestedAxis = 'z';
        else if (e.key === 'ArrowDown') requestedAxis = 'z'; // Down also controls Z
        
        // Toggle axis lock: if same axis pressed again, unlock
        if (requestedAxis) {
          e.preventDefault(); // Prevent arrow key scrolling
          const newAxis = lockedAxisRef.current === requestedAxis ? null : requestedAxis;
          lockedAxisRef.current = newAxis;
          
          setDragState(prev => ({
            ...prev,
            lockedAxis: newAxis,
            isCopyMode: keyStateRef.current.alt,
          }));
        }
        
        // Update copy mode
        setDragState(prev => ({
          ...prev,
          isCopyMode: keyStateRef.current.alt,
        }));
      }
      
      // Escape cancels drag
      if (e.key === 'Escape' && isDraggingRef.current) {
        isDraggingRef.current = false;
        lockedAxisRef.current = null;
        setDragState({
          isDragging: false,
          ghostPosition: null,
          startPosition: null,
          lockedAxis: null,
          snapResult: null,
          collisions: [],
          isCopyMode: false,
        });
        onDragCancel?.();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') keyStateRef.current.shift = false;
      if (e.key === 'Control') keyStateRef.current.ctrl = false;
      if (e.key === 'Alt') {
        keyStateRef.current.alt = false;
        if (isDraggingRef.current) {
          setDragState(prev => ({ ...prev, isCopyMode: false }));
        }
      }
      // Note: We don't unlock axis on key up anymore - it's a toggle
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onDragCancel]);
  
  // Store initial click offset for precise dragging
  const clickOffsetRef = useRef<Position | null>(null);
  
  // Handle pointer down - start drag
  const handlePointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!enabled || boxId !== selectedBoxId) return;
    
    event.stopPropagation();
    
    const box = getBox();
    if (!box) return;
    
    // Set up drag plane (horizontal at box Z position in Three.js coords)
    // Our data Z = Three.js Y
    const planeY = box.position.z;
    dragPlaneRef.current.set(new THREE.Vector3(0, 1, 0), -planeY);
    
    // Calculate click offset from box position for precise dragging
    // This prevents the box from "jumping" to the cursor position
    const intersect = new THREE.Vector3();
    if (event.ray.intersectPlane(dragPlaneRef.current, intersect)) {
      const clickDataPos = threeToData({ x: intersect.x, y: intersect.y, z: intersect.z });
      clickOffsetRef.current = {
        x: clickDataPos.x - box.position.x,
        y: clickDataPos.y - box.position.y,
        z: 0, // Z offset handled by drag plane
      };
    } else {
      clickOffsetRef.current = { x: 0, y: 0, z: 0 };
    }
    
    isDraggingRef.current = true;
    startPositionRef.current = Vec3.clone(box.position);
    lockedAxisRef.current = null; // Reset axis lock on new drag
    
    setDragState({
      isDragging: true,
      ghostPosition: Vec3.clone(box.position),
      startPosition: Vec3.clone(box.position),
      lockedAxis: null,
      snapResult: null,
      collisions: [],
      isCopyMode: keyStateRef.current.alt,
    });
    
    onDragStart?.();
    
    // Capture pointer
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  }, [enabled, boxId, selectedBoxId, getBox, onDragStart]);
  
  // Handle pointer move - update ghost position with precision
  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!isDraggingRef.current || !enabled) return;
    
    const box = getBox();
    if (!box || !startPositionRef.current) return;
    
    // Raycast to drag plane to get new position
    const intersect = new THREE.Vector3();
    const ray = event.ray;
    
    if (!ray.intersectPlane(dragPlaneRef.current, intersect)) return;
    
    // Convert Three.js coords to data coords
    const threePos = { x: intersect.x, y: intersect.y, z: intersect.z };
    let dataPos = threeToData(threePos);
    
    // Apply click offset for precise dragging (box follows cursor exactly)
    if (clickOffsetRef.current) {
      dataPos = {
        x: dataPos.x - clickOffsetRef.current.x,
        y: dataPos.y - clickOffsetRef.current.y,
        z: startPositionRef.current.z, // Keep original Z during XY drag
      };
    }
    
    // Use ref for locked axis to avoid stale closure issues
    let lockedAxis = lockedAxisRef.current;
    
    // Shift auto-detects dominant axis after a small threshold (lower threshold for responsiveness)
    if (keyStateRef.current.shift && !lockedAxis) {
      lockedAxis = detectDominantAxis(dataPos, startPositionRef.current, 30); // Lower threshold
      if (lockedAxis) {
        // Store the auto-detected axis in ref
        lockedAxisRef.current = lockedAxis;
      }
    }
    
    let targetPos = lockedAxis
      ? applyAxisLock(dataPos, startPositionRef.current, lockedAxis)
      : dataPos;
    
    // Round to sub-millimeter precision to avoid floating point jitter
    targetPos = {
      x: Math.round(targetPos.x * 10) / 10,
      y: Math.round(targetPos.y * 10) / 10,
      z: Math.round(targetPos.z * 10) / 10,
    };
    
    // Apply snap (unless Ctrl is held)
    let snapResult: SnapResult | null = null;
    if (snapEnabled && !keyStateRef.current.ctrl) {
      const activeWall = walls.find(w => w.id === activeWallId);
      const snapPoints = collectSnapPoints(activeWall?.boxes || [], boxId);
      
      snapResult = findBestSnap(
        box.position,
        { w: box.dimensions.lenX, d: box.dimensions.lenY, h: box.dimensions.lenZ },
        targetPos,
        snapPoints,
        ['grid', 'edge', 'corner', 'face', 'wall', 'floor']
      );
      
      if (snapResult.snapped && snapResult.position) {
        // Round snapped position to whole millimeters
        targetPos = {
          x: Math.round(snapResult.position.x),
          y: Math.round(snapResult.position.y),
          z: Math.round(snapResult.position.z),
        };
      }
    }
    
    // Apply floor constraint
    targetPos = constrainToFloor(targetPos);
    
    // Apply wall constraint (back of box should not go behind wall)
    targetPos = constrainToWall(targetPos, box.dimensions.lenY);
    
    // Check collisions
    const otherBoxes = getOtherBoxes();
    const movingAABB = AABBUtils.create(box.position, {
      w: box.dimensions.lenX,
      d: box.dimensions.lenY,
      h: box.dimensions.lenZ,
    });
    const collisionResult = resolveCollision(movingAABB, targetPos, otherBoxes);
    
    // If collision, use allowed position
    if (collisionResult.collides) {
      targetPos = collisionResult.allowedPosition;
    }
    
    setDragState(prev => ({
      ...prev,
      ghostPosition: targetPos,
      lockedAxis,
      snapResult,
      collisions: collisionResult.collidingWith,
      isCopyMode: keyStateRef.current.alt,
    }));
  }, [enabled, getBox, getOtherBoxes, walls, activeWallId, boxId, snapEnabled]);
  
  // Handle pointer up - finalize drag
  const handlePointerUp = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!isDraggingRef.current) return;
    
    const finalPosition = dragState.ghostPosition;
    const wasCopyMode = dragState.isCopyMode;
    
    isDraggingRef.current = false;
    clickOffsetRef.current = null; // Reset click offset
    lockedAxisRef.current = null; // Reset axis lock
    
    setDragState({
      isDragging: false,
      ghostPosition: null,
      startPosition: null,
      lockedAxis: null,
      snapResult: null,
      collisions: [],
      isCopyMode: false,
    });
    
    if (finalPosition) {
      // Round final position to whole millimeters for precision
      const roundedPosition = {
        x: Math.round(finalPosition.x),
        y: Math.round(finalPosition.y),
        z: Math.round(finalPosition.z),
      };
      
      if (wasCopyMode) {
        // Copy mode: duplicate the box at the new position
        // This will be handled by the parent component
        console.log('[DragInteraction] Copy mode - would duplicate box at:', roundedPosition);
        // For now, just move (copy functionality requires store support)
        moveBox(boxId, roundedPosition);
      } else {
        // Normal move
        moveBox(boxId, roundedPosition);
      }
      onDragEnd?.(roundedPosition);
    }
    
    // Release pointer
    (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
  }, [boxId, dragState.ghostPosition, dragState.isCopyMode, moveBox, onDragEnd]);
  
  // Set locked axis manually
  const setLockedAxis = useCallback((axis: LockedAxis) => {
    lockedAxisRef.current = axis;
    setDragState(prev => ({ ...prev, lockedAxis: axis }));
  }, []);

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
    
    const trimmed = input.trim();
    if (!trimmed) return false;
    
    let newPosition: Position;
    const startPos = startPositionRef.current;
    
    // Check for absolute coordinates [x,y,z]
    const absoluteMatch = trimmed.match(/^\[([^,]+),\s*([^,]+),\s*([^\]]+)\]$/);
    if (absoluteMatch) {
      const x = parseFloat(absoluteMatch[1]);
      const y = parseFloat(absoluteMatch[2]);
      const z = parseFloat(absoluteMatch[3]);
      if (isNaN(x) || isNaN(y) || isNaN(z)) return false;
      newPosition = { x, y, z };
    } else {
      // Check for relative coordinates x,y or x,y,z
      const parts = trimmed.split(',').map(s => parseFloat(s.trim()));
      
      if (parts.length === 1 && !isNaN(parts[0])) {
        // Single value - move along locked axis or direction of movement
        const distance = parts[0];
        const lockedAxis = lockedAxisRef.current;
        
        if (lockedAxis) {
          // Move along locked axis
          newPosition = { ...startPos };
          newPosition[lockedAxis] = startPos[lockedAxis] + distance;
        } else if (dragState.ghostPosition) {
          // Move along direction of current movement
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
            // No movement yet, default to X axis
            newPosition = { ...startPos, x: startPos.x + distance };
          }
        } else {
          // Default to X axis
          newPosition = { ...startPos, x: startPos.x + distance };
        }
      } else if (parts.length === 2 && parts.every(p => !isNaN(p))) {
        // Two values - X and Y relative
        newPosition = {
          x: startPos.x + parts[0],
          y: startPos.y + parts[1],
          z: startPos.z,
        };
      } else if (parts.length === 3 && parts.every(p => !isNaN(p))) {
        // Three values - X, Y, Z relative
        newPosition = {
          x: startPos.x + parts[0],
          y: startPos.y + parts[1],
          z: startPos.z + parts[2],
        };
      } else {
        return false; // Invalid format
      }
    }
    
    // Round to whole millimeters
    const roundedPosition = {
      x: Math.round(newPosition.x),
      y: Math.round(newPosition.y),
      z: Math.round(newPosition.z),
    };
    
    // Apply constraints
    const constrainedPosition = constrainToFloor(constrainToWall(roundedPosition, box.dimensions.lenY));
    
    // Check collisions
    const otherBoxes = getOtherBoxes();
    const movingAABB = AABBUtils.create(box.position, {
      w: box.dimensions.lenX,
      d: box.dimensions.lenY,
      h: box.dimensions.lenZ,
    });
    const collisionResult = resolveCollision(movingAABB, constrainedPosition, otherBoxes);
    
    // Use collision-resolved position
    const finalPosition = collisionResult.collides 
      ? collisionResult.allowedPosition 
      : constrainedPosition;
    
    // Apply the move
    moveBox(boxId, finalPosition);
    
    // End drag state
    isDraggingRef.current = false;
    clickOffsetRef.current = null;
    lockedAxisRef.current = null;
    
    setDragState({
      isDragging: false,
      ghostPosition: null,
      startPosition: null,
      lockedAxis: null,
      snapResult: null,
      collisions: [],
      isCopyMode: false,
    });
    
    onDragEnd?.(finalPosition);
    return true;
  }, [boxId, getBox, getOtherBoxes, moveBox, onDragEnd, dragState.ghostPosition]);
  
  return {
    dragState,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
    setLockedAxis,
    applyNumericInput,
  };
}

export default useDragInteraction;
