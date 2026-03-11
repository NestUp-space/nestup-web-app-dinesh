"use client";

import React, { useRef, useState, useEffect, useCallback, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  OrbitControls, 
  TransformControls, 
  Text, 
  PerspectiveCamera,
  Environment
} from "@react-three/drei";
import * as THREE from "three";
import { useInstallationGuideStore, useAppStore } from "@/stores/visualiserStore";
import type { Wall, Box, Plank, EditMode, MaterialLegendItem } from "@/types/visualiser";

// Demo data for testing
const DEMO_DATA = {
  walls: [
    {
      id: "wall-1",
      entityName: "Kitchen Wall A",
      roomName: "Kitchen",
      dimensions: { lenX: 3000, lenY: 600, lenZ: 2400 },
      boxes: [
        {
          id: "box-1",
          entityName: "Base Cabinet 1",
          roomName: "Kitchen",
          boxType: "Base",
          position: { x: 100, y: 0, z: 0 },
          dimensions: { lenX: 600, lenY: 560, lenZ: 720 },
          rowIndex: 2,
          planks: [
            {
              id: "P001",
              entityName: "Left Side",
              material: "White MDF",
              materialColor: "#F5F5F5",
              thickness: 18,
              position: { x: 0, y: 0, z: 0 },
              dimensions: { lenX: 18, lenY: 560, lenZ: 720 },
              stepNumber: 1,
              explodeDirection: { x: -100, y: 0, z: 0 },
              assemblyDirection: { arrow: "←", text: "Attach from left" },
            },
            {
              id: "P002",
              entityName: "Right Side",
              material: "White MDF",
              materialColor: "#F5F5F5",
              thickness: 18,
              position: { x: 582, y: 0, z: 0 },
              dimensions: { lenX: 18, lenY: 560, lenZ: 720 },
              stepNumber: 2,
              explodeDirection: { x: 100, y: 0, z: 0 },
              assemblyDirection: { arrow: "→", text: "Attach from right" },
            },
            {
              id: "P003",
              entityName: "Bottom Panel",
              material: "White MDF",
              materialColor: "#E8E8E8",
              thickness: 18,
              position: { x: 18, y: 0, z: 0 },
              dimensions: { lenX: 564, lenY: 560, lenZ: 18 },
              stepNumber: 3,
              explodeDirection: { x: 0, y: 0, z: -100 },
              assemblyDirection: { arrow: "↓", text: "Place at bottom" },
            },
            {
              id: "P004",
              entityName: "Top Panel",
              material: "White MDF",
              materialColor: "#E8E8E8",
              thickness: 18,
              position: { x: 18, y: 0, z: 702 },
              dimensions: { lenX: 564, lenY: 560, lenZ: 18 },
              stepNumber: 4,
              explodeDirection: { x: 0, y: 0, z: 100 },
              assemblyDirection: { arrow: "↑", text: "Place at top" },
            },
            {
              id: "P005",
              entityName: "Back Panel",
              material: "White MDF",
              materialColor: "#DEDEDE",
              thickness: 8,
              position: { x: 18, y: 552, z: 18 },
              dimensions: { lenX: 564, lenY: 8, lenZ: 684 },
              stepNumber: 5,
              explodeDirection: { x: 0, y: 100, z: 0 },
              assemblyDirection: { arrow: "⤴", text: "Attach at back" },
            },
          ],
          checklist: [
            { id: "P001", name: "Left Side", material: "White MDF", dimensions: "18×560×720" },
            { id: "P002", name: "Right Side", material: "White MDF", dimensions: "18×560×720" },
            { id: "P003", name: "Bottom Panel", material: "White MDF", dimensions: "564×560×18" },
            { id: "P004", name: "Top Panel", material: "White MDF", dimensions: "564×560×18" },
            { id: "P005", name: "Back Panel", material: "White MDF", dimensions: "564×8×684" },
          ],
        },
        {
          id: "box-2",
          entityName: "Base Cabinet 2",
          roomName: "Kitchen",
          boxType: "Base",
          position: { x: 700, y: 0, z: 0 },
          dimensions: { lenX: 600, lenY: 560, lenZ: 720 },
          rowIndex: 3,
          planks: [
            {
              id: "P006",
              entityName: "Left Side",
              material: "Oak Veneer",
              materialColor: "#C4A77D",
              thickness: 18,
              position: { x: 0, y: 0, z: 0 },
              dimensions: { lenX: 18, lenY: 560, lenZ: 720 },
              stepNumber: 1,
              explodeDirection: { x: -100, y: 0, z: 0 },
              assemblyDirection: { arrow: "←", text: "Attach from left" },
            },
            {
              id: "P007",
              entityName: "Right Side",
              material: "Oak Veneer",
              materialColor: "#C4A77D",
              thickness: 18,
              position: { x: 582, y: 0, z: 0 },
              dimensions: { lenX: 18, lenY: 560, lenZ: 720 },
              stepNumber: 2,
              explodeDirection: { x: 100, y: 0, z: 0 },
              assemblyDirection: { arrow: "→", text: "Attach from right" },
            },
          ],
          checklist: [
            { id: "P006", name: "Left Side", material: "Oak Veneer", dimensions: "18×560×720" },
            { id: "P007", name: "Right Side", material: "Oak Veneer", dimensions: "18×560×720" },
          ],
        },
      ],
    },
  ],
  materialLegend: [
    { name: "White MDF", color: "#F5F5F5" },
    { name: "Oak Veneer", color: "#C4A77D" },
  ],
  summary: { totalWalls: 1, totalBoxes: 2, totalPlanks: 7 },
};

