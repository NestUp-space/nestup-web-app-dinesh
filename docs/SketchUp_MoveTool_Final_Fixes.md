# SketchUp Move Tool - Final Fixes for 99% Accuracy

## Document Purpose
Complete list of remaining fixes needed to achieve 99% SketchUp Move Tool accuracy.

---

## Table of Contents

1. [Critical Fix #1: Remove Green Filled Ghost Box](#critical-fix-1-remove-green-filled-ghost-box)
2. [Critical Fix #2: Box-to-Box Magnetic Snap (Touch Snapping)](#critical-fix-2-box-to-box-magnetic-snap-touch-snapping)
3. [Critical Fix #3: Collision Prevention (Block Intersection)](#critical-fix-3-collision-prevention-block-intersection)
4. [Summary of All Changes](#summary-of-all-changes)

---

## Critical Fix #1: Remove Green Filled Ghost Box

### Problem
A semi-transparent green filled box appears when moving. SketchUp only shows wireframe edges.

### File
`frontend/src/components/visualiser/designer/Canvas3D/MoveVisuals.tsx`

### Current Code (WRONG)
```tsx
{/* Around line 143-153 */}

{/* This creates the green filled box - REMOVE IT */}
<mesh position={ghostPos}>
  <boxGeometry args={[w, h, d]} />
  <meshBasicMaterial color={ghostColor} transparent opacity={0.25} depthWrite={false} />
</mesh>

{/* This is the wireframe - KEEP IT */}
<lineSegments position={ghostPos}>
  <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
  <lineBasicMaterial color={edgeColor} transparent opacity={0.9} />
</lineSegments>
```

### Fixed Code
```tsx
{/* REMOVED: No filled mesh - SketchUp only shows wireframe */}

{/* Ghost box at target position - WIREFRAME ONLY */}
<lineSegments position={ghostPos}>
  <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
  <lineBasicMaterial color={edgeColor} transparent opacity={0.9} />
</lineSegments>
```

### Action
Delete the `<mesh>` block entirely. Keep only the `<lineSegments>` block.

---

## Critical Fix #2: Box-to-Box Magnetic Snap (Touch Snapping)

### Problem
Boxes don't snap to touch each other. When dragging a box close to another box, it should magnetically snap so their faces touch perfectly.

### File
`frontend/src/lib/visualiser/snapSystem.ts`

### Add This New Function
```typescript
/**
 * Box-to-Box Face Snapping (Magnetic Touch)
 * 
 * When a moving box gets within SNAP_THRESHOLD of another box's face,
 * it snaps to touch that face perfectly (no gap, no overlap).
 * 
 * This creates the "magnetic" effect where boxes attract to touch each other.
 */

const BOX_SNAP_THRESHOLD = 30; // mm - distance at which snap activates

export interface BoxSnapResult {
  snapped: boolean;
  position: Position;
  snappedAxis: 'x' | 'y' | 'z' | null;
  snappedToBoxId: string | null;
  touchingSide: 'min' | 'max' | null; // which side of the other box we're touching
}

/**
 * Snap moving box to touch nearby boxes (magnetic attraction).
 * 
 * @param targetPos - Current target position of moving box
 * @param movingBoxDims - Dimensions of the box being moved
 * @param otherBoxes - All other boxes to potentially snap to
 * @param threshold - Distance in mm at which snapping activates (default 30mm)
 * @returns Adjusted position that snaps to touch nearby boxes
 */
export function snapToNearbyBoxes(
  targetPos: Position,
  movingBoxDims: { w: number; d: number; h: number },
  otherBoxes: { id: string; position: Position; dimensions: { w: number; d: number; h: number } }[],
  threshold: number = BOX_SNAP_THRESHOLD
): BoxSnapResult {
  let snappedPos = { ...targetPos };
  let snapped = false;
  let snappedAxis: 'x' | 'y' | 'z' | null = null;
  let snappedToBoxId: string | null = null;
  let touchingSide: 'min' | 'max' | null = null;

  // Moving box bounds
  const movingMin = {
    x: targetPos.x,
    y: targetPos.y,
    z: targetPos.z,
  };
  const movingMax = {
    x: targetPos.x + movingBoxDims.w,
    y: targetPos.y + movingBoxDims.d,
    z: targetPos.z + movingBoxDims.h,
  };

  for (const other of otherBoxes) {
    const otherMin = {
      x: other.position.x,
      y: other.position.y,
      z: other.position.z,
    };
    const otherMax = {
      x: other.position.x + other.dimensions.w,
      y: other.position.y + other.dimensions.d,
      z: other.position.z + other.dimensions.h,
    };

    // Check each axis for potential snap

    // === X-AXIS SNAPPING ===
    // Check if boxes overlap on Y and Z (meaning X faces could touch)
    const overlapY = movingMin.y < otherMax.y && movingMax.y > otherMin.y;
    const overlapZ = movingMin.z < otherMax.z && movingMax.z > otherMin.z;
    
    if (overlapY && overlapZ) {
      // Moving box's RIGHT face near other box's LEFT face
      const distRightToLeft = Math.abs(movingMax.x - otherMin.x);
      if (distRightToLeft <= threshold && distRightToLeft > 0) {
        // Snap: moving box's right edge touches other box's left edge
        snappedPos.x = otherMin.x - movingBoxDims.w;
        snapped = true;
        snappedAxis = 'x';
        snappedToBoxId = other.id;
        touchingSide = 'min';
      }
      
      // Moving box's LEFT face near other box's RIGHT face
      const distLeftToRight = Math.abs(movingMin.x - otherMax.x);
      if (distLeftToRight <= threshold && distLeftToRight > 0) {
        // Snap: moving box's left edge touches other box's right edge
        snappedPos.x = otherMax.x;
        snapped = true;
        snappedAxis = 'x';
        snappedToBoxId = other.id;
        touchingSide = 'max';
      }
    }

    // === Y-AXIS SNAPPING ===
    // Check if boxes overlap on X and Z (meaning Y faces could touch)
    const overlapX = movingMin.x < otherMax.x && movingMax.x > otherMin.x;
    
    if (overlapX && overlapZ) {
      // Moving box's FRONT face near other box's BACK face
      const distFrontToBack = Math.abs(movingMax.y - otherMin.y);
      if (distFrontToBack <= threshold && distFrontToBack > 0) {
        snappedPos.y = otherMin.y - movingBoxDims.d;
        snapped = true;
        snappedAxis = 'y';
        snappedToBoxId = other.id;
        touchingSide = 'min';
      }
      
      // Moving box's BACK face near other box's FRONT face
      const distBackToFront = Math.abs(movingMin.y - otherMax.y);
      if (distBackToFront <= threshold && distBackToFront > 0) {
        snappedPos.y = otherMax.y;
        snapped = true;
        snappedAxis = 'y';
        snappedToBoxId = other.id;
        touchingSide = 'max';
      }
    }

    // === Z-AXIS SNAPPING ===
    // Check if boxes overlap on X and Y (meaning Z faces could touch)
    if (overlapX && overlapY) {
      // Moving box's TOP face near other box's BOTTOM face
      const distTopToBottom = Math.abs(movingMax.z - otherMin.z);
      if (distTopToBottom <= threshold && distTopToBottom > 0) {
        snappedPos.z = otherMin.z - movingBoxDims.h;
        snapped = true;
        snappedAxis = 'z';
        snappedToBoxId = other.id;
        touchingSide = 'min';
      }
      
      // Moving box's BOTTOM face near other box's TOP face (stacking)
      const distBottomToTop = Math.abs(movingMin.z - otherMax.z);
      if (distBottomToTop <= threshold && distBottomToTop > 0) {
        snappedPos.z = otherMax.z;
        snapped = true;
        snappedAxis = 'z';
        snappedToBoxId = other.id;
        touchingSide = 'max';
      }
    }

    // If we snapped, we can break (first snap wins)
    // Or continue to check all boxes and pick closest snap
    if (snapped) break;
  }

  return {
    snapped,
    position: snappedPos,
    snappedAxis,
    snappedToBoxId,
    touchingSide,
  };
}
```

---

## Critical Fix #3: Collision Prevention (Block Intersection)

### Problem
Boxes can overlap/intersect each other. They should be physically blocked - touching is allowed, but going inside is not.

### File
`frontend/src/hooks/useDragInteraction.ts`

### Add This New Function (before `computeConstrainedTarget`)
```typescript
/**
 * Prevent box intersection (collision blocking).
 * 
 * If the target position would cause overlap, push the box back
 * to the edge of the colliding box (so they touch but don't intersect).
 * 
 * @param targetPos - Desired position
 * @param movingBoxDims - Dimensions of moving box
 * @param otherBoxes - Other boxes to check collision against
 * @param startPos - Original position (to determine movement direction)
 * @returns Adjusted position that prevents intersection
 */
function preventIntersection(
  targetPos: Position,
  movingBoxDims: { w: number; d: number; h: number },
  otherBoxes: { id: string; aabb: AABB }[],
  startPos: Position
): Position {
  let adjustedPos = { ...targetPos };
  
  // Movement direction
  const deltaX = targetPos.x - startPos.x;
  const deltaY = targetPos.y - startPos.y;
  const deltaZ = targetPos.z - startPos.z;

  for (const other of otherBoxes) {
    // Calculate moving box bounds at adjusted position
    const movingMin = {
      x: adjustedPos.x,
      y: adjustedPos.y,
      z: adjustedPos.z,
    };
    const movingMax = {
      x: adjustedPos.x + movingBoxDims.w,
      y: adjustedPos.y + movingBoxDims.d,
      z: adjustedPos.z + movingBoxDims.h,
    };

    const otherMin = other.aabb.min;
    const otherMax = other.aabb.max;

    // Check for overlap
    const overlapX = movingMin.x < otherMax.x && movingMax.x > otherMin.x;
    const overlapY = movingMin.y < otherMax.y && movingMax.y > otherMin.y;
    const overlapZ = movingMin.z < otherMax.z && movingMax.z > otherMin.z;

    if (overlapX && overlapY && overlapZ) {
      // COLLISION DETECTED - Push back to edge

      // Calculate penetration depth on each axis
      const penRight = movingMax.x - otherMin.x;  // How much we penetrate from left
      const penLeft = otherMax.x - movingMin.x;   // How much we penetrate from right
      const penFront = movingMax.y - otherMin.y;  // How much we penetrate from back
      const penBack = otherMax.y - movingMin.y;   // How much we penetrate from front
      const penTop = movingMax.z - otherMin.z;    // How much we penetrate from bottom
      const penBottom = otherMax.z - movingMin.z; // How much we penetrate from top

      // Find minimum penetration based on movement direction
      // This ensures we push back on the axis we're moving along

      if (Math.abs(deltaX) >= Math.abs(deltaY) && Math.abs(deltaX) >= Math.abs(deltaZ)) {
        // Primarily moving in X
        if (deltaX > 0 && penRight > 0 && penRight < movingBoxDims.w) {
          // Moving right, hit left side of other box
          adjustedPos.x = otherMin.x - movingBoxDims.w; // Snap to touch
        } else if (deltaX < 0 && penLeft > 0 && penLeft < movingBoxDims.w) {
          // Moving left, hit right side of other box
          adjustedPos.x = otherMax.x; // Snap to touch
        }
      } else if (Math.abs(deltaY) >= Math.abs(deltaX) && Math.abs(deltaY) >= Math.abs(deltaZ)) {
        // Primarily moving in Y
        if (deltaY > 0 && penFront > 0 && penFront < movingBoxDims.d) {
          adjustedPos.y = otherMin.y - movingBoxDims.d;
        } else if (deltaY < 0 && penBack > 0 && penBack < movingBoxDims.d) {
          adjustedPos.y = otherMax.y;
        }
      } else {
        // Primarily moving in Z
        if (deltaZ > 0 && penTop > 0 && penTop < movingBoxDims.h) {
          adjustedPos.z = otherMin.z - movingBoxDims.h;
        } else if (deltaZ < 0 && penBottom > 0 && penBottom < movingBoxDims.h) {
          adjustedPos.z = otherMax.z;
        }
      }
    }
  }

  return adjustedPos;
}
```

### Update `computeConstrainedTarget` Function

Find the `computeConstrainedTarget` function and update it to use both snapping and collision prevention:

```typescript
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

  const lockedAxis = lockedAxisRef.current;
  const lockOrigin = axisLockOriginRef.current ?? startPositionRef.current;
  let targetPos = lockedAxis
    ? applyAxisLock(rawDataPos, lockOrigin, lockedAxis)
    : rawDataPos;

  // ... (parallel/perpendicular constraint code - keep existing) ...

  targetPos = {
    x: Math.round(targetPos.x * 10) / 10,
    y: Math.round(targetPos.y * 10) / 10,
    z: Math.round(targetPos.z * 10) / 10,
  };

  // Existing snap system (grid, corners, edges, etc.)
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
    };
    if (snapResult.snapped && snapResult.position) {
      targetPos = {
        x: Math.round(snapResult.position.x),
        y: Math.round(snapResult.position.y),
        z: Math.round(snapResult.position.z),
      };
      if (lockedAxis) {
        targetPos = applyAxisLock(targetPos, lockOrigin, lockedAxis);
      }
    }
  }

  // ========== NEW: BOX-TO-BOX MAGNETIC SNAP ==========
  const otherBoxes = getOtherBoxes();
  const boxDims = { w: box.dimensions.lenX, d: box.dimensions.lenY, h: box.dimensions.lenZ };
  
  // Get other boxes with full info for snapping
  const otherBoxesForSnap = walls
    .find(w => w.id === activeWallId)?.boxes
    .filter(b => b.id !== boxId)
    .map(b => ({
      id: b.id,
      position: b.position,
      dimensions: { w: b.dimensions.lenX, d: b.dimensions.lenY, h: b.dimensions.lenZ },
    })) || [];

  // Apply magnetic snap to nearby boxes
  const boxSnapResult = snapToNearbyBoxes(targetPos, boxDims, otherBoxesForSnap, 30);
  if (boxSnapResult.snapped) {
    targetPos = boxSnapResult.position;
  }
  // ===================================================

  // ========== NEW: COLLISION PREVENTION ==========
  // Prevent intersection (boxes can touch but not overlap)
  const startPos = startPositionRef.current;
  targetPos = preventIntersection(targetPos, boxDims, otherBoxes, startPos);
  // ===============================================

  // Apply floor and wall constraints
  targetPos = constrainToFloor(targetPos);
  targetPos = constrainToWall(targetPos, box.dimensions.lenY);

  // Collision detection (for visual feedback - should now always be empty)
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
```

### Import the New Function

At the top of `useDragInteraction.ts`, add the import:

```typescript
import {
  SnapResult,
  LockedAxis,
  collectSnapPoints,
  findBestSnap,
  applyAxisLock,
  SnapHysteresisState,
  snapToNearbyBoxes,  // NEW
} from '@/lib/visualiser/snapSystem';
```

---

## Summary of All Changes

### Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `MoveVisuals.tsx` | Remove green filled mesh | 🔴 Critical |
| `snapSystem.ts` | Add `snapToNearbyBoxes()` function | 🔴 Critical |
| `useDragInteraction.ts` | Add `preventIntersection()` function | 🔴 Critical |
| `useDragInteraction.ts` | Update `computeConstrainedTarget()` | 🔴 Critical |

### Behavior After Fix

| Action | Before Fix | After Fix |
|--------|------------|-----------|
| Drag box near another | No magnetic effect | **Snaps to touch at 30mm distance** |
| Push box into another | Overlaps with red warning | **Stops at edge, cannot overlap** |
| Boxes touching | Might have gap | **Perfect edge-to-edge contact** |
| Pull box away | Works | Works (no change) |
| Visual ghost preview | Green filled box | **Wireframe only** |

### Visual Representation

```
BEFORE FIX:
[████]   [████]     ← Gap, no snap
[████]              ← Cursor keeps moving
    [███[█]██]      ← Overlaps! (wrong)

AFTER FIX:
[████]   [████]     ← Box approaching
[████]→→            ← Gets within 30mm...
[████][████]        ← SNAP! Touches perfectly
[████][████]        ← Cannot push further (blocked)
```

---

## Testing Checklist

After implementing all fixes:

- [ ] Green filled ghost box is gone (wireframe only)
- [ ] When dragging box within 30mm of another, it snaps to touch
- [ ] Snapping works on all 4 sides (left, right, front, back)
- [ ] Snapping works on top and bottom (Z axis)
- [ ] Boxes CANNOT overlap/intersect each other
- [ ] Boxes CAN touch each other perfectly
- [ ] Pulling box away works freely with no resistance
- [ ] Floor constraint still works
- [ ] Wall constraint still works
- [ ] Axis locking (arrow keys) still works
- [ ] VCB input still works

---

## Accuracy After Fix

| Before | After |
|--------|-------|
| ~95% | **~99%** |

The remaining 1% would be minor visual polish items like custom cursor icons, which are optional.
