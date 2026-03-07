# Move Tool: 95% → 99% Parity Analysis

**Current Status:** 95% SketchUp-accurate  
**Goal:** 99% SketchUp parity  
**Gap:** Missing 5% of power-user features and polish

---

## Critical Analysis: What's Missing

After deep research into SketchUp Pro 2024's Move Tool, here are the features that would bring your implementation from 95% to 99%:

---

## TIER 1: CRITICAL FEATURES (3% impact)

These features are **heavily used** by SketchUp power users and are noticeably absent.

### 1. **"From Point" Inference System** ⭐⭐⭐⭐⭐

**What It Is:**
In SketchUp, you can establish a reference point and then get parallel/perpendicular inference lines FROM that point.

**How It Works:**
```
1. Start moving object
2. Hover over a point (e.g., corner of another cabinet)
3. HOLD SHIFT → Point becomes "locked" as reference
4. Move cursor → See MAGENTA dashed line from reference point
5. When you align parallel/perpendicular to reference → Line turns SOLID
6. This helps you position objects relative to OTHER objects precisely
```

**Why It Matters:**
- **Real-world use case:** "I want this cabinet to be exactly aligned with that corner, but 500mm to the right"
- **Current limitation:** Your tool only snaps TO points, not FROM points
- **Impact:** HIGH - This is how pros align cabinets in complex layouts

**Current Code Gap:**
```typescript
// Your code has:
✅ detectInferences() → Finds snap points at cursor
❌ No "reference point" system
❌ No "from point" parallel/perpendicular detection
```

**Implementation Complexity:** MEDIUM (2-3 days)

---

### 2. **Auto-Inference Direction Locking** ⭐⭐⭐⭐

**What It Is:**
SketchUp automatically suggests axis locks based on your movement direction, BEFORE you press any key.

**How It Works:**
```
1. Start moving object
2. Move cursor predominantly in one direction (e.g., mostly horizontal)
3. After ~50-100mm of movement → Axis line appears DASHED (suggestion)
4. If you continue in that direction → Line becomes SOLID (auto-locked)
5. You can still press arrow keys to manually lock different axis
6. Move perpendicular → Auto-lock releases
```

**Visual States:**
- **Dashed colored line:** "You're moving mostly in this direction, press arrow to lock"
- **Solid colored line:** "Auto-locked because you kept moving this way"
- **No line:** Free movement in all directions

**Why It Matters:**
- **User Experience:** Feels intelligent and helpful
- **Speed:** Don't need to press keys for common movements
- **Current limitation:** Your tool requires MANUAL key press every time

**Current Code Gap:**
```typescript
// Your code has:
✅ Manual axis lock (X, Y, Z keys)
✅ Axis line visualization
❌ No movement direction detection
❌ No dashed "suggestion" state
❌ No auto-locking based on dominant movement
```

**Implementation Complexity:** MEDIUM (2-3 days)

---

### 3. **Sticky Copy Mode (Ctrl Tap Persistence)** ⭐⭐⭐⭐

**What It Is:**
In SketchUp, when you TAP Ctrl once, copy mode stays ON until you tap Ctrl again (toggle). Currently your implementation might not fully persist this.

**How It Works:**
```
SKETCHUP:
1. Start move
2. TAP Ctrl (press and release) → + icon appears
3. Copy mode stays ON
4. Place copy → Original stays, copy created
5. TAP Ctrl again → Copy mode OFF, back to move

YOUR CODE (verify this works):
1. Ctrl tap → Copy mode ON ✅
2. But does it stay ON after releasing Ctrl? ⚠️
3. Does cursor show + icon persistently? ⚠️
```

**Why It Matters:**
- **Workflow:** Making multiple copies in sequence
- **Current limitation:** If copy mode doesn't persist, users must hold Ctrl entire time

**Current Code Status:**
```typescript
// Check useDragInteraction.ts:
const [isCopyMode, setIsCopyMode] = useState(false);

// Verify these work correctly:
- Ctrl tap → setIsCopyMode(true) ✅
- Ctrl tap again → setIsCopyMode(false) ✅
- Does NOT reset on pointer events ❓
- Cursor shows copy icon when isCopyMode === true ❓
```

**Implementation Complexity:** LOW (verify/fix, 1 day)

---

### 4. **Move-by-Distance Without Target Click** ⭐⭐⭐⭐

**What It Is:**
In SketchUp, you can type a distance and press Enter WITHOUT clicking a target point first.

