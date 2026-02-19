'use client';

import React, { useRef, useEffect, useMemo, useCallback, useState, createContext, useContext } from 'react';
import { Canvas, useThree, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useDesignerStore } from '@/store/designerStore';
import { Wall, Box, Plank, Position, DesignMode } from '@/types/visualiser';
import { useDragInteraction, DragState } from '@/hooks/useDragInteraction';
import { SnapIndicators } from './SnapIndicators';
import { Guidelines } from './Guidelines';

// ============================================
// CAMERA LOCK CONTEXT
// Used to communicate drag state from BoxMesh to Scene
// ============================================

interface CameraLockContextType {
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

const CameraLockContext = createContext<CameraLockContextType>({
  isDragging: false,
  setIsDragging: () => {},
});

const useCameraLock = () => useContext(CameraLockContext);

// ============================================
// COORDINATE SYSTEM CONVERSION
// Data coords: X=right, Y=front (towards viewer), Z=up
// Three.js:    X=right, Y=up, Z=towards camera
//
// IMPORTANT: Positive Y in data = positive Z in Three.js = towards camera/viewer
// Wall extends backward (negative Y in data = negative Z in Three.js = behind)
// Boxes at Y=0 extend forward (positive Y in data = positive Z = in front)
// ============================================

function dataToThree(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(
    x,      // X stays the same (right)
    z,      // Our Z (up) becomes Three.js Y (up)
    y       // Our Y (front) becomes positive Three.js Z (towards camera)
  );
}

function threeToData(x: number, y: number, z: number): { x: number; y: number; z: number } {
  return {
    x: x,      // X stays the same
    y: z,      // Three.js Z becomes our Y (front)
    z: y       // Three.js Y becomes our Z (up)
  };
}

// ============================================
// CONSTANTS (matching Apps Script)
// ============================================

const WALL_COLORS = [
  '#8B7355', '#6B8E23', '#4682B4', '#CD853F', '#708090',
  '#9370DB', '#20B2AA', '#DAA520', '#778899', '#BC8F8F',
];

const SNAP_CONFIG = {
  SNAP_THRESHOLD: 100,
  FLOOR_Y: 0,
  WALL_Y: 0,
};

// ============================================
// CUSTOM AXIS HELPER (matching Apps Script colors)
// X = Red (right), Y = Green (front in data), Z = Blue (up in data)
// ============================================

const CustomAxes: React.FC<{ size?: number }> = ({ size = 500 }) => {
  return (
    <group>
      {/* X axis - Red - pointing right */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, size, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#EF4444" linewidth={2} />
      </line>
      
      {/* Y axis (data) - Green - in Three.js this is +Z (pointing towards camera/viewer) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, 0, size])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#22C55E" linewidth={2} />
      </line>
      
      {/* Z axis (data) - Blue - in Three.js this is Y (pointing up) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, size, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#3B82F6" linewidth={2} />
      </line>

      {/* Axis labels */}
      <Html position={[size + 50, 0, 0]} center>
        <span className="text-red-500 text-xs font-bold">X</span>
      </Html>
      <Html position={[0, 0, size + 50]} center>
        <span className="text-green-500 text-xs font-bold">Y</span>
      </Html>
      <Html position={[0, size + 50, 0]} center>
        <span className="text-blue-500 text-xs font-bold">Z</span>
      </Html>
    </group>
  );
};

// ============================================
// FLOOR GRID (on XY plane in data = XZ plane in Three.js)
// ============================================

const FloorGrid: React.FC<{ size?: number; divisions?: number }> = ({ 
  size = 10000, 
  divisions = 100 
}) => {
  return (
    <>
      {/* Grid on the floor */}
      <gridHelper 
        args={[size, divisions, '#D1D5DB', '#E5E7EB']} 
        position={[size / 2, 0, 0]}
      />
      
      {/* Invisible floor plane for raycasting */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[size / 2, 0, 0]}
        visible={false}
      >
        <planeGeometry args={[size * 2, size * 2]} />
        <meshBasicMaterial side={THREE.DoubleSide} />
      </mesh>
    </>
  );
};

// ============================================
// HELPER: Check if camera should be locked based on tool
// ============================================

function shouldLockCamera(designMode: DesignMode, selectedBoxId: string | null, isDragging: boolean): boolean {
  // Lock camera when:
  // 1. Move tool is active and a box is selected (ready to move)
  // 2. Guidelines tool is active
  // 3. Any drag operation is in progress
  if (isDragging) return true;
  if (designMode === 'guidelines') return true;
  if (designMode === 'move' && selectedBoxId) return true;
  return false;
}

// ============================================
// SCENE COMPONENT
// ============================================

const Scene: React.FC = () => {
  const {
    walls,
    activeWallId,
    selectedWallId,
    selectedBoxId,
    showGrid,
    showAxes,
    showLabels,
    designMode,
    selectWall,
    selectBox,
    moveBox,
    rotateBox,
    snapEnabled,
  } = useDesignerStore();

  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  
  // Get drag state from context
  const { isDragging } = useCameraLock();
  
  // Determine if camera controls should be enabled
  const cameraEnabled = !shouldLockCamera(designMode, selectedBoxId, isDragging);

  // Set initial camera position (matching Apps Script)
  useEffect(() => {
    camera.position.set(2000, 1500, 2000);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Get the active wall to render
  // If no active wall, show nothing (user should add a wall first)
  const activeWall = useMemo(() => {
    if (!activeWallId) return null;
    return walls.find(w => w.id === activeWallId) || null;
  }, [walls, activeWallId]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5000, 8000, 5000]} intensity={0.8} castShadow />
      <directionalLight position={[-3000, 5000, -3000]} intensity={0.4} />

      {/* Background color */}
      <color attach="background" args={['#FAFAFA']} />

      {/* Grid */}
      {showGrid && <FloorGrid />}

      {/* Custom Axes */}
      {showAxes && <CustomAxes size={500} />}

      {/* Render ONLY the active wall at origin (0,0,0) */}
      {activeWall && (
        <WallGroup
          key={activeWall.id}
          wall={{
            ...activeWall,
            // Force position to origin for display
            position: { x: 0, y: 0, z: 0 },
          }}
          index={walls.findIndex(w => w.id === activeWall.id)}
          isSelected={activeWall.id === selectedWallId}
          selectedBoxId={selectedBoxId}
          showLabels={showLabels}
          designMode={designMode}
          onSelectWall={selectWall}
          onSelectBox={selectBox}
          onMoveBox={moveBox}
          onRotateBox={rotateBox}
          snapEnabled={snapEnabled}
        />
      )}

      {/* Empty state message when no walls */}
      {!activeWall && walls.length === 0 && (
        <Html center position={[0, 200, 0]}>
          <div className="bg-gray-800/90 text-white px-6 py-4 rounded-lg text-center shadow-xl">
            <p className="text-lg font-medium mb-2">No walls yet</p>
            <p className="text-gray-400 text-sm">Click &ldquo;Add Wall&rdquo; to get started</p>
          </div>
        </Html>
      )}

      {/* Guidelines - Construction lines */}
      <Guidelines />

      {/* OrbitControls - SketchUp style with camera lock support */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={cameraEnabled}
        enableDamping={false}
        enablePan={cameraEnabled}
        enableZoom={true}
        enableRotate={cameraEnabled}
        minDistance={100}
        maxDistance={50000}
        // Middle mouse = Orbit, Shift+Middle = Pan, Scroll = Zoom
        mouseButtons={{
          LEFT: cameraEnabled ? THREE.MOUSE.PAN : undefined,
          MIDDLE: cameraEnabled ? THREE.MOUSE.ROTATE : undefined,
          RIGHT: cameraEnabled ? THREE.MOUSE.PAN : undefined,
        }}
        target={[0, 0, 0]}
      />
    </>
  );
};

// ============================================
// WALL GROUP
// ============================================

interface WallGroupProps {
  wall: Wall;
  index: number;
  isSelected: boolean;
  selectedBoxId: string | null;
  showLabels: boolean;
  designMode: string;
  onSelectWall: (id: string) => void;
  onSelectBox: (id: string) => void;
  onMoveBox: (id: string, position: { x: number; y: number; z: number }) => void;
  onRotateBox: (id: string, degrees: number) => void;
  snapEnabled: boolean;
}

const WallGroup: React.FC<WallGroupProps> = ({
  wall,
  index,
  isSelected,
  selectedBoxId,
  showLabels,
  designMode,
  onSelectWall,
  onSelectBox,
  onMoveBox,
  onRotateBox,
  snapEnabled,
}) => {
  const color = WALL_COLORS[index % WALL_COLORS.length];
  
  // Wall dimensions in data coordinates
  const wallWidth = wall.dimensions.lenX;  // X dimension (width)
  const wallDepth = wall.dimensions.lenY;  // Y dimension (depth/thickness)
  const wallHeight = wall.dimensions.lenZ; // Z dimension (height)

  // Wall position (in data coordinates)
  const wallPosX = wall.position.x;
  const wallPosY = wall.position.y;
  const wallPosZ = wall.position.z;

  // Convert to Three.js coordinates
  // Wall center position in data coords:
  // X center = wallPosX + wallWidth/2
  // Y center = wallPosY - wallDepth/2 (wall extends BACKWARD into negative Y = behind viewer)
  // Z center = wallPosZ + wallHeight/2
  // This places wall surface at Y=0, extending backward to Y=-wallDepth
  const wallCenterData = {
    x: wallPosX + wallWidth / 2,
    y: wallPosY - wallDepth / 2,  // Wall extends backward (negative Y)
    z: wallPosZ + wallHeight / 2,
  };
  
  const wallCenter = dataToThree(wallCenterData.x, wallCenterData.y, wallCenterData.z);

  // Floor plane for this wall - extends in front of wall (positive Y) and slightly behind
  const floorExtension = 500;  // Extension in front of wall
  const floorBehind = wallDepth;  // How far behind wall
  const totalFloorDepth = floorExtension + floorBehind;
  const floorCenterY = wallPosY + (floorExtension - floorBehind) / 2;  // Center of floor
  const floorCenterData = {
    x: wallPosX + wallWidth / 2,
    y: floorCenterY,
    z: wallPosZ, // At ground level
  };
  const floorCenter = dataToThree(floorCenterData.x, floorCenterData.y, floorCenterData.z);

  return (
    <group>
      {/* Wall Surface */}
      <mesh
        position={wallCenter}
        onClick={(e) => {
          e.stopPropagation();
          onSelectWall(wall.id);
        }}
      >
        {/* Wall geometry: width(X), height(data Z = Three Y), depth(data Y = Three Z) */}
        <boxGeometry args={[wallWidth, wallHeight, wallDepth]} />
        <meshLambertMaterial
          color={isSelected ? '#FF6B00' : color}
          transparent
          opacity={isSelected ? 0.35 : 0.25}
        />
      </mesh>

      {/* Wall outline */}
      <lineSegments position={wallCenter}>
        <edgesGeometry args={[new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth)]} />
        <lineBasicMaterial color={isSelected ? '#FF6B00' : color} />
      </lineSegments>

      {/* Floor plane */}
      <mesh
        position={floorCenter}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[wallWidth, totalFloorDepth]} />
        <meshLambertMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wall Label */}
      {showLabels && (
        <Html
          position={dataToThree(
            wallPosX + wallWidth / 2,
            wallPosY,
            wallPosZ + wallHeight + 100
          ).toArray()}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-gray-800/85 text-white px-3 py-1.5 rounded-lg text-sm whitespace-nowrap font-medium shadow-lg">
            {wall.entityName}
            {wall.roomName && <span className="text-gray-400 ml-1">({wall.roomName})</span>}
          </div>
        </Html>
      )}

      {/* Render Boxes */}
      {wall.boxes.map((box) => (
        <BoxMesh
          key={box.id}
          box={box}
          wallPosition={wall.position}
          isSelected={box.id === selectedBoxId}
          showLabels={showLabels}
          designMode={designMode}
          onSelect={() => onSelectBox(box.id)}
          onMove={(pos) => onMoveBox(box.id, pos)}
          onRotate={(deg) => onRotateBox(box.id, deg)}
          snapEnabled={snapEnabled}
        />
      ))}
    </group>
  );
};

