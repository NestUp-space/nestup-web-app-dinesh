'use client';

import React, { useRef, useEffect, useMemo, useCallback, useState, createContext, useContext } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useDesignerStore } from '@/store/designerStore';
import { Wall, Box, Plank, DesignMode } from '@/types/visualiser';
import { Guidelines } from './Guidelines';
import { MeasurementVisuals } from './MeasurementVisuals';
import { MeasurementOverlay, MeasurementScreenOverlay } from './MeasurementOverlay';
import { useMeasurementTool } from '@/hooks/useMeasurementTool';
import { MoveToolIntegration, MoveToolScreenOverlay as MoveToolOverlay } from './MoveToolIntegration';
import { ScreenTip } from './ScreenTip';
import { TOOL_CURSORS } from './toolCursors';

// ============================================
// WEBGL SUPPORT & FALLBACK (e.g. Cursor Simple Browser)
// ============================================

function supportsWebGL(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    return !!gl;
  } catch {
    return false;
  }
}

const WebGLFallback: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-center p-8">
    <div className="max-w-md">
      <p className="text-lg font-medium text-gray-800 mb-2">3D view needs WebGL</p>
      <p className="text-sm text-gray-600 mb-4">
        This browser or tab cannot create a WebGL context. Open the designer in a full browser (Chrome, Edge, or Firefox) for the 3D view.
      </p>
      <a
        href={typeof window !== 'undefined' ? window.location.href : '/visualiser/designer'}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
      >
        Open in new window
      </a>
    </div>
  </div>
);

class WebGLErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  componentDidCatch(error: Error): void {
    console.warn('[Canvas3D] WebGL error caught:', error.message);
  }
  render(): React.ReactNode {
    if (this.state.hasError) return <WebGLFallback />;
    return this.props.children;
  }
}

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

/** Colors for wall features (switchboard, window, door) on the 3D wall */
const WALL_FEATURE_COLORS: Record<string, string> = {
  switchboard: '#EAB308',
  window: '#3B82F6',
  door: '#22C55E',
};
const WALL_FEATURE_DEPTH_MM = 25;
const WALL_FEATURE_DEFAULT_SIZE_MM = 200;
const SWITCHBOARD_PANEL_DEPTH_MM = 18;
const SWITCHBOARD_OUTLET_W_MM = 40;
const SWITCHBOARD_OUTLET_H_MM = 60;
const SWITCHBOARD_OUTLET_DEPTH_MM = 12;
const WINDOW_FRAME_WIDTH_MM = 50;
const WINDOW_GLASS_OPACITY = 0.5;

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

function shouldLockCamera(designMode: DesignMode): boolean {
  if (designMode === 'guidelines') return true;
  if (designMode === 'move') return true;
  return false;
}