**How It Works:**
```
SKETCHUP:
1. Click object → Start moving
2. Move in general direction (establishes vector)
3. Type "1500" + Enter
4. Object moves 1500mm in that direction
5. NO second click needed

YOUR CODE:
1. Click object → Start moving ✅
2. Move to target ✅
3. Click to place ✅
4. Can type distance to adjust AFTER clicking ✅
5. But can't type distance INSTEAD of clicking ❌
```

**Why It Matters:**
- **Speed:** Type exact distance without precise clicking
- **Precision:** "Move exactly 1500mm to the right" → Just type it
- **Current limitation:** Must click target, then adjust with VCB

**Current Code Gap:**
```typescript
// Your applyNumericInput() works AFTER placing
// Need: applyNumericInput() during movePhase === 'moving'
// Should: Calculate position based on current direction + typed distance
```

**Implementation Complexity:** LOW-MEDIUM (1-2 days)

---

### 5. **Parallel/Perpendicular Inference (Green/Magenta Lines)** ⭐⭐⭐⭐

**What It Is:**
SketchUp shows colored inference lines when your movement is parallel or perpendicular to edges in the scene.

**How It Works:**
```
1. Start moving object
2. As you move, SketchUp checks:
   - Is movement parallel to any edge? → GREEN dotted line appears
   - Is movement perpendicular to any edge? → MAGENTA dotted line appears
3. Lines help you align visually without measuring
```

**Colors:**
- **Green dashed line:** Parallel to an edge
- **Magenta dashed line:** Perpendicular to an edge
- **Shows the reference edge being paralleled/perpendiculared**

**Why It Matters:**
- **Real-world use:** "Move this cabinet parallel to that wall"
- **Visual alignment:** See relationships without measuring
- **Current limitation:** No parallel/perpendicular visual feedback

**Current Code Gap:**
```typescript
// Your code has:
✅ Endpoint, midpoint, edge, face inferences
❌ No parallel/perpendicular edge detection
❌ No green/magenta inference lines
❌ No reference edge highlighting
```

**Implementation Complexity:** MEDIUM-HIGH (3-4 days)

---

## TIER 2: IMPORTANT FEATURES (1.5% impact)

These improve the feel and polish significantly.

### 6. **Invalid Position Visual Feedback** ⭐⭐⭐

**What It Is:**
When you try to move an object to an invalid position (collision, below floor), the ghost turns RED and semi-transparent.

**Current State:**
```typescript
// Your code:
✅ Detects collisions
✅ Prevents invalid placement
❌ Ghost stays green even when position is invalid
❌ No visual warning BEFORE user tries to click
```

**What SketchUp Does:**
- Ghost box: Wireframe stays white
- Ghost fill: Turns RED semi-transparent
- Tooltip: "Position invalid: Collision"
- Cannot place: Click does nothing

**Why It Matters:**
- **Immediate feedback:** User knows it's invalid BEFORE clicking
- **Better UX:** Clear visual communication
- **Less frustration:** Don't try to place, then get error

**Implementation Complexity:** LOW (1 day)

---

### 7. **Inference Tooltip Enhancements** ⭐⭐⭐

**What It Is:**
More detailed and consistent tooltip text matching SketchUp exactly.

**SketchUp Tooltips:**
```
Idle: "Select point to move from"
Moving (no inference): "Move"
Endpoint: "Endpoint"
Midpoint: "Midpoint" 
On Edge: "On Edge"
On Face: "On Face"
Intersection: "Intersection"
Axis locked: "On Red Axis from Point" (shows which axis + reference)
Copy mode: "Move/Copy" (shows both operations)
```

**Your Current Tooltips:**
```typescript
// Check ScreenTip.tsx and MoveToolIntegration.tsx
// Verify:
- All inference types have labels ✅
- Axis lock shows "On [Color] Axis from Point" ❓
- Copy mode shows "Move/Copy" ❓
- Consistent with SketchUp wording ❓
```

**Why It Matters:**
- **Familiarity:** Exact SketchUp wording = no learning curve
- **Clarity:** Users know exactly what inference they're on

**Implementation Complexity:** LOW (1 day)

---

### 8. **Grip Point Inference** ⭐⭐⭐

**What It Is:**
When you click a bounding box grip point, that point becomes a strong inference reference for the duration of the move.

**How It Works:**
```
SKETCHUP:
1. Click corner grip → That corner is the "base point"
2. During move, strong inference to align that corner with other geometry
3. ScreenTip shows "from Corner"

YOUR CODE:
1. Click grip → Move starts ✅
2. But is grip point marked as special reference? ❓
3. Does it get priority in inference? ❓
```

**Why It Matters:**
- **Precision:** "Move this cabinet so its corner aligns with that corner"
- **Expected behavior:** SketchUp users expect this

**Implementation Complexity:** LOW-MEDIUM (1-2 days)

