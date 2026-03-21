'use client';

/**
 * Installation Guide Page — view-only 3D installation guide.
 *
 * Layout: Full-screen 3D canvas with floating UI overlays
 * (menu button, print, fit-view, step controls, plank info card,
 *  slide-in panel, tooltip, loading spinner).
 *
 * Coordinate mapping matches App Script exactly:
 *   Three.js X = Data X
 *   Three.js Y = Data Z  (height)
 *   Three.js Z = -Data Y  (depth, flipped)
 */

import { Suspense, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useDesignerStore } from '@/stores/designerStore';
import {
  buildInstallationGuide,
  enrichMaterialFromPipeline,
  syncPlankIdsToRaw,
  convertDesignerRawDataTo2D,
} from '@/lib/visualiser/appscript-port';
import type { VisualizationData, WallData, BoxData, PlankData } from '@/lib/visualiser/appscript-port';
import { generateRawData } from '@/lib/visualiser/rawDataGenerator';

// ============================================
// CONSTANTS — matching App Script
// ============================================
const FORWARD_DISTANCE = 1000;
const SCENE_BG = '#F5F7FA';

const COLORS = {
  primary: '#F97316',
  primaryDark: '#EA580C',
  primaryLight: '#FDBA74',
  white: '#FFFFFF',
  navy: '#1E3A5F',
  background: '#FFF7ED',
  border: '#FED7AA',
  textDark: '#374151',
  textMedium: '#6B7280',
  ash: '#9CA3AF',
  ashLight: '#E5E7EB',
  bgLight: '#F5F5F5',
  wallColor: '#F9FAFB',
  boxSelect: '#3B82F6',
  green: '#22C55E',
  red: '#EF4444',
};

// ============================================
// COORDINATE HELPERS — exact App Script mapping
// ============================================
function toThreePos(x: number, y: number, z: number): [number, number, number] {
  return [x, z, -y];
}

// ============================================
// WOOD TEXTURE GENERATOR (premium enhancement)
// ============================================
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 200, g: 180, b: 150 };
}

