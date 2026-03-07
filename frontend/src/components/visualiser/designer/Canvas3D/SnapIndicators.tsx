/**
 * SnapIndicators Component
 * SketchUp-style visual feedback during drag operations:
 * - Corner snaps: Green/Yellow ring with 4 corner dots
 * - Edge snaps: Cyan line with midpoint marker
 * - Grid snaps: Blue dashed crosshairs
 * - Inference lines: Dashed colored lines showing axis alignment
 * - Collision warning: Red highlight
 * - Distance labels with axis breakdown
 */

'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line, Html, Ring } from '@react-three/drei';
import { Position } from '@/types/visualiser';
import { SnapResult, SnapPoint, LockedAxis } from '@/lib/visualiser/snapSystem';

// ============================================
// TYPES
// ============================================

interface SnapIndicatorsProps {
  visible: boolean;
  ghostPosition: Position | null;
  startPosition: Position | null;
  snapResult: SnapResult | null;
  lockedAxis: LockedAxis;
  collisions: string[];
  boxDimensions: { w: number; d: number; h: number };
}

// Threshold for showing "approaching snap" feedback
const APPROACHING_SNAP_THRESHOLD = 150;

// ============================================
// COORDINATE CONVERSION
// ============================================

function dataToThree(x: number, y: number, z: number): [number, number, number] {
  // Data: X=right, Y=front (towards viewer), Z=up
  // Three.js: X=right, Y=up, Z=towards camera
  // Positive Y in data = positive Z in Three.js = towards viewer
  return [x, z, y];
}

// ============================================
// SKETCHUP-STYLE COLORS
// ============================================

const COLORS = {
  // Snap point colors
  grid: '#3B82F6',         // Blue - grid snap
  edge: '#06B6D4',         // Cyan - edge/midpoint
  corner: '#22C55E',       // Green - corner (endpoint in SketchUp)
  face: '#A855F7',         // Purple - face-to-face alignment
  midpoint: '#06B6D4',     // Cyan - midpoint
  onFace: '#3B82F6',       // Blue - on face
  
  // Plane colors
  wall: '#F97316',         // Orange
  floor: '#F97316',        // Orange
  
  // Feedback colors
  collision: '#EF4444',    // Red
  
  // Axis colors (SketchUp standard)
  axisX: '#EF4444',        // Red - X axis
  axisY: '#22C55E',        // Green - Y axis (our depth)
  axisZ: '#3B82F6',        // Blue - Z axis (our height)
  
  // Inference colors
  inference: '#A855F7',    // Purple - parallel/perpendicular inference
};

// ============================================
// MAIN COMPONENT
// ============================================