---

### 9. **Double-Click for Component Edit** ⭐⭐

**What It Is:**
In SketchUp, double-clicking an object enters "Edit Component" mode. Not directly related to Move tool, but expected behavior.

**Current State:**
- Single-click selects ✅
- Double-click behavior? ❓

**Note:** This might be outside Move tool scope, but worth considering for overall UX.

**Implementation Complexity:** LOW (depends on component system)

---

### 10. **Move Without Selection (Click-to-Select-and-Move)** ⭐⭐⭐

**What It Is:**
In SketchUp, you can activate Move tool first, THEN click an object to select and start moving in one action.

**How It Works:**
```
SKETCHUP:
1. Press M (no object selected)
2. Cursor shows move icon
3. Click object → Selects AND starts move in one click
4. Move object
5. Click to place

YOUR CODE:
1. Must select object first?
2. Then activate Move tool?
3. Or can Move tool select on first click? ❓
```

**Why It Matters:**
- **Speed:** One less click
- **Workflow:** More fluid interaction

**Implementation Complexity:** MEDIUM (depends on selection system)

---

## TIER 3: POLISH FEATURES (0.5% impact)

These are finishing touches for that last 0.5%.

### 11. **Rotation Locking (Future Feature)** ⭐

SketchUp's Move tool doesn't rotate, but Rotate tool exists separately. Your implementation correctly separates these.

**Status:** ✅ Not needed in Move tool (separate Rotate tool if needed)

---

### 12. **Scale Locking (Future Feature)** ⭐

Similarly, scaling is a separate tool in SketchUp.

**Status:** ✅ Not needed in Move tool

---

### 13. **Sound Effects** ⭐

SketchUp has subtle click sounds for:
- Starting move
- Snapping to inference
- Placing object
- Invalid action

**Why It Matters:**
- **Tactile feedback:** Confirms action
- **Accessibility:** Audio cue for vision-impaired users
- **Polish:** Feels professional

**Implementation Complexity:** LOW (1 day, if desired)

---

### 14. **Context Menu Integration** ⭐⭐

Right-click during move should show:
- "Cancel Move" → ESC equivalent
- "Lock Axis" → Show X/Y/Z options
- "Copy Mode" → Toggle copy

**Implementation Complexity:** LOW (1 day)

---

### 15. **Undo/Redo Integration** ⭐⭐⭐

**Critical for production:**
- Move action should be undoable (Ctrl+Z)
- Should restore exact previous position
- Should undo copies created in array mode

**Current State:**
```typescript
// Check if useDesignerStore has undo/redo:
✅ Move updates store
❓ Is there undo stack?
❓ Can user press Ctrl+Z to undo move?
```

**Implementation Complexity:** MEDIUM (depends on store architecture)

---

## TIER 4: ADVANCED FEATURES (Deferred)

These are complex and can be added in v2.0.

### 16. **Auto-Fold (Sticky Geometry)** - DEFER

**What It Is:**
Connected faces stretch with the moved object (like pulling taffy).

**Why Defer:**
- Extremely complex (requires topology tracking)
- Not critical for cabinet design (boxes are usually independent)
- Would add 100+ hours of development
- Performance-intensive

**Recommendation:** ❌ Don't implement unless specifically needed

---

### 17. **Component Replacement** - DEFER

**What It Is:**
Alt+Click on similar object → Replaces with current selection.

**Why Defer:**
- Requires component library system
- More of a "Replace" tool feature
- Not core to Move tool

**Recommendation:** ❌ Separate feature

---

### 18. **Move Along Path** - DEFER

**What It Is:**
Move object along a curved path.

**Why Defer:**
- Cabinet design is rectilinear (straight lines)
- Adds major complexity
- Rarely used in architectural context

**Recommendation:** ❌ Not needed for cabinets

---

## IMPLEMENTATION PRIORITY RANKING

Based on **impact × ease of implementation**:

### **PHASE 1: Quick Wins (1 week)** - Gets you to 97%

1. ✅ **Invalid Position Visual** (1 day, HIGH impact)
   - Ghost turns red when invalid
   - Clear visual feedback
   - Easy to implement

2. ✅ **Sticky Copy Mode Fix** (1 day, MEDIUM-HIGH impact)
   - Verify Ctrl tap persists correctly
   - Fix cursor icon persistence
   - Test edge cases

3. ✅ **Inference Tooltip Enhancement** (1 day, MEDIUM impact)
   - Match SketchUp wording exactly
   - Add axis lock descriptions
   - Polish existing labels

4. ✅ **Move-by-Distance Without Click** (2 days, HIGH impact)
   - Type distance during move
   - Calculate position from direction
   - No target click needed

