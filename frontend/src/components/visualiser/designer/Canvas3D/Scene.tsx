/**
 * Scene Component
 * Main 3D scene for the cabinet designer
 * Renders single wall view with boxes and planks
 * Supports placement mode with ghost preview
 */

"use client";

import React, { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Line, Text, Cone } from "@react-three/drei";
import * as THREE from "three";
import { WallMesh } from "./WallMesh";
import { BoxGroup } from "./BoxGroup";
import { PlacementGhost } from "./PlacementGhost";
import type { DesignerWall, DesignerBox, BoxTemplate, Position3D } from "@/types/visualiser";
import type { ViewMode } from "@/store/designerStore";

interface SceneProps {
  // Data
  wall: DesignerWall | null;
  boxes: DesignerBox[];
  
  // Selection
  selectedBoxId: string | null;
  selectedPlankId: string | null;
  
  // Placement
  placingTemplate: BoxTemplate | null;
  isSnappingEnabled: boolean;
  snapGridSize: number;
  
  // View
  viewMode: ViewMode;
  showGrid: boolean;
  showDimensions: boolean;
  showAxes: boolean;
  explodeAmount: number;
  
  // Callbacks
  onSelectBox: (boxId: string | null) => void;
  onSelectPlank: (plankId: string | null) => void;
  onPlankDoubleClick?: (plankId: string) => void;
  onPlaceBox?: (position: Position3D) => void;
}