export const SnapIndicators: React.FC<SnapIndicatorsProps> = ({
  visible,
  ghostPosition,
  startPosition,
  snapResult,
  lockedAxis,
  collisions,
  boxDimensions,
}) => {
  if (!visible || !ghostPosition) return null;

  const hasCollision = collisions.length > 0;
  const isSnapped = snapResult?.snapped ?? false;
  const snappingCorner = snapResult?.snappingCorner;
  const snappingCornerIndex = snapResult?.snappingCornerIndex;
  const distanceToThreshold = snapResult?.distanceToThreshold;

  return (
    <group>
      {/* Approaching Snap Indicator - "magnetic pull" feedback when getting close */}
      {!isSnapped && distanceToThreshold !== undefined && distanceToThreshold > 0 && (
        <ApproachingSnapIndicator 
          distanceToThreshold={distanceToThreshold} 
          ghostPosition={ghostPosition}
          boxDimensions={boxDimensions}
        />
      )}

      {/* Grid Snap Crosshairs */}
      {isSnapped && snapResult != null && snapResult.snapPoint?.type === 'grid' && (
        <GridSnapCrosshairs position={ghostPosition} />
      )}

      {/* Edge Snap Indicator */}
      {isSnapped && snapResult != null && snapResult.snapPoint?.type === 'edge' && (
        <EdgeSnapIndicator
          position={snapResult.snapPoint.position}
          from={startPosition || ghostPosition}
        />
      )}

      {/* Corner Snap Indicator - SketchUp style with 4 dots */}
      {isSnapped && snapResult != null && snapResult.snapPoint?.type === 'corner' && (
        <CornerSnapIndicator position={snapResult.snapPoint.position} />
      )}

      {/* Snapping Corner Indicator - shows which corner of the moving box is the "move point" */}
      {isSnapped && snapResult != null && snappingCorner && snapResult.snapPoint && 
       (snapResult.snapPoint.type === 'corner' || snapResult.snapPoint.type === 'edge') && (
        <SnappingCornerIndicator 
          snappingCorner={snappingCorner} 
          snapType={snapResult.snapPoint.type}
        />
      )}

      {/* Face Snap Indicator - edge-to-edge alignment */}
      {isSnapped && snapResult != null && snapResult.snapPoint?.type === 'face' && (
        <FaceSnapIndicator snapPoint={snapResult.snapPoint} ghostPosition={ghostPosition} boxDimensions={boxDimensions} />
      )}

      {/* Wall Snap Plane */}
      {isSnapped && snapResult != null && snapResult.snapPoint?.type === 'wall' && (
        <WallSnapPlane position={ghostPosition} width={boxDimensions.w} height={boxDimensions.h} />
      )}

      {/* Floor Snap Plane */}
      {isSnapped && snapResult != null && snapResult.snapPoint?.type === 'floor' && (
        <FloorSnapPlane position={ghostPosition} width={boxDimensions.w} depth={boxDimensions.d} />
      )}

      {/* Axis Lock Guide */}
      {lockedAxis && startPosition && (
        <AxisGuide
          startPosition={startPosition}
          currentPosition={ghostPosition}
          axis={lockedAxis}
        />
      )}

      {/* Inference Lines - show alignment to start position */}
      {startPosition && (
        <InferenceLines
          startPosition={startPosition}
          currentPosition={ghostPosition}
          lockedAxis={lockedAxis}
        />
      )}

      {/* Collision Warning */}
      {hasCollision && (
        <CollisionIndicator position={ghostPosition} dimensions={boxDimensions} />
      )}

      {/* Keep in-scene UI minimal while moving; distance is shown by compact move chip */}

      {/* All potential snap points within range - shown as small dots */}
      {snapResult?.activeSnaps.map((snap, i) => (
        <SnapPointDot key={i} point={snap} isActive={snap === snapResult.snapPoint} />
      ))}

      {/* Box corner markers - 8 dots at each corner with active corner highlighted */}
      <BoxCornerMarkers 
        position={ghostPosition} 
        dimensions={boxDimensions} 
        hasCollision={hasCollision}
        activeCornerIndex={isSnapped ? snappingCornerIndex : undefined}
      />
    </group>
  );
};

// ============================================
// GRID SNAP CROSSHAIRS
// ============================================

const GridSnapCrosshairs: React.FC<{ position: Position }> = ({ position }) => {
  const lineLength = 300;
  const crossSize = 40;

  const [x, y, z] = dataToThree(position.x, position.y, position.z);

  // Extended lines for grid alignment
  const vLinePoints: [number, number, number][] = [
    [x, y, z - lineLength],
    [x, y, z + lineLength],
  ];

  const hLinePoints: [number, number, number][] = [
    [x - lineLength, y, z],
    [x + lineLength, y, z],
  ];

  // Small cross at snap point
  const crossV: [number, number, number][] = [
    [x, y - crossSize, z],
    [x, y + crossSize, z],
  ];

  const crossH: [number, number, number][] = [
    [x - crossSize, y, z],
    [x + crossSize, y, z],
  ];

  return (
    <>
      {/* Extended guide lines */}
      <Line points={vLinePoints} color={COLORS.grid} lineWidth={1} dashed dashScale={5} gapSize={10} dashSize={20} />
      <Line points={hLinePoints} color={COLORS.grid} lineWidth={1} dashed dashScale={5} gapSize={10} dashSize={20} />
      
      {/* Cross marker at snap point */}
      <Line points={crossV} color={COLORS.grid} lineWidth={2} />
      <Line points={crossH} color={COLORS.grid} lineWidth={2} />
      
      {/* Center dot */}
      <mesh position={[x, y, z]}>
        <sphereGeometry args={[8, 8, 8]} />
        <meshBasicMaterial color={COLORS.grid} />
      </mesh>
    </>
  );
};

// ============================================
// EDGE SNAP INDICATOR
// ============================================