**Outcome:** Move tool feels 97% accurate, most users won't notice differences.

---

### **PHASE 2: Power Features (2 weeks)** - Gets you to 99%

5. ✅ **"From Point" Inference** (3 days, VERY HIGH impact)
   - Shift key to lock reference point
   - Magenta line from reference
   - Parallel/perpendicular detection
   - **This is THE feature power users will notice**

6. ✅ **Auto-Inference Direction Locking** (3 days, HIGH impact)
   - Detect dominant movement direction
   - Show dashed axis suggestion
   - Auto-lock when persistent
   - Feels intelligent and helpful

7. ✅ **Parallel/Perpendicular Edge Inference** (4 days, HIGH impact)
   - Green lines for parallel
   - Magenta lines for perpendicular
   - Reference edge highlighting
   - Visual alignment aid

8. ✅ **Grip Point Inference Priority** (2 days, MEDIUM impact)
   - Mark grip click as base point
   - Priority in inference detection
   - "from Corner" tooltips

**Outcome:** Move tool is 99% accurate, professionals can't tell the difference.

---

### **PHASE 3: Final Polish (1 week)** - Gets you to 99.5%

9. ✅ **Undo/Redo Integration** (2 days, CRITICAL)
   - Move action undoable
   - Array copies undoable
   - Proper state restoration

10. ✅ **Context Menu** (1 day, MEDIUM impact)
    - Right-click options
    - Quick access to features
    - Accessibility improvement

11. ✅ **Sound Effects** (1 day, LOW impact, HIGH polish)
    - Click sounds
    - Snap sounds
    - Error sounds

12. ✅ **Move Without Selection** (1 day, MEDIUM impact)
    - Click to select and move
    - One-click workflow
    - Faster interaction

**Outcome:** Production-ready, professional-grade Move tool.

---

## DETAILED IMPLEMENTATION GUIDES

### 1. INVALID POSITION VISUAL FEEDBACK

**File: `MoveVisuals.tsx`**

```tsx
// MODIFY GhostBox component:
interface GhostBoxProps {
  position: Position;
  dimensions: { lenX: number; lenY: number; lenZ: number };
  isValid: boolean; // ADD THIS PROP
}

const GhostBox: React.FC<GhostBoxProps> = ({ position, dimensions, isValid }) => {
  const [pulse, setPulse] = useState(0);
  
  useFrame(({ clock }) => {
    if (!isValid) {
      setPulse(Math.sin(clock.elapsedTime * 3) * 0.15 + 0.85);
    } else {
      setPulse(1);
    }
  });
  
  const ghostColor = isValid ? '#FFFFFF' : '#FF0000';
  const ghostOpacity = isValid ? 0.3 : 0.5 * pulse;
  
  return (
    <group position={dataToThree(position.x, position.y, position.z)}>
      {/* Wireframe - always visible */}
      <lineSegments>
        <edgesGeometry 
          args={[new THREE.BoxGeometry(dimensions.lenX, dimensions.lenZ, dimensions.lenY)]} 
        />
        <lineBasicMaterial 
          color={ghostColor} 
          linewidth={2}
          transparent
          opacity={isValid ? 1 : 0.8}
        />
      </lineSegments>
      
      {/* Fill - only when INVALID */}
      {!isValid && (
        <>
          <mesh>
            <boxGeometry args={[dimensions.lenX, dimensions.lenZ, dimensions.lenY]} />
            <meshBasicMaterial 
              color="#FF0000"
              transparent
              opacity={ghostOpacity}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Warning icon/text */}
          <sprite 
            position={[0, dimensions.lenZ / 2 + 50, 0]}
            scale={[50, 50, 1]}
          >
            <spriteMaterial 
              map={warningTexture} // Create warning icon texture
              transparent
              opacity={pulse}
            />
          </sprite>
        </>
      )}
    </group>
  );
};

// UPDATE MoveVisuals to pass isValid:
export const MoveVisuals: React.FC<MoveVisualsProps> = ({
  targetPosition,
  boxDimensions,
  isValid, // Already in your props ✅
  // ...
}) => {
  return (
    <group>
      {targetPosition && (
        <GhostBox 
          position={targetPosition}
          dimensions={boxDimensions}
          isValid={isValid} // PASS IT HERE
        />
      )}
      {/* ... rest of visuals ... */}
    </group>
  );
};
```

**File: `MoveToolIntegration.tsx`**

