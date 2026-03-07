/**
 * MoveVisuals – SketchUp-style move tool feedback
 * - Axis lines (X=red, Y=green, Z=blue): show locked axis solid, others dashed
 * - Ghost preview box with wireframe edges (green valid / red invalid / blue copy)
 * - Dimmed original position ghost
 * - Dashed line from base point to current position
 * - Copy mode indicator (+ badge)
 * - Snap dots for inference points with SketchUp-correct colors
 */

'use client';

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';
import { Position } from '@/types/visualiser';
import { INFERENCE_COLORS, INFERENCE_SHAPES, INDICATOR_SIZE, InferenceType } from '@/lib/visualiser/moveInference';

// Data coords: X=right, Y=front, Z=up
// Three.js: X same, Y=up=data Z, Z=towards camera=data Y
function dataToThree(x: number, y: number, z: number): [number, number, number] {
  return [x, z, y];
}

const AXIS_LENGTH = 5000;
// SketchUp-exact axis colors from the spec
const AXIS_COLORS = {
  x: '#FF0000', // Red (spec exact)
  y: '#00FF00', // Green (spec exact)
  z: '#0000FF', // Blue (spec exact)
  parallel: '#FF00FF', // Magenta (parallel/perpendicular)
} as const;

export interface MoveVisualsProps {
  /** Box min corner (target/ghost position) in data coords */
  targetPosition: Position;
  /** Original position before move started (for dimmed ghost) */
  startPosition?: Position | null;
  /** Box dimensions for center and ghost mesh */
  boxDimensions: { w: number; d: number; h: number };
  /** When set, show only this axis line; when null, show all three */
  lockedAxis: 'x' | 'y' | 'z' | null;
  /** Ghost color: true = green (valid), false = red (invalid) */
  isValid?: boolean;
  /** Inference points near cursor for snap indicators */
  inferencePoints?: Array<{ position: Position; type: string; label: string }>;
  /** Whether copy mode is active */
  isCopyMode?: boolean;
  /** "From Point" reference (Shift while moving); draw magenta sphere and line to ghost */
  fromPoint?: Position | null;
}

function inferenceColor(type: string): string {
  return INFERENCE_COLORS[type as InferenceType] || '#FFFFFF';
}

const InferenceIndicator: React.FC<{ color: string; shape: string; size: number; label: string }> = ({ color, shape, size, label }) => {
  const half = size / 2;
  if (shape === 'square') {
    return (
      <div
        style={{ width: size, height: size, backgroundColor: color, border: '1px solid white' }}
        title={label}
      />
    );
  }
  if (shape === 'diamond') {
    return (
      <div
        style={{
          width: size, height: size,
          backgroundColor: color,
          border: '1px solid white',
          transform: 'rotate(45deg)',
        }}
        title={label}
      />
    );
  }
  if (shape === 'x') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
        <title>{label}</title>
        <line x1="0" y1="0" x2={size} y2={size} stroke={color} strokeWidth="2" />
        <line x1={size} y1="0" x2="0" y2={size} stroke={color} strokeWidth="2" />
      </svg>
    );
  }
  // Default: circle
  return (
    <div
      className="rounded-full"
      style={{ width: size, height: size, backgroundColor: color, border: '1px solid white' }}
      title={label}
    />
  );
};

function getDominantAxisColor(start: Position, end: Position): string {
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  const dz = Math.abs(end.z - start.z);
  
  if (dx >= dy && dx >= dz) return AXIS_COLORS.x;
  if (dy >= dx && dy >= dz) return AXIS_COLORS.y;
  return AXIS_COLORS.z;
}

/** Red semi-transparent fill with subtle pulse when position is invalid */
const InvalidGhostFill: React.FC<{
  position: [number, number, number];
  dimensions: [number, number, number];
}> = ({ position, dimensions }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (mesh?.material && 'opacity' in mesh.material) {
      const pulse = Math.sin(clock.elapsedTime * 3) * 0.1 + 0.4;
      (mesh.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });

  const [w, h, d] = dimensions;
  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[w, h, d]} />
      <meshBasicMaterial
        color="#FF0000"
        transparent
        opacity={0.4}
        depthWrite={false}
      />
    </mesh>
  );
};

const FROM_POINT_ALIGN_TOL = 2;

