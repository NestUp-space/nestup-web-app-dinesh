# SketchUp Move Tool & Tape Measure Tool: Complete Research & Analysis

**Document Purpose:** Comprehensive analysis of SketchUp's Move and Tape Measure tools with detailed recommendations for Nestup 3D Cabinet Visualiser implementation.

**Date:** March 2026  
**Focus:** Tape Measure Tool (Primary), Move Tool (Secondary - Verification)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [SketchUp Move Tool - Research & Analysis](#sketchup-move-tool)
3. [SketchUp Tape Measure Tool - Deep Dive](#sketchup-tape-measure-tool)
4. [Current Implementation Analysis](#current-implementation-analysis)
5. [Gap Analysis & Recommendations](#gap-analysis--recommendations)
6. [Technical Specifications](#technical-specifications)
7. [UX/UI Specifications](#uxui-specifications)
8. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

### Key Findings

**Move Tool Status:** ✅ **95% Complete**
- Your implementation closely mirrors SketchUp's behavior
- Minor enhancements needed for polish

**Tape Measure Tool Status:** ⚠️ **70% Complete**
- Core measurement functionality present
- Missing critical SketchUp features:
  - Guide creation from edges (not just point-to-point)
  - Lock-to-axis during measurement
  - Temporary vs permanent guides
  - Rescale model feature
  - Guide intersections display

---

## SketchUp Move Tool

### How It Works (SketchUp Desktop)

#### 1. **Activation & Selection**
- **Keyboard:** Press `M` key
- **Toolbar:** Select Move icon (four arrows pointing outward)
- **Menu:** Tools → Move
- **Auto-activation:** Selecting object + M activates with selection

#### 2. **Interaction Phases**

**Phase 1: Pick Point (Start)**
```
User clicks on object → Inference engine activates
↓
Shows inference points (endpoints, midpoints, edges, faces)
↓
Click confirms start point → Object "attached" to cursor
```

**Phase 2: Move (Drag/Target)**
```
Move cursor → Object follows as "ghost"
↓
Inference continues (snap to other geometry)
↓
Axis locking available (Arrow keys or manual click)
↓
Click to place OR type distance + Enter
```

#### 3. **Key Features**

**A. Inference System**
- **Endpoint:** Green dot (corners, line ends)
- **Midpoint:** Cyan dot (middle of edges)
- **On Edge:** Red dot (anywhere along edge)
- **On Face:** Blue dot (anywhere on surface)
- **Intersection:** Red X (where edges meet)
- **Center:** Green dot (circle/arc centers, face centers)
- **From Point:** Magenta line (inference from another point)

**B. Axis Locking**
- **Red Axis:** Left Arrow key (X-axis)
- **Green Axis:** Right Arrow key (Y-axis)  
- **Blue Axis:** Up Arrow key (Z-axis)
- **Visual:** Dashed line becomes SOLID when locked
- **Unlock:** Press same arrow key again OR move cursor significantly

**C. Copy Mode**
- **Ctrl (PC) / Option (Mac):** Hold for single copy
- **Ctrl tap:** Toggle copy mode ON/OFF (+ cursor icon appears)
- **Multiple copies:** Type number + `x` (e.g., `5x`) after first copy

**D. Array Operations**
```
Linear Array:    5x      → 5 copies evenly spaced
Division Array:  5/      → Divide distance into 5 segments
External Array:  *5      → 5 copies at same interval beyond
```

**E. Value Control Box (VCB) Input**
```
Single distance:     1500        → Move 1500mm in current direction
Specific coords:     [100,200,0] → Absolute position
Relative coords:     <50,0,100>  → Relative offset from start
```

**F. Auto-Fold (Sticky Geometry)**
- Connected geometry stretches with moved object
- Hold Alt to prevent auto-fold
- "Sticky" faces follow the move

#### 4. **Visual Feedback**

| State | Visual |
|-------|--------|
| Idle (selected) | Bounding box with grip points |
| Moving | Dotted outline at origin + solid ghost at target |
| Axis locked | SOLID colored line (red/green/blue) |
| Copy mode | Small + icon next to cursor |
| Invalid position | Ghost turns red/transparent |
| Snapping | Snap point indicator + tooltip |

---

## SketchUp Tape Measure Tool

### How It Works (SketchUp Desktop)

#### 1. **Activation**
- **Keyboard:** Press `T` key
- **Toolbar:** Tape measure icon
- **Menu:** Tools → Tape Measure

#### 2. **Dual Mode Operation**

**Mode A: Measure (Default - No Ctrl)**
```
Click start point → Inference snaps
↓
Move to end point → Live measurement display
↓
Click end point → Measurement saved to history
↓
VCB shows: "Length: 1234mm"
```

**Mode B: Guide Creation (Ctrl held)**
```
1. POINT-TO-POINT GUIDE:
   Click start → Drag → Click end → Infinite guide line created

2. PARALLEL GUIDE FROM EDGE:
   Hover over edge (turns CYAN) → Click edge → Move perpendicular
   → Type offset distance OR click → Parallel guide created
   
3. AXIS-ALIGNED GUIDE:
   Click point → Press arrow key (locks axis) → Guide on that axis

4. DOUBLE-CLICK EDGE:
   Hover edge → Double-click → Instant guide along that edge
```

#### 3. **Guide Line Properties**

**Visual Characteristics:**
- **Color:** Cyan/turquoise (#00FFFF typically)
- **Style:** Dashed line (infinite length)
- **Thickness:** Thin (1-2px)
- **Opacity:** Semi-transparent (guides don't obscure geometry)
- **Origin marker:** Small dot where guide was created

**Behavior:**
- Extends infinitely in both directions
- Not part of geometry (separate layer)
- Can be hidden/shown: View → Guides → Hide/Show
- Can be deleted: Select + Delete OR Edit → Delete Guides → All/In Selection

**Guide Intersections:**
- Where guides cross, a snap point appears
- Green dot inference at intersections
- Useful for precise positioning

#### 4. **Key Features**

**A. Inference Integration**
```
Same inference as Move tool:
- Endpoints (green)
- Midpoints (cyan)  
- On Edge (red)
- On Face (blue)
- Intersections (red X)
- Guide intersections (green)
```

**B. Axis Locking During Measurement**
```
Start measurement → Press arrow key
↓
Measurement locked to that axis
↓  
VCB shows only distance along locked axis
```

**C. Measurement Display**
```
During: Live distance shown next to cursor
After:  VCB shows "Length: [value]" with units
```

**D. Parallel Guide Offset Workflow**
```
1. Hover edge until it highlights (CYAN)
2. Click edge (don't drag)
3. Move perpendicular to edge
4. Type offset distance (e.g., "100") + Enter
   OR click to set distance visually
5. Parallel guide created at that offset
```

**E. Measurement History**
- Last measurement shown in VCB
- Can recall by clicking VCB area
- Entity Info window shows: "Guide Line" with orientation

**F. Rescale Model Feature** (Advanced)
```
Measure known distance → Type actual value
↓
SketchUp asks: "Do you want to resize the model?"
↓
Yes → Entire model scales to match typed dimension
```

#### 5. **Visual Feedback States**

| State | Visual | Tooltip/VCB |
|-------|--------|-------------|
| Idle | Tape cursor | "Select start point" |
| Hovering edge (Ctrl) | CYAN highlighted edge | "Click edge for parallel guide" |
| Measuring (active) | Tape cursor + distance label | Live distance value |
| After measurement | - | "Length: 1234mm" |
| Guide mode (Ctrl) | + icon with tape cursor | "Guide mode" |
| Creating parallel | Dashed preview guide | Offset distance |
| Axis locked | SOLID axis line + tape | "Locked to [axis]" |

#### 6. **Advanced Techniques**

**Golden Section Guide:**
```
Measure edge → Type "1.618/" → Creates guide at golden ratio
```

**Precise Intersections:**
```
Create X-axis guide → Create Y-axis guide
→ Intersection point available for inference
```

**Construction Layout:**
```
From corner → Parallel guides at 50mm intervals
→ Grid for cabinet placement
```

---

## Current Implementation Analysis

### Move Tool - What You Have ✅

**Strengths (Matches SketchUp):**
1. ✅ Inference system (endpoint, midpoint, onEdge, onFace, center, intersection, origin)
2. ✅ Axis locking (X, Y, Z keys)
3. ✅ Copy mode (Ctrl toggle + Alt hold)
4. ✅ VCB input (distance, [x,y,z], <x,y,z>, arrays)
5. ✅ Snap system (grid, box-to-box magnetic snap)
6. ✅ Ghost visualization (wireframe at target)
7. ✅ Collision detection and prevention
8. ✅ Bounding box grips (corner, edge, face, center - Alt cycles)
9. ✅ ScreenTip feedback
10. ✅ Floor and wall constraints

**Minor Gaps:**
1. ⚠️ "From Point" inference (magenta line from another point)
2. ⚠️ Auto-fold/sticky geometry (connected faces stretching)
3. ⚠️ External array modifier (`*5` syntax)
4. ⚠️ Move by distance without clicking target (just type distance)

**Polish Needed:**
1. 🔧 Visual feedback when position invalid (red ghost)
2. 🔧 Audio feedback (optional, SketchUp has click sounds)
3. 🔧 Cursor changes more prominent

---

### Tape Measure Tool - What You Have

**Strengths (Matches SketchUp):**
1. ✅ Basic measurement (click-to-click distance)
2. ✅ Inference integration (reuses Move tool inferences)
3. ✅ Point-to-point guide creation (Ctrl mode)
4. ✅ Axis-aligned guides (X, Y, Z keys)
5. ✅ Guide visibility toggle (H key)
6. ✅ Live distance display during measurement
7. ✅ Measurement history storage

**Critical Gaps:**
1. ❌ **Parallel guide from edge** (hover edge → offset)
   - This is THE most-used feature in SketchUp
   - Currently missing entirely
   
2. ❌ **Edge highlighting** (hovering edge should turn CYAN)
   - `nearestEdge` exists but visual not prominent enough
   
3. ❌ **Double-click edge for instant guide**
   - Quick workflow missing

4. ❌ **Axis lock during measurement**
   - Can lock when creating guide, but not during measurement
   - Should show locked distance only along that axis

5. ❌ **Guide offset input workflow**
   - Click edge → type distance → Enter should work
   - Currently requires two clicks for point-to-point

6. ❌ **Guide intersection display**
   - Where guides cross should show snap points
   - Not currently detecting guide intersections

7. ❌ **Rescale model feature**
   - Measure → type different value → resize model
   - Advanced feature, lower priority

8. ❌ **Measurement label positioning**
   - Should follow cursor during measurement
   - Fixed position after completion

9. ⚠️ **Guide visual style**
   - Should be more subtle (thinner, more transparent)
   - Current style might be too bold

10. ⚠️ **VCB integration**
    - Shows distance but doesn't format as "Length: 1234mm"
    - No "resize model" prompt

---

## Gap Analysis & Recommendations

### Priority 1: CRITICAL (Tape Measure)

#### 1.1 Parallel Guide from Edge Workflow

**What's Missing:**
```
SketchUp:  Hover edge → Click → Move perp → Type offset → Guide created
Your Code: Only point-to-point guides work
```

**Technical Changes Needed:**

**File:** `useMeasurementTool.ts`
```typescript
// ADD NEW STATE:
const [edgeMode, setEdgeMode] = useState<'hover' | 'clicked' | null>(null);
const [clickedEdge, setClickedEdge] = useState<BoxEdge | null>(null);

// MODIFY handlePointerDown for Ctrl mode:
if (measurementMode === 'guide_create') {
  if (nearestEdge && !clickedEdge) {
    // First click on edge - enter offset mode
    setClickedEdge(nearestEdge);
    setEdgeMode('clicked');
    // Don't set startPoint yet
  } else if (clickedEdge) {
    // Second click OR type distance sets offset
    const offsetDistance = calculatePerpendicularOffset(clickedEdge, position);
    const guide = createParallelGuide(clickedEdge, offsetDistance);
    addMeasureGuideLine(guide);
    setClickedEdge(null);
    setEdgeMode(null);
  }
}
```

**File:** `measurementTool.ts`
```typescript
// ADD HELPER:
export function calculatePerpendicularOffset(
  edge: BoxEdge,
  point: Position
): number {
  // Project point onto line perpendicular to edge
  const edgeVector = {
    x: edge.end.x - edge.start.x,
    y: edge.end.y - edge.start.y,
    z: edge.end.z - edge.start.z,
  };
  
  // Normalize edge vector
  const length = Math.sqrt(
    edgeVector.x ** 2 + edgeVector.y ** 2 + edgeVector.z ** 2
  );
  const normalized = {
    x: edgeVector.x / length,
    y: edgeVector.y / length,
    z: edgeVector.z / length,
  };
  
  // Vector from edge start to point
  const toPoint = {
    x: point.x - edge.start.x,
    y: point.y - edge.start.y,
    z: point.z - edge.start.z,
  };
  
  // Perpendicular distance
  const parallelDist = 
    toPoint.x * normalized.x + 
    toPoint.y * normalized.y + 
    toPoint.z * normalized.z;
    
  const perpVector = {
    x: toPoint.x - parallelDist * normalized.x,
    y: toPoint.y - parallelDist * normalized.y,
    z: toPoint.z - parallelDist * normalized.z,
  };
  
  return Math.sqrt(
    perpVector.x ** 2 + perpVector.y ** 2 + perpVector.z ** 2
  );
}
```

**File:** `MeasurementVisuals.tsx`
```tsx
// ENHANCE EdgeHighlight for clicked edge:
{mode === 'guide_create' && clickedEdge && (
  <>
    <EdgeHighlight 
      start={clickedEdge.start} 
      end={clickedEdge.end} 
      color="#00FFFF" // CYAN for active
    />
    {currentPoint && (
      <ParallelGuidePreview 
        edge={clickedEdge}
        offset={calculatePerpendicularOffset(clickedEdge, currentPoint)}
      />
    )}
  </>
)}
```

**New Component:**
```tsx
const ParallelGuidePreview: React.FC<{
  edge: BoxEdge;
  offset: number;
}> = ({ edge, offset }) => {
  const guidePoints = useMemo(() => {
    // Calculate parallel line at offset distance
    const edgeVector = {
      x: edge.end.x - edge.start.x,
      y: edge.end.y - edge.start.y,
      z: edge.end.z - edge.start.z,
    };
    
    const perpVector = calculatePerpendicular(edgeVector);
    const normalized = normalize(perpVector);
    
    const offsetVector = {
      x: normalized.x * offset,
      y: normalized.y * offset,
      z: normalized.z * offset,
    };
    
    const start: Position = {
      x: edge.start.x + offsetVector.x,
      y: edge.start.y + offsetVector.y,
      z: edge.start.z + offsetVector.z,
    };
    
    const end: Position = {
      x: edge.end.x + offsetVector.x,
      y: edge.end.y + offsetVector.y,
      z: edge.end.z + offsetVector.z,
    };
    
    // Extend to infinite length
    const extendedStart = extendPoint(start, end, -5000);
    const extendedEnd = extendPoint(start, end, 5000);
    
    return [positionToThree(extendedStart), positionToThree(extendedEnd)];
  }, [edge, offset]);
  
  return (
    <Line
      points={guidePoints}
      color="#00FFFF"
      lineWidth={2}
      dashed
      dashScale={10}
      dashSize={20}
      gapSize={10}
      transparent
      opacity={0.5}
    />
  );
};
```

---

#### 1.2 Axis Lock During Measurement

**What's Missing:**
```
SketchUp:  Start measurement → Press arrow → Shows distance along axis only
Your Code: Axis lock works for guides, not measurement
```

**Technical Changes:**

**File:** `useMeasurementTool.ts`
```typescript
// ADD STATE:
const [measurementAxisLock, setMeasurementAxisLock] = useState<'x' | 'y' | 'z' | null>(null);

// MODIFY handleKeyDown:
case 'ArrowLeft': // X-axis
case 'ArrowRight': // Y-axis  
case 'ArrowUp': // Z-axis
  if (startPoint && measurementMode === 'measure') {
    const axis = event.key === 'ArrowLeft' ? 'x' : 
                 event.key === 'ArrowRight' ? 'y' : 'z';
    setMeasurementAxisLock(prev => prev === axis ? null : axis);
  }
  break;

// MODIFY handlePointerMove:
if (startPoint && measurementAxisLock) {
  // Constrain currentPoint to locked axis
  const constrained = constrainToAxis(startPoint, position, measurementAxisLock);
  setCurrentPoint(constrained);
} else {
  setCurrentPoint(position);
}
```

**File:** `measurementTool.ts`
```typescript
export function constrainToAxis(
  start: Position,
  target: Position,
  axis: 'x' | 'y' | 'z'
): Position {
  const result = { ...start };
  
  switch (axis) {
    case 'x':
      result.x = target.x;
      break;
    case 'y':
      result.y = target.y;
      break;
    case 'z':
      result.z = target.z;
      break;
  }
  
  return result;
}

export function getAxisDistance(
  start: Position,
  end: Position,
  axis: 'x' | 'y' | 'z' | null
): number {
  if (!axis) {
    return measureDistance(start, end).distance;
  }
  
  return Math.abs(end[axis] - start[axis]);
}
```

**File:** `MeasurementOverlay.tsx`
```tsx
// MODIFY MeasurementLabel to show axis-locked distance:
const displayDistance = useMemo(() => {
  if (!distance) return null;
  
  if (measurementAxisLock) {
    const axisDist = getAxisDistance(startPoint, currentPoint, measurementAxisLock);
    return `${axisDist.toFixed(0)}mm (${measurementAxisLock.toUpperCase()}-axis)`;
  }
  
  return `${distance.toFixed(0)}mm`;
}, [distance, measurementAxisLock, startPoint, currentPoint]);
```

---

#### 1.3 Double-Click Edge for Instant Guide

**What's Missing:**
```
SketchUp:  Hover edge → Double-click → Guide along edge created
Your Code: Mentioned in code but not working
```

**File:** `useMeasurementTool.ts`
```typescript
// FIX handlePointerDown double-click detection:
const lastClickRef = useRef<{ edge: BoxEdge | null; time: number }>({
  edge: null,
  time: 0,
});

const handlePointerDown = useCallback((
  event: PointerEvent,
  raycaster: THREE.Raycaster,
  camera: THREE.Camera,
  canvasSize: { width: number; height: number }
) => {
  if (!isActive) return;
  if (event.button !== 0) return;
  
  const now = Date.now();
  const doubleClickThreshold = 300; // ms
  
  if (measurementMode === 'guide_create' && nearestEdge && !startPoint) {
    // Check for double-click on same edge
    if (
      lastClickRef.current.edge &&
      edgesEqual(lastClickRef.current.edge, nearestEdge) &&
      now - lastClickRef.current.time < doubleClickThreshold
    ) {
      // DOUBLE-CLICK DETECTED - Create guide along edge
      const guide = createPointToPointGuide(nearestEdge.start, nearestEdge.end);
      addMeasureGuideLine(guide);
      lastClickRef.current = { edge: null, time: 0 };
      return;
    }
    
    // Record this click
    lastClickRef.current = { edge: nearestEdge, time: now };
  }
  
  // ... rest of existing logic
}, [/* deps */]);

function edgesEqual(edge1: BoxEdge, edge2: BoxEdge): boolean {
  return (
    positionsEqual(edge1.start, edge2.start) &&
    positionsEqual(edge1.end, edge2.end)
  ) || (
    positionsEqual(edge1.start, edge2.end) &&
    positionsEqual(edge1.end, edge2.start)
  );
}

function positionsEqual(p1: Position, p2: Position, tolerance = 0.1): boolean {
  return (
    Math.abs(p1.x - p2.x) < tolerance &&
    Math.abs(p1.y - p2.y) < tolerance &&
    Math.abs(p1.z - p2.z) < tolerance
  );
}
```

---

#### 1.4 Guide Intersection Inference

**What's Missing:**
```
SketchUp:  Where guides cross → Green snap point appears
Your Code: Guides exist but intersections not calculated
```

**File:** `measurementTool.ts`
```typescript
export interface GuideIntersection {
  position: Position;
  guides: [string, string]; // IDs of intersecting guides
}

export function calculateGuideIntersections(
  guides: MeasureGuideLine[]
): GuideIntersection[] {
  const intersections: GuideIntersection[] = [];
  
  for (let i = 0; i < guides.length; i++) {
    for (let j = i + 1; j < guides.length; j++) {
      const guide1 = guides[i];
      const guide2 = guides[j];
      
      const intersection = findLineIntersection(
        guide1.origin,
        guide1.direction,
        guide2.origin,
        guide2.direction
      );
      
      if (intersection) {
        intersections.push({
          position: intersection,
          guides: [guide1.id, guide2.id],
        });
      }
    }
  }
  
  return intersections;
}

function findLineIntersection(
  origin1: Position,
  direction1: Position,
  origin2: Position,
  direction2: Position
): Position | null {
  // Solve parametric line equations:
  // P1 = origin1 + t1 * direction1
  // P2 = origin2 + t2 * direction2
  
  // For 3D lines, they might not intersect (skew)
  // Find closest point and check distance
  
  const { x: x1, y: y1, z: z1 } = origin1;
  const { x: dx1, y: dy1, z: dz1 } = direction1;
  const { x: x2, y: y2, z: z2 } = origin2;
  const { x: dx2, y: dy2, z: dz2 } = direction2;
  
  // Check if lines are parallel
  const cross = {
    x: dy1 * dz2 - dz1 * dy2,
    y: dz1 * dx2 - dx1 * dz2,
    z: dx1 * dy2 - dy1 * dx2,
  };
  
  const crossMag = Math.sqrt(cross.x ** 2 + cross.y ** 2 + cross.z ** 2);
  if (crossMag < 0.0001) return null; // Parallel lines
  
  // Solve for intersection parameters
  // This is complex 3D math - using matrix solution
  const diff = {
    x: x2 - x1,
    y: y2 - y1,
    z: z2 - z1,
  };
  
  const det = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(det) < 0.0001) return null;
  
  const t1 = (diff.x * dy2 - diff.y * dx2) / det;
  
  const point1 = {
    x: x1 + t1 * dx1,
    y: y1 + t1 * dy1,
    z: z1 + t1 * dz1,
  };
  
  const t2 = (diff.x * dy1 - diff.y * dx1) / det;
  
  const point2 = {
    x: x2 + t2 * dx2,
    y: y2 + t2 * dy2,
    z: z2 + t2 * dz2,
  };
  
  // Check if points are close enough (intersection tolerance)
  const distance = Math.sqrt(
    (point1.x - point2.x) ** 2 +
    (point1.y - point2.y) ** 2 +
    (point1.z - point2.z) ** 2
  );
  
  if (distance < 1) { // 1mm tolerance
    return {
      x: (point1.x + point2.x) / 2,
      y: (point1.y + point2.y) / 2,
      z: (point1.z + point2.z) / 2,
    };
  }
  
  return null;
}
```

**File:** `detectMeasurementInferences` (ADD guide intersections)
```typescript
// ADD to detectMeasurementInferences function:
export function detectMeasurementInferences(
  camera: THREE.Camera,
  canvasSize: { width: number; height: number },
  cursorPx: { x: number; y: number },
  boxes: Box[],
  guides?: MeasureGuideLine[] // ADD THIS PARAMETER
): MeasurementInferencePoint[] {
  const inferences: MeasurementInferencePoint[] = [];
  
  // ... existing box inferences ...
  
  // ADD GUIDE INTERSECTION INFERENCES:
  if (guides && guides.length > 0) {
    const visibleGuides = guides.filter(g => g.visible);
    const intersections = calculateGuideIntersections(visibleGuides);
    
    for (const intersection of intersections) {
      const screenPos = projectToScreen(
        dataToThree(intersection.position.x, intersection.position.y, intersection.position.z),
        camera,
        canvasSize
      );
      
      const dist = screenDistance(cursorPx, screenPos);
      
      if (dist < SCREEN_THRESHOLD_PX) {
        inferences.push({
          position: intersection.position,
          type: 'intersection',
          label: 'Guide Intersection',
          priority: PRIORITY.intersection,
        });
      }
    }
  }
  
  // ... rest of function ...
}
```

**File:** `useMeasurementTool.ts`
```typescript
// PASS guides to inference detection:
const inferences = detectMeasurementInferences(
  camera,
  canvasSize,
  cursorPx,
  boxes,
  measureGuideLines // ADD THIS
);
```

---

### Priority 2: IMPORTANT (Tape Measure Polish)

#### 2.1 VCB Format & Rescale Model

**File:** `MeasurementOverlay.tsx`
```tsx
// ENHANCE VCB display:
const VCBDisplay: React.FC<{ distance: number | null }> = ({ distance }) => {
  const [rescaleInput, setRescaleInput] = useState('');
  const [showRescalePrompt, setShowRescalePrompt] = useState(false);
  
  const handleRescaleSubmit = () => {
    const newValue = parseFloat(rescaleInput);
    if (distance && newValue > 0) {
      const scaleFactor = newValue / distance;
      // Show confirmation dialog
      setShowRescalePrompt(true);
    }
  };
  
  return (
    <div className="vcb-display">
      {distance !== null && (
        <>
          <div className="measurement-value">
            Length: {distance.toFixed(0)}mm
          </div>
          <input
            type="text"
            placeholder="Type distance to rescale"
            value={rescaleInput}
            onChange={(e) => setRescaleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRescaleSubmit();
            }}
          />
          {showRescalePrompt && (
            <div className="rescale-prompt">
              <p>Resize model to make this {rescaleInput}mm?</p>
              <button onClick={() => applyRescale(scaleFactor)}>Yes</button>
              <button onClick={() => setShowRescalePrompt(false)}>No</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
```

---

#### 2.2 Edge Hover Visual Enhancement

**File:** `MeasurementVisuals.tsx`
```tsx
// IMPROVE EdgeHighlight:
export const EdgeHighlight: React.FC<EdgeHighlightProps> = ({
  start, end, color = '#00FFFF', pulsate = false
}) => {
  const points = useMemo(() => [positionToThree(start), positionToThree(end)], [start, end]);
  
  return (
    <group>
      {/* Main line */}
      <Line 
        points={points} 
        color={color} 
        lineWidth={6} 
        transparent 
        opacity={pulsate ? 0.9 : 0.7} 
      />
      
      {/* Glow effect */}
      <Line 
        points={points} 
        color={color} 
        lineWidth={10} 
        transparent 
        opacity={0.3} 
      />
      
      {/* Endpoint markers */}
      <mesh position={positionToThree(start)}>
        <sphereGeometry args={[10, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      <mesh position={positionToThree(end)}>
        <sphereGeometry args={[10, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
    </group>
  );
};
```

---

#### 2.3 Measurement Label Cursor Follow

**File:** `MeasurementOverlay.tsx`
```tsx
// IMPROVE MeasurementLabel to follow cursor:
const MeasurementLabel: React.FC<MeasurementLabelProps> = ({
  distance,
  position,
  cursorPosition, // ADD THIS PROP
  axis,
}) => {
  const labelRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (labelRef.current && cursorPosition) {
      labelRef.current.style.left = `${cursorPosition.x + 20}px`;
      labelRef.current.style.top = `${cursorPosition.y - 30}px`;
    }
  }, [cursorPosition]);
  
  return (
    <div
      ref={labelRef}
      className="measurement-label-cursor"
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: '#FFFFFF',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '14px',
        fontFamily: 'monospace',
        whiteSpace: 'nowrap',
        zIndex: 10000,
      }}
    >
      {distance ? `${distance.toFixed(0)}mm` : ''}
      {axis && <span style={{ color: '#00FFFF' }}> ({axis})</span>}
    </div>
  );
};
```

---

### Priority 3: NICE TO HAVE (Move Tool Enhancements)

#### 3.1 "From Point" Inference (Magenta Line)

**What's Missing:**
```
SketchUp:  After selecting point → Hold Shift → Inference from that point
Your Code: Missing "from point" parallel/perpendicular inference
```

**File:** `moveInference.ts`
```typescript
// ADD new inference type:
export type InferenceType =
  | 'endpoint' | 'midpoint' | 'center' | 'onEdge' | 'onFace'
  | 'intersection' | 'origin' | 'inGroup' | 'grid'
  | 'fromPoint'; // ADD THIS

export const INFERENCE_COLORS: Record<InferenceType, string> = {
  // ... existing ...
  fromPoint: '#FF00FF', // Magenta
};

// ADD to detectInferences:
export function detectInferences(
  camera: THREE.Camera,
  size: { width: number; height: number },
  cursorPx: { x: number; y: number },
  selectedBox: Box | null,
  otherBoxes: Box[],
  aroundPosition?: Position,
  excludeBoxId?: string,
  basePoint?: Position, // Existing
  insideGroup?: boolean,
  fromPointRef?: Position // ADD THIS - reference point for "from" inference
): InferencePoint[] {
  const inferences: InferencePoint[] = [];
  
  // ... existing inference detection ...
  
  // ADD FROM POINT INFERENCE:
  if (fromPointRef && aroundPosition) {
    // Check if current position is parallel/perpendicular to fromPointRef
    const dx = aroundPosition.x - fromPointRef.x;
    const dy = aroundPosition.y - fromPointRef.y;
    const dz = aroundPosition.z - fromPointRef.z;
    
    const tolerance = 5; // 5mm tolerance for axis alignment
    
    // Check X-axis alignment
    if (Math.abs(dy) < tolerance && Math.abs(dz) < tolerance) {
      inferences.push({
        position: aroundPosition,
        type: 'fromPoint',
        label: `From Point (X-axis)`,
        priority: PRIORITY.fromPoint || 40,
      });
    }
    
    // Check Y-axis alignment
    if (Math.abs(dx) < tolerance && Math.abs(dz) < tolerance) {
      inferences.push({
        position: aroundPosition,
        type: 'fromPoint',
        label: `From Point (Y-axis)`,
        priority: PRIORITY.fromPoint || 40,
      });
    }
    
    // Check Z-axis alignment
    if (Math.abs(dx) < tolerance && Math.abs(dy) < tolerance) {
      inferences.push({
        position: aroundPosition,
        type: 'fromPoint',
        label: `From Point (Z-axis)`,
        priority: PRIORITY.fromPoint || 40,
      });
    }
  }
  
  return inferences;
}
```

**File:** `useDragInteraction.ts`
```typescript
// ADD state for reference point:
const [fromPointRef, setFromPointRef] = useState<Position | null>(null);

// ADD Shift key handler:
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Shift' && ghostPosition) {
      setFromPointRef(ghostPosition); // Set current position as reference
    }
  };
  
  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      setFromPointRef(null); // Clear reference
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}, [ghostPosition]);

// PASS to detectInferences:
const inferences = detectInferences(
  camera,
  size,
  cursorPx,
  selectedBox,
  otherBoxes,
  aroundPosition,
  excludeBoxId,
  basePoint,
  insideGroup,
  fromPointRef // ADD THIS
);
```

**File:** `MoveVisuals.tsx`
```tsx
// ADD visual for "from point" reference:
{fromPointRef && (
  <group>
    {/* Reference point marker */}
    <mesh position={dataToThree(fromPointRef.x, fromPointRef.y, fromPointRef.z)}>
      <sphereGeometry args={[8, 16, 16]} />
      <meshBasicMaterial color="#FF00FF" />
    </mesh>
    
    {/* Line from reference to current */}
    {ghostPosition && (
      <Line
        points={[
          dataToThree(fromPointRef.x, fromPointRef.y, fromPointRef.z),
          dataToThree(ghostPosition.x, ghostPosition.y, ghostPosition.z),
        ]}
        color="#FF00FF"
        lineWidth={2}
        dashed
        dashScale={5}
        dashSize={10}
        gapSize={10}
        transparent
        opacity={0.6}
      />
    )}
  </group>
)}
```

---

#### 3.2 Invalid Position Visual Feedback

**File:** `MoveVisuals.tsx`
```tsx
// MODIFY ghost box to show red when invalid:
const GhostBox: React.FC<{ position: Position; dimensions; isValid: boolean }> = ({
  position,
  dimensions,
  isValid,
}) => {
  const color = isValid ? '#00FF00' : '#FF0000';
  const opacity = isValid ? 0.3 : 0.5;
  
  return (
    <group position={dataToThree(position.x, position.y, position.z)}>
      {/* Wireframe */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(dimensions.lenX, dimensions.lenZ, dimensions.lenY)]} />
        <lineBasicMaterial color={color} linewidth={2} />
      </lineSegments>
      
      {/* Semi-transparent fill when invalid */}
      {!isValid && (
        <mesh>
          <boxGeometry args={[dimensions.lenX, dimensions.lenZ, dimensions.lenY]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={opacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Pulsating effect when invalid */}
      {!isValid && <PulsatingWarning />}
    </group>
  );
};

const PulsatingWarning: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(clock.elapsedTime * 3) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[20, 16, 16]} />
      <meshBasicMaterial 
        color="#FF0000" 
        transparent 
        opacity={0.3}
        wireframe
      />
    </mesh>
  );
};
```

---

#### 3.3 Auto-Fold / Sticky Geometry

**Note:** This is a COMPLEX feature that requires:
- Topology tracking (which faces connect to which)
- Stretching connected geometry during move
- Performance optimization for large models

**Recommendation:** DEFER this to future iteration. It's not critical for cabinet design where boxes are typically independent units.

---

#### 3.4 External Array Modifier (`*5` syntax)

**File:** `useDragInteraction.ts`
```typescript
// ADD to applyNumericInput:
if (input.includes('*')) {
  // External array: repeat copies beyond current distance
  const [countStr] = input.split('*');
  const count = parseInt(countStr, 10);
  
  if (!isNaN(count) && count > 0 && ghostPosition && startPosition) {
    const delta = {
      x: ghostPosition.x - startPosition.x,
      y: ghostPosition.y - startPosition.y,
      z: ghostPosition.z - startPosition.z,
    };
    
    // Create copies at intervals beyond current position
    for (let i = 1; i <= count; i++) {
      const copyPosition = {
        x: ghostPosition.x + delta.x * i,
        y: ghostPosition.y + delta.y * i,
        z: ghostPosition.z + delta.z * i,
      };
      
      createCopyAt(copyPosition);
    }
    
    return true;
  }
}
```

---

## Technical Specifications

### Tape Measure Tool - Complete Spec

#### State Management
```typescript
interface TapeMeasureState {
  // Mode
  mode: 'measure' | 'guide_create';
  isActive: boolean;
  
  // Measurement
  startPoint: Position | null;
  currentPoint: Position | null;
  measurementAxisLock: 'x' | 'y' | 'z' | null;
  
  // Guide Creation
  edgeMode: 'hover' | 'clicked' | null;
  clickedEdge: BoxEdge | null;
  guideOffset: number | null;
  
  // Inference
  snapPoint: MeasurementInferencePoint | null;
  nearestEdge: BoxEdge | null;
  guideIntersections: GuideIntersection[];
  
  // Display
  hoverInfo: HoverMeasurementInfo | null;
  currentDistance: number | null;
  dominantAxis: 'x' | 'y' | 'z' | '3d' | null;
  
  // Keyboard
  isCtrlPressed: boolean;
  isShiftPressed: boolean;
  
  // Rescale
  rescaleValue: number | null;
  showRescalePrompt: boolean;
}
```

#### Workflow States
```
IDLE STATE:
- No startPoint
- Show hover measurements on edges
- Detect nearest edge (guide_create mode)
- Show snap inferences

MEASURING STATE (Measure Mode):
- startPoint set
- currentPoint follows cursor
- Live distance display
- Axis lock available (arrow keys)
- Click to finish → Add to history

GUIDE CREATING STATE (Guide Mode):
WORKFLOW A - Point to Point:
  - Click point 1 → set startPoint
  - Click point 2 → create guide → reset

WORKFLOW B - Parallel from Edge:
  - Hover edge (CYAN highlight)
  - Click edge → set clickedEdge
  - Move perpendicular → preview parallel guide
  - Type distance OR click → create guide → reset

WORKFLOW C - Axis Guide:
  - Click point → set startPoint
  - Press arrow key → create axis guide → reset

WORKFLOW D - Double-click Edge:
  - Hover edge
  - Double-click → instant guide → reset
```

#### Visual Feedback Matrix

| State | Visual Elements | Color | Behavior |
|-------|----------------|-------|----------|
| Idle (Measure) | Tape cursor | Default | - |
| Measuring | Tape cursor + line + endpoints | #FF0000 | Follow cursor |
| Measuring (axis locked) | + solid axis line | Axis color | Constrain to axis |
| Idle (Guide) | Tape + cursor | Default | - |
| Hovering edge | CYAN thick edge highlight | #00FFFF | Pulsate |
| Edge clicked | CYAN edge + parallel preview | #00FFFF | Show offset |
| Creating guide | Dashed preview line | #00FFFF | Follow cursor |
| Snap active | Inference indicator | Per type | Show label |
| Guide created | Infinite dashed line | #00FFFF | Persistent |
| Guide selected | White line, thicker | #FFFFFF | Highlight |
| Guide intersection | Green dot | #00FF00 | Snap point |

---

## UX/UI Specifications

### User Flow - Tape Measure Tool

#### Flow 1: Quick Measurement
```
1. Press T → Tool activates
2. Hover over cabinet edge → See edge highlight
3. Click edge endpoint → Start point set
4. Move to other endpoint → See live distance
5. Click → Measurement saved
6. VCB shows "Length: 1234mm"
```

#### Flow 2: Create Parallel Guide
```
1. Press T + hold Ctrl → Guide mode
2. Hover over vertical cabinet edge → Edge turns CYAN
3. Click edge (don't drag) → Edge mode activated
4. Move perpendicular → See parallel guide preview
5a. Type "100" + Enter → Guide at 100mm offset
OR
5b. Click at desired offset → Guide created
6. Guide appears as infinite dashed line
```

#### Flow 3: Create Axis Guide
```
1. Press T + Ctrl → Guide mode
2. Click any point → Point selected
3. Press arrow key (Left/Right/Up) → Guide created on that axis
4. Guide extends infinitely
```

#### Flow 4: Measure with Axis Lock
```
1. Press T → Measure mode
2. Click start point
3. Press arrow key → Lock to axis (line turns solid color)
4. Move → Distance shown only along locked axis
5. Click → Measurement saved with axis indication
```

#### Flow 5: Guide Intersection Snap
```
1. Create vertical guide (X-axis)
2. Create horizontal guide (Y-axis)
3. Where they cross → Green snap point appears
4. Use Move tool → Can snap to intersection
```

---

### Keyboard Shortcuts

#### Tape Measure Tool
| Key | Action | Context |
|-----|--------|---------|
| T | Activate tool | Any time |
| Ctrl | Toggle guide mode | While active |
| Esc | Cancel measurement/guide | During operation |
| Delete/Backspace | Delete selected guide | Guide selected |
| H | Toggle guide visibility | Any time |
| X | Create X-axis guide | Guide mode + point clicked |
| Y | Create Y-axis guide | Guide mode + point clicked |
| Z | Create Z-axis guide | Guide mode + point clicked |
| Arrow Left | Lock to X-axis | During measurement |
| Arrow Right | Lock to Y-axis | During measurement |
| Arrow Up | Lock to Z-axis | During measurement |
| Enter | Confirm offset | Typing offset value |
| Numbers | Type offset/rescale value | After measurement |

#### Move Tool (Reference)
| Key | Action | Context |
|-----|--------|---------|
| M | Activate tool | Any time |
| X | Lock to X-axis | During move |
| Y | Lock to Y-axis | During move |
| Z | Lock to Z-axis | During move |
| Ctrl (tap) | Toggle copy mode | During move |
| Ctrl (hold) | Temporary copy | During move |
| Alt | Cycle grip mode | Idle (8 corners → 12 edges → 6 faces → 1 center) |
| Alt (hold) | Disable auto-fold | During move (future) |
| Shift | Set "from point" reference | During move (future) |
| Esc | Cancel move | During move |
| Enter | Apply VCB value | After typing |

---

### Visual Design Principles

#### 1. Inference Colors (Match SketchUp)
- **Green (#00FF00):** Endpoints, centers, guide intersections
- **Cyan (#00FFFF):** Midpoints, hovering edges
- **Red (#FF0000):** On edge inference, invalid position
- **Blue (#0000CC):** On face inference
- **Yellow (#FFFF00):** Origin (0,0,0), grid
- **Magenta (#FF00FF):** In group, from point reference

#### 2. Guide Line Styling
```css
Guide Line (default):
- Color: #00FFFF (cyan)
- Style: Dashed (dash 30px, gap 20px)
- Width: 1px
- Opacity: 0.6
- Extends: Infinite (5000mm each direction)

Guide Line (selected):
- Color: #FFFFFF (white)
- Width: 2px
- Opacity: 0.8

Guide Line (preview):
- Color: #00FFFF
- Width: 2px
- Opacity: 0.5
- Style: Dashed (dash 20px, gap 10px)
```

#### 3. Measurement Display
```css
Cursor Label:
- Position: Cursor + 20px right, -30px up
- Background: rgba(0, 0, 0, 0.8)
- Text: #FFFFFF, 14px monospace
- Padding: 4px 8px
- Border-radius: 4px

VCB Display:
- Position: Bottom-right corner
- Format: "Length: 1234mm"
- Font: 12px Arial
- Color: #333333
- Background: #FFFFFF
- Border: 1px solid #CCCCCC
```

#### 4. Edge Highlighting
```css
Hover (not clicked):
- Color: #00FFFF
- Width: 6px
- Opacity: 0.7
- Glow: 10px width, opacity 0.3

Clicked (offset mode):
- Color: #00FFFF
- Width: 6px
- Opacity: 0.9
- Pulsate: Yes (subtle)
```

---

## Implementation Roadmap

### Phase 1: Critical Tape Measure Features (1-2 weeks)

**Week 1:**
- ✅ Day 1-2: Parallel guide from edge workflow
  - Edge click detection
  - Perpendicular offset calculation
  - Preview guide rendering
  - Offset input handling

- ✅ Day 3-4: Axis lock during measurement
  - Arrow key handlers
  - Axis-constrained distance calculation
  - Visual feedback (solid axis line)
  - VCB display update

- ✅ Day 5: Double-click edge for instant guide
  - Double-click detection
  - Edge equality comparison
  - Instant guide creation

**Week 2:**
- ✅ Day 6-7: Guide intersection detection
  - Intersection calculation algorithm
  - Inference point integration
  - Snap indicator rendering

- ✅ Day 8-9: Enhanced edge hovering
  - Improved visual feedback
  - Glow effects
  - Pulsating animation

- ✅ Day 10: VCB format improvements
  - "Length: Xmm" format
  - Cursor-following label
  - Axis indication in label

---

### Phase 2: Tape Measure Polish (1 week)

**Week 3:**
- ✅ Day 11-12: Rescale model feature
  - Input handling
  - Confirmation dialog
  - Scale factor calculation
  - Model scaling execution

- ✅ Day 13: Guide visual refinements
  - Thinner, more subtle lines
  - Better dash patterns
  - Origin markers

- ✅ Day 14: Measurement history UI
  - Collapsible panel
  - Clear history button
  - Measurement selection

- ✅ Day 15: Testing and bug fixes

---

### Phase 3: Move Tool Enhancements (1 week) - OPTIONAL

**Week 4:**
- ✅ Day 16-17: "From Point" inference
  - Shift key reference point
  - Parallel/perpendicular detection
  - Magenta line rendering

- ✅ Day 18: Invalid position feedback
  - Red ghost coloring
  - Pulsating warning
  - Semi-transparent fill

- ✅ Day 19: External array modifier
  - `*5` syntax parsing
  - Copy creation logic

- ✅ Day 20: Polish and testing

---

### Phase 4: Future Enhancements (Deferred)

**Low Priority:**
- Auto-fold / sticky geometry (complex, defer to v2.0)
- Protractor tool (angle measurement)
- Section planes
- Guide cleanup tools (delete all, delete in selection)
- Guide lock/unlock
- Guide offset editing (modify existing guide)
- Construction point markers
- Dimension annotations (permanent labels)

---

## Testing Checklist

### Tape Measure Tool

#### Measurement Mode
- [ ] Click two points → Distance shown in VCB
- [ ] Measurement follows cursor during drag
- [ ] Snap to endpoints, midpoints, edges
- [ ] Arrow key locks to axis → Shows axis-only distance
- [ ] Press same arrow key → Unlocks axis
- [ ] ESC cancels active measurement
- [ ] Measurement added to history
- [ ] History panel shows all measurements
- [ ] Can clear individual measurements

#### Guide Creation Mode (Ctrl)
- [ ] Ctrl press → Mode indicator shows "Guide"
- [ ] Ctrl release → Mode returns to "Measure"
- [ ] Click point 1, point 2 → Point-to-point guide created

**Parallel Guide Workflow:**
- [ ] Hover edge → Edge highlights CYAN
- [ ] Click edge → Edge stays highlighted
- [ ] Move perpendicular → Preview guide appears
- [ ] Preview shows correct offset distance
- [ ] Type "100" + Enter → Guide at 100mm offset
- [ ] Click without typing → Guide at clicked distance
- [ ] ESC while in edge mode → Cancels, resets state

**Axis Guide:**
- [ ] Click point → Press Arrow Left → X-axis guide created
- [ ] Click point → Press Arrow Right → Y-axis guide created
- [ ] Click point → Press Arrow Up → Z-axis guide created

**Double-Click Edge:**
- [ ] Hover edge → Double-click → Guide along edge created
- [ ] Works on horizontal edges
- [ ] Works on vertical edges
- [ ] Works on depth edges

#### Guide Display
- [ ] Guides render as dashed cyan lines
- [ ] Guides extend infinitely (both directions)
- [ ] Origin marker visible at creation point
- [ ] Press H → Guides hide
- [ ] Press H again → Guides show
- [ ] Click guide → Selects (turns white)
- [ ] Selected guide + Delete → Guide removed

#### Guide Intersections
- [ ] Two guides crossing → Intersection snap point appears
- [ ] Snap point is green
- [ ] Move tool can snap to intersection
- [ ] Tape tool can snap to intersection
- [ ] Three+ guides crossing → All intersections detected

#### VCB & Display
- [ ] During measurement: Distance shown at cursor
- [ ] After measurement: "Length: Xmm" in VCB
- [ ] Axis-locked: Shows axis name in label
- [ ] Cursor label follows mouse smoothly
- [ ] No flickering or jumping

---

### Move Tool (Verification)

#### Basic Movement
- [ ] Click object → Drag → Object follows cursor
- [ ] Ghost shown at target position
- [ ] Original position shown with dotted outline
- [ ] Click to place → Object moves
- [ ] ESC cancels → Returns to original position

#### Inference System
- [ ] Snap to endpoints (green dot)
- [ ] Snap to midpoints (cyan dot)
- [ ] Snap to edges (red dot)
- [ ] Snap to faces (blue diamond)
- [ ] Snap to center (green dot)
- [ ] Snap to intersections (red X)
- [ ] Snap to origin 0,0,0 (yellow dot)
- [ ] Snap to grid points (gray dot)

#### Axis Locking
- [ ] Press X → Locks to X-axis (red line solid)
- [ ] Press Y → Locks to Y-axis (green line solid)
- [ ] Press Z → Locks to Z-axis (blue line solid)
- [ ] Press same key → Unlocks
- [ ] Locked axis line extends from start point
- [ ] Can only move along locked axis

#### Copy Mode
- [ ] Ctrl tap → Copy mode ON (+ cursor icon)
- [ ] Ctrl tap again → Copy mode OFF
- [ ] Alt hold → Temporary copy mode
- [ ] Alt release → Returns to move mode
- [ ] Place copy → Original stays, copy created
- [ ] Type "5x" → 5 copies evenly spaced
- [ ] Type "5/" → Divides distance into 5 segments

#### VCB Input
- [ ] Type "1500" + Enter → Moves 1500mm
- [ ] Type "[100,200,0]" → Absolute position
- [ ] Type "<50,0,100>" → Relative offset
- [ ] Type "5x" → Array of 5 copies
- [ ] Type "5/" → Division into 5 parts
- [ ] Invalid input → No action, stays in place

#### Collision & Validation
- [ ] Moving into another box → Prevented
- [ ] Ghost turns red when invalid
- [ ] Below floor → Prevented
- [ ] Behind wall → Prevented
- [ ] Collision list shown in UI
- [ ] Can't place in invalid position

#### Bounding Box Grips
- [ ] Selected object → 8 corner grips shown
- [ ] Alt tap → Switches to 12 edge grips
- [ ] Alt tap → Switches to 6 face grips
- [ ] Alt tap → Switches to 1 center grip
- [ ] Alt tap → Cycles back to corners
- [ ] Hover grip → Turns blue
- [ ] Obscured grip → Blue + transparent
- [ ] Click grip → Move from that point

#### Box-to-Box Snap
- [ ] Moving near another box → Snaps to touch
- [ ] Snaps to left/right/front/back/top/bottom
- [ ] Within 30mm → Magnetic pull
- [ ] Visual indicator when snapped
- [ ] Works with any face alignment

---

## Performance Considerations

### Tape Measure Tool

**Intersection Calculation:**
- Calculate guide intersections only when needed:
  - On guide creation
  - On guide deletion
  - When guides visibility toggled
- Cache results
- Limit to visible guides only
- Expected: <10ms for 20 guides

**Edge Detection:**
- Use spatial indexing for edge lookup
- Only check boxes in viewport frustum
- Expected: <5ms for 50 boxes

**Inference Detection:**
- Already optimized in Move tool
- Reuse same system
- Screen-space filtering effective

---

## Accessibility & Usability

### Tooltips
- All inference points show descriptive labels
- Edge hover shows "Click for parallel guide"
- Axis lock shows "Locked to X-axis"
- Mode indicator always visible

### Error Prevention
- Can't create guide without Ctrl
- Can't place invalid measurement
- Confirmation for rescale operation
- Visual feedback before action

### Learning Curve
- Mimic SketchUp exactly → Existing users transfer skills
- Clear visual feedback → New users understand quickly
- Forgiving (ESC to cancel) → Experimentation encouraged

---

## Conclusion

### Tape Measure Tool Summary

**Current State:** 70% complete, core functionality working  
**Remaining Work:** 30%, mostly edge-based guide workflows  
**Estimated Effort:** 2-3 weeks for full parity with SketchUp  
**Priority:** HIGH - This is the primary focus

**Critical Missing Features:**
1. Parallel guide from edge (HIGHEST priority)
2. Axis lock during measurement
3. Guide intersections
4. Double-click edge shortcut
5. Enhanced edge highlighting

**Once Complete:**
- Will match SketchUp Tape Measure 95%+
- Professional construction layout capability
- Seamless workflow for cabinet designers

---

### Move Tool Summary

**Current State:** 95% complete, excellent SketchUp parity  
**Remaining Work:** 5%, minor enhancements  
**Estimated Effort:** 1 week for polish  
**Priority:** MEDIUM - Already very functional

**Nice-to-Have Features:**
1. "From Point" inference (Shift key)
2. Invalid position visual (red ghost)
3. External array modifier (`*5`)
4. Auto-fold (DEFER - very complex)

**Status:**
- Production-ready as-is
- Enhancements are purely for power users
- Can ship without these features

---

### Recommended Approach

**Phase 1 (Weeks 1-2): Tape Measure Critical Path**
→ Focus 100% on parallel guides, axis locking, intersections  
→ Goal: Match SketchUp's most-used workflows

**Phase 2 (Week 3): Tape Measure Polish**
→ Refinements, testing, edge cases  
→ Goal: Production quality

**Phase 3 (Week 4): Move Tool Enhancements (Optional)**
→ Add "nice to have" features  
→ Goal: Power user features

**Ship Criteria:**
- ✅ Tape Measure Phase 1 + 2 complete
- ✅ Move Tool as-is (already great)
- ✅ All testing checklist items passing
- ✅ No critical bugs

---

**END OF DOCUMENT**

*This research document provides complete specifications for implementing SketchUp-grade Move and Tape Measure tools. All information is based on SketchUp Pro 2024 behavior and industry-standard CAD workflows.*