export function Scene({
  wall,
  boxes,
  selectedBoxId,
  selectedPlankId,
  placingTemplate,
  isSnappingEnabled,
  snapGridSize,
  viewMode,
  showGrid,
  showDimensions,
  showAxes,
  explodeAmount,
  onSelectBox,
  onSelectPlank,
  onPlankDoubleClick,
  onPlaceBox,
}: SceneProps) {
  const { camera, raycaster, pointer } = useThree();
  const controlsRef = useRef<any>(null);
  const floorPlaneRef = useRef<THREE.Mesh>(null);
  
  // Ghost position state
  const [ghostPosition, setGhostPosition] = useState<Position3D>({ x: 0, y: 0, z: 0 });
  const [isValidPlacement, setIsValidPlacement] = useState(true);

  // Calculate view target based on wall dimensions
  const target = {
    x: wall ? wall.width / 2 : 500,
    y: wall ? wall.height / 2 : 500,
    z: 0,
  };
  
  // Floor plane for raycasting
  const floorPlane = useMemo(() => 
    new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), 
    []
  );
  
  // Update ghost position during placement
  useFrame(() => {
    if (!placingTemplate || !wall) return;
    
    // Create a ray from camera through mouse position
    raycaster.setFromCamera(pointer, camera);
    
    // Find intersection with floor plane (y=0 in Three.js = z=0 in data)
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(floorPlane, intersectPoint);
    
    if (intersectPoint) {
      // Convert from Three.js to data coordinates
      let posX = intersectPoint.x - placingTemplate.defaultWidth / 2;
      let posY = -intersectPoint.z - placingTemplate.defaultDepth / 2;
      let posZ = placingTemplate.defaultSkirtingHeight;
      
      // Apply snapping
      if (isSnappingEnabled && snapGridSize > 0) {
        posX = Math.round(posX / snapGridSize) * snapGridSize;
        posY = Math.round(posY / snapGridSize) * snapGridSize;
      }
      
      // Clamp to wall bounds
      posX = Math.max(0, Math.min(wall.width - placingTemplate.defaultWidth, posX));
      posY = Math.max(0, Math.min(wall.depth - placingTemplate.defaultDepth, posY));
      
      // Check for collisions with existing boxes
      const ghostBounds = {
        minX: posX,
        maxX: posX + placingTemplate.defaultWidth,
        minY: posY,
        maxY: posY + placingTemplate.defaultDepth,
        minZ: posZ,
        maxZ: posZ + placingTemplate.defaultHeight - placingTemplate.defaultSkirtingHeight,
      };
      
      let hasCollision = false;
      for (const box of boxes) {
        const boxWidth = box.dimensions.boxWidth || box.dimensions.lenX;
        const boxDepth = box.dimensions.boxDepth || box.dimensions.lenY;
        const boxHeight = box.dimensions.boxHeight || box.dimensions.lenZ;
        
        const boxBounds = {
          minX: box.position.x,
          maxX: box.position.x + boxWidth,
          minY: box.position.y,
          maxY: box.position.y + boxDepth,
          minZ: box.position.z,
          maxZ: box.position.z + boxHeight,
        };
        
        // AABB collision check
        if (
          ghostBounds.minX < boxBounds.maxX &&
          ghostBounds.maxX > boxBounds.minX &&
          ghostBounds.minY < boxBounds.maxY &&
          ghostBounds.maxY > boxBounds.minY &&
          ghostBounds.minZ < boxBounds.maxZ &&
          ghostBounds.maxZ > boxBounds.minZ
        ) {
          hasCollision = true;
          break;
        }
      }
      
      setGhostPosition({ x: posX, y: posY, z: posZ });
      setIsValidPlacement(!hasCollision);
    }
  });

  // Handle view mode changes
  useEffect(() => {
    if (!controlsRef.current) return;

    const distance = Math.max(
      wall?.width || 2000,
      wall?.height || 2000
    ) * 1.5;

    switch (viewMode) {
      case "front":
        camera.position.set(target.x, target.y, distance);
        break;
      case "top":
        camera.position.set(target.x, distance, target.z);
        break;
      case "right":
        camera.position.set(distance, target.y, target.z);
        break;
      default: // perspective
        camera.position.set(
          target.x + distance * 0.6,
          target.y + distance * 0.4,
          distance * 0.8
        );
    }

    controlsRef.current.target.set(target.x, target.y, target.z);
    controlsRef.current.update();
  }, [viewMode, camera, wall, target.x, target.y, target.z]);

  // Handle plank click - select both box and plank
  const handlePlankClick = useCallback(
    (boxId: string, plankId: string) => {
      onSelectBox(boxId);
      onSelectPlank(plankId);
    },
    [onSelectBox, onSelectPlank]
  );

  // Handle box click - select box, deselect plank
  const handleBoxClick = useCallback(
    (boxId: string) => {
      onSelectBox(boxId);
      onSelectPlank(null);
    },
    [onSelectBox, onSelectPlank]
  );

  // Handle background click - deselect all or place box
  const handleBackgroundClick = useCallback(() => {
    if (placingTemplate && isValidPlacement && onPlaceBox) {
      onPlaceBox(ghostPosition);
    } else {
      onSelectBox(null);
      onSelectPlank(null);
    }
  }, [onSelectBox, onSelectPlank, placingTemplate, isValidPlacement, ghostPosition, onPlaceBox]);

  // Create sky gradient texture with useMemo
  const skyTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, '#5B9BD5');    // Sky blue at top
      gradient.addColorStop(0.3, '#87CEEB');  // Lighter blue
      gradient.addColorStop(0.6, '#C5E3F2');  // Very light blue
      gradient.addColorStop(1, '#FFFFFF');    // White at horizon
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 2, 512);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  return (
    <>
      {/* Lighting - Enhanced for SketchUp style */}
      <ambientLight intensity={0.8} />
      <directionalLight 
        position={[3000, 5000, 3000]} 
        intensity={1.0} 
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={20000}
        shadow-camera-left={-5000}
        shadow-camera-right={5000}
        shadow-camera-top={5000}
        shadow-camera-bottom={-5000}
      />
      <directionalLight 
        position={[-2000, 2000, 2000]} 
        intensity={0.5} 
      />
      <hemisphereLight args={["#87CEEB", "#8BC990", 0.6]} />

      {/* Camera Controls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={300}
        maxDistance={15000}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />

      {/* Background click plane */}
      <mesh 
        position={[target.x, target.y, -1000]} 
        onClick={handleBackgroundClick}
      >
        <planeGeometry args={[20000, 20000]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* SketchUp-style Ground Plane */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[wall ? wall.width / 2 : 2000, -1, wall ? -wall.depth / 2 : -200]} 
        receiveShadow
      >
        <planeGeometry args={[20000, 20000]} />
        <meshStandardMaterial 
          color="#8BC990" 
          side={THREE.DoubleSide}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Grid - overlays on ground plane */}
      {showGrid && (
        <Grid
          position={[wall ? wall.width / 2 : 2000, 1, wall ? -wall.depth / 2 : -200]}
          args={[8000, 8000]}
          cellSize={100}
          cellThickness={0.5}
          cellColor="#4A7C59"
          sectionSize={500}
          sectionThickness={1}
          sectionColor="#3D6B4A"
          fadeDistance={10000}
          fadeStrength={1}
          followCamera={false}
        />
      )}

      {/* Axes - Positioned at origin with prominent styling */}
      {showAxes && (
        <group position={[0, 0, 0]}>
          {/* X Axis (Red) - Width direction */}
          <Line 
            points={[[-100, 0, 0], [1000, 0, 0]]} 
            color="#EF4444" 
            lineWidth={3} 
          />
          <Cone 
            args={[20, 50, 8]} 
            position={[1000, 0, 0]}
            rotation={[0, 0, -Math.PI / 2]}
          >
            <meshBasicMaterial color="#EF4444" />
          </Cone>
          <Text
            position={[1100, 0, 0]}
            fontSize={60}
            color="#EF4444"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            X
          </Text>

          {/* Y Axis (Green) - Height direction */}
          <Line 
            points={[[0, -100, 0], [0, 1000, 0]]} 
            color="#22C55E" 
            lineWidth={3} 
          />
          <Cone 
            args={[20, 50, 8]} 
            position={[0, 1000, 0]}
          >
            <meshBasicMaterial color="#22C55E" />
          </Cone>
          <Text
            position={[0, 1100, 0]}
            fontSize={60}
            color="#22C55E"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            Y
          </Text>

          {/* Z Axis (Blue) - Depth direction (negative in Three.js) */}
          <Line 
            points={[[0, 0, 100], [0, 0, -1000]]} 
            color="#3B82F6" 
            lineWidth={3} 
          />
          <Cone 
            args={[20, 50, 8]} 
            position={[0, 0, -1000]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <meshBasicMaterial color="#3B82F6" />
          </Cone>
          <Text
            position={[0, 0, -1100]}
            fontSize={60}
            color="#3B82F6"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            Z
          </Text>

          {/* Origin marker */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[15, 16, 16]} />
            <meshBasicMaterial color="#1A365D" />
          </mesh>
        </group>
      )}

      {/* Wall boundary wireframe */}
      {wall && (
        <WallMesh 
          wall={wall} 
          showDimensions={showDimensions} 
        />
      )}

      {/* Boxes */}
      {boxes.map((box) => (
        <BoxGroup
          key={box.id}
          box={box}
          isSelected={selectedBoxId === box.id}
          selectedPlankId={selectedPlankId}
          explodeAmount={explodeAmount}
          showDimensions={showDimensions}
          onPlankClick={(plankId) => handlePlankClick(box.id, plankId)}
          onPlankDoubleClick={onPlankDoubleClick}
          onBoxClick={() => handleBoxClick(box.id)}
        />
      ))}

      {/* Placement Ghost */}
      {placingTemplate && wall && (
        <PlacementGhost
          template={placingTemplate}
          position={ghostPosition}
          isValid={isValidPlacement}
        />
      )}
    </>
  );
}

export default Scene;
