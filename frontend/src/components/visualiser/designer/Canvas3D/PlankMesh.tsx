/**
 * PlankMesh Component
 * Renders a single plank in the 3D scene
 */

"use client";

import React, { useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { Html, Text } from "@react-three/drei";
import type { DesignerPlank, Position3D } from "@/types/visualiser";

interface PlankMeshProps {
  plank: DesignerPlank;
  boxPosition: Position3D;
  isSelected: boolean;
  isBoxSelected: boolean;
  explodeAmount: number;
  showDimensions: boolean;
  showLabels?: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
}

export function PlankMesh({
  plank,
  boxPosition,
  isSelected,
  isBoxSelected,
  explodeAmount,
  showDimensions,
  showLabels = true,
  onClick,
  onDoubleClick,
}: PlankMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Calculate explode direction based on plank position relative to box center
  const explodeOffset = useMemo(() => {
    if (explodeAmount <= 0) return { x: 0, y: 0, z: 0 };
    
    // Simple directional explode based on plank role
    const role = plank.plankRole || 'other';
    const factor = explodeAmount * 150;
    
    switch (role) {
      case 'left':
        return { x: -factor, y: 0, z: 0 };
      case 'right':
        return { x: factor, y: 0, z: 0 };
      case 'top':
        return { x: 0, y: factor, z: 0 };
      case 'bottom':
        return { x: 0, y: -factor, z: 0 };
      case 'back':
        return { x: 0, y: 0, z: -factor };
      case 'door':
      case 'drawer_front':
        return { x: 0, y: 0, z: factor };
      case 'shelf':
        return { x: 0, y: factor * 0.3, z: 0 };
      default:
        return { x: 0, y: 0, z: 0 };
    }
  }, [explodeAmount, plank.plankRole]);

  // Convert from data coords to Three.js coords
  // Data: X=Width, Y=Depth, Z=Height
  // Three.js: X=Width, Y=Height, Z=-Depth
  const position: [number, number, number] = useMemo(() => [
    boxPosition.x + plank.position.x + plank.dimensions.lenX / 2 + explodeOffset.x,
    boxPosition.z + plank.position.z + plank.dimensions.lenZ / 2 + explodeOffset.y,
    -(boxPosition.y + plank.position.y + plank.dimensions.lenY / 2) + explodeOffset.z,
  ], [boxPosition, plank.position, plank.dimensions, explodeOffset]);

  const size: [number, number, number] = useMemo(() => [
    plank.dimensions.lenX,
    plank.dimensions.lenZ,
    plank.dimensions.lenY,
  ], [plank.dimensions]);

  const color = useMemo(() => plank.color || '#9CA3AF', [plank.color]);

  return (
    <group>
      {/* Main plank mesh */}
      <mesh
        ref={meshRef}
        position={position}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClick?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isSelected ? 1 : isBoxSelected ? 0.9 : 0.8}
          emissive={isSelected ? "#FFAA00" : hovered ? "#4488FF" : "#000000"}
          emissiveIntensity={isSelected ? 0.4 : hovered ? 0.2 : 0}
        />
      </mesh>

      {/* Edges */}
      <lineSegments position={position}>
        <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
        <lineBasicMaterial
          color={isSelected ? "#FFAA00" : "#333333"}
          transparent
          opacity={0.5}
        />
      </lineSegments>

      {/* Dimension labels (when selected) */}
      {showDimensions && isSelected && (
        <>
          {/* Width label (X) */}
          <Text
            position={[position[0], position[1] + size[1] / 2 + 30, position[2]]}
            fontSize={18}
            color="#EF4444"
            anchorX="center"
          >
            {Math.round(plank.dimensions.lenX)}mm
          </Text>
          
          {/* Height label (Z in data = Y in Three.js) */}
          <Text
            position={[position[0] + size[0] / 2 + 30, position[1], position[2]]}
            fontSize={18}
            color="#22C55E"
            anchorX="center"
            rotation={[0, 0, -Math.PI / 2]}
          >
            {Math.round(plank.dimensions.lenZ)}mm
          </Text>
          
          {/* Depth label (Y in data = -Z in Three.js) */}
          <Text
            position={[position[0], position[1], position[2] - size[2] / 2 - 30]}
            fontSize={18}
            color="#3B82F6"
            anchorX="center"
          >
            {Math.round(plank.dimensions.lenY)}mm
          </Text>
        </>
      )}

      {/* Plank ID label */}
      {showLabels && (
        <Html
          position={[position[0], position[1], position[2] + size[2] / 2 + 5]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
              isSelected
                ? "bg-orange-500 text-white"
                : "bg-white/90 text-gray-800"
            }`}
          >
            {plank.name}
          </div>
        </Html>
      )}
    </group>
  );
}

export default PlankMesh;