// ============================================
// BOX MESH
// ============================================

interface BoxMeshProps {
  box: Box;
  wallPosition: { x: number; y: number; z: number };
  isSelected: boolean;
  showLabels: boolean;
  designMode: string;
  onSelect: () => void;
  onMove: (position: { x: number; y: number; z: number }) => void;
  onRotate: (degrees: number) => void;
  snapEnabled: boolean;
}

const BoxMesh: React.FC<BoxMeshProps> = ({
  box,
  wallPosition,
  isSelected,
  showLabels,
  designMode,
  onSelect,
  onMove,
  onRotate,
  snapEnabled,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const selectedBoxId = useDesignerStore((s) => s.selectedBoxId);
  
  // Get camera lock context to report drag state
  const { setIsDragging } = useCameraLock();
  
  // Get move input context for numeric input
  const { 
    setApplyNumericInput, 
    setStartPosition, 
    setLockedAxis: setMoveInputLockedAxis,
    setGhostPosition 
  } = useMoveInput();

  // Box dimensions
  const boxWidth = box.dimensions.lenX;
  const boxDepth = box.dimensions.lenY;
  const boxHeight = box.dimensions.lenZ;

  // Use drag interaction hook for SketchUp-grade movement
  const { dragState, handlers, setLockedAxis, applyNumericInput } = useDragInteraction({
    boxId: box.id,
    enabled: isSelected && (designMode === 'select' || designMode === 'move'),
    onDragStart: () => {
      setIsDragging(true);
    },
    onDragEnd: (newPosition) => {
      setIsDragging(false);
      onMove(newPosition);
    },
    onDragCancel: () => {
      setIsDragging(false);
    },
  });
  
  // Also update drag state when dragState.isDragging changes
  useEffect(() => {
    if (dragState.isDragging) {
      setIsDragging(true);
    }
  }, [dragState.isDragging, setIsDragging]);

  // Sync drag state with MoveInputContext for the numeric input box
  useEffect(() => {
    if (dragState.isDragging) {
      // Register the numeric input handler
      setApplyNumericInput(applyNumericInput);
      setStartPosition(dragState.startPosition);
      setMoveInputLockedAxis(dragState.lockedAxis);
      setGhostPosition(dragState.ghostPosition);
    } else {
      // Clean up when not dragging
      setApplyNumericInput(null);
      setStartPosition(null);
      setMoveInputLockedAxis(null);
      setGhostPosition(null);
    }
  }, [
    dragState.isDragging, 
    dragState.startPosition, 
    dragState.lockedAxis, 
    dragState.ghostPosition,
    applyNumericInput,
    setApplyNumericInput, 
    setStartPosition, 
    setMoveInputLockedAxis, 
    setGhostPosition
  ]);

  // Box position in data coordinates (min corner, local to wall at origin)
  // Use ghost position during drag, actual position otherwise
  const displayPosition = dragState.isDragging && dragState.ghostPosition 
    ? dragState.ghostPosition 
    : box.position;
    
  const localX = displayPosition.x;
  const localY = displayPosition.y;
  const localZ = displayPosition.z;

  // Convert box min corner position to Three.js
  const boxGroupPos = dataToThree(localX, localY, localZ);

  // Rotation around Z axis in data = rotation around Y axis in Three.js
  const rotationY = box.rotZ ? THREE.MathUtils.degToRad(box.rotZ) : 0;

  // Get planks - either from catalog data or generate defaults
  const planks = useMemo(() => {
    if (box.planks && box.planks.length > 0) {
      return box.planks;
    }
    return generateDefaultPlanks(box);
  }, [box]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect();
  }, [onSelect]);

  const handleDoubleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (designMode === 'rotate') {
      onRotate(90);
    }
  }, [designMode, onRotate]);

  // Bounding box center offset (for selection box visualization)
  const boundingBoxCenter = dataToThree(
    boxWidth / 2,
    boxDepth / 2,
    boxHeight / 2
  );

  // Ghost appearance during drag
  const ghostOpacity = dragState.isDragging ? 0.5 : (isSelected ? 0.15 : 0.02);
  const hasCollision = dragState.collisions.length > 0;

  return (
    <>
      {/* Main box group */}
      <group 
        ref={groupRef} 
        position={boxGroupPos} 
        rotation={[0, rotationY, 0]}
        onPointerDown={isSelected ? handlers.onPointerDown : undefined}
        onPointerMove={isSelected ? handlers.onPointerMove : undefined}
        onPointerUp={isSelected ? handlers.onPointerUp : undefined}
      >
        {/* Selection/Interaction bounding box (centered within box) */}
        {/* depthWrite={false} prevents this overlay from z-fighting with planks */}
        <mesh
          position={boundingBoxCenter}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          renderOrder={10}
        >
          <boxGeometry args={[boxWidth, boxHeight, boxDepth]} />
          <meshBasicMaterial
            color={hasCollision ? '#EF4444' : (isSelected ? '#FF6B00' : '#666666')}
            transparent
            opacity={ghostOpacity}
            wireframe={!isSelected && !dragState.isDragging}
            depthWrite={false}
          />
        </mesh>

        {/* Selection outline - renderOrder=11 above selection box */}
        {isSelected && (
          <lineSegments position={boundingBoxCenter} renderOrder={11}>
            <edgesGeometry args={[new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth)]} />
            <lineBasicMaterial color={hasCollision ? '#EF4444' : '#FF6B00'} linewidth={2} />
          </lineSegments>
        )}

        {/* Planks - positions are relative to box origin (0,0,0) */}
        {planks.map((plank, i) => (
          <PlankMeshDirect
            key={plank.id || i}
            plank={plank}
            ghostMode={dragState.isDragging}
          />
        ))}

        {/* Box Label */}
        {showLabels && !dragState.isDragging && (
          <Html
            position={boundingBoxCenter.clone().add(new THREE.Vector3(0, boxHeight / 2 + 80, 0)).toArray()}
            center
            style={{ pointerEvents: 'none' }}
          >
            <div
              className={`px-2 py-1 rounded text-xs whitespace-nowrap font-medium ${
                isSelected
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700/80 text-gray-200'
              }`}
            >
              {box.boxModel || box.entityName}
            </div>
          </Html>
        )}
      </group>

      {/* Snap Indicators - rendered outside box group for proper world coordinates */}
      {isSelected && (
        <SnapIndicators
          visible={dragState.isDragging}
          ghostPosition={dragState.ghostPosition}
          startPosition={dragState.startPosition}
          snapResult={dragState.snapResult}
          lockedAxis={dragState.lockedAxis}
          collisions={dragState.collisions}
          boxDimensions={{ w: boxWidth, d: boxDepth, h: boxHeight }}
        />
      )}
    </>
  );
};