// ============================================
// 3D Components
// ============================================

interface PlankMeshProps {
  plank: Plank;
  boxPosition: { x: number; y: number; z: number };
  isCurrentStep: boolean;
  isPastStep: boolean;
  explodeAmount: number;
  isSelected: boolean;
  onClick: () => void;
  opacity?: number;
}

function PlankMesh({ 
  plank, 
  boxPosition, 
  isCurrentStep, 
  isPastStep, 
  explodeAmount, 
  isSelected,
  onClick,
  opacity = 1
}: PlankMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Calculate position with explode effect
  const explodeOffset = {
    x: plank.explodeDirection.x * explodeAmount,
    y: plank.explodeDirection.z * explodeAmount, // Y in Three.js is Z in data
    z: -plank.explodeDirection.y * explodeAmount, // Z in Three.js is -Y in data
  };

  const position: [number, number, number] = [
    boxPosition.x + plank.position.x + plank.dimensions.lenX / 2 + explodeOffset.x,
    boxPosition.z + plank.position.z + plank.dimensions.lenZ / 2 + explodeOffset.y,
    -(boxPosition.y + plank.position.y + plank.dimensions.lenY / 2 + explodeOffset.z),
  ];

  // Determine visual state
  let materialOpacity = opacity;
  let emissiveIntensity = 0;
  
  if (isCurrentStep) {
    emissiveIntensity = 0.3;
    materialOpacity = 1;
  } else if (isPastStep) {
    materialOpacity = 0.7;
  } else if (!isCurrentStep && !isPastStep) {
    materialOpacity = 0.2;
  }

  if (isSelected) {
    emissiveIntensity = 0.5;
  }

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[
          plank.dimensions.lenX,
          plank.dimensions.lenZ,
          plank.dimensions.lenY,
        ]} />
        <meshStandardMaterial 
          color={plank.materialColor}
          transparent
          opacity={materialOpacity}
          emissive={isSelected ? "#FFAA00" : isCurrentStep ? "#22AA22" : "#000000"}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      
      {/* Wireframe edges */}
      <lineSegments position={position}>
        <edgesGeometry args={[new THREE.BoxGeometry(
          plank.dimensions.lenX,
          plank.dimensions.lenZ,
          plank.dimensions.lenY,
        )]} />
        <lineBasicMaterial color="#374151" transparent opacity={0.3} />
      </lineSegments>

      {/* Label */}
      {opacity > 0.5 && (
        <Text
          position={[position[0], position[1] + plank.dimensions.lenZ / 2 + 20, position[2]]}
          fontSize={Math.min(30, plank.dimensions.lenX * 0.1)}
          color="#374151"
          anchorX="center"
          anchorY="bottom"
        >
          {plank.id}
        </Text>
      )}
    </group>
  );
}