const EdgeSnapIndicator: React.FC<{ position: Position; from: Position }> = ({ position, from }) => {
  const pos = dataToThree(position.x, position.y, position.z);
  const fromPos = dataToThree(from.x, from.y, from.z);

  // Line from start to snap point
  const linePoints: [number, number, number][] = [fromPos, pos];

  return (
    <>
      {/* Connection line */}
      <Line points={linePoints} color={COLORS.edge} lineWidth={2} />
      
      {/* Midpoint diamond marker */}
      <group position={pos}>
        {/* Outer ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[20, 25, 4]} />
          <meshBasicMaterial color={COLORS.edge} side={THREE.DoubleSide} />
        </mesh>
        
        {/* Center point */}
        <mesh>
          <sphereGeometry args={[8, 8, 8]} />
          <meshBasicMaterial color={COLORS.edge} />
        </mesh>
      </group>
    </>
  );
};

// ============================================
// CORNER SNAP INDICATOR - SketchUp style
// ============================================

const CornerSnapIndicator: React.FC<{ position: Position }> = ({ position }) => {
  const pos = dataToThree(position.x, position.y, position.z);
  const dotOffset = 25;

  // 4 dots around the corner point
  const dotPositions: [number, number, number][] = [
    [pos[0] - dotOffset, pos[1], pos[2] - dotOffset],
    [pos[0] + dotOffset, pos[1], pos[2] - dotOffset],
    [pos[0] - dotOffset, pos[1], pos[2] + dotOffset],
    [pos[0] + dotOffset, pos[1], pos[2] + dotOffset],
  ];

  return (
    <group>
      {/* Outer ring */}
      <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[35, 40, 32]} />
        <meshBasicMaterial color={COLORS.corner} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* Center point */}
      <mesh position={pos}>
        <sphereGeometry args={[12, 16, 16]} />
        <meshBasicMaterial color={COLORS.corner} />
      </mesh>

      {/* 4 corner dots */}
      {dotPositions.map((dotPos, i) => (
        <mesh key={i} position={dotPos}>
          <sphereGeometry args={[6, 8, 8]} />
          <meshBasicMaterial color={COLORS.corner} />
        </mesh>
      ))}

      {/* Cross lines connecting dots */}
      <Line
        points={[dotPositions[0], dotPositions[3]]}
        color={COLORS.corner}
        lineWidth={1}
        transparent
        opacity={0.5}
      />
      <Line
        points={[dotPositions[1], dotPositions[2]]}
        color={COLORS.corner}
        lineWidth={1}
        transparent
        opacity={0.5}
      />
    </group>
  );
};

// ============================================
// FACE SNAP INDICATOR - edge-to-edge alignment
// ============================================

const FaceSnapIndicator: React.FC<{
  snapPoint: SnapPoint;
  ghostPosition: Position;
  boxDimensions: { w: number; d: number; h: number };
}> = ({ snapPoint, ghostPosition, boxDimensions }) => {
  const lineLength = 1000;
  const { faceAxis, faceValue } = snapPoint;
  
  if (!faceAxis || faceValue === undefined) return null;
  
  // Draw a line along the aligned face
  const lines: { points: [number, number, number][]; color: string }[] = [];
  
  // Get the center of the ghost box
  const centerX = ghostPosition.x + boxDimensions.w / 2;
  const centerY = ghostPosition.y + boxDimensions.d / 2;
  const centerZ = ghostPosition.z + boxDimensions.h / 2;
  
  switch (faceAxis) {
    case 'x': {
      // Vertical line at the aligned X value
      const [x, , ] = dataToThree(faceValue, centerY, centerZ);
      lines.push({
        points: [[x, 0, centerY], [x, boxDimensions.h + 200, centerY]],
        color: COLORS.face,
      });
      break;
    }
    case 'y': {
      // Horizontal line at the aligned Y value (depth)
      const [, , z] = dataToThree(centerX, faceValue, centerZ);
      lines.push({
        points: [[centerX - lineLength / 2, centerZ, z], [centerX + lineLength / 2, centerZ, z]],
        color: COLORS.face,
      });
      break;
    }
    case 'z': {
      // Horizontal plane line at the aligned Z value (height)
      const [, y, ] = dataToThree(centerX, centerY, faceValue);
      lines.push({
        points: [[centerX - lineLength / 2, y, centerY], [centerX + lineLength / 2, y, centerY]],
        color: COLORS.face,
      });
      break;
    }
  }
  
  return (
    <>
      {lines.map((line, i) => (
        <Line
          key={i}
          points={line.points}
          color={line.color}
          lineWidth={3}
          dashed
          dashScale={5}
          gapSize={10}
          dashSize={20}
        />
      ))}
      
      {/* Face alignment marker */}
      <mesh position={dataToThree(
        faceAxis === 'x' ? faceValue : centerX,
        faceAxis === 'y' ? faceValue : centerY,
        faceAxis === 'z' ? faceValue : centerZ
      )}>
        <sphereGeometry args={[15, 16, 16]} />
        <meshBasicMaterial color={COLORS.face} />
      </mesh>
    </>
  );
};