// ============================================
// MEASUREMENT TOOL VISUALS
// Renders tape measure tool visuals and handles measurement interactions
// ============================================
const MeasurementToolVisuals: React.FC = () => {
  const { camera, gl, size } = useThree();
  const { designMode, selectMeasureGuide, clearMeasurementHistory } = useDesignerStore();
  const { 
    state, 
    handlers, 
    measurementHistory, 
    measureGuideLines, 
    measureGuidePoints, 
    measureGuidesVisible 
  } = useMeasurementTool();
  
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  
  const isMeasureMode = designMode === 'measure';
  
  // Set up event listeners for measurement tool
  useEffect(() => {
    if (!isMeasureMode) return;
    
    const raycaster = raycasterRef.current;
    const canvasEl = gl.domElement;
    
    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvasEl.getBoundingClientRect();
      pointerRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerRef.current, camera);
      
      handlers.handlePointerMove(e, raycaster, camera, { width: size.width, height: size.height });
    };
    
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest?.('form') || target?.closest?.('button') || target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
        return;
      }
      
      const rect = canvasEl.getBoundingClientRect();
      pointerRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerRef.current, camera);
      
      handlers.handlePointerDown(e, raycaster, camera, { width: size.width, height: size.height });
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      handlers.handleKeyDown(e);
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      handlers.handleKeyUp(e);
    };
    
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // SketchUp-like tape cursor
    canvasEl.style.cursor = state.mode === 'guide_create' ? TOOL_CURSORS.tapeGuide : TOOL_CURSORS.tapeMeasure;
    
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      canvasEl.style.cursor = 'default';
    };
  }, [isMeasureMode, camera, gl, size, handlers]);
  
  if (!isMeasureMode) return null;
  
  return (
    <>
      {/* Three.js visuals */}
      <MeasurementVisuals
        startPoint={state.startPoint}
        currentPoint={state.currentPoint}
        snapPoint={state.snapPoint}
        measureGuideLines={measureGuideLines}
        measureGuidePoints={measureGuidePoints}
        measureGuidesVisible={measureGuidesVisible}
        selectedGuideId={useDesignerStore.getState().selectedMeasureGuideId}
        nearestEdge={state.nearestEdge}
        clickedEdge={state.clickedEdge}
        mode={state.mode}
        onSelectGuide={selectMeasureGuide}
      />
      
      {/* HTML overlay for measurement labels */}
      <MeasurementOverlay
        mode={state.mode}
        isActive={state.isActive}
        startPoint={state.startPoint}
        currentPoint={state.currentPoint}
        distance={state.currentDistance}
        dominantAxis={state.dominantAxis}
        measurementAxisLock={state.measurementAxisLock}
        hoverInfo={state.hoverInfo}
        snapPoint={state.snapPoint}
        isCtrlPressed={state.isCtrlPressed}
        measurements={measurementHistory}
        guideOffset={state.guideOffset}
        onSetGuideOffset={handlers.setGuideOffset}
        onFinishGuide={handlers.finishGuideWithOffset}
        onClearHistory={clearMeasurementHistory}
        cursorScreenPosition={state.cursorScreenPosition}
      />
    </>
  );
};

// ============================================
// MEASUREMENT TOOL SCREEN OVERLAY
// Screen-space UI for measurement tool (mode indicator, history panel)
// ============================================
const MeasurementToolScreenOverlay: React.FC = () => {
  const { designMode, measurementMode, measurementHistory, clearMeasurementHistory } = useDesignerStore();
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  
  const isMeasureMode = designMode === 'measure';
  
  useEffect(() => {
    if (!isMeasureMode) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(false);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMeasureMode]);
  
  if (!isMeasureMode) return null;
  
  return (
    <MeasurementScreenOverlay
      mode={measurementMode}
      isActive={isMeasureMode}
      isCtrlPressed={isCtrlPressed}
      measurements={measurementHistory}
      onClearHistory={clearMeasurementHistory}
    />
  );
};

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
    rotateBox,
  } = useDesignerStore();

  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  
  const cameraLocked = shouldLockCamera(designMode);
  const isMoveTool = designMode === 'move';
  const isMeasureTool = designMode === 'measure';
  const controlsEnabled = !cameraLocked;

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
          onRotateBox={rotateBox}
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

      {/* Measurement Tool Visuals */}
      <MeasurementToolVisuals />

      {/* Move Tool Visuals (drag ghost, snap indicators, inference points) */}
      <MoveToolIntegration />

      {/* OrbitControls */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={controlsEnabled || isMoveTool || isMeasureTool}
        enableDamping={false}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        zoomToCursor
        minDistance={100}
        maxDistance={50000}
        mouseButtons={{
          LEFT: (isMoveTool || isMeasureTool) ? undefined : (controlsEnabled ? THREE.MOUSE.PAN : undefined),
          MIDDLE: THREE.MOUSE.ROTATE,
          RIGHT: THREE.MOUSE.PAN,
        }}
        target={[0, 0, 0]}
      />
    </>
  );
};

// ============================================
// WALL FEATURE MESH (switchboard, door, window)
// ============================================

interface WallFeatureMeshProps {
  type: string;
  w: number;
  h: number;
  d: number;
}