interface BoxGroupProps {
  box: Box;
  isSelected: boolean;
  currentStep: number;
  explodeAmount: number;
  selectedPlankId: string | null;
  onPlankClick: (plankId: string) => void;
  forwardDistance: number;
  opacity: number;
}

function BoxGroup({ 
  box, 
  isSelected, 
  currentStep, 
  explodeAmount, 
  selectedPlankId,
  onPlankClick,
  forwardDistance,
  opacity
}: BoxGroupProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Apply forward offset when selected
  const zOffset = isSelected ? forwardDistance : 0;
  
  return (
    <group 
      ref={groupRef}
      position={[box.position.x, box.position.z, -box.position.y + zOffset]}
    >
      {box.planks.map((plank) => (
        <PlankMesh
          key={plank.id}
          plank={plank}
          boxPosition={{ x: 0, y: 0, z: 0 }}
          isCurrentStep={currentStep === (plank.stepNumber ?? 0)}
          isPastStep={currentStep > (plank.stepNumber ?? 0)}
          explodeAmount={isSelected ? explodeAmount : 0}
          isSelected={selectedPlankId === plank.id}
          onClick={() => onPlankClick(plank.id)}
          opacity={isSelected ? 0.95 : opacity}
        />
      ))}
    </group>
  );
}

interface WallSurfaceProps {
  wall: Wall;
}

function WallSurface({ wall }: WallSurfaceProps) {
  return (
    <mesh 
      position={[wall.dimensions.lenX / 2, -25, wall.dimensions.lenZ / 2]}
      receiveShadow
    >
      <boxGeometry args={[wall.dimensions.lenX, 50, wall.dimensions.lenZ]} />
      <meshStandardMaterial 
        color="#F9FAFB" 
        transparent 
        opacity={0.8} 
      />
    </mesh>
  );
}

function Scene() {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  
  const { 
    data, 
    currentWallIndex, 
    currentBoxIndex, 
    currentStep,
    explodeAmount,
    editMode,
    selectedPlankId,
    setSelectedPlank,
    setCurrentStep
  } = useInstallationGuideStore();

  const currentWall = data?.walls[currentWallIndex];
  const currentBox = currentWall?.boxes[currentBoxIndex];

  // Camera animation on wall change
  useEffect(() => {
    if (currentWall && controlsRef.current) {
      const center = {
        x: currentWall.dimensions.lenX / 2,
        y: currentWall.dimensions.lenZ / 2,
        z: -currentWall.dimensions.lenY / 2,
      };
      
      // Animate camera
      camera.position.set(
        center.x + 2000,
        center.y + 1500,
        center.z + 2500
      );
      controlsRef.current.target.set(center.x, center.y, center.z);
      controlsRef.current.update();
    }
  }, [currentWallIndex, currentWall, camera]);

  const handlePlankClick = (plankId: string) => {
    if (editMode !== 'view') {
      setSelectedPlank(plankId);
    } else {
      // Find plank and jump to its step
      const plank = currentBox?.planks.find((p: Plank) => p.id === plankId);
      if (plank) {
        setCurrentStep(plank.stepNumber ?? 0);
      }
    }
  };

  if (!currentWall) {
    return (
      <>
        <ambientLight intensity={0.7} />
        <Text position={[0, 0, 0]} fontSize={50} color="#666">
          Select a wall to begin
        </Text>
      </>
    );
  }

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight 
        position={[2000, 3000, 2000]} 
        intensity={0.6} 
        castShadow 
      />
      <directionalLight 
        position={[-1000, 1000, -1000]} 
        intensity={0.3} 
      />
      
      {/* Controls */}
      <OrbitControls 
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={500}
        maxDistance={15000}
      />
      
      {/* Wall Surface */}
      <WallSurface wall={currentWall} />
      
      {/* Boxes */}
      {currentWall.boxes.map((box: Box, index: number) => (
        <BoxGroup
          key={box.id}
          box={box}
          isSelected={index === currentBoxIndex}
          currentStep={currentStep}
          explodeAmount={explodeAmount}
          selectedPlankId={selectedPlankId}
          onPlankClick={handlePlankClick}
          forwardDistance={1000}
          opacity={currentBoxIndex === -1 ? 0.95 : 0.15}
        />
      ))}
    </>
  );
}