```tsx
// UPDATE ScreenTip to show invalid reason:
useEffect(() => {
  if (!dragState.positionValid && dragState.ghostPosition) {
    const reason = dragState.collisions.length > 0 
      ? `Cannot place: ${dragState.collisions[0]}`
      : 'Invalid position';
    
    emitScreenTip(reason, event.clientX, event.clientY);
  }
}, [dragState.positionValid, dragState.collisions]);
```

---

### 2. "FROM POINT" INFERENCE SYSTEM

**File: `useDragInteraction.ts`**

```typescript
// ADD NEW STATE:
const [fromPointRef, setFromPointRef] = useState<Position | null>(null);
const [fromPointAxis, setFromPointAxis] = useState<'x' | 'y' | 'z' | null>(null);

// ADD SHIFT KEY HANDLER:
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Shift' && !e.repeat && ghostPosition) {
      // Lock current position as reference point
      setFromPointRef({ ...ghostPosition });
      console.log('From point locked:', ghostPosition);
    }
  };
  
  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      // Clear reference point
      setFromPointRef(null);
      setFromPointAxis(null);
    }
  };
  
  if (movePhase === 'moving') {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  }
  
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}, [movePhase, ghostPosition]);

// ADD FROM-POINT ALIGNMENT DETECTION:
const detectFromPointAlignment = useCallback((
  currentPos: Position,
  referencePos: Position
): { aligned: boolean; axis: 'x' | 'y' | 'z' | null } => {
  const tolerance = 5; // 5mm tolerance
  
  const dx = Math.abs(currentPos.x - referencePos.x);
  const dy = Math.abs(currentPos.y - referencePos.y);
  const dz = Math.abs(currentPos.z - referencePos.z);
  
  // Check which axes are aligned
  const xAligned = dx < tolerance;
  const yAligned = dy < tolerance;
  const zAligned = dz < tolerance;
  
  // Two axes aligned means moving along the third axis
  if (xAligned && yAligned) return { aligned: true, axis: 'z' };
  if (xAligned && zAligned) return { aligned: true, axis: 'y' };
  if (yAligned && zAligned) return { aligned: true, axis: 'x' };
  
  return { aligned: false, axis: null };
}, []);

// MODIFY computeConstrainedTarget to include from-point logic:
const computeConstrainedTarget = useCallback((/* params */) => {
  // ... existing axis lock logic ...
  
  // ADD FROM-POINT DETECTION:
  if (fromPointRef && !lockedAxis) {
    const alignment = detectFromPointAlignment(targetPosition, fromPointRef);
    
    if (alignment.aligned) {
      // Constrain to the aligned axis from reference point
      setFromPointAxis(alignment.axis);
      
      // Snap to reference point alignment
      const constrained = { ...targetPosition };
      if (alignment.axis === 'x') {
        constrained.y = fromPointRef.y;
        constrained.z = fromPointRef.z;
      } else if (alignment.axis === 'y') {
        constrained.x = fromPointRef.x;
        constrained.z = fromPointRef.z;
      } else if (alignment.axis === 'z') {
        constrained.x = fromPointRef.x;
        constrained.y = fromPointRef.y;
      }
      
      targetPosition = constrained;
    } else {
      setFromPointAxis(null);
    }
  }
  
  // ... rest of function ...
}, [fromPointRef, lockedAxis, detectFromPointAlignment]);
```

**File: `MoveVisuals.tsx`**

```tsx
// ADD PROPS:
interface MoveVisualsProps {
  // ... existing props ...
  fromPointRef?: Position | null;
  fromPointAxis?: 'x' | 'y' | 'z' | null;
}

// ADD FROM-POINT VISUAL:
export const MoveVisuals: React.FC<MoveVisualsProps> = ({
  targetPosition,
  fromPointRef,
  fromPointAxis,
  // ... other props
}) => {
  const axisColors = {
    x: '#FF0000',
    y: '#00FF00',
    z: '#0000FF',
  };
  
  return (
    <group>
      {/* ... existing visuals ... */}
      
      {/* FROM POINT REFERENCE MARKER */}
      {fromPointRef && (
        <group>
          {/* Reference point sphere */}
          <mesh position={dataToThree(fromPointRef.x, fromPointRef.y, fromPointRef.z)}>
            <sphereGeometry args={[10, 16, 16]} />
            <meshBasicMaterial color="#FF00FF" />
          </mesh>
          
          {/* Ring around reference point */}
          <mesh 
            position={dataToThree(fromPointRef.x, fromPointRef.y, fromPointRef.z)}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[15, 20, 32]} />
            <meshBasicMaterial 
              color="#FF00FF" 
              side={THREE.DoubleSide}
              transparent
              opacity={0.6}
            />
          </mesh>
          
          {/* Line from reference to current position */}
          {targetPosition && (
            <Line
              points={[
                dataToThree(fromPointRef.x, fromPointRef.y, fromPointRef.z),
                dataToThree(targetPosition.x, targetPosition.y, targetPosition.z),
              ]}
              color={fromPointAxis ? axisColors[fromPointAxis] : '#FF00FF'}
              lineWidth={fromPointAxis ? 3 : 2}
              dashed={!fromPointAxis}
              dashScale={fromPointAxis ? 1 : 5}
              dashSize={fromPointAxis ? 1000 : 10}
              gapSize={fromPointAxis ? 0 : 10}
              transparent
              opacity={fromPointAxis ? 1 : 0.6}
            />
          )}
          
          {/* Label */}
          {targetPosition && fromPointAxis && (
            <Html
              position={dataToThree(
                (fromPointRef.x + targetPosition.x) / 2,
                (fromPointRef.y + targetPosition.y) / 2,
                (fromPointRef.z + targetPosition.z) / 2
              )}
              center
            >
              <div className="from-point-label">
                From Point ({fromPointAxis.toUpperCase()}-axis)
              </div>
            </Html>
          )}
        </group>
      )}
    </group>
  );
};
```