// ============================================
// PLANK MESH DIRECT (matches Apps Script createPlank)
// Position is directly from plank.position (min corner)
// Supports laminate texture mapping for 3D visualization
// ============================================

interface PlankMeshDirectProps {
  plank: Plank;
  ghostMode?: boolean;
}

const PlankMeshDirect: React.FC<PlankMeshDirectProps> = ({ plank, ghostMode = false }) => {
  // Plank dimensions from catalog
  const lenX = plank.dimensions.lenX;  // Width
  const lenY = plank.dimensions.lenY;  // Depth  
  const lenZ = plank.dimensions.lenZ;  // Height

  // Plank position is the min corner (from catalog)
  // We need center position for Three.js mesh
  const posX = plank.position.x + lenX / 2;
  const posY = plank.position.y + lenY / 2;
  const posZ = plank.position.z + lenZ / 2;

  // Convert to Three.js coordinates
  const meshPos = dataToThree(posX, posY, posZ);

  const color = plank.materialColor || getMaterialColor(plank.material);
  
  // Get texture URL from plank (applied via LaminatePanel)
  const textureUrl = plank.textureUrl || plank.outerLaminateUrl;

  return (
    <group position={meshPos}>
      {/* Three.js BoxGeometry(width, height, depth) 
          Our data: lenX=width, lenZ=height (mapped to Three Y), lenY=depth (mapped to Three Z) */}
      {/* renderOrder=1 ensures planks render before selection overlays */}
      <mesh castShadow={!ghostMode} receiveShadow={!ghostMode} renderOrder={1}>
        <boxGeometry args={[lenX, lenZ, lenY]} />
        {textureUrl ? (
          <PlankTexturedMaterial 
            textureUrl={textureUrl} 
            fallbackColor={color}
            ghostMode={ghostMode}
            laminateCode={plank.laminateCode}
          />
        ) : (
          <meshLambertMaterial 
            color={color} 
            transparent={ghostMode}
            opacity={ghostMode ? 0.6 : 1}
            polygonOffset={true}
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        )}
      </mesh>
      {/* Edges for visual clarity - renderOrder=2 above planks */}
      <lineSegments renderOrder={2}>
        <edgesGeometry args={[new THREE.BoxGeometry(lenX, lenZ, lenY)]} />
        <lineBasicMaterial color="#555555" transparent opacity={ghostMode ? 0.3 : 0.5} />
      </lineSegments>
    </group>
  );
};

