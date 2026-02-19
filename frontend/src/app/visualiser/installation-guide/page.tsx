'use client';

/**
 * Installation Guide Page
 * Interactive 3D assembly guide for customers
 * Based on Apps Script "visualization.js" and "installationguide.js"
 * 
 * Features:
 * - 3D visualization of cabinets
 * - Step-by-step assembly instructions
 * - Explode view for individual boxes
 * - Plank checklist
 * - Material legend
 */

import { Suspense, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import { useDesignerStore } from '@/store/designerStore';
import { Wall, Box, Plank } from '@/types/visualiser';
import * as THREE from 'three';

// ============================================
// TYPES
// ============================================

interface PlankWithStep extends Plank {
  stepNumber: number;
  explodeOffset: { x: number; y: number; z: number };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getMaterialColor(material: string): string {
  const materialColors: Record<string, string> = {
    '2632 SF Inner': '#DEB887',
    'BB EHGP 701': '#FFFFFF',
    '7070': '#E5E7EB',
    'EHGP 701': '#FAF9F6',
    'Color (Kitchen)': '#F5DEB3',
    'Plywood': '#D2B48C',
    'MDF': '#DEB887',
    'HDHMR': '#C4A86C',
  };
  return materialColors[material?.trim()] || '#D1D5DB';
}

function getExplodeDirection(role: string): { x: number; y: number; z: number } {
  const d = 300; // Explode distance
  switch (role) {
    case 'left': return { x: -d, y: 0, z: 0 };
    case 'right': return { x: d, y: 0, z: 0 };
    case 'top': return { x: 0, y: d, z: 0 };
    case 'bottom': return { x: 0, y: -d, z: 0 };
    case 'back': return { x: 0, y: 0, z: d };
    case 'front': case 'door': return { x: 0, y: 0, z: -d };
    case 'shelf': return { x: 0, y: 0, z: -d * 0.5 };
    case 'skirting': return { x: 0, y: -d * 0.3, z: -d * 0.3 };
    case 'drawer': return { x: 0, y: 0, z: -d * 0.7 };
    default: return { x: 0, y: 0, z: -d * 0.4 };
  }
}

function getAssemblyOrder(role: string): number {
  const orderMap: Record<string, number> = {
    'skirting': 1, 'bottom': 2, 'left': 3, 'right': 4,
    'back': 5, 'top': 6, 'shelf': 7, 'dummy': 8,
    'facia': 9, 'drawer': 10, 'front': 11, 'door': 12, 'other': 7,
  };
  return orderMap[role] || 7;
}

function getAssemblyDirection(role: string): { arrow: string; text: string } {
  switch (role) {
    case 'left': return { arrow: '→', text: 'Place LEFT panel' };
    case 'right': return { arrow: '←', text: 'Place RIGHT panel' };
    case 'top': return { arrow: '↓', text: 'Place on TOP' };
    case 'bottom': return { arrow: '↑', text: 'Place at BOTTOM' };
    case 'back': return { arrow: '⟵', text: 'Place at BACK' };
    case 'front': case 'door': return { arrow: '⟶', text: 'Attach FRONT' };
    case 'shelf': return { arrow: '—', text: 'Insert SHELF' };
    case 'skirting': return { arrow: '↓', text: 'Fix SKIRTING' };
    case 'drawer': return { arrow: '⟶', text: 'Slide DRAWER' };
    default: return { arrow: '•', text: 'Place part' };
  }
}

// ============================================
// 3D COMPONENTS
// ============================================

interface PlankMeshProps {
  plank: PlankWithStep;
  isExploded: boolean;
  isHighlighted: boolean;
  isCurrentStep: boolean;
  opacity: number;
  onClick?: () => void;
}

function PlankMesh({ plank, isExploded, isHighlighted, isCurrentStep, opacity, onClick }: PlankMeshProps) {
  const color = plank.materialColor || getMaterialColor(plank.material);
  
  const position = useMemo(() => {
    const base = [
      plank.position.x + plank.dimensions.lenX / 2,
      plank.position.z + plank.dimensions.lenZ / 2,
      -(plank.position.y + plank.dimensions.lenY / 2),
    ] as [number, number, number];
    
    if (isExploded) {
      return [
        base[0] + plank.explodeOffset.x,
        base[1] + plank.explodeOffset.z,
        base[2] - plank.explodeOffset.y,
      ] as [number, number, number];
    }
    
    return base;
  }, [plank, isExploded]);

  return (
    <mesh
      position={position}
      onClick={onClick}
    >
      <boxGeometry args={[plank.dimensions.lenX, plank.dimensions.lenZ, plank.dimensions.lenY]} />
      <meshStandardMaterial
        color={isCurrentStep ? '#4CAF50' : isHighlighted ? '#FFD700' : color}
        transparent={opacity < 1}
        opacity={opacity}
        wireframe={opacity < 0.5}
      />
      
      {/* Step number label */}
      {isCurrentStep && (
        <Html position={[0, plank.dimensions.lenZ / 2 + 50, 0]} center>
          <div className="bg-green-500 text-white px-2 py-1 rounded text-sm font-bold">
            Step {plank.stepNumber}
          </div>
        </Html>
      )}
    </mesh>
  );
}

interface BoxGroupProps {
  box: Box;
  isExploded: boolean;
  currentStep: number;
  onPlankClick?: (plank: Plank) => void;
}

function BoxGroup({ box, isExploded, currentStep, onPlankClick }: BoxGroupProps) {
  // Prepare planks with step info
  const sortedPlanks = useMemo(() => {
    return [...box.planks]
      .map((plank) => ({
        ...plank,
        assemblyOrder: getAssemblyOrder(plank.role),
        explodeOffset: getExplodeDirection(plank.role),
      }))
      .sort((a, b) => a.assemblyOrder - b.assemblyOrder)
      .map((plank, index) => ({
        ...plank,
        stepNumber: index + 1,
      }));
  }, [box.planks]);

  return (
    <group position={[box.position.x, box.position.z, -box.position.y]}>
      {sortedPlanks.map((plank) => {
        const isCurrentStep = plank.stepNumber === currentStep;
        const isPastStep = plank.stepNumber < currentStep;
        const isFutureStep = plank.stepNumber > currentStep;

        return (
          <PlankMesh
            key={plank.id}
            plank={plank}
            isExploded={isExploded && !isPastStep}
            isHighlighted={false}
            isCurrentStep={isCurrentStep}
            opacity={isFutureStep ? 0.3 : 1}
            onClick={() => onPlankClick?.(plank)}
          />
        );
      })}
    </group>
  );
}

// ============================================
// SIDEBAR COMPONENTS
// ============================================

interface BoxSelectorProps {
  walls: Wall[];
  selectedBoxId: string | null;
  onSelectBox: (boxId: string) => void;
}

function BoxSelector({ walls, selectedBoxId, onSelectBox }: BoxSelectorProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-700">Select Cabinet</h3>
      {walls.map((wall) => (
        <div key={wall.id} className="space-y-1">
          <p className="text-sm text-gray-500">{wall.roomName} - {wall.unitLocation}</p>
          {wall.boxes.map((box) => (
            <button
              key={box.id}
              onClick={() => onSelectBox(box.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                selectedBoxId === box.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {box.entityName || box.boxType}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

interface StepInstructionsProps {
  box: Box | null;
  currentStep: number;
  onStepChange: (step: number) => void;
}

function StepInstructions({ box, currentStep, onStepChange }: StepInstructionsProps) {
  if (!box) {
    return (
      <div className="text-gray-500 text-center py-4">
        Select a cabinet to view assembly steps
      </div>
    );
  }

  const sortedPlanks = [...box.planks]
    .map((plank) => ({
      ...plank,
      assemblyOrder: getAssemblyOrder(plank.role),
    }))
    .sort((a, b) => a.assemblyOrder - b.assemblyOrder);

  const totalSteps = sortedPlanks.length;
  const currentPlank = sortedPlanks[currentStep - 1];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Assembly Steps</h3>
        <span className="text-sm text-gray-500">
          {currentStep} / {totalSteps}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Current Step */}
      {currentPlank && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{getAssemblyDirection(currentPlank.role).arrow}</span>
            <div>
              <p className="font-bold text-green-800">Step {currentStep}</p>
              <p className="text-sm text-green-600">{getAssemblyDirection(currentPlank.role).text}</p>
            </div>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Part:</strong> {currentPlank.entityName}</p>
            <p><strong>Material:</strong> {currentPlank.material}</p>
            <p><strong>Size:</strong> {currentPlank.dimensions.lenX} × {currentPlank.dimensions.lenY} × {currentPlank.dimensions.lenZ} mm</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => onStepChange(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="flex-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <button
          onClick={() => onStepChange(Math.min(totalSteps, currentStep + 1))}
          disabled={currentStep === totalSteps}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>

      {/* Checklist */}
      <div className="mt-4">
        <h4 className="font-medium text-gray-700 mb-2">Parts Checklist</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {sortedPlanks.map((plank, index) => (
            <div
              key={plank.id}
              className={`flex items-center gap-2 p-2 rounded text-sm cursor-pointer ${
                index + 1 === currentStep
                  ? 'bg-green-100 border border-green-300'
                  : index + 1 < currentStep
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-white border border-gray-200'
              }`}
              onClick={() => onStepChange(index + 1)}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                index + 1 < currentStep
                  ? 'bg-green-500 text-white'
                  : index + 1 === currentStep
                  ? 'bg-green-200 text-green-800'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1 < currentStep ? '✓' : index + 1}
              </span>
              <span className="flex-1 truncate">{plank.entityName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function InstallationGuidePage() {
  const walls = useDesignerStore((state) => state.walls);
  const projectName = useDesignerStore((state) => state.projectName);

  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isExploded, setIsExploded] = useState(false);

  // Find selected box
  const selectedBox = useMemo(() => {
    for (const wall of walls) {
      const box = wall.boxes.find((b) => b.id === selectedBoxId);
      if (box) return box;
    }
    return null;
  }, [walls, selectedBoxId]);

  // Reset step when box changes
  const handleSelectBox = useCallback((boxId: string) => {
    setSelectedBoxId(boxId);
    setCurrentStep(1);
  }, []);

  // Material legend
  const materialLegend = useMemo(() => {
    const materials = new Set<string>();
    walls.forEach((wall) => {
      wall.boxes.forEach((box) => {
        box.planks.forEach((plank) => {
          if (plank.material) materials.add(plank.material);
        });
      });
    });
    return Array.from(materials).map((mat) => ({
      name: mat,
      color: getMaterialColor(mat),
    }));
  }, [walls]);

  if (walls.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No Design Data</h1>
          <p className="text-gray-600 mb-6">
            Please create or load a design first to view the installation guide.
          </p>
          <Link
            href="/visualiser/designer"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Designer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Installation Guide</h1>
            <p className="text-purple-200 text-sm">{projectName}</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isExploded}
                onChange={(e) => setIsExploded(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span>Explode View</span>
            </label>
            <Link
              href="/visualiser/designer"
              className="px-4 py-2 bg-white/20 rounded hover:bg-white/30 transition-colors"
            >
              Back to Designer
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Left Sidebar - Box Selector */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <BoxSelector
            walls={walls}
            selectedBoxId={selectedBoxId}
            onSelectBox={handleSelectBox}
          />
          
          {/* Material Legend */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-700 mb-2">Materials</h3>
            <div className="space-y-1">
              {materialLegend.map((mat) => (
                <div key={mat.name} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: mat.color }}
                  />
                  <span className="text-gray-600 truncate">{mat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="flex-1 relative">
          <Canvas
            shadows
            camera={{ position: [2000, 1500, 2000], fov: 50, near: 1, far: 50000 }}
          >
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
              
              {/* Render selected box */}
              {selectedBox && (
                <BoxGroup
                  box={selectedBox}
                  isExploded={isExploded}
                  currentStep={currentStep}
                />
              )}
              
              {/* Grid helper */}
              <gridHelper args={[5000, 50, '#888888', '#cccccc']} rotation={[0, 0, 0]} />
              
              <OrbitControls makeDefault />
              <Environment preset="apartment" />
              <ContactShadows position={[0, -1, 0]} opacity={0.4} blur={2} />
            </Suspense>
          </Canvas>
          
          {/* Step indicator overlay */}
          {selectedBox && (
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">
                  {selectedBox.entityName || selectedBox.boxType}
                </span>
                <span className="text-sm text-gray-500">
                  Step {currentStep} of {selectedBox.planks.length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Step Instructions */}
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <StepInstructions
            box={selectedBox}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
          />
        </div>
      </div>
    </div>
  );
}