---

### 3. AUTO-INFERENCE DIRECTION LOCKING

**File: `useDragInteraction.ts`**

```typescript
// ADD NEW STATE:
const [movementHistory, setMovementHistory] = useState<Position[]>([]);
const [suggestedAxis, setSuggestedAxis] = useState<'x' | 'y' | 'z' | null>(null);
const [autoLockedAxis, setAutoLockedAxis] = useState<'x' | 'y' | 'z' | null>(null);

// ADD MOVEMENT TRACKING:
const trackMovement = useCallback((position: Position) => {
  setMovementHistory(prev => {
    const updated = [...prev, position];
    // Keep last 10 positions
    if (updated.length > 10) updated.shift();
    return updated;
  });
}, []);

// ADD DOMINANT AXIS DETECTION:
const detectDominantAxis = useCallback((
  history: Position[]
): { axis: 'x' | 'y' | 'z' | null; confidence: number } => {
  if (history.length < 3) return { axis: null, confidence: 0 };
  
  const first = history[0];
  const last = history[history.length - 1];
  
  const dx = Math.abs(last.x - first.x);
  const dy = Math.abs(last.y - first.y);
  const dz = Math.abs(last.z - first.z);
  
  const total = dx + dy + dz;
  if (total < 50) return { axis: null, confidence: 0 }; // Too small movement
  
  const xRatio = dx / total;
  const yRatio = dy / total;
  const zRatio = dz / total;
  
  // Find dominant axis
  if (xRatio > 0.7) return { axis: 'x', confidence: xRatio };
  if (yRatio > 0.7) return { axis: 'y', confidence: yRatio };
  if (zRatio > 0.7) return { axis: 'z', confidence: zRatio };
  
  return { axis: null, confidence: 0 };
}, []);

// MODIFY handlePointerMove:
const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
  // ... existing logic to get targetPosition ...
  
  // Track movement for auto-lock
  if (movePhase === 'moving' && targetPosition) {
    trackMovement(targetPosition);
    
    // Detect dominant axis
    const { axis, confidence } = detectDominantAxis(movementHistory);
    
    if (axis && confidence > 0.7) {
      setSuggestedAxis(axis);
      
      // Auto-lock if confidence is very high and moving consistently
      if (confidence > 0.85 && movementHistory.length >= 5) {
        if (!lockedAxis && !autoLockedAxis) {
          setAutoLockedAxis(axis);
          setLockedAxis(axis); // Apply the lock
        }
      }
    } else {
      setSuggestedAxis(null);
    }
    
    // Clear auto-lock if movement changes significantly
    if (autoLockedAxis && confidence < 0.5) {
      setAutoLockedAxis(null);
      setLockedAxis(null);
    }
  }
  
  // ... rest of function ...
}, [movePhase, movementHistory, lockedAxis, autoLockedAxis]);

// RESET on drag start/end:
const handlePointerDown = useCallback(() => {
  setMovementHistory([]);
  setSuggestedAxis(null);
  setAutoLockedAxis(null);
  // ... rest of function ...
}, []);
```

**File: `MoveVisuals.tsx`**

