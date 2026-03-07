/**
 * MeasurementVisuals Component
 * 
 * Three.js visual components for the Tape Measure tool.
 * Renders measurement lines, guide lines, snap indicators, and endpoints.
 */

'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { Position, MeasureGuideLine, MeasureGuidePoint, BoxEdge } from '@/types/visualiser';
import { MEASUREMENT_COLORS, MEASUREMENT_CONFIG, createParallelGuide, calculatePerpendicularOffset } from '@/lib/visualiser/measurementTool';
import { INFERENCE_COLORS } from '@/lib/visualiser/moveInference';
import { MeasurementInferencePoint } from '@/lib/visualiser/measurementTool';

// ============================================
// COORDINATE CONVERSION
// ============================================

function dataToThree(x: number, y: number, z: number): [number, number, number] {
  return [x, z, y];
}

function positionToThree(p: Position): [number, number, number] {
  return dataToThree(p.x, p.y, p.z);
}

// ============================================
// MEASUREMENT LINE COMPONENT
// ============================================

interface MeasurementLineProps {
  start: Position;
  end: Position;
  temporary?: boolean;
}

export const MeasurementLine: React.FC<MeasurementLineProps> = ({
  start,
  end,
  temporary = false,
}) => {
  const points = useMemo(() => {
    return [positionToThree(start), positionToThree(end)];
  }, [start, end]);

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

// ============================================
// MEASUREMENT ENDPOINTS COMPONENT
// ============================================

interface MeasurementEndpointsProps {
  points: (Position | null)[];
}

export const MeasurementEndpoints: React.FC<MeasurementEndpointsProps> = ({
  points,
}) => {
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

// ============================================
// INFINITE GUIDE LINE COMPONENT
// ============================================

interface InfiniteGuideLineProps {
  guide: MeasureGuideLine;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const InfiniteGuideLine: React.FC<InfiniteGuideLineProps> = ({
  guide,
  isSelected = false,
  onSelect,
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

  const midpoint = useMemo(() => {
    return positionToThree(guide.origin);
  }, [guide.origin]);

  const hitQuaternion = useMemo(() => {
    const guideDirThree = new THREE.Vector3(guide.direction.x, guide.direction.z, guide.direction.y);
    if (guideDirThree.lengthSq() < 1e-8) {
      return new THREE.Quaternion();
    }
    guideDirThree.normalize();
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), guideDirThree);
    return q;
  }, [guide.direction.x, guide.direction.y, guide.direction.z]);

  return (
    <group>
      <Line
        points={points}
        color={isSelected ? '#FFFFFF' : guide.color}
        lineWidth={isSelected ? 2 : 1}
        dashed
        dashScale={10}
        dashSize={30}
        gapSize={20}
        transparent
        opacity={0.6}
      />

      {/* Clickable area for selection */}
      {onSelect && (
        <mesh position={midpoint} quaternion={hitQuaternion} onClick={onSelect}>
          <boxGeometry args={[24, MEASUREMENT_CONFIG.GUIDE_LINE_LENGTH, 24]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}

      {/* Origin marker */}
      <mesh position={positionToThree(guide.origin)}>
        <sphereGeometry args={[10, 8, 8]} />
        <meshBasicMaterial color={guide.color} transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

// ============================================
// GUIDE POINT COMPONENT
// ============================================

interface GuidePointMarkerProps {
  point: MeasureGuidePoint;
}

export const GuidePointMarker: React.FC<GuidePointMarkerProps> = ({ point }) => {
  const color = point.type === 'endpoint' 
    ? '#22C55E'  // Green
    : point.type === 'midpoint' 
      ? '#06B6D4' // Cyan
      : '#F59E0B'; // Amber for custom

  return (
    <mesh position={positionToThree(point.position)}>
      <sphereGeometry args={[6, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
};

// ============================================
// SNAP INDICATOR COMPONENT
// ============================================

interface SnapIndicatorProps {
  point: MeasurementInferencePoint;
}

export const SnapIndicator: React.FC<SnapIndicatorProps> = ({ point }) => {
  const color = INFERENCE_COLORS[point.type] || '#FFFFFF';

  return (
    <group position={positionToThree(point.position)}>
      {/* Inner solid sphere */}
      <mesh>
        <sphereGeometry args={[6, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Outer ring for emphasis */}
      <mesh>
        <ringGeometry args={[10, 12, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.5} />
      </mesh>
    </group>
  );
};

// ============================================
// EDGE HIGHLIGHT COMPONENT
// ============================================

interface EdgeHighlightProps {
  start: Position;
  end: Position;
  color?: string;
  /** When true (e.g. clicked edge), use thicker line and full opacity */
  prominent?: boolean;
}

export const EdgeHighlight: React.FC<EdgeHighlightProps> = ({
  start,
  end,
  color = '#FFFF00',
  prominent = false,
}) => {
  const points = useMemo(() => {
    return [positionToThree(start), positionToThree(end)];
  }, [start, end]);

  return (
    <group>
      <Line
        points={points}
        color={color}
        lineWidth={prominent ? 6 : 4}
        transparent
        opacity={prominent ? 1 : 0.85}
      />
      <Line
        points={points}
        color={color}
        lineWidth={prominent ? 10 : 8}
        transparent
        opacity={0.25}
      />
      <mesh position={positionToThree(start)}>
        <sphereGeometry args={[6, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      <mesh position={positionToThree(end)}>
        <sphereGeometry args={[6, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

// ============================================
// PARALLEL GUIDE PREVIEW (when clickedEdge + currentPoint)
// ============================================

interface ParallelGuidePreviewProps {
  clickedEdge: BoxEdge;
  currentPoint: Position;
}

const ParallelGuidePreview: React.FC<ParallelGuidePreviewProps> = ({ clickedEdge, currentPoint }) => {
  const offset = calculatePerpendicularOffset(clickedEdge, currentPoint);
  const guideSpec = createParallelGuide(clickedEdge, offset);
  const halfLength = MEASUREMENT_CONFIG.GUIDE_LINE_LENGTH / 2;
  const start: Position = {
    x: guideSpec.origin.x - guideSpec.direction.x * halfLength,
    y: guideSpec.origin.y - guideSpec.direction.y * halfLength,
    z: guideSpec.origin.z - guideSpec.direction.z * halfLength,
  };
  const end: Position = {
    x: guideSpec.origin.x + guideSpec.direction.x * halfLength,
    y: guideSpec.origin.y + guideSpec.direction.y * halfLength,
    z: guideSpec.origin.z + guideSpec.direction.z * halfLength,
  };
  const points = useMemo(() => [positionToThree(start), positionToThree(end)], [start, end]);
  return (
    <Line
      points={points}
      color={MEASUREMENT_COLORS.guideLineDefault}
      lineWidth={2}
      dashed
      dashScale={10}
      dashSize={30}
      gapSize={20}
      transparent
      opacity={0.8}
    />
  );
};

// ============================================
// MAIN MEASUREMENT VISUALS COMPONENT
// ============================================

interface MeasurementVisualsProps {
  startPoint: Position | null;
  currentPoint: Position | null;
  snapPoint: MeasurementInferencePoint | null;
  measureGuideLines: MeasureGuideLine[];
  measureGuidePoints: MeasureGuidePoint[];
  measureGuidesVisible: boolean;
  selectedGuideId: string | null;
  nearestEdge: { start: Position; end: Position } | null;
  clickedEdge: BoxEdge | null;
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
  clickedEdge,
  mode,
  onSelectGuide,
}) => {
  return (
    <group>
      {/* Active measurement line */}
      {startPoint && currentPoint && !clickedEdge && (
        <>
          <MeasurementLine start={startPoint} end={currentPoint} temporary />
          <MeasurementEndpoints points={[startPoint, currentPoint]} />
        </>
      )}

      {/* Snap indicator */}
      {snapPoint && <SnapIndicator point={snapPoint} />}

      {/* Guide lines */}
      {measureGuidesVisible &&
        measureGuideLines.map((guide) => (
          <InfiniteGuideLine
            key={guide.id}
            guide={guide}
            isSelected={guide.id === selectedGuideId}
            onSelect={() => onSelectGuide?.(guide.id)}
          />
        ))}

      {/* Guide points */}
      {measureGuidesVisible &&
        measureGuidePoints.map((point) => (
          <GuidePointMarker key={point.id} point={point} />
        ))}

      {/* Parallel guide from edge: preview line at perpendicular offset */}
      {mode === 'guide_create' && clickedEdge && currentPoint && (
        <ParallelGuidePreview clickedEdge={clickedEdge} currentPoint={currentPoint} />
      )}

      {/* Highlight clicked edge (prominent CYAN) or nearest edge in guide create mode */}
      {mode === 'guide_create' && (clickedEdge || (nearestEdge && !startPoint)) && (
        <EdgeHighlight
          start={(clickedEdge ?? nearestEdge!).start}
          end={(clickedEdge ?? nearestEdge!).end}
          color="#00FFFF"
          prominent={!!clickedEdge}
        />
      )}
    </group>
  );
};

export default MeasurementVisuals;