// ============================================
// SNAP TYPE LABEL - shows what kind of snap is active
// ============================================

const SnapTypeLabel: React.FC<{
  snapPoint: SnapPoint;
  position: Position;
  boxHeight: number;
}> = ({ snapPoint, position, boxHeight }) => {
  const labelPos = dataToThree(position.x, position.y, position.z + boxHeight + 120);
  
  // Get snap type display info
  const getSnapInfo = () => {
    switch (snapPoint.type) {
      case 'corner':
        return { label: 'Corner Snap', color: 'bg-green-500', icon: '◆' };
      case 'edge':
        return { label: 'Edge Snap', color: 'bg-cyan-500', icon: '◇' };
      case 'face':
        return { label: 'Edge Aligned', color: 'bg-purple-500', icon: '║' };
      case 'grid':
        return { label: 'Grid Snap', color: 'bg-blue-500', icon: '⊞' };
      case 'wall':
        return { label: 'Wall Snap', color: 'bg-orange-500', icon: '⬜' };
      case 'floor':
        return { label: 'Floor Snap', color: 'bg-orange-500', icon: '⬛' };
      default:
        return null;
    }
  };
  
  const info = getSnapInfo();
  if (!info) return null;
  
  return (
    <Html position={labelPos} center style={{ pointerEvents: 'none' }}>
      <div className={`${info.color} text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1`}>
        <span>{info.icon}</span>
        <span>{info.label}</span>
      </div>
    </Html>
  );
};

// ============================================
// SNAPPING CORNER INDICATOR - Shows which corner is the "move point"
// ============================================