// ============================================
// PLANK TEXTURED MATERIAL
// Loads and applies laminate texture to mesh
// Shows loading indicator and handles errors gracefully
// ============================================

interface PlankTexturedMaterialProps {
  textureUrl: string;
  fallbackColor: string;
  ghostMode: boolean;
  laminateCode?: string;
}

const PlankTexturedMaterial: React.FC<PlankTexturedMaterialProps> = ({ 
  textureUrl, 
  fallbackColor, 
  ghostMode,
  laminateCode 
}) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  useEffect(() => {
    if (!textureUrl) {
      setTexture(null);
      setLoadState('idle');
      return;
    }

    // Start loading
    setLoadState('loading');
    console.log(`[PlankTexture] Starting load for ${laminateCode || 'unknown'}:`, textureUrl);

    // Dynamic import to avoid SSR issues
    import('@/lib/visualiser/laminateTextureService').then(({ LaminateTextureCache }) => {
      const code = laminateCode || textureUrl;
      LaminateTextureCache.loadTexture(code, textureUrl)
        .then((loadedTexture) => {
          if (loadedTexture) {
            console.log(`[PlankTexture] ✓ Texture loaded for ${code}`);
            setTexture(loadedTexture);
            setLoadState('loaded');
          } else {
            console.warn(`[PlankTexture] ✗ No texture returned for ${code}`);
            setLoadState('error');
          }
        })
        .catch((err) => {
          console.error(`[PlankTexture] ✗ Load error for ${code}:`, err);
          setLoadState('error');
        });
    });
  }, [textureUrl, laminateCode]);

  // Successfully loaded texture - display with full detail
  // polygonOffset prevents z-fighting when planks overlap at corners/edges
  if (texture && loadState === 'loaded') {
    return (
      <meshStandardMaterial
        map={texture}
        transparent={ghostMode}
        opacity={ghostMode ? 0.6 : 1}
        roughness={0.6}
        metalness={0.05}
        envMapIntensity={0.3}
        polygonOffset={true}
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    );
  }

  // Loading state - show semi-transparent color
  if (loadState === 'loading') {
    return (
      <meshLambertMaterial 
        color="#E0D4C8"
        transparent
        opacity={0.7}
        polygonOffset={true}
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    );
  }

  // Error state or fallback - show base color
  return (
    <meshLambertMaterial 
      color={fallbackColor} 
      transparent={ghostMode}
      opacity={ghostMode ? 0.6 : 1}
      polygonOffset={true}
      polygonOffsetFactor={-1}
      polygonOffsetUnits={-1}
    />
  );
};