// ============================================
// UI Components
// ============================================

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function SlidePanel({ isOpen, onClose }: SidePanelProps) {
  const { 
    data, 
    currentWallIndex, 
    currentBoxIndex,
    explodeAmount,
    setCurrentWall, 
    setCurrentBox,
    setExplodeAmount 
  } = useInstallationGuideStore();

  const currentWall = data?.walls[currentWallIndex];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="absolute inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Panel */}
      <div className={`absolute top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-bold text-gray-800">Installation Guide</h2>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-200 hover:bg-orange-500 hover:text-white transition-colors flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-auto p-4 space-y-6">
            {/* Wall Selector */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Select Wall
              </label>
              <select
                value={currentWallIndex}
                onChange={(e) => setCurrentWall(Number(e.target.value))}
                className="w-full p-3 border-2 rounded-xl text-gray-700 focus:border-orange-500 focus:outline-none"
              >
                <option value={-1}>-- Choose Wall --</option>
                {data?.walls.map((wall: Wall, index: number) => (
                  <option key={wall.id} value={index}>
                    {wall.entityName} ({wall.roomName})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Box List */}
            {currentWall && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Boxes ({currentWall.boxes.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {currentWall.boxes.map((box: Box, index: number) => (
                    <button
                      key={box.id}
                      onClick={() => setCurrentBox(index)}
                      className={`w-full p-3 text-left rounded-xl border-2 transition-colors ${
                        currentBoxIndex === index
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <div className="font-medium text-gray-800">{box.entityName}</div>
                      <div className="text-sm text-gray-500">{box.planks.length} planks</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Explode Slider */}
            <div className="p-4 bg-gray-100 rounded-xl">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Explode View</span>
                <span className="text-sm font-bold text-orange-500">{Math.round(explodeAmount * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={explodeAmount}
                onChange={(e) => setExplodeAmount(Number(e.target.value))}
                className="w-full accent-orange-500"
              />
            </div>
            
            {/* Material Legend */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Material Legend
              </label>
              {data?.materialLegend.map((mat: MaterialLegendItem) => (
                <div key={mat.name} className="flex items-center gap-3 mb-2">
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: mat.color }}
                  />
                  <span className="text-sm text-gray-700">{mat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StepControls() {
  const { 
    data, 
    currentWallIndex, 
    currentBoxIndex, 
    currentStep,
    setCurrentStep 
  } = useInstallationGuideStore();

  const currentWall = data?.walls[currentWallIndex];
  const currentBox = currentWall?.boxes[currentBoxIndex];
  const maxStep = currentBox?.planks.length || 0;

  const canPrev = currentStep > 0;
  const canNext = currentStep < maxStep;

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white px-6 py-3 rounded-full shadow-lg z-30">
      <button
        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
        disabled={!canPrev}
        className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold text-gray-700 hover:border-orange-500 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ◀
      </button>
      
      <div className="text-center min-w-[80px]">
        <div className="text-2xl font-bold text-orange-500">{currentStep}</div>
        <div className="text-xs text-gray-500">of {maxStep}</div>
      </div>
      
      <button
        onClick={() => setCurrentStep(Math.min(maxStep, currentStep + 1))}
        disabled={!canNext}
        className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold hover:bg-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ▶
      </button>
    </div>
  );
}

function EditModeButtons() {
  const { editMode, setEditMode } = useInstallationGuideStore();

  const modes: { mode: EditMode; icon: string; label: string }[] = [
    { mode: 'view', icon: '👁️', label: 'View' },
    { mode: 'move', icon: '✥', label: 'Move' },
    { mode: 'rotate', icon: '↻', label: 'Rotate' },
    { mode: 'boxMove', icon: '📦', label: 'Box' },
  ];

  return (
    <div className="absolute top-5 left-1/2 -translate-x-1/2 flex gap-1 bg-white p-1.5 rounded-full shadow-lg z-30">
      {modes.map(({ mode, icon, label }) => (
        <button
          key={mode}
          onClick={() => setEditMode(mode)}
          title={label}
          className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition-colors ${
            editMode === mode
              ? mode === 'boxMove' 
                ? 'bg-blue-500 text-white'
                : 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

function CurrentPlankInfo() {
  const { 
    data, 
    currentWallIndex, 
    currentBoxIndex, 
    currentStep 
  } = useInstallationGuideStore();

  const currentWall = data?.walls[currentWallIndex];
  const currentBox = currentWall?.boxes[currentBoxIndex];
  const currentPlank = currentBox?.planks.find(p => p.stepNumber === currentStep);

  if (!currentPlank || currentStep === 0) return null;

  return (
    <div className="absolute bottom-5 left-5 bg-white p-4 rounded-2xl shadow-lg max-w-[280px] z-30">
      <div className="text-3xl font-extrabold text-orange-500 font-mono">{currentPlank.id}</div>
      <div className="font-semibold text-gray-800 mt-1">{currentPlank.entityName}</div>
      <div className="text-sm text-gray-500">{currentBox?.roomName} • {currentBox?.entityName}</div>
      <div className="text-sm text-gray-500 mt-1">{currentPlank.material}</div>
      <div className="text-sm font-semibold font-mono text-gray-800 mt-2 pt-2 border-t border-gray-200">
        {currentPlank.dimensions.lenX} × {currentPlank.dimensions.lenY} × {currentPlank.dimensions.lenZ} mm
      </div>
      <div className="flex items-center gap-2 mt-2 p-2 bg-orange-50 rounded-lg text-orange-500 font-semibold">
        <span className="text-2xl">{currentPlank.assemblyDirection.arrow}</span>
        <span>{currentPlank.assemblyDirection.text}</span>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function InstallationGuideViewer() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { setData, currentBoxIndex } = useInstallationGuideStore();
  const { isConnected } = useAppStore();

  // Load demo data on mount
  useEffect(() => {
    setData(DEMO_DATA as any);
  }, [setData]);

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-slate-200 to-slate-300">
      {/* 3D Canvas */}
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#F5F7FA');
        }}
      >
        <PerspectiveCamera makeDefault position={[3000, 2000, 4000]} fov={45} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {/* UI Overlays */}
      <SlidePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
      
      {/* Menu Button */}
      <button
        onClick={() => setIsPanelOpen(true)}
        className="absolute top-5 left-5 w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-2xl text-gray-700 hover:scale-110 transition-transform z-30"
      >
        ☰
      </button>

      {/* Print Button */}
      <button
        onClick={() => window.print()}
        className="absolute top-5 right-5 w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-2xl text-gray-700 hover:scale-110 transition-transform z-30"
      >
        🖨️
      </button>

      {/* Fit View Button */}
      <button
        className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-orange-500 text-white shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform z-30"
      >
        ⊙
      </button>

      {/* Edit Mode Buttons */}
      <EditModeButtons />

      {/* Step Controls */}
      {currentBoxIndex >= 0 && <StepControls />}

      {/* Current Plank Info */}
      <CurrentPlankInfo />

      {/* Loading Indicator - hidden once canvas loads */}
      <div id="loading" className="hidden absolute inset-0 bg-white flex flex-col items-center justify-center z-50">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
        <p className="mt-4 text-gray-500">Loading Installation Guide...</p>
      </div>
    </div>
  );
}
