"use client";

import React, { useRef, useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  TransformControls,
  Grid,
  PerspectiveCamera,
  Text,
  Line,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import type { DesignerBox, DesignerPlank, EditMode, Vector3D, Dimensions } from "@/types/visualiser";

// ============================================
// State Management
// ============================================

interface DesignerState {
  boxes: DesignerBox[];
  selectedBoxId: string | null;
  selectedPlankId: string | null;
  editMode: EditMode;
  showDimensions: boolean;
  showGrid: boolean;
  snapEnabled: boolean;
  explodeAmount: number;
  viewMode: "perspective" | "front" | "top" | "right";
  gridSize: number;
}

const initialState: DesignerState = {
  boxes: [],
  selectedBoxId: null,
  selectedPlankId: null,
  editMode: "view",
  showDimensions: true,
  showGrid: true,
  snapEnabled: true,
  explodeAmount: 0,
  viewMode: "perspective",
  gridSize: 50,
};

// Demo box data
const DEMO_BOXES: DesignerBox[] = [
  {
    id: "box-1",
    name: "Base Cabinet 1",
    roomName: "Kitchen",
    position: { x: 0, y: 0, z: 0 },
    dimensions: { lenX: 600, lenY: 560, lenZ: 720 },
    planks: [
      {
        id: "B1-P1",
        name: "Left Side",
        material: "White MDF",
        color: "#F5F5F5",
        position: { x: 0, y: 0, z: 0 },
        dimensions: { lenX: 18, lenY: 560, lenZ: 720 },
        parentBoxId: "box-1",
      },
      {
        id: "B1-P2",
        name: "Right Side",
        material: "White MDF",
        color: "#F5F5F5",
        position: { x: 582, y: 0, z: 0 },
        dimensions: { lenX: 18, lenY: 560, lenZ: 720 },
        parentBoxId: "box-1",
      },
      {
        id: "B1-P3",
        name: "Bottom",
        material: "White MDF",
        color: "#E8E8E8",
        position: { x: 18, y: 0, z: 0 },
        dimensions: { lenX: 564, lenY: 560, lenZ: 18 },
        parentBoxId: "box-1",
      },
      {
        id: "B1-P4",
        name: "Top",
        material: "White MDF",
        color: "#E8E8E8",
        position: { x: 18, y: 0, z: 702 },
        dimensions: { lenX: 564, lenY: 560, lenZ: 18 },
        parentBoxId: "box-1",
      },
      {
        id: "B1-P5",
        name: "Back",
        material: "White MDF",
        color: "#D0D0D0",
        position: { x: 18, y: 552, z: 18 },
        dimensions: { lenX: 564, lenY: 8, lenZ: 684 },
        parentBoxId: "box-1",
      },
    ],
  },
  {
    id: "box-2",
    name: "Wall Cabinet 1",
    roomName: "Kitchen",
    position: { x: 0, y: 0, z: 1400 },
    dimensions: { lenX: 600, lenY: 350, lenZ: 700 },
    planks: [
      {
        id: "B2-P1",
        name: "Left Side",
        material: "Oak Veneer",
        color: "#C4A77D",
        position: { x: 0, y: 0, z: 0 },
        dimensions: { lenX: 18, lenY: 350, lenZ: 700 },
        parentBoxId: "box-2",
      },
      {
        id: "B2-P2",
        name: "Right Side",
        material: "Oak Veneer",
        color: "#C4A77D",
        position: { x: 582, y: 0, z: 0 },
        dimensions: { lenX: 18, lenY: 350, lenZ: 700 },
        parentBoxId: "box-2",
      },
      {
        id: "B2-P3",
        name: "Top",
        material: "Oak Veneer",
        color: "#B89A6D",
        position: { x: 18, y: 0, z: 682 },
        dimensions: { lenX: 564, lenY: 350, lenZ: 18 },
        parentBoxId: "box-2",
      },
      {
        id: "B2-P4",
        name: "Bottom",
        material: "Oak Veneer",
        color: "#B89A6D",
        position: { x: 18, y: 0, z: 0 },
        dimensions: { lenX: 564, lenY: 350, lenZ: 18 },
        parentBoxId: "box-2",
      },
    ],
  },
];

// ============================================
// 3D Components
// ============================================

interface PlankMeshProps {
  plank: DesignerPlank;
  boxPosition: Vector3D;
  isSelected: boolean;
  isBoxSelected: boolean;
  explodeAmount: number;
  showDimensions: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}

function PlankMesh({
  plank,
  boxPosition,
  isSelected,
  isBoxSelected,
  explodeAmount,
  showDimensions,
  onClick,
  onDoubleClick,
}: PlankMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Calculate explode direction based on plank position
  const getExplodeDirection = (): Vector3D => {
    const center = { x: 300, y: 280, z: 360 };
    return {
      x: Math.sign(plank.position.x + plank.dimensions.lenX / 2 - center.x) || 0,
      y: Math.sign(plank.position.y + plank.dimensions.lenY / 2 - center.y) || 0,
      z: Math.sign(plank.position.z + plank.dimensions.lenZ / 2 - center.z) || 0,
    };
  };

  const explodeDir = getExplodeDirection();
  const explodeOffset = {
    x: explodeDir.x * explodeAmount * 100,
    y: explodeDir.z * explodeAmount * 100,
    z: -explodeDir.y * explodeAmount * 100,
  };

  // Convert from data coords to Three.js coords
  const position: [number, number, number] = [
    boxPosition.x + plank.position.x + plank.dimensions.lenX / 2 + explodeOffset.x,
    boxPosition.z + plank.position.z + plank.dimensions.lenZ / 2 + explodeOffset.y,
    -(boxPosition.y + plank.position.y + plank.dimensions.lenY / 2 + explodeOffset.z),
  ];

  const size: [number, number, number] = [
    plank.dimensions.lenX,
    plank.dimensions.lenZ,
    plank.dimensions.lenY,
  ];

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClick();
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
          color={plank.color}
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

      {/* Dimension labels */}
      {showDimensions && isSelected && (
        <>
          {/* Width label (X) */}
          <Text
            position={[position[0], position[1] + size[1] / 2 + 30, position[2]]}
            fontSize={18}
            color="#FF6B6B"
            anchorX="center"
          >
            {plank.dimensions.lenX}mm
          </Text>
          {/* Height label (Z) */}
          <Text
            position={[position[0] + size[0] / 2 + 30, position[1], position[2]]}
            fontSize={18}
            color="#4ECDC4"
            anchorX="center"
            rotation={[0, 0, -Math.PI / 2]}
          >
            {plank.dimensions.lenZ}mm
          </Text>
          {/* Depth label (Y) */}
          <Text
            position={[position[0], position[1], position[2] - size[2] / 2 - 30]}
            fontSize={18}
            color="#45B7D1"
            anchorX="center"
          >
            {plank.dimensions.lenY}mm
          </Text>
        </>
      )}

      {/* Plank ID label */}
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
          {plank.id}
        </div>
      </Html>
    </group>
  );
}

