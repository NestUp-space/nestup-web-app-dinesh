/**
 * WallMesh Component
 * Renders the wall as a solid surface with edges (SketchUp style)
 * The wall provides a visual backdrop for cabinet placement
 */

"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import type { DesignerWall } from "@/types/visualiser";

interface WallMeshProps {
  wall: DesignerWall;
  showDimensions?: boolean;
}

export function WallMesh({ wall, showDimensions = true }: WallMeshProps) {
  // Convert from data coords to Three.js coords
  // Data: X=Width, Y=Depth, Z=Height
  // Three.js: X=Width, Y=Height, Z=-Depth
  
  const position: [number, number, number] = useMemo(() => [
    wall.width / 2,  // Center X
    wall.height / 2, // Center Y (Three.js Y = Data Z)
    -wall.depth / 2, // Center Z (Three.js Z = -Data Y)
  ], [wall.width, wall.height, wall.depth]);
  
  const size: [number, number, number] = useMemo(() => [
    wall.width,
    wall.height,
    wall.depth,
  ], [wall.width, wall.height, wall.depth]);

  // Memoize geometry to avoid recreation
  const boxGeometry = useMemo(() => new THREE.BoxGeometry(...size), [size]);

  return (
    <group>
      {/* Solid wall surface - SketchUp style light gray */}
      <mesh position={position} receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color="#E8E4DF"
          side={THREE.DoubleSide}
          roughness={0.9}
          metalness={0}
        />
      </mesh>

      {/* Wall edges for definition - darker lines */}
      <lineSegments position={position}>
        <edgesGeometry args={[boxGeometry]} />
        <lineBasicMaterial color="#555555" linewidth={1} />
      </lineSegments>

      {/* Dimension labels */}
      {showDimensions && (
        <>
          {/* Width label (bottom) */}
          <Text
            position={[wall.width / 2, -80, 50]}
            fontSize={50}
            color="#DC2626"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {wall.width}mm
          </Text>

          {/* Height label (side) */}
          <Text
            position={[-80, wall.height / 2, 50]}
            fontSize={50}
            color="#16A34A"
            anchorX="center"
            anchorY="middle"
            rotation={[0, 0, Math.PI / 2]}
            fontWeight="bold"
          >
            {wall.height}mm
          </Text>

          {/* Wall name */}
          <Text
            position={[wall.width / 2, wall.height + 100, 50]}
            fontSize={60}
            color="#1F2937"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {wall.name}
          </Text>
        </>
      )}
    </group>
  );
}

export default WallMesh;