function luminance(r: number, g: number, b: number) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function generateWoodTexture(
  baseColor: string,
  canvasW: number,
  canvasH: number,
  plankId: string,
  dims: { lenX: number; lenY: number; lenZ: number },
  seed: number,
): THREE.CanvasTexture {
  const w = Math.min(1024, Math.max(256, Math.round(canvasW / 2)));
  const h = Math.min(1024, Math.max(256, Math.round(canvasH / 2)));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const { r, g, b } = hexToRgb(baseColor);

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);

  const rng = (s: number) => {
    const v = Math.sin(s * 127.1 + seed * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };

  const grainCount = 12 + Math.floor(rng(1) * 10);
  for (let i = 0; i < grainCount; i++) {
    const gy = (i / grainCount) * h + (rng(i * 7) - 0.5) * 20;
    const variation = (rng(i * 13) - 0.5) * 30;
    const dr = Math.max(0, Math.min(255, r + variation));
    const dg = Math.max(0, Math.min(255, g + variation - 10));
    const db = Math.max(0, Math.min(255, b + variation - 15));
    ctx.strokeStyle = `rgba(${Math.round(dr)},${Math.round(dg)},${Math.round(db)},${0.3 + rng(i * 3) * 0.4})`;
    ctx.lineWidth = 1 + rng(i * 5) * 3;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    for (let x = 0; x < w; x += 8) {
      ctx.lineTo(x, gy + Math.sin(x * 0.02 + rng(i) * 10) * (3 + rng(i * 2) * 5));
    }
    ctx.stroke();
  }

  const knotCount = Math.floor(rng(99) * 2);
  for (let k = 0; k < knotCount; k++) {
    const kx = rng(k * 41) * w;
    const ky = rng(k * 67) * h;
    const kr = 4 + rng(k * 89) * 8;
    const grad = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr);
    grad.addColorStop(0, `rgba(${Math.max(0, r - 50)},${Math.max(0, g - 50)},${Math.max(0, b - 40)},0.6)`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(kx, ky, kr * 1.2, kr, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (plankId) {
    const lum = luminance(r, g, b);
    const textColor = lum > 0.5 ? '#111111' : '#FFFFFF';
    const strokeColor = lum > 0.5 ? '#FFFFFF' : '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const idSize = Math.max(16, Math.min(60, w * 0.18));
    ctx.font = `900 ${idSize}px Arial, sans-serif`;
    ctx.lineWidth = Math.max(3, idSize * 0.12);
    ctx.strokeStyle = strokeColor;
    ctx.shadowColor = lum > 0.5 ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 4;
    ctx.strokeText(plankId, w / 2, h / 2 - idSize * 0.3);
    ctx.fillStyle = textColor;
    ctx.fillText(plankId, w / 2, h / 2 - idSize * 0.3);

    const dimSize = Math.max(11, idSize * 0.55);
    ctx.font = `bold ${dimSize}px Arial, sans-serif`;
    ctx.lineWidth = Math.max(2, dimSize * 0.1);
    ctx.strokeText(`${dims.lenX}x${dims.lenY}x${dims.lenZ}`, w / 2, h / 2 + idSize * 0.55);
    ctx.fillText(`${dims.lenX}x${dims.lenY}x${dims.lenZ}`, w / 2, h / 2 + idSize * 0.55);
    ctx.shadowBlur = 0;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

// ============================================
// PLANK MESH
// ============================================
interface PlankMeshProps {
  plank: PlankData;
  targetOpacity: number;
  isCurrentStep: boolean;
  isSelected: boolean;
  explodeAmount: number;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

function PlankMesh({ plank, targetOpacity, isCurrentStep, isSelected, explodeAmount, onClick, onPointerOver, onPointerOut }: PlankMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const opacityRef = useRef(targetOpacity);

  // App Script: mesh.position.set(plank.x + lenX/2, plank.z + lenZ/2, -(plank.y + lenY/2))
  const basePos = useMemo((): [number, number, number] => [
    plank.position.x + plank.dimensions.lenX / 2,
    plank.position.z + plank.dimensions.lenZ / 2,
    -(plank.position.y + plank.dimensions.lenY / 2),
  ], [plank.position, plank.dimensions]);

  const explodeVec = useMemo((): [number, number, number] => {
    if (explodeAmount <= 0) return [0, 0, 0];
    const ed = plank.explodeDirection;
    return [ed.x * explodeAmount, ed.z * explodeAmount, -ed.y * explodeAmount];
  }, [plank.explodeDirection, explodeAmount]);

  const targetPos = useMemo(
    () => new THREE.Vector3(basePos[0] + explodeVec[0], basePos[1] + explodeVec[1], basePos[2] + explodeVec[2]),
    [basePos, explodeVec],
  );

  // App Script: BoxGeometry(lenX, lenZ, lenY)
  const geoArgs = useMemo((): [number, number, number] => [
    plank.dimensions.lenX,
    plank.dimensions.lenZ,
    plank.dimensions.lenY,
  ], [plank.dimensions]);

  const seedHash = useMemo(() => {
    let h = 0;
    for (let i = 0; i < plank.id.length; i++) h = ((h << 5) - h + plank.id.charCodeAt(i)) | 0;
    return Math.abs(h);
  }, [plank.id]);

  const texture = useMemo(() => {
    const faceW = Math.max(plank.dimensions.lenX, plank.dimensions.lenY);
    const faceH = Math.max(plank.dimensions.lenZ, Math.min(plank.dimensions.lenX, plank.dimensions.lenY));
    return generateWoodTexture(plank.materialColor, faceW, faceH, plank.id, plank.dimensions, seedHash);
  }, [plank.materialColor, plank.id, plank.dimensions, seedHash]);

  const emissiveColor = useMemo(() => {
    if (isSelected) return new THREE.Color(0x333300);
    if (isCurrentStep) return new THREE.Color(0x225522);
    return new THREE.Color(0x000000);
  }, [isSelected, isCurrentStep]);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.lerp(targetPos, 0.12);
    opacityRef.current += (targetOpacity - opacityRef.current) * 0.12;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    if (mat.opacity !== undefined) {
      mat.opacity = opacityRef.current;
      mat.transparent = opacityRef.current < 0.99;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={basePos}
      castShadow
      receiveShadow
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={(e) => { e.stopPropagation(); onPointerOver?.(); }}
      onPointerOut={onPointerOut}
    >
      <boxGeometry args={geoArgs} />
      <meshStandardMaterial
        map={texture}
        roughness={0.72}
        metalness={0.0}
        envMapIntensity={0.35}
        transparent
        opacity={targetOpacity}
        emissive={emissiveColor}
        emissiveIntensity={isSelected ? 0.4 : isCurrentStep ? 0.3 : 0}
      />
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...geoArgs)]} />
        <lineBasicMaterial color={0x374151} transparent opacity={0.3} />
      </lineSegments>
    </mesh>
  );
}

// ============================================
// WALL SURFACE — vertical backdrop, always behind all boxes
// ============================================
function WallSurface({ wall, boxes }: { wall: WallData; boxes: BoxData[] }) {
  const { wallW, wallH, cx, cy, cz } = useMemo(() => {
    if (boxes.length === 0) {
      const fw = wall.dimensions.lenX || 5000;
      const fh = wall.dimensions.lenZ || 3000;
      return { wallW: fw, wallH: fh, cx: fw / 2, cy: fh / 2, cz: -200 };
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, maxZ_back = -Infinity;
    for (const box of boxes) {
      const bx = box.position.x;
      const by = box.position.z;
      const bz_front = -box.position.y;
      const bw = box.dimensions.lenX || 500;
      const bh = box.dimensions.lenZ || 500;
      const bd = box.dimensions.lenY || 500;

      minX = Math.min(minX, bx);
      maxX = Math.max(maxX, bx + bw);
      minY = Math.min(minY, by);
      maxY = Math.max(maxY, by + bh);
      maxZ_back = Math.max(maxZ_back, Math.abs(bz_front) + bd);
    }

    const pad = 400;
    const computedW = (maxX - minX) + pad * 2;
    const computedH = (maxY - minY) + pad * 2;
    const wallWidth = Math.max(computedW, wall.dimensions.lenX || 0);
    const wallHeight = Math.max(computedH, wall.dimensions.lenZ || 0);

    return {
      wallW: wallWidth,
      wallH: wallHeight,
      cx: (minX + maxX) / 2,
      cy: (minY + maxY) / 2,
      cz: -(maxZ_back + 200),
    };
  }, [wall.dimensions, boxes]);

  return (
    <mesh position={[cx, cy, cz]} receiveShadow>
      <boxGeometry args={[wallW, wallH, 30]} />
      <meshLambertMaterial color={COLORS.wallColor} transparent opacity={0.8} />
    </mesh>
  );
}

// ============================================
// BOX GROUP
// ============================================
interface BoxGroupProps {
  box: BoxData;
  isActiveBox: boolean;
  currentStep: number;
  explodeAmount: number;
  selectedPlankId: string | null;
  forwardOffset: number;
  onPlankClick: (plank: PlankData, box: BoxData) => void;
  onPlankHover: (plank: PlankData | null) => void;
}

function BoxGroup({ box, isActiveBox, currentStep, explodeAmount, selectedPlankId, forwardOffset, onPlankClick, onPlankHover }: BoxGroupProps) {
  const groupRef = useRef<THREE.Group>(null);

  // App Script: boxGroup3D.position.set(box.position.x, box.position.z, -box.position.y)
  const basePos = useMemo((): THREE.Vector3 =>
    new THREE.Vector3(box.position.x, box.position.z, -box.position.y),
    [box.position],
  );

  const targetPos = useMemo(
    () => new THREE.Vector3(basePos.x, basePos.y, basePos.z + forwardOffset),
    [basePos, forwardOffset],
  );

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.lerp(targetPos, 0.08);
    }
  });

  const sortedPlanks = useMemo(
    () => [...box.planks].sort((a, b) => (a.assemblyOrder ?? 7) - (b.assemblyOrder ?? 7)),
    [box.planks],
  );

  return (
    <group ref={groupRef} position={[basePos.x, basePos.y, basePos.z]}>
      {sortedPlanks.map((plank, idx) => {
        const step = idx + 1;
        let opacity: number;
        let isCurrent = false;

        if (!isActiveBox) {
          opacity = 0.15;
        } else if (currentStep === 0) {
          opacity = 0.95;
        } else if (step < currentStep) {
          opacity = 0.7;
        } else if (step === currentStep) {
          opacity = 1.0;
          isCurrent = true;
        } else {
          opacity = 0.2;
        }

        return (
          <PlankMesh
            key={plank.id}
            plank={plank}
            targetOpacity={opacity}
            isCurrentStep={isCurrent}
            isSelected={selectedPlankId === plank.id}
            explodeAmount={isActiveBox ? explodeAmount : 0}
            onClick={() => onPlankClick(plank, box)}
            onPointerOver={() => onPlankHover(plank)}
            onPointerOut={() => onPlankHover(null)}
          />
        );
      })}
    </group>
  );
}