// ============================================
// HELPER FUNCTIONS
// ============================================

function generateDefaultPlanks(box: Box): Plank[] {
  const w = box.dimensions.lenX;
  const d = box.dimensions.lenY;
  const h = box.dimensions.lenZ;
  const t = box.carcusThickness || 18;
  const backT = box.backplankThickness || 6;
  const skirting = box.skirting || 0;

  const planks: Plank[] = [];
  // Use LOCAL coordinates (relative to box origin at 0,0,0)
  // Planks are rendered as children of the box group
  const baseX = 0;
  const baseY = 0;
  const baseZ = 0;

  // Left panel
  planks.push({
    id: 'left',
    entityName: 'Left Panel',
    material: 'Plywood',
    materialColor: '#D4A574',
    thickness: t,
    position: { x: baseX, y: baseY, z: baseZ + skirting },
    dimensions: { lenX: t, lenY: d, lenZ: h - skirting },
    role: 'left',
    explodeDirection: { x: -1, y: 0, z: 0 },
    assemblyDirection: { arrow: '→', text: 'Insert from left' },
    isDoor: false,
    assemblyOrder: 1,
    autoGenerated: true,
  });

  // Right panel
  planks.push({
    id: 'right',
    entityName: 'Right Panel',
    material: 'Plywood',
    materialColor: '#D4A574',
    thickness: t,
    position: { x: baseX + w - t, y: baseY, z: baseZ + skirting },
    dimensions: { lenX: t, lenY: d, lenZ: h - skirting },
    role: 'right',
    explodeDirection: { x: 1, y: 0, z: 0 },
    assemblyDirection: { arrow: '←', text: 'Insert from right' },
    isDoor: false,
    assemblyOrder: 2,
    autoGenerated: true,
  });

  // Top panel
  planks.push({
    id: 'top',
    entityName: 'Top Panel',
    material: 'Plywood',
    materialColor: '#D4A574',
    thickness: t,
    position: { x: baseX + t, y: baseY, z: baseZ + h - t },
    dimensions: { lenX: w - t * 2, lenY: d, lenZ: t },
    role: 'top',
    explodeDirection: { x: 0, y: 0, z: 1 },
    assemblyDirection: { arrow: '↓', text: 'Place on top' },
    isDoor: false,
    assemblyOrder: 3,
    autoGenerated: true,
  });

  // Bottom panel
  planks.push({
    id: 'bottom',
    entityName: 'Bottom Panel',
    material: 'Plywood',
    materialColor: '#D4A574',
    thickness: t,
    position: { x: baseX + t, y: baseY, z: baseZ + skirting },
    dimensions: { lenX: w - t * 2, lenY: d, lenZ: t },
    role: 'bottom',
    explodeDirection: { x: 0, y: 0, z: -1 },
    assemblyDirection: { arrow: '↑', text: 'Place at bottom' },
    isDoor: false,
    assemblyOrder: 4,
    autoGenerated: true,
  });

  // Back panel
  planks.push({
    id: 'back',
    entityName: 'Back Panel',
    material: 'Plywood 6mm',
    materialColor: '#A08060',
    thickness: backT,
    position: { x: baseX + t, y: baseY + d - backT, z: baseZ + skirting + t },
    dimensions: { lenX: w - t * 2, lenY: backT, lenZ: h - skirting - t * 2 },
    role: 'back',
    explodeDirection: { x: 0, y: 1, z: 0 },
    assemblyDirection: { arrow: '←', text: 'Slide in from back' },
    isDoor: false,
    assemblyOrder: 5,
    autoGenerated: true,
  });

  // Skirting
  if (skirting > 0) {
    planks.push({
      id: 'skirting',
      entityName: 'Skirting',
      material: 'Plywood',
      materialColor: '#C9A066',
      thickness: t,
      position: { x: baseX, y: baseY, z: baseZ },
      dimensions: { lenX: w, lenY: box.skirtingWidth || 100, lenZ: skirting },
      role: 'skirting',
      explodeDirection: { x: 0, y: -1, z: 0 },
      assemblyDirection: { arrow: '↑', text: 'Attach at base' },
      isDoor: false,
      assemblyOrder: 6,
      autoGenerated: true,
    });
  }

  return planks;
}

