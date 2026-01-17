/**
 * BoxGroup Component
 * Renders a cabinet box with all its planks
 */

"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { PlankMesh } from "./PlankMesh";
import type { DesignerBox } from "@/types/visualiser";

interface BoxGroupProps {
  box: DesignerBox;
  isSelected: boolean;
  selectedPlankId: string | null;
  explodeAmount: number;
  showDimensions: boolean;
  showLabels?: boolean;
  onPlankClick: (plankId: string) => void;
  onPlankDoubleClick?: (plankId: string) => void;
  onBoxClick: () => void;
}

export function BoxGroup({
  box,
  isSelected,
  selectedPlankId,
  explodeAmount,
  showDimensions,
  showLabels = true,
  onPlankClick,
  onPlankDoubleClick,
  onBoxClick,
}: BoxGroupProps) {
  // Get effective box dimensions
  const boxWidth = box.dimensions.boxWidth || box.dimensions.lenX || 600;
  const boxHeight = box.dimensions.boxHeight || box.dimensions.lenZ || 800;
  const boxDepth = box.dimensions.boxDepth || box.dimensions.lenY || 550;

  // Calculate bounding box position in Three.js coords
  const boundingBoxPosition: [number, number, number] = useMemo(() => [
    box.position.x + boxWidth / 2,
    box.position.z + boxHeight / 2,
    -(box.position.y + boxDepth / 2),
  ], [box.position, boxWidth, boxHeight, boxDepth]);

  const boundingBoxSize: [number, number, number] = useMemo(() => [
    boxWidth + 20,
    boxHeight + 20,
    boxDepth + 20,
  ], [boxWidth, boxHeight, boxDepth]);

  return (
    <group onClick={onBoxClick}>
      {/* Render all planks */}
      {box.planks.map((plank) => (
        <PlankMesh
          key={plank.id}
          plank={plank}
          boxPosition={box.position}
          isSelected={selectedPlankId === plank.id}
          isBoxSelected={isSelected}
          explodeAmount={isSelected ? explodeAmount : 0}
          showDimensions={showDimensions}
          showLabels={showLabels}
          onClick={() => onPlankClick(plank.id)}
          onDoubleClick={() => onPlankDoubleClick?.(plank.id)}
        />
      ))}

      {/* Box bounding box indicator (when selected) */}
      {isSelected && (
        <lineSegments position={boundingBoxPosition}>
          <edgesGeometry
            args={[new THREE.BoxGeometry(...boundingBoxSize)]}
          />
          <lineBasicMaterial 
            color="#00AAFF" 
            transparent 
            opacity={0.5} 
          />
        </lineSegments>
      )}

      {/* Box label */}
      {showLabels && (
        <Html
          position={[
            boundingBoxPosition[0],
            boundingBoxPosition[1] + boundingBoxSize[1] / 2 + 30,
            boundingBoxPosition[2],
          ]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div
            className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
              isSelected
                ? "bg-blue-500 text-white"
                : "bg-gray-100/90 text-gray-700"
            }`}
          >
            {box.name}
            {box.boxModel && ` (${box.boxModel})`}
          </div>
        </Html>
      )}
    </group>
  );
}

export default BoxGroup;
