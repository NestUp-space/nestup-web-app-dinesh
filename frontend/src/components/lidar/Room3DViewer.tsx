"use client";

/**
 * Room 3D Viewer Component
 * Interactive 3D visualization of scanned rooms with wall and module placement
 * Based on CabinetDesigner.tsx patterns
 */

import React, { useRef, useState, useCallback, Suspense, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  PerspectiveCamera,
  Text,
  Line,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import {
  Wall,
  PlacedModule,
  RoomDimensions,
  FloorPlanData,
  ViewMode,
  EditMode,
} from "@/types/lidar";

// ============================================
// State Types
// ============================================

interface RoomViewerState {
  walls: Wall[];
  placedModules: PlacedModule[];
  selectedWallId: string | null;
  selectedModuleId: string | null;
  editMode: EditMode;
  viewMode: ViewMode;
  showGrid: boolean;
  showDimensions: boolean;
  roomDimensions: RoomDimensions | null;
}

interface Room3DViewerProps {
  walls: Wall[];
  placedModules?: PlacedModule[];
  roomDimensions?: RoomDimensions | null;
  floorPlan?: FloorPlanData | null;
  onWallSelect?: (wallId: string | null) => void;
  onModuleSelect?: (moduleId: string | null) => void;
  onModulePlace?: (wallId: string, position: { x: number; y: number; z: number }) => void;
}

// ============================================
// 3D Components
// ============================================

interface WallMeshProps {
  wall: Wall;
  isSelected: boolean;
  showDimensions: boolean;
  onClick: () => void;
}

function WallMesh({ wall, isSelected, showDimensions, onClick }: WallMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Calculate wall position and dimensions
  const centerX = (wall.startPoint.x + wall.endPoint.x) / 2;
  const centerY = (wall.startPoint.y + wall.endPoint.y) / 2;
  const wallHeight = wall.height || 2800;
  const wallThickness = 100; // 100mm wall thickness

  // Calculate wall angle
  const angle = Math.atan2(
    wall.endPoint.y - wall.startPoint.y,
    wall.endPoint.x - wall.startPoint.x
  );

  // Convert to Three.js coordinates (Y is up, Z is into screen)
  const position: [number, number, number] = [
    centerX,
    wallHeight / 2,
    -centerY,
  ];

  return (
    <group position={position} rotation={[0, -angle, 0]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
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
        <boxGeometry args={[wall.length, wallHeight, wallThickness]} />
        <meshStandardMaterial
          color={isSelected ? "#4488FF" : "#E8E8E8"}
          transparent
          opacity={isSelected ? 0.9 : 0.7}
          emissive={hovered ? "#4488FF" : "#000000"}
          emissiveIntensity={hovered ? 0.2 : 0}
        />
      </mesh>

      {/* Wall edges */}
      <lineSegments>
        <edgesGeometry
          args={[new THREE.BoxGeometry(wall.length, wallHeight, wallThickness)]}
        />
        <lineBasicMaterial
          color={isSelected ? "#0066FF" : "#666666"}
          transparent
          opacity={0.5}
        />
      </lineSegments>

      {/* Dimension label */}
      {showDimensions && (
        <Text
          position={[0, wallHeight / 2 + 100, wallThickness / 2 + 50]}
          fontSize={80}
          color="#333333"
          anchorX="center"
        >
          {Math.round(wall.length)}mm
        </Text>
      )}

      {/* Wall index label */}
      <Html
        position={[0, wallHeight + 100, 0]}
        center
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
            isSelected
              ? "bg-blue-500 text-white"
              : "bg-white/90 text-gray-800"
          }`}
        >
          Wall {wall.wallIndex + 1}
        </div>
      </Html>
    </group>
  );
}

interface ModuleMeshProps {
  module: PlacedModule;
  isSelected: boolean;
  onClick: () => void;
}

function ModuleMesh({ module, isSelected, onClick }: ModuleMeshProps) {
  const [hovered, setHovered] = useState(false);

  // Convert to Three.js coordinates
  const position: [number, number, number] = [
    module.position.x,
    module.position.z + module.dimensions.height / 2,
    -module.position.y,
  ];

  const size: [number, number, number] = [
    module.dimensions.width,
    module.dimensions.height,
    module.dimensions.depth,
  ];

  // Module color based on category
  const color = isSelected ? "#FF6B6B" : "#C4A77D";

  return (
    <group position={position} rotation={[0, (module.rotation * Math.PI) / 180, 0]}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
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
          opacity={isSelected ? 1 : 0.85}
          emissive={isSelected ? "#FF6B6B" : hovered ? "#B89A6D" : "#000000"}
          emissiveIntensity={isSelected ? 0.3 : hovered ? 0.2 : 0}
        />
      </mesh>

      {/* Module edges */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
        <lineBasicMaterial
          color={isSelected ? "#FF0000" : "#8B7355"}
          transparent
          opacity={0.7}
        />
      </lineSegments>

      {/* Module label */}
      <Html
        position={[0, size[1] / 2 + 50, 0]}
        center
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
            isSelected
              ? "bg-red-500 text-white"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {module.template?.name || "Module"}
        </div>
      </Html>
    </group>
  );
}

interface FloorMeshProps {
  floorPlan: FloorPlanData | null;
  roomDimensions: RoomDimensions | null;
}

function FloorMesh({ floorPlan, roomDimensions }: FloorMeshProps) {
  if (!roomDimensions) return null;

  const width = roomDimensions.width;
  const depth = roomDimensions.depth;

  return (
    <group>
      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, -depth / 2]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color="#F5F5F5"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floor outline from boundary */}
      {floorPlan?.boundary && floorPlan.boundary.length > 0 && (
        <Line
          points={floorPlan.boundary.map(([x, y]) => [x, 1, -y])}
          color="#333333"
          lineWidth={2}
        />
      )}
    </group>
  );
}

interface SceneProps {
  state: RoomViewerState;
  floorPlan: FloorPlanData | null;
  onWallSelect: (wallId: string | null) => void;
  onModuleSelect: (moduleId: string | null) => void;
}

function Scene({ state, floorPlan, onWallSelect, onModuleSelect }: SceneProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  // Calculate center point for camera target
  const centerX = state.roomDimensions
    ? state.roomDimensions.width / 2
    : 2000;
  const centerZ = state.roomDimensions
    ? -state.roomDimensions.depth / 2
    : -2000;
  const centerY = state.roomDimensions
    ? state.roomDimensions.height / 2
    : 1400;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5000, 8000, 5000]} intensity={0.7} castShadow />
      <directionalLight position={[-3000, 3000, -3000]} intensity={0.3} />
      <hemisphereLight args={["#FFFFFF", "#444444", 0.5]} />

      {/* Camera Controls */}
      <OrbitControls
        ref={controlsRef}
        target={[centerX, centerY, centerZ]}
        enableDamping
        dampingFactor={0.05}
        minDistance={1000}
        maxDistance={20000}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />

      {/* Grid */}
      {state.showGrid && (
        <Grid
          position={[centerX, 0, centerZ]}
          args={[10000, 10000]}
          cellSize={500}
          cellThickness={0.5}
          cellColor="#CCCCCC"
          sectionSize={1000}
          sectionThickness={1}
          sectionColor="#999999"
          fadeDistance={15000}
          fadeStrength={1}
          followCamera={false}
        />
      )}

      {/* Floor */}
      <FloorMesh floorPlan={floorPlan} roomDimensions={state.roomDimensions} />

      {/* Walls */}
      {state.walls.map((wall) => (
        <WallMesh
          key={wall.id}
          wall={wall}
          isSelected={state.selectedWallId === wall.id}
          showDimensions={state.showDimensions}
          onClick={() => onWallSelect(wall.id)}
        />
      ))}

      {/* Placed Modules */}
      {state.placedModules.map((module) => (
        <ModuleMesh
          key={module.id}
          module={module}
          isSelected={state.selectedModuleId === module.id}
          onClick={() => onModuleSelect(module.id)}
        />
      ))}

      {/* Origin axes */}
      <group>
        <Line points={[[0, 0, 0], [1000, 0, 0]]} color="red" lineWidth={2} />
        <Line points={[[0, 0, 0], [0, 1000, 0]]} color="green" lineWidth={2} />
        <Line points={[[0, 0, 0], [0, 0, -1000]]} color="blue" lineWidth={2} />
      </group>
    </>
  );
}

// ============================================
// UI Components
// ============================================

interface ToolbarProps {
  state: RoomViewerState;
  onEditModeChange: (mode: EditMode) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onToggleDimensions: () => void;
  onToggleGrid: () => void;
}

function Toolbar({
  state,
  onEditModeChange,
  onViewModeChange,
  onToggleDimensions,
  onToggleGrid,
}: ToolbarProps) {
  const editModes: { mode: EditMode; icon: string; label: string }[] = [
    { mode: "view", icon: "👁️", label: "View" },
    { mode: "select", icon: "👆", label: "Select" },
    { mode: "place", icon: "📦", label: "Place" },
    { mode: "move", icon: "✥", label: "Move" },
  ];

  const viewModes: { mode: ViewMode; label: string }[] = [
    { mode: "perspective", label: "3D" },
    { mode: "top", label: "Top" },
    { mode: "front", label: "Front" },
    { mode: "right", label: "Right" },
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/95 backdrop-blur px-3 py-2 rounded-xl shadow-lg z-30">
      {/* Edit Modes */}
      <div className="flex gap-1 pr-3 border-r border-gray-200">
        {editModes.map(({ mode, icon, label }) => (
          <button
            key={mode}
            onClick={() => onEditModeChange(mode)}
            title={label}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors ${
              state.editMode === mode
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* View Modes */}
      <div className="flex gap-1 pr-3 border-r border-gray-200">
        {viewModes.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              state.viewMode === mode
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Toggle Options */}
      <div className="flex gap-1">
        <button
          onClick={onToggleDimensions}
          title="Toggle Dimensions"
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors ${
            state.showDimensions
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          📏
        </button>
        <button
          onClick={onToggleGrid}
          title="Toggle Grid"
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors ${
            state.showGrid
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          #
        </button>
      </div>
    </div>
  );
}

interface PropertiesPanelProps {
  state: RoomViewerState;
}

function PropertiesPanel({ state }: PropertiesPanelProps) {
  const selectedWall = state.walls.find((w) => w.id === state.selectedWallId);
  const selectedModule = state.placedModules.find(
    (m) => m.id === state.selectedModuleId
  );

  return (
    <div className="absolute top-4 right-4 w-72 bg-white/95 backdrop-blur rounded-xl shadow-lg overflow-hidden z-30">
      <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Properties</h3>
      </div>

      <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Room Info */}
        {state.roomDimensions && (
          <div className="p-3 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-700 mb-2">🏠 Room</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                Width: {Math.round(state.roomDimensions.width)}mm
              </div>
              <div>
                Depth: {Math.round(state.roomDimensions.depth)}mm
              </div>
              <div>
                Height: {Math.round(state.roomDimensions.height)}mm
              </div>
              <div>
                Area: {state.roomDimensions.area.toFixed(2)} m²
              </div>
            </div>
          </div>
        )}

        {/* Selected Wall Info */}
        {selectedWall && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-700 mb-2">
              🧱 Wall {selectedWall.wallIndex + 1}
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Length: {Math.round(selectedWall.length)}mm</div>
              <div>Height: {Math.round(selectedWall.height)}mm</div>
              <div>
                Start: ({Math.round(selectedWall.startPoint.x)},{" "}
                {Math.round(selectedWall.startPoint.y)})
              </div>
              <div>
                End: ({Math.round(selectedWall.endPoint.x)},{" "}
                {Math.round(selectedWall.endPoint.y)})
              </div>
            </div>
          </div>
        )}

        {/* Selected Module Info */}
        {selectedModule && (
          <div className="p-3 bg-amber-50 rounded-lg">
            <h4 className="font-semibold text-amber-700 mb-2">
              📦 {selectedModule.template?.name || "Module"}
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                Size: {selectedModule.dimensions.width} ×{" "}
                {selectedModule.dimensions.height} ×{" "}
                {selectedModule.dimensions.depth}mm
              </div>
              <div>
                Position: ({Math.round(selectedModule.position.x)},{" "}
                {Math.round(selectedModule.position.y)},{" "}
                {Math.round(selectedModule.position.z)})
              </div>
              <div>Rotation: {selectedModule.rotation}°</div>
            </div>
          </div>
        )}

        {/* No Selection */}
        {!selectedWall && !selectedModule && (
          <div className="text-center text-gray-500 py-4">
            Click on a wall or module to view properties
          </div>
        )}

        {/* Stats */}
        <div className="pt-3 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Walls: {state.walls.length} | Modules: {state.placedModules.length}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function Room3DViewer({
  walls,
  placedModules = [],
  roomDimensions = null,
  floorPlan = null,
  onWallSelect,
  onModuleSelect,
}: Room3DViewerProps) {
  const [state, setState] = useState<RoomViewerState>({
    walls,
    placedModules,
    selectedWallId: null,
    selectedModuleId: null,
    editMode: "view",
    viewMode: "perspective",
    showGrid: true,
    showDimensions: true,
    roomDimensions,
  });

  // Update state when props change
  React.useEffect(() => {
    setState((prev) => ({
      ...prev,
      walls,
      placedModules,
      roomDimensions,
    }));
  }, [walls, placedModules, roomDimensions]);

  const handleWallSelect = useCallback(
    (wallId: string | null) => {
      setState((prev) => ({
        ...prev,
        selectedWallId: wallId,
        selectedModuleId: null,
      }));
      onWallSelect?.(wallId);
    },
    [onWallSelect]
  );

  const handleModuleSelect = useCallback(
    (moduleId: string | null) => {
      setState((prev) => ({
        ...prev,
        selectedModuleId: moduleId,
        selectedWallId: null,
      }));
      onModuleSelect?.(moduleId);
    },
    [onModuleSelect]
  );

  const handleEditModeChange = useCallback((mode: EditMode) => {
    setState((prev) => ({ ...prev, editMode: mode }));
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setState((prev) => ({ ...prev, viewMode: mode }));
  }, []);

  const handleToggleDimensions = useCallback(() => {
    setState((prev) => ({ ...prev, showDimensions: !prev.showDimensions }));
  }, []);

  const handleToggleGrid = useCallback(() => {
    setState((prev) => ({ ...prev, showGrid: !prev.showGrid }));
  }, []);

  // Calculate camera position based on room size
  const cameraDistance = roomDimensions
    ? Math.max(roomDimensions.width, roomDimensions.depth) * 1.5
    : 5000;

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-slate-200 to-slate-300">
      {/* 3D Canvas */}
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor("#E8ECF0");
        }}
      >
        <PerspectiveCamera
          makeDefault
          position={[cameraDistance, cameraDistance * 0.8, cameraDistance]}
          fov={50}
        />
        <Suspense fallback={null}>
          <Scene
            state={state}
            floorPlan={floorPlan}
            onWallSelect={handleWallSelect}
            onModuleSelect={handleModuleSelect}
          />
        </Suspense>
      </Canvas>

      {/* UI Overlays */}
      <Toolbar
        state={state}
        onEditModeChange={handleEditModeChange}
        onViewModeChange={handleViewModeChange}
        onToggleDimensions={handleToggleDimensions}
        onToggleGrid={handleToggleGrid}
      />

      <PropertiesPanel state={state} />

      {/* Status Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg text-sm z-30">
        <span className="text-gray-500">Mode: </span>
        <span className="font-medium text-gray-800 capitalize">
          {state.editMode}
        </span>
        <span className="mx-2 text-gray-300">|</span>
        <span className="text-gray-500">Selected: </span>
        <span className="font-medium text-gray-800">
          {state.selectedWallId
            ? `Wall ${state.walls.find((w) => w.id === state.selectedWallId)?.wallIndex ?? 0 + 1}`
            : state.selectedModuleId
            ? "Module"
            : "None"}
        </span>
      </div>
    </div>
  );
}
