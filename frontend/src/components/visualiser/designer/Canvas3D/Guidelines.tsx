/**
 * Guidelines Component
 * SketchUp-style construction lines for precise positioning
 * 
 * Features:
 * - Persistent guidelines (click-to-place)
 * - Temporary inference lines during placement
 * - Infinite extension along axis
 * - Selectable and deletable
 * - Color-coded by axis (Red=X, Green=Y, Blue=Z)
 */

'use client';

import React, { useMemo, useCallback, useState, useRef } from 'react';
import { ThreeEvent, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Line, Html } from '@react-three/drei';
import { useDesignerStore } from '@/stores/designerStore';
import { Position, Guideline } from '@/types/visualiser';

// ============================================
// CONSTANTS
// ============================================

const GUIDELINE_LENGTH = 20000; // Extend guidelines far in each direction
const GUIDELINE_COLORS = {
  x: '#EF4444', // Red
  y: '#22C55E', // Green
  z: '#3B82F6', // Blue
  temp: '#F59E0B', // Amber for temporary
};

// ============================================
// COORDINATE CONVERSION
// ============================================

function dataToThree(x: number, y: number, z: number): [number, number, number] {
  // Data: X=right, Y=front (towards viewer), Z=up
  // Three.js: X=right, Y=up, Z=towards camera
  // Positive Y in data = positive Z in Three.js = towards viewer
  return [x, z, y];
}

function threeToData(x: number, y: number, z: number): Position {
  return { x, y: z, z: y };
}

// ============================================
// GUIDELINE LINE COMPONENT
// ============================================