const WallFeatureMesh: React.FC<WallFeatureMeshProps> = ({ type, w, h, d }) => {
  const color = WALL_FEATURE_COLORS[type] ?? '#9CA3AF';

  if (type === 'switchboard') {
    const panelD = SWITCHBOARD_PANEL_DEPTH_MM;
    const outW = SWITCHBOARD_OUTLET_W_MM;
    const outH = SWITCHBOARD_OUTLET_H_MM;
    const outD = SWITCHBOARD_OUTLET_DEPTH_MM;
    const outZ = panelD / 2 + outD / 2;
    const numOutlets = w > 200 ? 3 : 2;
    const step = numOutlets > 1 ? (w - outW) / (numOutlets - 1) : 0;
    const startX = -w / 2 + outW / 2;
    return (
      <group>
        <mesh>
          <boxGeometry args={[w, h, panelD]} />
          <meshLambertMaterial color={color} />
        </mesh>
        {Array.from({ length: numOutlets }, (_, i) => (
          <mesh key={i} position={[startX + i * step, 0, outZ]}>
            <boxGeometry args={[outW, outH, outD]} />
            <meshLambertMaterial color="#374151" />
          </mesh>
        ))}
      </group>
    );
  }

  if (type === 'door') {
    return (
      <group>
        <mesh>
          <boxGeometry args={[w, h, d]} />
          <meshLambertMaterial color={color} />
        </mesh>
      </group>
    );
  }

  if (type === 'window') {
    const fw = WINDOW_FRAME_WIDTH_MM;
    const innerW = Math.max(20, w - fw * 2);
    const innerH = Math.max(20, h - fw * 2);
    return (
      <group>
        <mesh>
          <boxGeometry args={[w, h, d]} />
          <meshLambertMaterial color={color} />
        </mesh>
        <mesh position={[0, 0, d / 2 + 2]}>
          <planeGeometry args={[innerW, innerH]} />
          <meshLambertMaterial color="#93C5FD" transparent opacity={WINDOW_GLASS_OPACITY} side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }

  return (
    <mesh>
      <boxGeometry args={[w, h, d]} />
      <meshLambertMaterial color={color} />
    </mesh>
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
  onRotateBox: (id: string, degrees: number) => void;
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
  onRotateBox,
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

      {/* Wall features (switchboards, windows, doors) from measurement */}
      {wall.wallFeatures?.map((f, i) => {
        const x = f.x_mm ?? 0;
        let z = f.y_mm ?? 0;
        const w = f.width_mm ?? WALL_FEATURE_DEFAULT_SIZE_MM;
        const h = f.height_mm ?? WALL_FEATURE_DEFAULT_SIZE_MM;
        const d = WALL_FEATURE_DEPTH_MM;
        if (z + h > wallHeight) {
          z = Math.max(0, wallHeight - h - z);
        }
        const centerX = wallPosX + x + w / 2;
        const centerY = wallPosY + d / 2;
        const centerZ = wallPosZ + z + h / 2;
        const pos = dataToThree(centerX, centerY, centerZ);
        return (
          <group key={i} position={pos}>
            <WallFeatureMesh type={f.type} w={w} h={h} d={d} />
          </group>
        );
      })}

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
          isSelected={box.id === selectedBoxId}
          showLabels={showLabels}
          designMode={designMode}
          onSelect={() => onSelectBox(box.id)}
          onRotate={(deg) => onRotateBox(box.id, deg)}
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
  isSelected: boolean;
  showLabels: boolean;
  designMode: string;
  onSelect: () => void;
  onRotate: (degrees: number) => void;
}

const BoxMesh: React.FC<BoxMeshProps> = ({
  box,
  isSelected,
  showLabels,
  designMode,
  onSelect,
  onRotate,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  const boxWidth = box.dimensions.lenX;
  const boxDepth = box.dimensions.lenY;
  const boxHeight = box.dimensions.lenZ;

  const boxGroupPos = dataToThree(box.position.x, box.position.y, box.position.z);
  const rotationY = box.rotZ ? THREE.MathUtils.degToRad(box.rotZ) : 0;

  const planks = useMemo(() => {
    if (box.planks && box.planks.length > 0) {
      return box.planks;
    }
    return generateDefaultPlanks(box);
  }, [box]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect();
    if (designMode === 'move') {
      window.dispatchEvent(new CustomEvent('move-tool-start-request', { detail: { boxId: box.id } }));
    }
  }, [onSelect, designMode, box.id]);

  const handleDoubleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (designMode === 'rotate') {
      onRotate(90);
    }
  }, [designMode, onRotate]);

  const boundingBoxCenter = dataToThree(
    boxWidth / 2,
    boxDepth / 2,
    boxHeight / 2
  );

  const ghostOpacity = isSelected ? 0.15 : 0.02;

  return (
    <group 
      ref={groupRef} 
      position={boxGroupPos} 
      rotation={[0, rotationY, 0]}
    >
      <mesh
        position={boundingBoxCenter}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        renderOrder={10}
      >
        <boxGeometry args={[boxWidth, boxHeight, boxDepth]} />
        <meshBasicMaterial
          color={isSelected ? '#FF6B00' : '#666666'}
          transparent
          opacity={ghostOpacity}
          wireframe={!isSelected}
          depthWrite={false}
        />
      </mesh>

      {isSelected && (
        <lineSegments position={boundingBoxCenter} renderOrder={11}>
          <edgesGeometry args={[new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth)]} />
          <lineBasicMaterial color="#FF6B00" linewidth={2} />
        </lineSegments>
      )}

      {planks.map((plank, i) => (
        <PlankMeshDirect
          key={plank.id || i}
          plank={plank}
        />
      ))}

      {showLabels && (
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
            {box.entityName || box.boxModel}
          </div>
        </Html>
      )}
    </group>
  );
};