const SnappingCornerIndicator: React.FC<{
  snappingCorner: Position;
  snapType: string;
}> = ({ snappingCorner, snapType }) => {
  const pos = dataToThree(snappingCorner.x, snappingCorner.y, snappingCorner.z);
  
  // Get color based on snap type
  const getColor = () => {
    switch (snapType) {
      case 'corner': return COLORS.corner;
      case 'edge': return COLORS.edge;
      case 'face': return COLORS.face;
      default: return COLORS.corner;
    }
  };
  
  const color = getColor();
  
  return (
    <group position={pos}>
      {/* Large pulsing outer ring - the "move point" indicator */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[45, 55, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Inner filled circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[35, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Center point - larger and brighter */}
      <mesh>
        <sphereGeometry args={[20, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Label */}
      <Html position={[0, 60, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="text-xs font-bold text-white bg-gray-800/80 px-1.5 py-0.5 rounded whitespace-nowrap">
          Move Point
        </div>
      </Html>
    </group>
  );
};

// ============================================
// APPROACHING SNAP INDICATOR - "Magnetic pull" visual
// ============================================

const ApproachingSnapIndicator: React.FC<{
  distanceToThreshold: number;
  ghostPosition: Position;
  boxDimensions: { w: number; d: number; h: number };
}> = ({ distanceToThreshold, ghostPosition, boxDimensions }) => {
  // Only show when we're within the approaching threshold but not yet snapped
  if (distanceToThreshold < 0 || distanceToThreshold > APPROACHING_SNAP_THRESHOLD) return null;
  
  // Calculate opacity based on distance (closer = more opaque)
  const progress = 1 - (distanceToThreshold / APPROACHING_SNAP_THRESHOLD);
  const opacity = 0.1 + progress * 0.3;
  
  const center = dataToThree(
    ghostPosition.x + boxDimensions.w / 2,
    ghostPosition.y + boxDimensions.d / 2,
    ghostPosition.z + boxDimensions.h / 2
  );
  
  return (
    <group>
      {/* Pulsing glow effect around the box */}
      <mesh position={center}>
        <boxGeometry args={[
          boxDimensions.w + 20 + progress * 30,
          boxDimensions.h + 20 + progress * 30,
          boxDimensions.d + 20 + progress * 30
        ]} />
        <meshBasicMaterial 
          color={COLORS.corner} 
          transparent 
          opacity={opacity} 
          wireframe 
        />
      </mesh>
      
      {/* Distance to snap label */}
      <Html 
        position={[center[0], center[1] + boxDimensions.h / 2 + 150, center[2]]} 
        center 
        style={{ pointerEvents: 'none' }}
      >
        <div className="bg-gray-800/80 text-green-400 px-2 py-1 rounded text-xs font-mono">
          {Math.round(distanceToThreshold)}mm to snap
        </div>
      </Html>
    </group>
  );
};

// ============================================
// BOX CORNER MARKERS - 8 dots at each corner with active corner highlighted
// ============================================

const BoxCornerMarkers: React.FC<{
  position: Position;
  dimensions: { w: number; d: number; h: number };
  hasCollision: boolean;
  activeCornerIndex?: number;
}> = ({ position, dimensions, hasCollision, activeCornerIndex }) => {
  const baseColor = hasCollision ? COLORS.collision : COLORS.corner;
  
  // Calculate 8 corners of the box
  const corners = useMemo(() => {
    const { w, d, h } = dimensions;
    return [
      // Bottom corners
      dataToThree(position.x, position.y, position.z),
      dataToThree(position.x + w, position.y, position.z),
      dataToThree(position.x, position.y + d, position.z),
      dataToThree(position.x + w, position.y + d, position.z),
      // Top corners
      dataToThree(position.x, position.y, position.z + h),
      dataToThree(position.x + w, position.y, position.z + h),
      dataToThree(position.x, position.y + d, position.z + h),
      dataToThree(position.x + w, position.y + d, position.z + h),
    ];
  }, [position, dimensions]);

  return (
    <group>
      {corners.map((corner, i) => {
        const isActive = i === activeCornerIndex;
        const size = isActive ? 18 : 10;
        const opacity = isActive ? 1 : 0.6;
        const color = isActive ? '#FFFFFF' : baseColor;
        
        return (
          <mesh key={i} position={corner}>
            <sphereGeometry args={[size, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} />
          </mesh>
        );
      })}
    </group>
  );
};

// ============================================
// INFERENCE LINES
// ============================================

const InferenceLines: React.FC<{
  startPosition: Position;
  currentPosition: Position;
  lockedAxis: LockedAxis;
}> = ({ startPosition, currentPosition, lockedAxis }) => {
  const lineLength = 500;

  // Calculate deltas
  const dx = currentPosition.x - startPosition.x;
  const dy = currentPosition.y - startPosition.y;
  const dz = currentPosition.z - startPosition.z;

  const lines: { points: [number, number, number][]; color: string }[] = [];

  // If not locked to an axis, show inference lines for significant movement
  if (!lockedAxis) {
    const threshold = 20;
    
    // X axis movement
    if (Math.abs(dx) > threshold && Math.abs(dy) < threshold && Math.abs(dz) < threshold) {
      const [sx, sy, sz] = dataToThree(startPosition.x, startPosition.y, startPosition.z);
      lines.push({
        points: [[sx - lineLength, sy, sz], [sx + lineLength, sy, sz]],
        color: COLORS.axisX,
      });
    }
    
    // Y axis movement (depth)
    if (Math.abs(dy) > threshold && Math.abs(dx) < threshold && Math.abs(dz) < threshold) {
      const [sx, sy, sz] = dataToThree(startPosition.x, startPosition.y, startPosition.z);
      lines.push({
        points: [[sx, sy, sz - lineLength], [sx, sy, sz + lineLength]],
        color: COLORS.axisY,
      });
    }
    
    // Z axis movement (height)
    if (Math.abs(dz) > threshold && Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
      const [sx, sy, sz] = dataToThree(startPosition.x, startPosition.y, startPosition.z);
      lines.push({
        points: [[sx, sy - lineLength, sz], [sx, sy + lineLength, sz]],
        color: COLORS.axisZ,
      });
    }
  }

  return (
    <>
      {lines.map((line, i) => (
        <Line
          key={i}
          points={line.points}
          color={line.color}
          lineWidth={1}
          dashed
          dashScale={8}
          gapSize={15}
          dashSize={30}
          transparent
          opacity={0.6}
        />
      ))}
    </>
  );
};

// ============================================
// WALL & FLOOR SNAP PLANES
// ============================================

const WallSnapPlane: React.FC<{ position: Position; width: number; height: number }> = ({
  position,
  width,
  height,
}) => {
  const [x, y, z] = dataToThree(position.x + width / 2, 0, position.z + height / 2);

  return (
    <mesh position={[x, y, 0]} rotation={[0, 0, 0]}>
      <planeGeometry args={[width + 100, height + 100]} />
      <meshBasicMaterial color={COLORS.wall} transparent opacity={0.1} side={THREE.DoubleSide} />
    </mesh>
  );
};

const FloorSnapPlane: React.FC<{ position: Position; width: number; depth: number }> = ({
  position,
  width,
  depth,
}) => {
  const [x, , z] = dataToThree(position.x + width / 2, position.y + depth / 2, 0);

  return (
    <mesh position={[x, 0, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width + 100, depth + 100]} />
      <meshBasicMaterial color={COLORS.floor} transparent opacity={0.1} side={THREE.DoubleSide} />
    </mesh>
  );
};

// ============================================
// AXIS GUIDE
// ============================================

const AxisGuide: React.FC<{
  startPosition: Position;
  currentPosition: Position;
  axis: LockedAxis;
}> = ({ startPosition, currentPosition, axis }) => {
  const lineLength = 2000;

  const points = useMemo(() => {
    if (!axis) return null;
    
    const [sx, sy, sz] = dataToThree(startPosition.x, startPosition.y, startPosition.z);
    
    switch (axis) {
      case 'x':
        return [[sx - lineLength, sy, sz], [sx + lineLength, sy, sz]] as [number, number, number][];
      case 'y':
        return [[sx, sy, sz - lineLength], [sx, sy, sz + lineLength]] as [number, number, number][];
      case 'z':
        return [[sx, sy - lineLength, sz], [sx, sy + lineLength, sz]] as [number, number, number][];
      default:
        return null;
    }
  }, [startPosition, axis]);

  if (!axis || !points) return null;

  const color = axis === 'x' ? COLORS.axisX : axis === 'y' ? COLORS.axisY : COLORS.axisZ;
  
  return (
    <>
      <Line points={points} color={color} lineWidth={2} dashed dashScale={10} gapSize={20} dashSize={40} />
      
      {/* Axis label */}
      <Html position={points[1]} center style={{ pointerEvents: 'none' }}>
        <div className={`px-2 py-0.5 rounded text-xs font-bold ${
          axis === 'x' ? 'bg-red-500' : axis === 'y' ? 'bg-green-500' : 'bg-blue-500'
        } text-white`}>
          {axis.toUpperCase()}
        </div>
      </Html>
    </>
  );
};

// ============================================
// COLLISION INDICATOR
// ============================================

const CollisionIndicator: React.FC<{
  position: Position;
  dimensions: { w: number; d: number; h: number };
}> = ({ position, dimensions }) => {
  const center = dataToThree(
    position.x + dimensions.w / 2,
    position.y + dimensions.d / 2,
    position.z + dimensions.h / 2
  );

  return (
    <group>
      {/* Translucent red box */}
      <mesh position={center}>
        <boxGeometry args={[dimensions.w + 10, dimensions.h + 10, dimensions.d + 10]} />
        <meshBasicMaterial color={COLORS.collision} transparent opacity={0.2} />
      </mesh>
      
      {/* Red outline */}
      <lineSegments position={center}>
        <edgesGeometry args={[new THREE.BoxGeometry(dimensions.w + 10, dimensions.h + 10, dimensions.d + 10)]} />
        <lineBasicMaterial color={COLORS.collision} linewidth={2} />
      </lineSegments>
      
      {/* Warning label */}
      <Html position={[center[0], center[1] + dimensions.h / 2 + 50, center[2]]} center style={{ pointerEvents: 'none' }}>
        <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
          COLLISION
        </div>
      </Html>
    </group>
  );
};

// ============================================
// DISTANCE LABEL
// ============================================

const DistanceLabel: React.FC<{ 
  from: Position; 
  to: Position; 
  lockedAxis?: LockedAxis;
  snapResult?: SnapResult | null;
}> = ({ from, to, lockedAxis, snapResult }) => {
  const dx = Math.round(to.x - from.x);
  const dy = Math.round(to.y - from.y);
  const dz = Math.round(to.z - from.z);
  
  const distance = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));

  if (distance < 1) return null;

  const midpoint = dataToThree(
    (from.x + to.x) / 2,
    (from.y + to.y) / 2,
    (from.z + to.z) / 2 + 80
  );

  // Build axis breakdown string with locked axis highlighted
  const axisParts = [];
  if (Math.abs(dx) > 0) {
    const isLocked = lockedAxis === 'x';
    axisParts.push(
      <span key="x" className={`${isLocked ? 'text-red-300 font-bold' : 'text-red-400'}`}>
        X:{isLocked ? <span className="underline">{dx}</span> : dx}
      </span>
    );
  }
  if (Math.abs(dy) > 0) {
    const isLocked = lockedAxis === 'y';
    axisParts.push(
      <span key="y" className={`${isLocked ? 'text-green-300 font-bold' : 'text-green-400'}`}>
        Y:{isLocked ? <span className="underline">{dy}</span> : dy}
      </span>
    );
  }
  if (Math.abs(dz) > 0) {
    const isLocked = lockedAxis === 'z';
    axisParts.push(
      <span key="z" className={`${isLocked ? 'text-blue-300 font-bold' : 'text-blue-400'}`}>
        Z:{isLocked ? <span className="underline">{dz}</span> : dz}
      </span>
    );
  }

  // Get snap status indicator
  const getSnapStatus = () => {
    if (!snapResult?.snapped) return null;
    
    const type = snapResult.snapPoint?.type;
    const colors: Record<string, string> = {
      corner: 'bg-green-500',
      edge: 'bg-cyan-500',
      face: 'bg-purple-500',
      grid: 'bg-blue-500',
      wall: 'bg-orange-500',
      floor: 'bg-orange-500',
    };
    
    return (
      <div className={`${colors[type || 'grid'] || 'bg-gray-500'} text-white text-xs px-2 py-0.5 rounded-full mt-1 inline-block`}>
        {type === 'corner' && '◆ Corner'}
        {type === 'edge' && '◇ Edge'}
        {type === 'face' && '║ Edge Aligned'}
        {type === 'grid' && '⊞ Grid'}
        {type === 'wall' && '⬜ Wall'}
        {type === 'floor' && '⬛ Floor'}
      </div>
    );
  };

  return (
    <Html position={midpoint} center style={{ pointerEvents: 'none' }}>
      <div className="bg-gray-900/90 text-white px-3 py-2 rounded-lg text-sm font-mono shadow-lg min-w-[120px] text-center">
        <div className="font-bold text-lg">{distance}mm</div>
        {axisParts.length > 0 && (
          <div className="text-xs flex gap-2 justify-center mt-1">
            {axisParts}
          </div>
        )}
        {lockedAxis && (
          <div className={`text-xs mt-1 ${
            lockedAxis === 'x' ? 'text-red-400' : lockedAxis === 'y' ? 'text-green-400' : 'text-blue-400'
          }`}>
            ⌨ {lockedAxis.toUpperCase()} axis locked
          </div>
        )}
        {getSnapStatus()}
      </div>
    </Html>
  );
};

// ============================================
// SNAP POINT DOT
// ============================================

const SnapPointDot: React.FC<{ point: SnapPoint; isActive: boolean }> = ({ point, isActive }) => {
  const pos = dataToThree(point.position.x, point.position.y, point.position.z);
  
  // Color based on snap type
  const getColor = () => {
    switch (point.type) {
      case 'corner': return COLORS.corner;
      case 'edge': return COLORS.edge;
      case 'face': return COLORS.face;
      case 'wall': return COLORS.wall;
      case 'floor': return COLORS.floor;
      default: return COLORS.grid;
    }
  };
  
  const color = getColor();
  const size = isActive ? 18 : 10;
  const opacity = isActive ? 0.9 : 0.3;

  return (
    <mesh position={pos}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
};

export default SnapIndicators;