interface GuidelineLineProps {
  guideline: Guideline;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const GuidelineLine: React.FC<GuidelineLineProps> = ({
  guideline,
  isSelected,
  onSelect,
  onDelete,
}) => {
  const color = GUIDELINE_COLORS[guideline.axis] || GUIDELINE_COLORS.temp;
  
  // Calculate extended line points based on axis
  const points = useMemo(() => {
    const start = dataToThree(guideline.start.x, guideline.start.y, guideline.start.z);
    const end = dataToThree(guideline.end.x, guideline.end.y, guideline.end.z);
    
    // Direction vector
    const dir = [
      end[0] - start[0],
      end[1] - start[1],
      end[2] - start[2],
    ];
    
    // Normalize and extend
    const len = Math.sqrt(dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2);
    if (len < 0.001) {
      // If points are too close, extend along the axis
      switch (guideline.axis) {
        case 'x':
          return [
            [start[0] - GUIDELINE_LENGTH, start[1], start[2]],
            [start[0] + GUIDELINE_LENGTH, start[1], start[2]],
          ] as [number, number, number][];
        case 'y':
          return [
            [start[0], start[1], start[2] - GUIDELINE_LENGTH],
            [start[0], start[1], start[2] + GUIDELINE_LENGTH],
          ] as [number, number, number][];
        case 'z':
          return [
            [start[0], start[1] - GUIDELINE_LENGTH, start[2]],
            [start[0], start[1] + GUIDELINE_LENGTH, start[2]],
          ] as [number, number, number][];
      }
    }
    
    const normDir = [dir[0] / len, dir[1] / len, dir[2] / len];
    
    return [
      [
        start[0] - normDir[0] * GUIDELINE_LENGTH,
        start[1] - normDir[1] * GUIDELINE_LENGTH,
        start[2] - normDir[2] * GUIDELINE_LENGTH,
      ],
      [
        end[0] + normDir[0] * GUIDELINE_LENGTH,
        end[1] + normDir[1] * GUIDELINE_LENGTH,
        end[2] + normDir[2] * GUIDELINE_LENGTH,
      ],
    ] as [number, number, number][];
  }, [guideline]);

  // Midpoint for label/interaction
  const midpoint = useMemo(() => {
    const start = dataToThree(guideline.start.x, guideline.start.y, guideline.start.z);
    const end = dataToThree(guideline.end.x, guideline.end.y, guideline.end.z);
    return [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
      (start[2] + end[2]) / 2,
    ] as [number, number, number];
  }, [guideline]);

  // Calculate distance label
  const distance = useMemo(() => {
    const dx = guideline.end.x - guideline.start.x;
    const dy = guideline.end.y - guideline.start.y;
    const dz = guideline.end.z - guideline.start.z;
    return Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));
  }, [guideline]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect();
  }, [onSelect]);

  return (
    <group>
      {/* Main guideline */}
      <Line
        points={points}
        color={isSelected ? '#FFFFFF' : color}
        lineWidth={isSelected ? 2 : 1}
        dashed
        dashScale={10}
        dashSize={30}
        gapSize={20}
      />
      
      {/* Clickable area - wider invisible line for easier selection */}
      <mesh position={midpoint} onClick={handleClick}>
        <cylinderGeometry args={[20, 20, GUIDELINE_LENGTH * 2, 8]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Start point marker */}
      <mesh position={dataToThree(guideline.start.x, guideline.start.y, guideline.start.z)}>
        <sphereGeometry args={[15, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>

      {/* End point marker */}
      <mesh position={dataToThree(guideline.end.x, guideline.end.y, guideline.end.z)}>
        <sphereGeometry args={[15, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>

      {/* Distance label when selected */}
      {isSelected && distance > 0 && (
        <Html position={midpoint} center style={{ pointerEvents: 'none' }}>
          <div className="bg-gray-900/90 text-white px-2 py-1 rounded text-xs font-mono whitespace-nowrap">
            {distance}mm
            <button
              className="ml-2 text-red-400 hover:text-red-300"
              style={{ pointerEvents: 'auto' }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              ×
            </button>
          </div>
        </Html>
      )}
    </group>
  );
};

// ============================================
// TEMPORARY GUIDELINE (During Placement)
// ============================================

interface TempGuidelineProps {
  startPoint: Position;
  currentPoint: Position;
  axis: 'x' | 'y' | 'z';
}

const TempGuideline: React.FC<TempGuidelineProps> = ({
  startPoint,
  currentPoint,
  axis,
}) => {
  const color = GUIDELINE_COLORS.temp;
  
  const points = useMemo(() => {
    const start = dataToThree(startPoint.x, startPoint.y, startPoint.z);
    const end = dataToThree(currentPoint.x, currentPoint.y, currentPoint.z);
    return [start, end] as [number, number, number][];
  }, [startPoint, currentPoint]);

  const distance = useMemo(() => {
    const dx = currentPoint.x - startPoint.x;
    const dy = currentPoint.y - startPoint.y;
    const dz = currentPoint.z - startPoint.z;
    return Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));
  }, [startPoint, currentPoint]);

  const midpoint = useMemo(() => {
    const start = dataToThree(startPoint.x, startPoint.y, startPoint.z);
    const end = dataToThree(currentPoint.x, currentPoint.y, currentPoint.z);
    return [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2 + 50,
      (start[2] + end[2]) / 2,
    ] as [number, number, number];
  }, [startPoint, currentPoint]);

  return (
    <group>
      <Line
        points={points}
        color={color}
        lineWidth={2}
        dashed
        dashScale={5}
        dashSize={20}
        gapSize={10}
      />
      
      {/* Start point */}
      <mesh position={dataToThree(startPoint.x, startPoint.y, startPoint.z)}>
        <sphereGeometry args={[20, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Current point */}
      <mesh position={dataToThree(currentPoint.x, currentPoint.y, currentPoint.z)}>
        <sphereGeometry args={[20, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>

      {/* Distance label */}
      {distance > 0 && (
        <Html position={midpoint} center style={{ pointerEvents: 'none' }}>
          <div className="bg-amber-500/90 text-white px-3 py-1.5 rounded text-sm font-mono shadow-lg">
            {distance}mm ({axis.toUpperCase()})
          </div>
        </Html>
      )}
    </group>
  );
};

// ============================================
// GUIDELINE PLACEMENT HANDLER
// ============================================

interface GuidelinePlacementProps {
  onPlaceStart: (point: Position) => void;
  onPlaceEnd: (point: Position, axis: 'x' | 'y' | 'z') => void;
  isPlacing: boolean;
  startPoint: Position | null;
}

const GuidelinePlacement: React.FC<GuidelinePlacementProps> = ({
  onPlaceStart,
  onPlaceEnd,
  isPlacing,
  startPoint,
}) => {
  const [currentPoint, setCurrentPoint] = useState<Position | null>(null);
  const planeRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  // Detect dominant axis from movement
  const detectedAxis = useMemo((): 'x' | 'y' | 'z' => {
    if (!startPoint || !currentPoint) return 'x';
    
    const dx = Math.abs(currentPoint.x - startPoint.x);
    const dy = Math.abs(currentPoint.y - startPoint.y);
    const dz = Math.abs(currentPoint.z - startPoint.z);
    
    if (dx >= dy && dx >= dz) return 'x';
    if (dy >= dx && dy >= dz) return 'y';
    return 'z';
  }, [startPoint, currentPoint]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isPlacing || !startPoint) return;
    
    // Get intersection with floor plane
    const point = e.point;
    const dataPoint = threeToData(point.x, point.y, point.z);
    setCurrentPoint(dataPoint);
  }, [isPlacing, startPoint]);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    
    const point = e.point;
    const dataPoint = threeToData(point.x, point.y, point.z);
    
    if (!isPlacing) {
      onPlaceStart(dataPoint);
    } else if (startPoint) {
      onPlaceEnd(dataPoint, detectedAxis);
      setCurrentPoint(null);
    }
  }, [isPlacing, startPoint, onPlaceStart, onPlaceEnd, detectedAxis]);

  return (
    <group>
      {/* Invisible interaction plane */}
      <mesh
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[5000, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
      >
        <planeGeometry args={[20000, 20000]} />
        <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Temporary guideline during placement */}
      {isPlacing && startPoint && currentPoint && (
        <TempGuideline
          startPoint={startPoint}
          currentPoint={currentPoint}
          axis={detectedAxis}
        />
      )}
    </group>
  );
};

// ============================================
// MAIN GUIDELINES COMPONENT
// ============================================

export const Guidelines: React.FC = () => {
  const {
    guidelines,
    selectedGuidelineId,
    isPlacingGuideline,
    guidelineStartPoint,
    designMode,
    selectGuideline,
    deleteGuideline,
    startPlacingGuideline,
    finishPlacingGuideline,
  } = useDesignerStore();

  // Only render when in guidelines mode
  const isGuidelinesMode = designMode === 'guidelines';

  const handlePlaceStart = useCallback((point: Position) => {
    startPlacingGuideline(point);
  }, [startPlacingGuideline]);

  const handlePlaceEnd = useCallback((point: Position, axis: 'x' | 'y' | 'z') => {
    finishPlacingGuideline(point, axis);
  }, [finishPlacingGuideline]);

  return (
    <group>
      {/* Render all persistent guidelines */}
      {guidelines.map((guideline) => (
        <GuidelineLine
          key={guideline.id}
          guideline={guideline}
          isSelected={guideline.id === selectedGuidelineId}
          onSelect={() => selectGuideline(guideline.id)}
          onDelete={() => deleteGuideline(guideline.id)}
        />
      ))}

      {/* Placement interaction when in guidelines mode */}
      {isGuidelinesMode && (
        <GuidelinePlacement
          onPlaceStart={handlePlaceStart}
          onPlaceEnd={handlePlaceEnd}
          isPlacing={isPlacingGuideline}
          startPoint={guidelineStartPoint}
        />
      )}
    </group>
  );
};

export default Guidelines;