export function MoveVisuals({
  targetPosition,
  startPosition,
  boxDimensions,
  lockedAxis,
  isValid = true,
  inferencePoints = [],
  isCopyMode = false,
  fromPoint = null,
}: MoveVisualsProps) {
  const { w, d, h } = boxDimensions;
  
  // Target (ghost) center
  const cx = targetPosition.x + w / 2;
  const cy = targetPosition.y + d / 2;
  const cz = targetPosition.z + h / 2;

  // Start (original) center
  const startCx = startPosition ? startPosition.x + w / 2 : cx;
  const startCy = startPosition ? startPosition.y + d / 2 : cy;
  const startCz = startPosition ? startPosition.z + h / 2 : cz;

  // Axis lines through ghost center
  const axes = useMemo(() => {
    const [tx, ty, tz] = dataToThree(cx, cy, cz);
    const L = AXIS_LENGTH / 2;
    const out: Array<{ key: string; axis: 'x' | 'y' | 'z'; start: [number, number, number]; end: [number, number, number]; color: string }> = [];
    out.push({ key: 'x', axis: 'x', start: [tx - L, ty, tz], end: [tx + L, ty, tz], color: AXIS_COLORS.x });
    out.push({ key: 'y', axis: 'y', start: [tx, ty, tz - L], end: [tx, ty, tz + L], color: AXIS_COLORS.y });
    out.push({ key: 'z', axis: 'z', start: [tx, ty - L, tz], end: [tx, ty + L, tz], color: AXIS_COLORS.z });
    return out;
  }, [cx, cy, cz]);

  const visibleAxes = lockedAxis ? axes.filter((a) => a.axis === lockedAxis) : axes;

  // Ghost color based on validity and copy mode
  const ghostColor = isCopyMode ? 0x3B82F6 : (isValid ? 0x00ff00 : 0xff0000);
  const edgeColor = isCopyMode ? '#3B82F6' : (isValid ? '#22C55E' : '#EF4444');

  const ghostPos = dataToThree(cx, cy, cz);
  const startPos = dataToThree(startCx, startCy, startCz);

  const fromPointAlignedAxis: 'x' | 'y' | 'z' | null = fromPoint ? (() => {
    const tol = FROM_POINT_ALIGN_TOL;
    const matchX = Math.abs(targetPosition.x - fromPoint.x) <= tol;
    const matchY = Math.abs(targetPosition.y - fromPoint.y) <= tol;
    const matchZ = Math.abs(targetPosition.z - fromPoint.z) <= tol;
    if (matchX && matchY) return 'z';
    if (matchX && matchZ) return 'y';
    if (matchY && matchZ) return 'x';
    return null;
  })() : null;

  // Base-to-current line color (matches dominant axis)
  const baseToCurrentColor = startPosition 
    ? (lockedAxis ? AXIS_COLORS[lockedAxis] : getDominantAxisColor(startPosition, targetPosition))
    : '#888888';

  return (
    <group>
      {/* Dimmed original position ghost (shows where object started) */}
      {startPosition && (
        <>
          <mesh position={startPos}>
            <boxGeometry args={[w, h, d]} />
            <meshBasicMaterial
              color={0x888888}
              transparent
              opacity={0.1}
              depthWrite={false}
            />
          </mesh>
          {/* Bounding box outline: dotted 1px (spec Section 1.3 stipple ".") */}
          <lineSegments position={startPos}>
            <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
            <lineDashedMaterial color="#666666" transparent opacity={0.3} dashSize={3} gapSize={3} />
          </lineSegments>
        </>
      )}

      {/* Inference line from base point to current position (spec Section 1.3: dashed 1px suggesting) */}
      {startPosition && (
        <Line
          points={[startPos, ghostPos]}
          color={baseToCurrentColor}
          lineWidth={lockedAxis ? 3 : 1}
          dashed={!lockedAxis}
          dashScale={30}
          dashSize={15}
          gapSize={10}
          transparent
          opacity={lockedAxis ? 0.9 : 0.7}
        />
      )}

      {/* Axis lines: dashed 1px when suggesting, solid 2-3px when LOCKED (spec Section 1.3) */}
      {visibleAxes.map(({ key, axis, start, end, color }) => {
        const isLocked = lockedAxis === axis;
        return (
          <Line
            key={key}
            points={[start, end]}
            color={color}
            lineWidth={isLocked ? 3 : 1}
            dashed={!isLocked}
            dashScale={50}
            dashSize={30}
            gapSize={20}
            transparent
            opacity={isLocked ? 0.9 : 0.5}
          />
        );
      })}

      {/* Ghost box at target position — wireframe only (SketchUp style) */}
      {isValid && (
        <mesh position={ghostPos} renderOrder={4}>
          <boxGeometry args={[w, h, d]} />
          <meshBasicMaterial
            color={ghostColor}
            transparent
            opacity={0.05}
            depthWrite={false}
          />
        </mesh>
      )}
      <lineSegments position={ghostPos}>
        <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
        <lineBasicMaterial color={edgeColor} transparent opacity={0.9} />
      </lineSegments>

      {/* When invalid: semi-transparent red fill with subtle pulse */}
      {!isValid && (
        <InvalidGhostFill position={ghostPos} dimensions={[w, h, d]} />
      )}

      {/* From Point: magenta sphere at ref + line to ghost (dashed magenta or solid axis when aligned) */}
      {fromPoint && (
        <>
          <mesh position={dataToThree(fromPoint.x, fromPoint.y, fromPoint.z)}>
            <sphereGeometry args={[12, 16, 16]} />
            <meshBasicMaterial color="#FF00FF" transparent opacity={0.9} />
          </mesh>
          <Line
            points={[dataToThree(fromPoint.x, fromPoint.y, fromPoint.z), ghostPos]}
            color={fromPointAlignedAxis ? (AXIS_COLORS[fromPointAlignedAxis] as string) : '#FF00FF'}
            lineWidth={fromPointAlignedAxis ? 3 : 1}
            dashed={!fromPointAlignedAxis}
            dashScale={20}
            dashSize={15}
            gapSize={10}
            transparent
            opacity={0.9}
          />
        </>
      )}

      {/* Copy mode badge */}
      {isCopyMode && (
        <Html position={[ghostPos[0], ghostPos[1] + h/2 + 20, ghostPos[2]]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
            + COPY
          </div>
        </Html>
      )}

      {/* Snap indicators with SketchUp-exact shapes, colors, and sizes */}
      {inferencePoints.map((p, i) => {
        const color = inferenceColor(p.type);
        const shape = INFERENCE_SHAPES[p.type as InferenceType] || 'circle';
        const sz = INDICATOR_SIZE;
        return (
          <Html key={i} position={dataToThree(p.position.x, p.position.y, p.position.z)} center style={{ pointerEvents: 'none' }}>
            <InferenceIndicator color={color} shape={shape} size={sz} label={p.label} />
          </Html>
        );
      })}
    </group>
  );
}
