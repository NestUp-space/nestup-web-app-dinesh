"use client";

/**
 * Point Cloud Viewer Component
 * Interactive 3D visualization of raw LiDAR scan point cloud data
 */

import React, { useRef, useMemo, useState, useCallback, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Html,
  Line,
} from "@react-three/drei";
import * as THREE from "three";

// ============================================
// Types
// ============================================

export interface ScanPoint {
  scanSeq: number;
  pointIdx: number;
  angleRad: number;
  rangeM: number;
  intensity: number;
  x: number;
  y: number;
  z?: number;
}

interface PointCloudViewerProps {
  points: ScanPoint[];
  colorMode?: "intensity" | "height" | "distance" | "scan";
  pointSize?: number;
  showGrid?: boolean;
  showAxes?: boolean;
  onPointSelect?: (point: ScanPoint | null) => void;
}

// ============================================
// Point Cloud Geometry Component
// ============================================

interface PointCloudMeshProps {
  points: ScanPoint[];
  colorMode: "intensity" | "height" | "distance" | "scan";
  pointSize: number;
}

function PointCloudMesh({ points, colorMode, pointSize }: PointCloudMeshProps) {
  const meshRef = useRef<THREE.Points>(null);

  // Create geometry from points
  const { positions, colors } = useMemo(() => {
    const posArray = new Float32Array(points.length * 3);
    const colorArray = new Float32Array(points.length * 3);

    // Calculate bounds for color mapping
    let minIntensity = Infinity,
      maxIntensity = -Infinity;
    let minDistance = Infinity,
      maxDistance = -Infinity;
    let minScan = Infinity,
      maxScan = -Infinity;

    for (const p of points) {
      minIntensity = Math.min(minIntensity, p.intensity);
      maxIntensity = Math.max(maxIntensity, p.intensity);
      minDistance = Math.min(minDistance, p.rangeM);
      maxDistance = Math.max(maxDistance, p.rangeM);
      minScan = Math.min(minScan, p.scanSeq);
      maxScan = Math.max(maxScan, p.scanSeq);
    }

    // Color helper
    const getColor = (point: ScanPoint): THREE.Color => {
      const color = new THREE.Color();

      switch (colorMode) {
        case "intensity": {
          const t =
            (point.intensity - minIntensity) / (maxIntensity - minIntensity || 1);
          // Blue to Red gradient
          color.setHSL(0.66 - t * 0.66, 1, 0.5);
          break;
        }
        case "distance": {
          const t =
            (point.rangeM - minDistance) / (maxDistance - minDistance || 1);
          // Green to Yellow to Red
          color.setHSL(0.33 - t * 0.33, 1, 0.5);
          break;
        }
        case "scan": {
          const t =
            (point.scanSeq - minScan) / (maxScan - minScan || 1);
          // Cycle through hue
          color.setHSL(t, 0.8, 0.5);
          break;
        }
        case "height":
        default: {
          const z = point.z || 0;
          const t = Math.max(0, Math.min(1, (z + 1) / 2));
          color.setHSL(0.66 - t * 0.66, 1, 0.5);
          break;
        }
      }

      return color;
    };

    // Fill arrays
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      // Scale from meters to millimeters and convert coordinate system
      // X stays X, Y becomes Z (depth), Z (if exists) becomes Y (up)
      posArray[i * 3] = p.x * 1000;
      posArray[i * 3 + 1] = (p.z || 0) * 1000;
      posArray[i * 3 + 2] = -p.y * 1000; // Negate Y for proper orientation

      const color = getColor(p);
      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }

    return { positions: posArray, colors: colorArray };
  }, [points, colorMode]);

  // Animate points slightly for visual effect
  useFrame((state) => {
    if (meshRef.current) {
      // Subtle rotation for better depth perception
      // meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={points.length}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={pointSize}
        vertexColors
        sizeAttenuation={true}
        transparent
        opacity={0.9}
      />
    </points>
  );
}

// ============================================
// Scene Component
// ============================================

interface SceneProps {
  points: ScanPoint[];
  colorMode: "intensity" | "height" | "distance" | "scan";
  pointSize: number;
  showGrid: boolean;
  showAxes: boolean;
}

function Scene({ points, colorMode, pointSize, showGrid, showAxes }: SceneProps) {
  // Calculate bounds for camera positioning
  const bounds = useMemo(() => {
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    for (const p of points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }

    const centerX = ((minX + maxX) / 2) * 1000;
    const centerY = ((minY + maxY) / 2) * 1000;
    const width = (maxX - minX) * 1000;
    const height = (maxY - minY) * 1000;
    const maxDim = Math.max(width, height);

    return { centerX, centerY, width, height, maxDim };
  }, [points]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[5000, 5000, 5000]} intensity={0.5} />

      {/* Camera Controls */}
      <OrbitControls
        target={[bounds.centerX, 0, -bounds.centerY]}
        enableDamping
        dampingFactor={0.05}
        minDistance={100}
        maxDistance={bounds.maxDim * 3}
      />

      {/* Grid */}
      {showGrid && (
        <gridHelper
          args={[bounds.maxDim * 2, 20, "#666666", "#333333"]}
          position={[bounds.centerX, -10, -bounds.centerY]}
        />
      )}

      {/* Axes */}
      {showAxes && (
        <group>
          <Line
            points={[
              [0, 0, 0],
              [500, 0, 0],
            ]}
            color="red"
            lineWidth={2}
          />
          <Line
            points={[
              [0, 0, 0],
              [0, 500, 0],
            ]}
            color="green"
            lineWidth={2}
          />
          <Line
            points={[
              [0, 0, 0],
              [0, 0, -500],
            ]}
            color="blue"
            lineWidth={2}
          />
          <Html position={[550, 0, 0]}>
            <span className="text-red-500 text-xs font-bold">X</span>
          </Html>
          <Html position={[0, 550, 0]}>
            <span className="text-green-500 text-xs font-bold">Y (up)</span>
          </Html>
          <Html position={[0, 0, -550]}>
            <span className="text-blue-500 text-xs font-bold">Z</span>
          </Html>
        </group>
      )}

      {/* Point Cloud */}
      <PointCloudMesh
        points={points}
        colorMode={colorMode}
        pointSize={pointSize}
      />

      {/* Origin marker */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[20, 16, 16]} />
        <meshBasicMaterial color="#FF0000" />
      </mesh>
    </>
  );
}