function getMaterialColor(material: string): string {
  if (!material) return '#D4A574';
  
  const m = material.toLowerCase();
  if (m.includes('white') || m.includes('inner')) return '#F5F5F5';
  if (m.includes('oak') || m.includes('walnut')) return '#8B7355';
  if (m.includes('maple')) return '#FFCC99';
  if (m.includes('cherry')) return '#B5651D';
  if (m.includes('grey') || m.includes('gray')) return '#808080';
  if (m.includes('black')) return '#333333';
  if (m.includes('6mm') || m.includes('6 mm')) return '#A08060';
  
  return '#D4A574';
}

// ============================================
// MOVE INPUT BOX CONTEXT
// Allows BoxMesh to communicate with the MoveInputBox
// ============================================

interface MoveInputContextType {
  applyNumericInput: ((input: string) => boolean) | null;
  setApplyNumericInput: (fn: ((input: string) => boolean) | null) => void;
  startPosition: Position | null;
  setStartPosition: (pos: Position | null) => void;
  lockedAxis: 'x' | 'y' | 'z' | null;
  setLockedAxis: (axis: 'x' | 'y' | 'z' | null) => void;
  ghostPosition: Position | null;
  setGhostPosition: (pos: Position | null) => void;
}

const MoveInputContext = createContext<MoveInputContextType>({
  applyNumericInput: null,
  setApplyNumericInput: () => {},
  startPosition: null,
  setStartPosition: () => {},
  lockedAxis: null,
  setLockedAxis: () => {},
  ghostPosition: null,
  setGhostPosition: () => {},
});

const useMoveInput = () => useContext(MoveInputContext);

// ============================================
// MOVE INPUT BOX COMPONENT
// Shows distance moved and accepts numeric input
// Supports two modes:
// 1. Drag mode: Shows distance while dragging
// 2. Click mode: Arrow keys select axis, type value to move
// ============================================

interface MoveInputBoxProps {
  visible: boolean;
  isDragging?: boolean;
}