// ============================================
// CAMERA ANIMATOR — lerps camera to target, then releases control
// ============================================
function CameraAnimator({ target, lookAt, onReached }: { target: THREE.Vector3 | null; lookAt: THREE.Vector3 | null; onReached?: () => void }) {
  const { camera } = useThree();
  const controlsRef = useRef<{ target: THREE.Vector3 } | null>(null);

  const orbitControls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3 } | null;
  useEffect(() => { controlsRef.current = orbitControls; }, [orbitControls]);

  useFrame(() => {
    let posReached = !target;
    let lookReached = !lookAt;

    if (target) {
      camera.position.lerp(target, 0.06);
      if (camera.position.distanceTo(target) < 10) {
        posReached = true;
      }
    }
    if (lookAt && controlsRef.current) {
      controlsRef.current.target.lerp(lookAt, 0.06);
      if (controlsRef.current.target.distanceTo(lookAt) < 10) {
        lookReached = true;
      }
    }

    if (posReached && lookReached && (target || lookAt)) {
      onReached?.();
    }
  });

  return null;
}

// ============================================
// MAIN PAGE
// ============================================
export default function InstallationGuidePage() {
  const walls = useDesignerStore((s) => s.walls);
  const rawData = useDesignerStore((s) => s.rawData);
  const pipelineResult = useDesignerStore((s) => s.pipelineResult);
  const projectName = useDesignerStore((s) => s.projectName);

  const [selectedWallIdx, setSelectedWallIdx] = useState(-1);
  const [selectedBoxIdx, setSelectedBoxIdx] = useState(-1);
  const [previousBoxIdx, setPreviousBoxIdx] = useState(-1);
  const [currentStep, setCurrentStep] = useState(0);
  const [explodeAmount, setExplodeAmount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedPlankId, setSelectedPlankId] = useState<string | null>(null);
  const [hoveredPlank, setHoveredPlank] = useState<PlankData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);

  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3 | null>(null);
  const [cameraLookAt, setCameraLookAt] = useState<THREE.Vector3 | null>(null);

  const handleCameraReached = useCallback(() => {
    setCameraTarget(null);
    setCameraLookAt(null);
  }, []);

  // Build visualization data
  const visualizationData = useMemo((): VisualizationData | null => {
    let rawValues: unknown[][];

    if (rawData && Array.isArray(rawData) && rawData.length > 0) {
      const header = Object.keys((rawData as Record<string, unknown>[])[0]);
      const rows = (rawData as Record<string, unknown>[]).map((r) => header.map((h) => r[h]));
      rawValues = [header, ...rows];
      if (pipelineResult?.formattedData?.header?.length) {
        try {
          rawValues = syncPlankIdsToRaw(
            { header: pipelineResult.formattedData.header, rows: pipelineResult.formattedData.rows },
            rawValues,
          );
        } catch { /* keep rawValues as-is */ }
      }
    } else if (walls.length > 0) {
      const rawDataRows = generateRawData(walls);
      rawValues = convertDesignerRawDataTo2D(rawDataRows as Parameters<typeof convertDesignerRawDataTo2D>[0]);
      if (pipelineResult?.formattedData?.header?.length) {
        try {
          rawValues = syncPlankIdsToRaw(
            { header: pipelineResult.formattedData.header, rows: pipelineResult.formattedData.rows },
            rawValues,
          );
        } catch { /* keep rawValues as-is */ }
      }
    } else {
      return null;
    }

    if (rawValues.length < 2) return null;

    try {
      let vizData = buildInstallationGuide(rawValues);
      if (pipelineResult?.formattedData?.header?.length) {
        vizData = enrichMaterialFromPipeline(vizData, pipelineResult.formattedData);
      }
      return vizData;
    } catch (err) {
      console.error('Failed to build installation guide:', err);
      return null;
    }
  }, [rawData, walls, pipelineResult]);

  const allWalls = visualizationData?.walls ?? [];
  const materialLegend = visualizationData?.materialLegend ?? [];
  const summary = visualizationData?.summary;

  // Auto-select first wall on load
  useEffect(() => {
    if (allWalls.length > 0 && selectedWallIdx < 0) {
      setSelectedWallIdx(0);
      setLoading(false);
    } else if (allWalls.length === 0) {
      setLoading(false);
    }
  }, [allWalls, selectedWallIdx]);

  const selectedWall = selectedWallIdx >= 0 ? allWalls[selectedWallIdx] ?? null : null;
  const selectedBox = selectedWall && selectedBoxIdx >= 0 ? selectedWall.boxes[selectedBoxIdx] ?? null : null;

  // Sorted planks of selected box
  const sortedPlanks = useMemo(() => {
    if (!selectedBox) return [];
    return [...selectedBox.planks].sort((a, b) => (a.assemblyOrder ?? 7) - (b.assemblyOrder ?? 7));
  }, [selectedBox]);

  const totalSteps = sortedPlanks.length;
  const currentPlank = currentStep > 0 ? sortedPlanks[currentStep - 1] ?? null : null;

  // Fit-to-view: camera to fit all boxes from the front
  const fitToView = useCallback(() => {
    if (!selectedWall) return;
    const boxes = selectedWall.boxes;
    let cx: number, cy: number, maxDim: number;
    if (boxes.length > 0) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const box of boxes) {
        minX = Math.min(minX, box.position.x);
        maxX = Math.max(maxX, box.position.x + (box.dimensions.lenX || 500));
        minY = Math.min(minY, box.position.z);
        maxY = Math.max(maxY, box.position.z + (box.dimensions.lenZ || 500));
      }
      cx = (minX + maxX) / 2;
      cy = (minY + maxY) / 2;
      maxDim = Math.max(maxX - minX, maxY - minY);
    } else {
      const lenX = selectedWall.dimensions.lenX || 5000;
      const lenZ = selectedWall.dimensions.lenZ || 3000;
      cx = lenX / 2;
      cy = lenZ / 2;
      maxDim = Math.max(lenX, lenZ);
    }
    const dist = maxDim * 1.8;
    setCameraTarget(new THREE.Vector3(cx + dist * 0.3, cy + dist * 0.3, dist * 1.2));
    setCameraLookAt(new THREE.Vector3(cx, cy, 0));
  }, [selectedWall]);


  // Wall selection (no camera animation — user controls orbit freely)
  const handleSelectWall = useCallback((idx: number) => {
    setSelectedWallIdx(idx);
    setSelectedBoxIdx(-1);
    setPreviousBoxIdx(-1);
    setCurrentStep(0);
    setExplodeAmount(0);
    setSelectedPlankId(null);
  }, []);

  // Box selection (no camera animation — user controls orbit freely)
  const handleSelectBox = useCallback((idx: number) => {
    setPreviousBoxIdx(selectedBoxIdx);
    setSelectedBoxIdx(idx);
    setCurrentStep(0);
    setExplodeAmount(0);
    setSelectedPlankId(null);
  }, [selectedBoxIdx]);

  // Plank click handler (view-only)
  const handlePlankClick = useCallback((plank: PlankData, box: BoxData) => {
    if (!selectedWall) return;
    const boxIdx = selectedWall.boxes.findIndex((b) => b.id === box.id);

    if (boxIdx >= 0 && boxIdx !== selectedBoxIdx) {
      handleSelectBox(boxIdx);
    }
    const stepIdx = sortedPlanks.findIndex((p) => p.id === plank.id);
    if (stepIdx >= 0) {
      setCurrentStep(stepIdx + 1);
    }
  }, [selectedWall, selectedBoxIdx, handleSelectBox, sortedPlanks]);

  // Step controls
  const changeStep = useCallback((delta: number) => {
    setCurrentStep((prev) => Math.max(0, Math.min(prev + delta, totalSteps)));
  }, [totalSteps]);

  // Mouse tracking for tooltip
  useEffect(() => {
    const handler = (e: MouseEvent) => setTooltipPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);


  // ============================================
  // NO DATA STATE
  // ============================================
  if (!loading && allWalls.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-10 text-center max-w-md border border-orange-100">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-orange-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-blue-900 mb-3">No Design Data</h1>
          <p className="text-gray-500 mb-8">
            Generate files from raw data or create a design to view the installation guide.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/visualiser/designer" className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium shadow-md shadow-orange-500/25">
              Go to Designer
            </Link>
            <Link href="/visualiser/generate" className="px-6 py-3 bg-orange-100 text-orange-700 rounded-xl hover:bg-orange-200 transition-colors font-medium">
              Generate Files
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER — Full-screen 3D with floating UI
  // ============================================
  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* ======== LOADING OVERLAY ======== */}
      {loading && (
        <div className="absolute inset-0 z-[1000] bg-white flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: COLORS.ashLight, borderTopColor: COLORS.primary }} />
          <p className="mt-4 text-sm" style={{ color: COLORS.textMedium }}>Loading Installation Guide...</p>
        </div>
      )}

      {/* ======== 3D CANVAS (full screen) ======== */}
      <div className="absolute inset-0">
        <Canvas
          shadows
          camera={{ position: [3000, 2000, 4000], fov: 45, near: 1, far: 100000 }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
          onCreated={({ scene }) => { scene.background = new THREE.Color(SCENE_BG); }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[2000, 3000, 2000]} intensity={0.6} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-far={30000} shadow-camera-left={-5000} shadow-camera-right={5000} shadow-camera-top={5000} shadow-camera-bottom={-5000} />
            <directionalLight position={[-1000, 1000, -1000]} intensity={0.3} />

            {selectedWall && <WallSurface wall={selectedWall} boxes={selectedWall.boxes} />}

            {selectedWall?.boxes.map((box, idx) => (
              <BoxGroup
                key={box.id}
                box={box}
                isActiveBox={selectedBoxIdx < 0 || idx === selectedBoxIdx}
                currentStep={idx === selectedBoxIdx ? currentStep : 0}
                explodeAmount={idx === selectedBoxIdx ? explodeAmount : 0}
                selectedPlankId={selectedPlankId}
                forwardOffset={idx === selectedBoxIdx ? FORWARD_DISTANCE : 0}
                onPlankClick={handlePlankClick}
                onPlankHover={setHoveredPlank}
              />
            ))}

            <OrbitControls
              makeDefault
              enableDamping
              dampingFactor={0.05}
              screenSpacePanning
              minDistance={500}
              maxDistance={15000}
            />
            <Environment preset="studio" />

            <CameraAnimator target={cameraTarget} lookAt={cameraLookAt} onReached={handleCameraReached} />
          </Suspense>
        </Canvas>
      </div>

      {/* ======== TOOLTIP ======== */}
      {hoveredPlank && (
        <div
          className="fixed pointer-events-none z-[300] bg-white text-sm rounded-xl shadow-xl max-w-[250px] leading-relaxed"
          style={{
            left: tooltipPos.x + 15,
            top: tooltipPos.y + 15,
            borderLeft: `4px solid ${COLORS.primary}`,
            padding: '12px 16px',
            color: COLORS.textDark,
          }}
        >
          <strong style={{ color: COLORS.primary, fontSize: '16px' }}>{hoveredPlank.id}</strong><br />
          <strong>{hoveredPlank.entityName}</strong><br />
          <span style={{ color: COLORS.ash, fontSize: '11px' }}>{hoveredPlank.material || 'No material'}</span><br />
          <span style={{ fontFamily: 'monospace' }}>
            {hoveredPlank.dimensions.lenX} x {hoveredPlank.dimensions.lenY} x {hoveredPlank.dimensions.lenZ} mm
          </span>
        </div>
      )}

      {/* ======== FLOATING MENU BUTTON (top-left) ======== */}
      <button
        onClick={() => setPanelOpen(true)}
        className="absolute top-5 left-5 z-[100] w-14 h-14 rounded-full bg-white shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-2xl"
        style={{ color: COLORS.textDark }}
        title="Menu"
      >
        &#9776;
      </button>

      {/* ======== FLOATING PRINT BUTTON (top-right) ======== */}
      <button
        onClick={() => window.print()}
        className="absolute top-5 right-5 z-[100] w-14 h-14 rounded-full bg-white shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-xl print:hidden"
        style={{ color: COLORS.textDark }}
        title="Print"
      >
        &#128424;
      </button>

      {/* ======== FLOATING FIT BUTTON (bottom-right) ======== */}
      <button
        onClick={fitToView}
        className="absolute bottom-[100px] right-5 z-[100] w-14 h-14 rounded-full shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-xl text-white print:hidden"
        style={{ background: COLORS.primary }}
        title="Fit View"
      >
        &#8857;
      </button>

      {/* ======== CURRENT PLANK INFO (bottom-left) ======== */}
      {selectedBoxIdx >= 0 && currentStep > 0 && currentPlank && (
        <div
          className="absolute bottom-5 left-5 z-[100] bg-white rounded-2xl shadow-lg max-w-[280px] p-4 print:hidden"
        >
          <div className="text-3xl font-extrabold font-mono" style={{ color: COLORS.primary }}>{currentPlank.id}</div>
          <div className="text-base font-semibold mt-1" style={{ color: COLORS.textDark }}>{currentPlank.entityName}</div>
          {selectedBox && (
            <div className="text-xs mt-0.5" style={{ color: COLORS.ash }}>
              {selectedBox.roomName} &bull; {selectedBox.entityName}
            </div>
          )}
          <div className="text-xs mt-0.5" style={{ color: COLORS.textMedium }}>{currentPlank.material || 'No material'}</div>
          <div className="text-sm font-semibold font-mono mt-2 pt-2" style={{ color: COLORS.textDark, borderTop: `1px solid ${COLORS.ashLight}` }}>
            {currentPlank.dimensions.lenX} x {currentPlank.dimensions.lenY} x {currentPlank.dimensions.lenZ} mm
          </div>
          <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: '#FFF7ED', color: COLORS.primary }}>
            <span className="text-2xl">{currentPlank.assemblyDirection?.arrow ?? '\u2022'}</span>
            <span>{currentPlank.assemblyDirection?.text ?? 'Place part'}</span>
          </div>
        </div>
      )}

      {/* ======== STEP CONTROLS (bottom-center pill) ======== */}
      {selectedBoxIdx >= 0 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-white px-6 py-3 rounded-full shadow-xl print:hidden">
          <button
            onClick={() => changeStep(-1)}
            disabled={currentStep <= 0}
            className="w-12 h-12 rounded-full border-2 text-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:border-orange-500 hover:text-orange-500"
            style={{ borderColor: COLORS.ashLight, color: COLORS.textDark, background: COLORS.white }}
          >
            &#9664;
          </button>
          <div className="text-center min-w-[80px]">
            <div className="text-2xl font-bold" style={{ color: COLORS.primary }}>{currentStep}</div>
            <div className="text-xs" style={{ color: COLORS.textMedium }}>of {totalSteps}</div>
          </div>
          <button
            onClick={() => changeStep(1)}
            disabled={currentStep >= totalSteps}
            className="w-12 h-12 rounded-full border-2 text-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: COLORS.primary, borderColor: COLORS.primary, color: COLORS.white }}
          >
            &#9654;
          </button>
        </div>
      )}

      {/* ======== OVERLAY (when panel is open) ======== */}
      <div
        className={`absolute inset-0 z-[150] transition-all duration-300 ${panelOpen ? 'bg-black/30 visible pointer-events-auto' : 'invisible opacity-0 pointer-events-none'}`}
        onClick={() => setPanelOpen(false)}
      />

      {/* ======== SLIDE-IN PANEL (left) ======== */}
      <div
        className={`absolute top-0 left-0 h-full bg-white shadow-xl z-[200] flex flex-col overflow-hidden transition-transform duration-300 print:hidden ${panelOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 340 }}
      >
        {/* Panel header */}
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.ashLight }}>
          <div className="text-lg font-bold" style={{ color: COLORS.textDark }}>Installation Guide</div>
          <button
            onClick={() => setPanelOpen(false)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all hover:text-white"
            style={{ background: COLORS.ashLight, color: COLORS.textDark }}
            onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.primary; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.ashLight; e.currentTarget.style.color = COLORS.textDark; }}
          >
            &#10005;
          </button>
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Wall Selector */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: COLORS.textMedium }}>Select Wall</div>
            <select
              className="w-full px-4 py-3.5 rounded-xl text-sm font-medium border-2 cursor-pointer focus:outline-none"
              style={{ borderColor: COLORS.ashLight, color: COLORS.textDark }}
              value={selectedWallIdx}
              onChange={(e) => handleSelectWall(parseInt(e.target.value))}
              onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.primary; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.ashLight; }}
            >
              <option value={-1}>-- Choose Wall --</option>
              {allWalls.map((w, i) => (
                <option key={w.id} value={i}>
                  {w.entityName || `Wall ${i + 1}`}{w.roomName ? ` (${w.roomName})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Box List */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: COLORS.textMedium }}>
              Boxes {selectedWall ? `(${selectedWall.boxes.length})` : ''}
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {selectedWall ? selectedWall.boxes.map((box, idx) => (
                <button
                  key={box.id}
                  onClick={() => { handleSelectBox(idx); setPanelOpen(false); }}
                  className="w-full text-left px-3.5 py-3 rounded-xl border-2 transition-all cursor-pointer"
                  style={{
                    borderColor: idx === selectedBoxIdx ? COLORS.primary : COLORS.ashLight,
                    background: idx === selectedBoxIdx ? '#FFF7ED' : COLORS.white,
                  }}
                >
                  <div className="text-sm font-semibold" style={{ color: COLORS.textDark }}>{box.entityName || `Box ${idx + 1}`}</div>
                  <div className="text-xs mt-1" style={{ color: COLORS.textMedium }}>{box.planks.length} planks</div>
                </button>
              )) : (
                <div className="py-5 text-center text-sm" style={{ color: COLORS.textMedium }}>Select a wall first</div>
              )}
            </div>
          </div>

          {/* Explode Slider */}
          <div className="p-4 rounded-xl" style={{ background: COLORS.bgLight }}>
            <div className="flex justify-between mb-3">
              <span className="text-xs font-semibold" style={{ color: COLORS.textDark }}>Explode View</span>
              <span className="text-xs font-bold" style={{ color: COLORS.primary }}>{Math.round(explodeAmount * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(explodeAmount * 100)}
              onChange={(e) => setExplodeAmount(parseInt(e.target.value) / 100)}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ background: COLORS.ashLight, accentColor: COLORS.primary }}
            />
          </div>

          {/* Parts Checklist */}
          {selectedBox && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: COLORS.textMedium }}>Parts Checklist</div>
              <div className="max-h-[200px] overflow-y-auto space-y-1.5">
                {sortedPlanks.map((plank, idx) => {
                  const step = idx + 1;
                  const isDone = step < currentStep;
                  const isCurrent = step === currentStep;
                  return (
                    <button
                      key={plank.id}
                      onClick={() => setCurrentStep(step)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer text-left"
                      style={{ background: isCurrent ? COLORS.bgLight : 'transparent' }}
                    >
                      <div
                        className="w-5.5 h-5.5 rounded-md flex items-center justify-center text-sm shrink-0"
                        style={{
                          width: 22,
                          height: 22,
                          border: `2px solid ${isDone ? COLORS.primary : COLORS.ash}`,
                          background: isDone ? COLORS.primary : 'transparent',
                          color: isDone ? COLORS.white : 'transparent',
                          borderRadius: 6,
                        }}
                      >
                        {isDone ? '\u2713' : ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate" style={{ color: COLORS.textDark }}>{plank.entityName}</div>
                        <div className="text-[11px] font-mono truncate" style={{ color: COLORS.textMedium }}>{plank.material} &bull; {plank.dimensions.lenX}x{plank.dimensions.lenY}x{plank.dimensions.lenZ}</div>
                      </div>
                      <div className="text-sm font-bold font-mono shrink-0" style={{ color: COLORS.primary }}>{plank.id}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Material Legend */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: COLORS.textMedium }}>Material Legend</div>
            <div className="space-y-2">
              {materialLegend.map((m) => (
                <div key={m.name} className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md shrink-0" style={{ background: m.color, border: `1px solid ${COLORS.ashLight}` }} />
                  <span className="text-xs" style={{ color: COLORS.textDark }}>{m.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Back link */}
          <Link
            href="/visualiser/generate"
            className="block text-center text-sm font-medium py-3 rounded-xl transition-colors"
            style={{ background: COLORS.background, color: COLORS.primary }}
          >
            &larr; Back to Generate
          </Link>
        </div>

        {/* Panel footer with summary */}
        {summary && (
          <div className="px-5 py-3 border-t text-[11px]" style={{ borderColor: COLORS.ashLight, color: COLORS.textMedium }}>
            {summary.totalWalls} walls &bull; {summary.totalBoxes} cabinets &bull; {summary.totalPlanks} parts
          </div>
        )}
      </div>

      {/* ======== PRINT STYLES ======== */}
      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
