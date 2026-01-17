/**
 * PlacementGhost Component
 * Shows a ghost preview of the box being placed
 */

"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import type { BoxTemplate, Position3D } from "@/types/visualiser";

interface PlacementGhostProps {
  template: BoxTemplate;
  position: Position3D;
  isValid: boolean;
}

export function PlacementGhost({ template, position, isValid }: PlacementGhostProps) {
  const { defaultWidth, defaultDepth, defaultHeight, defaultSkirtingHeight } = template;

  // Calculate position in Three.js coordinates
  // Data: X=Width, Y=Depth, Z=Height
  // Three.js: X=Width, Y=Height, Z=-Depth
  const threePosition: [number, number, number] = useMemo(() => [
    position.x + defaultWidth / 2,
    position.z + defaultHeight / 2,
    -(position.y + defaultDepth / 2),
  ], [position, defaultWidth, defaultDepth, defaultHeight]);

  const size: [number, number, number] = useMemo(() => [
    defaultWidth,
    defaultHeight,
    defaultDepth,
  ], [defaultWidth, defaultDepth, defaultHeight]);

  const color = useMemo(() => isValid ? '#22C55E' : '#EF4444', [isValid]);
  const opacity = useMemo(() => isValid ? 0.4 : 0.3, [isValid]);

  return (
    <group>
      {/* Ghost mesh */}
      <mesh position={threePosition}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outline */}
      <lineSegments position={threePosition}>
        <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.8}
          linewidth={2}
        />
      </lineSegments>

      {/* Label */}
      <Html
        position={[threePosition[0], threePosition[1] + size[1] / 2 + 50, threePosition[2]]}
        center
        style={{ pointerEvents: "none" }}
      >
        <div className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
          isValid 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {template.entityName}
          <div className="text-xs opacity-80">
            {defaultWidth} × {defaultDepth} × {defaultHeight}mm
          </div>
        </div>
      </Html>

      {/* Dimensions */}
      <Html
        position={[threePosition[0], 10, threePosition[2]]}
        center
        style={{ pointerEvents: "none" }}
      >
        <div className="text-xs text-gray-600 bg-white/90 px-2 py-1 rounded">
          X: {Math.round(position.x)}mm
        </div>
      </Html>
    </group>
  );
}

export default PlacementGhost;