interface BoxGroupProps {
  box: DesignerBox;
  isSelected: boolean;
  selectedPlankId: string | null;
  explodeAmount: number;
  showDimensions: boolean;
  onPlankClick: (plankId: string) => void;
  onBoxClick: () => void;
}

function BoxGroup({
  box,
  isSelected,
  selectedPlankId,
  explodeAmount,
  showDimensions,
  onPlankClick,
  onBoxClick,
}: BoxGroupProps) {
  return (
    <group onClick={onBoxClick}>
      {box.planks.map((plank) => (
        <PlankMesh
          key={plank.id}
          plank={plank}
          boxPosition={box.position}
          isSelected={selectedPlankId === plank.id}
          isBoxSelected={isSelected}
          explodeAmount={isSelected ? explodeAmount : 0}
          showDimensions={showDimensions}
          onClick={() => onPlankClick(plank.id)}
          onDoubleClick={() => {}}
        />
      ))}

      {/* Box bounding box indicator */}
      {isSelected && (
        <lineSegments
          position={[
            box.position.x + box.dimensions.lenX / 2,
            box.position.z + box.dimensions.lenZ / 2,
            -(box.position.y + box.dimensions.lenY / 2),
          ]}
        >
          <edgesGeometry
            args={[
              new THREE.BoxGeometry(
                box.dimensions.lenX + 20,
                box.dimensions.lenZ + 20,
                box.dimensions.lenY + 20
              ),
            ]}
          />
          <lineBasicMaterial color="#00AAFF" transparent opacity={0.5} linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
}

interface FloorGridProps {
  size?: number;
  divisions?: number;
}

function FloorGrid({ size = 4000, divisions = 40 }: FloorGridProps) {
  return (
    <Grid
      position={[size / 2, 0, -size / 2]}
      args={[size, size]}
      cellSize={100}
      cellThickness={0.5}
      cellColor="#444444"
      sectionSize={500}
      sectionThickness={1}
      sectionColor="#666666"
      fadeDistance={8000}
      fadeStrength={1}
      followCamera={false}
    />
  );
}

interface SceneProps {
  state: DesignerState;
  onSelectBox: (boxId: string | null) => void;
  onSelectPlank: (plankId: string | null) => void;
}

function Scene({ state, onSelectBox, onSelectPlank }: SceneProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  // Handle view mode changes
  useEffect(() => {
    if (!controlsRef.current) return;

    const target = { x: 500, y: 500, z: -400 };

    switch (state.viewMode) {
      case "front":
        camera.position.set(target.x, target.y, 2000);
        break;
      case "top":
        camera.position.set(target.x, 3000, target.z);
        break;
      case "right":
        camera.position.set(2500, target.y, target.z);
        break;
      default: // perspective
        camera.position.set(1500, 1200, 1500);
    }

    controlsRef.current.target.set(target.x, target.y, target.z);
    controlsRef.current.update();
  }, [state.viewMode, camera]);

  const handlePlankClick = useCallback(
    (boxId: string, plankId: string) => {
      if (state.editMode === "boxMove") {
        onSelectBox(boxId);
        onSelectPlank(null);
      } else {
        onSelectBox(boxId);
        onSelectPlank(plankId);
      }
    },
    [state.editMode, onSelectBox, onSelectPlank]
  );

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[2000, 3000, 2000]} intensity={0.7} castShadow />
      <directionalLight position={[-1500, 1000, -1500]} intensity={0.3} />
      <hemisphereLight args={["#FFFFFF", "#444444", 0.5]} />

      {/* Controls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={300}
        maxDistance={10000}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />

      {/* Grid */}
      {state.showGrid && <FloorGrid />}

      {/* Boxes */}
      {state.boxes.map((box) => (
        <BoxGroup
          key={box.id}
          box={box}
          isSelected={state.selectedBoxId === box.id}
          selectedPlankId={state.selectedPlankId}
          explodeAmount={state.explodeAmount}
          showDimensions={state.showDimensions}
          onPlankClick={(plankId) => handlePlankClick(box.id, plankId)}
          onBoxClick={() => onSelectBox(box.id)}
        />
      ))}

      {/* Origin axes */}
      <group>
        <Line points={[[0, 0, 0], [500, 0, 0]]} color="red" lineWidth={2} />
        <Line points={[[0, 0, 0], [0, 500, 0]]} color="green" lineWidth={2} />
        <Line points={[[0, 0, 0], [0, 0, -500]]} color="blue" lineWidth={2} />
      </group>
    </>
  );
}

// ============================================
// UI Components
// ============================================

interface ToolbarProps {
  state: DesignerState;
  onEditModeChange: (mode: EditMode) => void;
  onViewModeChange: (mode: "perspective" | "front" | "top" | "right") => void;
  onToggleDimensions: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
}

function Toolbar({
  state,
  onEditModeChange,
  onViewModeChange,
  onToggleDimensions,
  onToggleGrid,
  onToggleSnap,
}: ToolbarProps) {
  const editModes: { mode: EditMode; icon: string; label: string }[] = [
    { mode: "view", icon: "👁️", label: "View" },
    { mode: "move", icon: "✥", label: "Move" },
    { mode: "rotate", icon: "↻", label: "Rotate" },
    { mode: "boxMove", icon: "📦", label: "Box" },
  ];

  const viewModes: { mode: "perspective" | "front" | "top" | "right"; label: string }[] = [
    { mode: "perspective", label: "3D" },
    { mode: "front", label: "Front" },
    { mode: "top", label: "Top" },
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
                ? mode === "boxMove"
                  ? "bg-blue-500 text-white"
                  : "bg-orange-500 text-white"
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
            state.showDimensions ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
          }`}
        >
          📏
        </button>
        <button
          onClick={onToggleGrid}
          title="Toggle Grid"
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors ${
            state.showGrid ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
          }`}
        >
          #
        </button>
        <button
          onClick={onToggleSnap}
          title="Toggle Snap"
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors ${
            state.snapEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
          }`}
        >
          🧲
        </button>
      </div>
    </div>
  );
}

interface PropertiesPanelProps {
  state: DesignerState;
  onExplodeChange: (amount: number) => void;
}

function PropertiesPanel({ state, onExplodeChange }: PropertiesPanelProps) {
  const selectedBox = state.boxes.find((b) => b.id === state.selectedBoxId);
  const selectedPlank = selectedBox?.planks.find((p) => p.id === state.selectedPlankId);

  return (
    <div className="absolute top-4 right-4 w-72 bg-white/95 backdrop-blur rounded-xl shadow-lg overflow-hidden z-30">
      <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Properties</h3>
      </div>

      <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Explode Control */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Explode View</span>
            <span className="text-sm font-bold text-orange-500">{Math.round(state.explodeAmount * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={state.explodeAmount}
            onChange={(e) => onExplodeChange(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
        </div>

        {/* Box Info */}
        {selectedBox && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-700 mb-2">📦 {selectedBox.name}</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Room: {selectedBox.roomName}</div>
              <div>Dimensions: {selectedBox.dimensions.lenX} × {selectedBox.dimensions.lenY} × {selectedBox.dimensions.lenZ}mm</div>
              <div>Position: ({selectedBox.position.x}, {selectedBox.position.y}, {selectedBox.position.z})</div>
              <div>Planks: {selectedBox.planks.length}</div>
            </div>
          </div>
        )}

        {/* Plank Info */}
        {selectedPlank && (
          <div className="p-3 bg-orange-50 rounded-lg">
            <h4 className="font-semibold text-orange-700 mb-2">🪵 {selectedPlank.name}</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>ID: {selectedPlank.id}</div>
              <div>Material: {selectedPlank.material}</div>
              <div>Size: {selectedPlank.dimensions.lenX} × {selectedPlank.dimensions.lenY} × {selectedPlank.dimensions.lenZ}mm</div>
              <div>Position: ({selectedPlank.position.x}, {selectedPlank.position.y}, {selectedPlank.position.z})</div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-500">Color:</span>
              <div
                className="w-6 h-6 rounded border"
                style={{ backgroundColor: selectedPlank.color }}
              />
            </div>
          </div>
        )}

        {/* No Selection */}
        {!selectedBox && (
          <div className="text-center text-gray-500 py-4">
            Click on a box or plank to view properties
          </div>
        )}

        {/* Box List */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">All Boxes ({state.boxes.length})</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {state.boxes.map((box) => (
              <div
                key={box.id}
                className={`p-2 rounded-lg text-sm cursor-pointer transition-colors ${
                  state.selectedBoxId === box.id
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                }`}
              >
                <div className="font-medium">{box.name}</div>
                <div className="text-xs text-gray-500">{box.planks.length} planks</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface HierarchyPanelProps {
  state: DesignerState;
  onSelectBox: (boxId: string | null) => void;
  onSelectPlank: (plankId: string | null) => void;
}

function HierarchyPanel({ state, onSelectBox, onSelectPlank }: HierarchyPanelProps) {
  const [expandedBoxes, setExpandedBoxes] = useState<Set<string>>(new Set());

  const toggleBox = (boxId: string) => {
    const newExpanded = new Set(expandedBoxes);
    if (newExpanded.has(boxId)) {
      newExpanded.delete(boxId);
    } else {
      newExpanded.add(boxId);
    }
    setExpandedBoxes(newExpanded);
  };

  return (
    <div className="absolute top-4 left-4 w-64 bg-white/95 backdrop-blur rounded-xl shadow-lg overflow-hidden z-30">
      <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Hierarchy</h3>
      </div>

      <div className="p-2 max-h-96 overflow-y-auto">
        {state.boxes.map((box) => (
          <div key={box.id}>
            <div
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                state.selectedBoxId === box.id && !state.selectedPlankId
                  ? "bg-blue-100"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => {
                onSelectBox(box.id);
                onSelectPlank(null);
                toggleBox(box.id);
              }}
            >
              <span className="text-xs text-gray-400">
                {expandedBoxes.has(box.id) ? "▼" : "▶"}
              </span>
              <span className="text-lg">📦</span>
              <span className="text-sm font-medium text-gray-700">{box.name}</span>
            </div>

            {/* Planks */}
            {expandedBoxes.has(box.id) && (
              <div className="ml-6 border-l border-gray-200 pl-2">
                {box.planks.map((plank) => (
                  <div
                    key={plank.id}
                    className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                      state.selectedPlankId === plank.id
                        ? "bg-orange-100"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      onSelectBox(box.id);
                      onSelectPlank(plank.id);
                    }}
                  >
                    <span
                      className="w-3 h-3 rounded-sm border"
                      style={{ backgroundColor: plank.color }}
                    />
                    <span className="text-xs text-gray-600">{plank.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function CabinetDesigner() {
  const [state, setState] = useState<DesignerState>({
    ...initialState,
    boxes: DEMO_BOXES,
  });

  const handleSelectBox = useCallback((boxId: string | null) => {
    setState((prev) => ({ ...prev, selectedBoxId: boxId }));
  }, []);

  const handleSelectPlank = useCallback((plankId: string | null) => {
    setState((prev) => ({ ...prev, selectedPlankId: plankId }));
  }, []);

  const handleEditModeChange = useCallback((mode: EditMode) => {
    setState((prev) => ({ ...prev, editMode: mode }));
  }, []);

  const handleViewModeChange = useCallback((mode: "perspective" | "front" | "top" | "right") => {
    setState((prev) => ({ ...prev, viewMode: mode }));
  }, []);

  const handleExplodeChange = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, explodeAmount: amount }));
  }, []);

  const handleToggleDimensions = useCallback(() => {
    setState((prev) => ({ ...prev, showDimensions: !prev.showDimensions }));
  }, []);

  const handleToggleGrid = useCallback(() => {
    setState((prev) => ({ ...prev, showGrid: !prev.showGrid }));
  }, []);

  const handleToggleSnap = useCallback(() => {
    setState((prev) => ({ ...prev, snapEnabled: !prev.snapEnabled }));
  }, []);

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-slate-300 to-slate-400">
      {/* 3D Canvas */}
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor("#E2E8F0");
        }}
      >
        <PerspectiveCamera makeDefault position={[1500, 1200, 1500]} fov={50} />
        <Suspense fallback={null}>
          <Scene
            state={state}
            onSelectBox={handleSelectBox}
            onSelectPlank={handleSelectPlank}
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
        onToggleSnap={handleToggleSnap}
      />

      <HierarchyPanel
        state={state}
        onSelectBox={handleSelectBox}
        onSelectPlank={handleSelectPlank}
      />

      <PropertiesPanel state={state} onExplodeChange={handleExplodeChange} />

      {/* Status Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg text-sm z-30">
        <span className="text-gray-500">Mode: </span>
        <span className="font-medium text-gray-800 capitalize">{state.editMode}</span>
        <span className="mx-2 text-gray-300">|</span>
        <span className="text-gray-500">Selected: </span>
        <span className="font-medium text-gray-800">
          {state.selectedPlankId || state.selectedBoxId || "None"}
        </span>
        <span className="mx-2 text-gray-300">|</span>
        <span className="text-gray-500">Boxes: </span>
        <span className="font-medium text-gray-800">{state.boxes.length}</span>
      </div>
    </div>
  );
}