const MoveInputBox: React.FC<MoveInputBoxProps> = ({ visible, isDragging = false }) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { applyNumericInput, startPosition, lockedAxis, ghostPosition, setLockedAxis } = useMoveInput();

  // Calculate current distance moved (only relevant during drag)
  const distance = useMemo(() => {
    if (!startPosition || !ghostPosition) return { total: 0, x: 0, y: 0, z: 0 };
    const dx = ghostPosition.x - startPosition.x;
    const dy = ghostPosition.y - startPosition.y;
    const dz = ghostPosition.z - startPosition.z;
    return {
      total: Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz)),
      x: Math.round(dx),
      y: Math.round(dy),
      z: Math.round(dz),
    };
  }, [startPosition, ghostPosition]);

  // Handle arrow keys for axis selection (click mode) and numeric input capture
  useEffect(() => {
    if (!visible) {
      setInputValue('');
      setIsFocused(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys if typing in an input field (except arrow keys for axis selection)
      const target = e.target as HTMLElement;
      const isTypingInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      // Arrow keys for axis selection (works even when not focused on input)
      // Only in click mode (not dragging) - during drag, axis lock is handled by useDragInteraction
      if (!isDragging && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        
        let newAxis: 'x' | 'y' | 'z';
        switch (e.key) {
          case 'ArrowLeft':
          case 'ArrowRight':
            newAxis = 'x';
            break;
          case 'ArrowUp':
            newAxis = 'z';
            break;
          case 'ArrowDown':
            newAxis = 'y';
            break;
          default:
            return;
        }
        
        // Toggle axis if same key pressed again, otherwise set new axis
        if (lockedAxis === newAxis) {
          setLockedAxis(null);
          console.log('[MoveInput] Axis unlocked');
        } else {
          setLockedAxis(newAxis);
          console.log(`[MoveInput] Axis set to ${newAxis.toUpperCase()}`);
        }
        
        // Focus the input after selecting axis
        setTimeout(() => inputRef.current?.focus(), 0);
        return;
      }
      
      // Capture numeric keys, minus, comma, brackets (for typing distance)
      if (/^[\d\-,.\[\]]$/.test(e.key) && !isFocused && !isTypingInInput) {
        e.preventDefault();
        setInputValue(e.key);
        setIsFocused(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [visible, isFocused, isDragging, lockedAxis, setLockedAxis]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (applyNumericInput && inputValue.trim()) {
      const success = applyNumericInput(inputValue);
      if (success) {
        setInputValue('');
        // Keep focused for multiple inputs
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  if (!visible) return null;

  // Get axis color
  const getAxisColor = (axis: 'x' | 'y' | 'z' | null) => {
    switch (axis) {
      case 'x': return 'text-red-400';
      case 'y': return 'text-green-400';
      case 'z': return 'text-blue-400';
      default: return 'text-gray-300';
    }
  };
  
  const getAxisBgColor = (axis: 'x' | 'y' | 'z' | null) => {
    switch (axis) {
      case 'x': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'y': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'z': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default: return 'bg-gray-700 text-gray-400 border-gray-600';
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-2 shadow-xl">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          {/* Axis selection buttons (click mode) */}
          {!isDragging && (
            <>
              <div className="flex items-center gap-1">
                <span className="text-gray-400 text-xs mr-1">Axis:</span>
                <button
                  type="button"
                  onClick={() => setLockedAxis(lockedAxis === 'x' ? null : 'x')}
                  className={`px-2 py-0.5 text-xs font-bold rounded border transition-colors ${
                    lockedAxis === 'x' ? 'bg-red-500/30 text-red-400 border-red-500' : 'bg-gray-800 text-gray-400 border-gray-600 hover:border-red-500/50'
                  }`}
                  title="X axis (Left/Right arrows)"
                >
                  X
                </button>
                <button
                  type="button"
                  onClick={() => setLockedAxis(lockedAxis === 'y' ? null : 'y')}
                  className={`px-2 py-0.5 text-xs font-bold rounded border transition-colors ${
                    lockedAxis === 'y' ? 'bg-green-500/30 text-green-400 border-green-500' : 'bg-gray-800 text-gray-400 border-gray-600 hover:border-green-500/50'
                  }`}
                  title="Y axis (Down arrow)"
                >
                  Y
                </button>
                <button
                  type="button"
                  onClick={() => setLockedAxis(lockedAxis === 'z' ? null : 'z')}
                  className={`px-2 py-0.5 text-xs font-bold rounded border transition-colors ${
                    lockedAxis === 'z' ? 'bg-blue-500/30 text-blue-400 border-blue-500' : 'bg-gray-800 text-gray-400 border-gray-600 hover:border-blue-500/50'
                  }`}
                  title="Z axis (Up arrow)"
                >
                  Z
                </button>
              </div>
              <div className="w-px h-4 bg-gray-700" />
            </>
          )}
          
          {/* Distance display (drag mode only) */}
          {isDragging && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Distance:</span>
                <span className={`font-mono font-bold ${lockedAxis ? getAxisColor(lockedAxis) : 'text-white'}`}>
                  {lockedAxis ? Math.abs(distance[lockedAxis]) : distance.total}mm
                </span>
                {!lockedAxis && distance.total > 0 && (
                  <span className="text-gray-500 text-xs">
                    (<span className="text-red-400">X:{distance.x}</span>, 
                    <span className="text-green-400">Y:{distance.y}</span>, 
                    <span className="text-blue-400">Z:{distance.z}</span>)
                  </span>
                )}
                {lockedAxis && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${getAxisBgColor(lockedAxis)}`}>
                    {lockedAxis.toUpperCase()} locked
                  </span>
                )}
              </div>
              <div className="w-px h-4 bg-gray-700" />
            </>
          )}

          {/* Input field */}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={handleBlur}
              placeholder={lockedAxis ? `Move ${lockedAxis.toUpperCase()}...` : 'Select axis first'}
              disabled={!isDragging && !lockedAxis}
              className={`w-32 border rounded px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none font-mono ${
                lockedAxis 
                  ? `bg-gray-800 border-gray-600 focus:border-orange-500` 
                  : 'bg-gray-900 border-gray-700 cursor-not-allowed'
              }`}
            />
            <button
              type="submit"
              disabled={!lockedAxis && !isDragging}
              className={`px-2 py-1 text-white text-sm rounded transition-colors ${
                lockedAxis || isDragging
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-gray-700 cursor-not-allowed'
              }`}
            >
              Apply
            </button>
          </div>

          {/* Help text */}
          <span className="text-gray-500 text-xs">
            {isDragging ? 'Enter: mm | x,y | x,y,z' : '← → X | ↑ Z | ↓ Y'}
          </span>
        </form>
      </div>
    </div>
  );
};

// ============================================
// MAIN CANVAS COMPONENT
// ============================================

export const Canvas3D: React.FC = () => {
  // Get store state for move tool visibility
  const { designMode, selectedBoxId, moveBox, walls } = useDesignerStore();
  
  // State to track if any box is being dragged (for camera lock)
  const [isDragging, setIsDragging] = useState(false);
  
  // Move input context state
  const [applyNumericInput, setApplyNumericInputState] = useState<((input: string) => boolean) | null>(null);
  const [moveStartPosition, setMoveStartPosition] = useState<Position | null>(null);
  const [moveLockedAxis, setMoveLockedAxis] = useState<'x' | 'y' | 'z' | null>(null);
  const [moveGhostPosition, setMoveGhostPosition] = useState<Position | null>(null);
  
  // Get the selected box for input-based movement
  const selectedBox = useMemo(() => {
    if (!selectedBoxId) return null;
    for (const wall of walls) {
      const box = wall.boxes.find(b => b.id === selectedBoxId);
      if (box) return box;
    }
    return null;
  }, [selectedBoxId, walls]);
  
  // Function to apply input-based movement (when not dragging)
  const applyInputMovement = useCallback((input: string): boolean => {
    if (!selectedBox || !moveLockedAxis) {
      console.log('[MoveInput] Cannot apply: no box selected or no axis locked');
      return false;
    }
    
    // Parse the input value
    const value = parseFloat(input);
    if (isNaN(value)) {
      console.log('[MoveInput] Invalid input:', input);
      return false;
    }
    
    // Calculate new position
    const newPosition = { ...selectedBox.position };
    newPosition[moveLockedAxis] += value;
    
    // Apply floor constraint for Z axis
    if (moveLockedAxis === 'z') {
      newPosition.z = Math.max(0, newPosition.z);
    }
    
    // Apply the movement
    moveBox(selectedBoxId!, newPosition);
    console.log(`[MoveInput] Moved box ${moveLockedAxis.toUpperCase()} by ${value}mm to`, newPosition);
    
    return true;
  }, [selectedBox, moveLockedAxis, selectedBoxId, moveBox]);
  
  const cameraLockValue = useMemo(() => ({
    isDragging,
    setIsDragging,
  }), [isDragging]);

  const moveInputValue = useMemo(() => ({
    applyNumericInput: isDragging ? applyNumericInput : applyInputMovement,
    setApplyNumericInput: setApplyNumericInputState,
    startPosition: moveStartPosition,
    setStartPosition: setMoveStartPosition,
    lockedAxis: moveLockedAxis,
    setLockedAxis: setMoveLockedAxis,
    ghostPosition: moveGhostPosition,
    setGhostPosition: setMoveGhostPosition,
  }), [applyNumericInput, applyInputMovement, isDragging, moveStartPosition, moveLockedAxis, moveGhostPosition]);

  // Show move input when: dragging OR (move tool active AND box selected)
  const showMoveInput = isDragging || (designMode === 'move' && selectedBoxId !== null);

  return (
    <div className="w-full h-full relative">
      <CameraLockContext.Provider value={cameraLockValue}>
        <MoveInputContext.Provider value={moveInputValue}>
          <Canvas
            camera={{
              fov: 45,
              near: 1,
              far: 100000,
              position: [2000, 1500, 2000],
            }}
            shadows
            gl={{ antialias: true }}
          >
            <Scene />
          </Canvas>
          
          {/* Move Input Box - visible when move tool active with selection OR during drag */}
          <MoveInputBox visible={showMoveInput} isDragging={isDragging} />
        </MoveInputContext.Provider>
      </CameraLockContext.Provider>
    </div>
  );
};