// ============================================
// Toolbar Component
// ============================================

interface ToolbarProps {
  colorMode: "intensity" | "height" | "distance" | "scan";
  pointSize: number;
  showGrid: boolean;
  showAxes: boolean;
  pointCount: number;
  onColorModeChange: (mode: "intensity" | "height" | "distance" | "scan") => void;
  onPointSizeChange: (size: number) => void;
  onToggleGrid: () => void;
  onToggleAxes: () => void;
}

function Toolbar({
  colorMode,
  pointSize,
  showGrid,
  showAxes,
  pointCount,
  onColorModeChange,
  onPointSizeChange,
  onToggleGrid,
  onToggleAxes,
}: ToolbarProps) {
  return (
    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30">
      {/* Left controls */}
      <div className="flex items-center gap-2 bg-white/95 backdrop-blur px-3 py-2 rounded-xl shadow-lg">
        {/* Color Mode */}
        <div className="flex items-center gap-1 pr-3 border-r border-gray-200">
          <span className="text-xs text-gray-500 mr-1">Color:</span>
          {(["intensity", "distance", "scan"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onColorModeChange(mode)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                colorMode === mode
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Point Size */}
        <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
          <span className="text-xs text-gray-500">Size:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={pointSize}
            onChange={(e) => onPointSizeChange(Number(e.target.value))}
            className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-600 w-4">{pointSize}</span>
        </div>

        {/* Toggle Options */}
        <div className="flex gap-1">
          <button
            onClick={onToggleGrid}
            title="Toggle Grid"
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${
              showGrid
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            #
          </button>
          <button
            onClick={onToggleAxes}
            title="Toggle Axes"
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${
              showAxes
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            ⊕
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white/95 backdrop-blur px-3 py-2 rounded-xl shadow-lg">
        <span className="text-sm text-gray-600">
          <span className="font-bold text-gray-900">
            {pointCount.toLocaleString()}
          </span>{" "}
          points
        </span>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function PointCloudViewer({
  points,
  colorMode: initialColorMode = "intensity",
  pointSize: initialPointSize = 3,
  showGrid: initialShowGrid = true,
  showAxes: initialShowAxes = true,
  onPointSelect,
}: PointCloudViewerProps) {
  const [colorMode, setColorMode] = useState(initialColorMode);
  const [pointSize, setPointSize] = useState(initialPointSize);
  const [showGrid, setShowGrid] = useState(initialShowGrid);
  const [showAxes, setShowAxes] = useState(initialShowAxes);

  // Calculate camera distance based on point bounds
  const cameraDistance = useMemo(() => {
    if (points.length === 0) return 2000;

    let maxDist = 0;
    for (const p of points) {
      const dist = Math.sqrt(p.x * p.x + p.y * p.y);
      maxDist = Math.max(maxDist, dist);
    }
    return maxDist * 1000 * 2; // Convert to mm and double for good view
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">☁️</div>
          <p>No point cloud data to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-gray-900 to-gray-800">
      {/* 3D Canvas */}
      <Canvas
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor("#1a1a2e");
        }}
      >
        <PerspectiveCamera
          makeDefault
          position={[cameraDistance, cameraDistance * 0.5, cameraDistance]}
          fov={50}
          near={1}
          far={cameraDistance * 10}
        />
        <Suspense fallback={null}>
          <Scene
            points={points}
            colorMode={colorMode}
            pointSize={pointSize}
            showGrid={showGrid}
            showAxes={showAxes}
          />
        </Suspense>
      </Canvas>

      {/* Toolbar */}
      <Toolbar
        colorMode={colorMode}
        pointSize={pointSize}
        showGrid={showGrid}
        showAxes={showAxes}
        pointCount={points.length}
        onColorModeChange={setColorMode}
        onPointSizeChange={setPointSize}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onToggleAxes={() => setShowAxes(!showAxes)}
      />

      {/* Color Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg shadow-lg p-3 z-30">
        <div className="text-xs font-medium text-gray-700 mb-2">
          Color: {colorMode.charAt(0).toUpperCase() + colorMode.slice(1)}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Low</span>
          <div
            className="w-24 h-3 rounded"
            style={{
              background:
                colorMode === "intensity"
                  ? "linear-gradient(to right, blue, cyan, green, yellow, red)"
                  : colorMode === "distance"
                  ? "linear-gradient(to right, green, yellow, red)"
                  : "linear-gradient(to right, red, yellow, green, cyan, blue, magenta)",
            }}
          />
          <span className="text-xs text-gray-500">High</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-lg shadow-lg p-3 z-30 text-xs text-gray-600">
        <div>🖱️ Left click + drag: Rotate</div>
        <div>🖱️ Right click + drag: Pan</div>
        <div>🖱️ Scroll: Zoom</div>
      </div>
    </div>
  );
}