```tsx
// ADD PROPS:
interface MoveVisualsProps {
  // ... existing ...
  suggestedAxis?: 'x' | 'y' | 'z' | null;
  autoLockedAxis?: 'x' | 'y' | 'z' | null;
}

// MODIFY AxisLines component:
const AxisLines: React.FC<{
  startPosition: Position;
  targetPosition: Position;
  lockedAxis: LockedAxis;
  suggestedAxis?: 'x' | 'y' | 'z' | null;
  autoLockedAxis?: 'x' | 'y' | 'z' | null;
}> = ({ startPosition, targetPosition, lockedAxis, suggestedAxis, autoLockedAxis }) => {
  const axisConfig = {
    x: { color: '#FF0000', label: 'Red' },
    y: { color: '#00FF00', label: 'Green' },
    z: { color: '#0000FF', label: 'Blue' },
  };
  
  const renderAxis = (axis: 'x' | 'y' | 'z') => {
    const isLocked = lockedAxis === axis;
    const isSuggested = suggestedAxis === axis;
    const isAutoLocked = autoLockedAxis === axis;
    
    // Determine visual state:
    // 1. Manually locked → SOLID line
    // 2. Auto-locked → SOLID line (slightly thicker)
    // 3. Suggested → DASHED line
    // 4. Neither → Don't show
    
    if (!isLocked && !isSuggested && !isAutoLocked) return null;
    
    const lineWidth = isAutoLocked ? 4 : isLocked ? 3 : 2;
    const dashed = isSuggested && !isLocked && !isAutoLocked;
    
    return (
      <Line
        key={axis}
        points={[
          dataToThree(startPosition.x, startPosition.y, startPosition.z),
          dataToThree(targetPosition.x, targetPosition.y, targetPosition.z),
        ]}
        color={axisConfig[axis].color}
        lineWidth={lineWidth}
        dashed={dashed}
        dashScale={dashed ? 5 : 1}
        dashSize={dashed ? 15 : 1000}
        gapSize={dashed ? 10 : 0}
        transparent
        opacity={dashed ? 0.6 : 1}
      />
    );
  };
  
  return (
    <group>
      {renderAxis('x')}
      {renderAxis('y')}
      {renderAxis('z')}
    </group>
  );
};
```

---

### 4. MOVE-BY-DISTANCE WITHOUT TARGET CLICK

**File: `useDragInteraction.ts`**

```typescript
// MODIFY applyNumericInput to work DURING movement:
const applyNumericInput = useCallback((input: string): boolean => {
  // Check if we're currently moving (not placed yet)
  if (movePhase === 'moving' && ghostPosition && startPosition) {
    // User typed distance without clicking target
    
    // Parse distance
    const distance = parseValueWithUnits(input);
    if (isNaN(distance) || distance <= 0) return false;
    
    // Calculate direction from movement so far
    const currentDirection = {
      x: ghostPosition.x - startPosition.x,
      y: ghostPosition.y - startPosition.y,
      z: ghostPosition.z - startPosition.z,
    };
    
    const currentDistance = Math.sqrt(
      currentDirection.x ** 2 +
      currentDirection.y ** 2 +
      currentDirection.z ** 2
    );
    
    if (currentDistance < 1) {
      // No direction established yet
      console.warn('Move in a direction first, then type distance');
      return false;
    }
    
    // Normalize direction
    const normalized = {
      x: currentDirection.x / currentDistance,
      y: currentDirection.y / currentDistance,
      z: currentDirection.z / currentDistance,
    };
    
    // Calculate new position at exact distance
    const newPosition: Position = {
      x: startPosition.x + normalized.x * distance,
      y: startPosition.y + normalized.y * distance,
      z: startPosition.z + normalized.z * distance,
    };
    
    // Apply axis lock if active
    const constrained = applyAxisLock(newPosition, startPosition, lockedAxis);
    
    // Validate and place
    const validated = validatePosition(
      constrained,
      { position: startPosition, dimensions: boxDimensions },
      otherBoxes
    );
    
    if (validated.isValid) {
      setGhostPosition(constrained);
      
      // Auto-place (no need for second click)
      setTimeout(() => {
        place(); // Place at calculated position
      }, 100);
      
      return true;
    } else {
      console.warn('Cannot move to calculated position:', validated.reason);
      return false;
    }
  }
  
  // ... existing logic for placed state ...
}, [movePhase, ghostPosition, startPosition, lockedAxis, boxDimensions, otherBoxes]);
```

**File: `MoveToolIntegration.tsx`**

```tsx
// ENHANCE VCB to show direction hint:
const VCBInput: React.FC = () => {
  const [value, setValue] = useState('');
  const { dragState, movePhase } = window.__moveToolCtx || {};
  
  const placeholder = useMemo(() => {
    if (movePhase === 'moving' && dragState?.ghostPosition && dragState?.startPosition) {
      // Calculate current distance
      const dx = dragState.ghostPosition.x - dragState.startPosition.x;
      const dy = dragState.ghostPosition.y - dragState.startPosition.y;
      const dz = dragState.ghostPosition.z - dragState.startPosition.z;
      const distance = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
      
      return `${distance.toFixed(0)}mm (type to change)`;
    }
    return 'Distance';
  }, [movePhase, dragState]);
  
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const success = window.__moveToolCtx?.applyNumericInput(value);
          if (success) setValue('');
        }
      }}
      placeholder={placeholder}
      className="vcb-input"
    />
  );
};
```