// ============================================
// PLANK MESH DIRECT (matches Apps Script createPlank)
// Position is directly from plank.position (min corner)
// Supports laminate texture mapping for 3D visualization
// ============================================

interface PlankMeshDirectProps {
  plank: Plank;
}

const PlankMeshDirect: React.FC<PlankMeshDirectProps> = ({ plank }) => {
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
      <mesh castShadow receiveShadow renderOrder={1}>
        <boxGeometry args={[lenX, lenZ, lenY]} />
        {textureUrl ? (
          <PlankTexturedMaterial 
            textureUrl={textureUrl} 
            fallbackColor={color}
            laminateCode={plank.laminateCode}
          />
        ) : (
          <meshLambertMaterial 
            color={color} 
            polygonOffset={true}
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        )}
      </mesh>
      <lineSegments renderOrder={2}>
        <edgesGeometry args={[new THREE.BoxGeometry(lenX, lenZ, lenY)]} />
        <lineBasicMaterial color="#555555" transparent opacity={0.5} />
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
  laminateCode?: string;
}

const PlankTexturedMaterial: React.FC<PlankTexturedMaterialProps> = ({ 
  textureUrl, 
  fallbackColor, 
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

// Move tool reconnected via MoveToolIntegration component

// ============================================
// MAIN CANVAS COMPONENT
// ============================================

export const Canvas3D: React.FC = () => {
  const [webGLOk, setWebGLOk] = useState<boolean | null>(null);

  useEffect(() => {
    setWebGLOk(supportsWebGL());
  }, []);

  const [isDragging, setIsDragging] = useState(false);
  
  const cameraLockValue = useMemo(() => ({
    isDragging,
    setIsDragging,
  }), [isDragging]);

  if (webGLOk === false) {
    return <WebGLFallback />;
  }
  if (webGLOk === null) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading 3D…</p>
      </div>
    );
  }

  return (
    <WebGLErrorBoundary>
      <div className="w-full h-full relative">
        <CameraLockContext.Provider value={cameraLockValue}>
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

          {/* Measurement Tool Screen Overlay (mode indicator, history panel) */}
          <MeasurementToolScreenOverlay />

          {/* Move Tool Screen Overlay (VCB input, status) */}
          <MoveToolOverlay />

          {/* ScreenTip (inference tooltip near cursor) */}
          <ScreenTip />
        </CameraLockContext.Provider>
      </div>
    </WebGLErrorBoundary>
  );
};