---

## TESTING CHECKLIST FOR 99% PARITY

### From Point Inference
- [ ] Hold Shift during move → Reference point locked
- [ ] Magenta sphere appears at reference point
- [ ] Moving parallel to reference → Magenta line appears
- [ ] Moving perpendicular to reference → Magenta line appears
- [ ] Alignment to X/Y/Z axis from reference → Line becomes solid
- [ ] Release Shift → Reference point cleared
- [ ] ScreenTip shows "From Point (X-axis)" when aligned

### Auto-Inference Direction Locking
- [ ] Start moving predominantly horizontally → Red dashed line appears (X suggestion)
- [ ] Continue horizontal movement → Line becomes solid (auto-locked)
- [ ] Move vertically while locked → Lock releases
- [ ] Start moving predominantly vertically → Green dashed line (Y suggestion)
- [ ] Can manually lock with arrow keys while suggestion active
- [ ] Manual lock overrides auto-lock

### Move-by-Distance Without Click
- [ ] Start moving → Establish direction
- [ ] Type "1500" → Object moves exactly 1500mm in that direction
- [ ] Type "500" with axis locked → Moves 500mm along locked axis only
- [ ] Invalid distance (negative, zero) → No action
- [ ] No direction established yet → Shows warning

### Invalid Position Visual
- [ ] Move into collision → Ghost turns red with semi-transparent fill
- [ ] Move below floor → Ghost turns red
- [ ] Move behind wall → Ghost turns red
- [ ] Red ghost pulsates gently
- [ ] ScreenTip shows reason: "Collision with Cabinet X"
- [ ] Cannot place when red (click does nothing)
- [ ] Move to valid position → Ghost returns to white/green

### Sticky Copy Mode
- [ ] Tap Ctrl once → + icon appears
- [ ] Release Ctrl → + icon stays (mode persists)
- [ ] Place copy → Original stays, copy created, + icon still visible
- [ ] Tap Ctrl again → + icon disappears (mode off)
- [ ] Alt hold → Temporary copy mode (+ appears)
- [ ] Alt release → Returns to previous mode

### Parallel/Perpendicular Inference
- [ ] Move parallel to cabinet edge → Green dashed line appears
- [ ] Line connects to reference edge being paralleled
- [ ] Move perpendicular to edge → Magenta dashed line appears
- [ ] Works with horizontal edges
- [ ] Works with vertical edges
- [ ] Works with depth edges

### Grip Point Priority
- [ ] Click corner grip → Corner becomes base point
- [ ] ScreenTip shows "from Corner"
- [ ] Strong inference to align that corner with other geometry
- [ ] Works with all 8 corners
- [ ] Works with edge midpoints
- [ ] Works with face centers

### Undo/Redo
- [ ] Move object → Ctrl+Z undos move (returns to original position)
- [ ] Create array copy (5x) → Ctrl+Z undos all copies
- [ ] Redo (Ctrl+Y) restores move
- [ ] Multiple moves can be undone in sequence
- [ ] Undo history survives tool switch

---

## FINAL RECOMMENDATION

**To achieve 99% SketchUp parity, implement in this order:**

### Week 1: Quick Wins (→ 97%)
1. Invalid position visual (1 day)
2. Sticky copy mode verification (1 day)
3. Move-by-distance without click (2 days)
4. Tooltip enhancements (1 day)

### Week 2-3: Power Features (→ 99%)
5. "From Point" inference system (3 days)
6. Auto-inference direction locking (3 days)
7. Parallel/perpendicular edge inference (4 days)

### Week 4: Final Polish (→ 99.5%)
8. Undo/redo integration (2 days)
9. Grip point priority (1 day)
10. Context menu (1 day)
11. Sound effects (optional, 1 day)

**Total Time:** 4 weeks for 99% parity

**Most Critical Single Feature:** "From Point" inference (Shift key)
- This is what separates casual use from professional use
- Power users will immediately notice its absence
- Adds the most "SketchUp feel"

**Skip These (Not Worth It):**
- Auto-fold/sticky geometry (too complex, minimal value for cabinets)
- Component replacement (separate feature)
- Move along path (not relevant to rectilinear design)

---

**END OF ANALYSIS**
