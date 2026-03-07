"use client";

/**
 * Floor Plan Viewer Component
 * 2D SVG-based visualization of the floor plan with walls and dimensions
 */

import React, { useMemo, useState, useRef, useCallback } from "react";
import { FloorPlanData, Wall, RoomDimensions, PlacedModule } from "@/types/lidar";

interface FloorPlanViewerProps {
  floorPlan: FloorPlanData | null;
  walls: Wall[];
  placedModules?: PlacedModule[];
  roomDimensions?: RoomDimensions | null;
  selectedWallId?: string | null;
  selectedModuleId?: string | null;
  onWallSelect?: (wallId: string | null) => void;
  onModuleSelect?: (moduleId: string | null) => void;
  showDimensions?: boolean;
  showGrid?: boolean;
}

export default function FloorPlanViewer({
  floorPlan,
  walls,
  placedModules = [],
  roomDimensions,
  selectedWallId,
  selectedModuleId,
  onWallSelect,
  onModuleSelect,
  showDimensions = true,
  showGrid = true,
}: FloorPlanViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Calculate viewBox dimensions
  const viewBox = useMemo(() => {
    if (!roomDimensions) {
      return { minX: 0, minY: 0, width: 10000, height: 10000 };
    }

    const padding = 1000;
    return {
      minX: -padding,
      minY: -padding,
      width: roomDimensions.width + padding * 2,
      height: roomDimensions.depth + padding * 2,
    };
  }, [roomDimensions]);

  // Handle zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.1, Math.min(5, prev * delta)));
  }, []);

  // Handle pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || e.button === 2) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    },
    [isPanning, panStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Generate grid lines
  const gridLines = useMemo(() => {
    if (!showGrid) return null;
    
    const gridSize = 500; // 500mm grid
    const lines: JSX.Element[] = [];
    
    for (let x = 0; x <= viewBox.width; x += gridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={viewBox.minY}
          x2={x}
          y2={viewBox.height + viewBox.minY}
          stroke="#E5E7EB"
          strokeWidth={x % 1000 === 0 ? 2 : 1}
        />
      );
    }
    
    for (let y = 0; y <= viewBox.height; y += gridSize) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={viewBox.minX}
          y1={y}
          x2={viewBox.width + viewBox.minX}
          y2={y}
          stroke="#E5E7EB"
          strokeWidth={y % 1000 === 0 ? 2 : 1}
        />
      );
    }
    
    return lines;
  }, [showGrid, viewBox]);

  // Format dimension text
  const formatDimension = (mm: number) => {
    if (mm >= 1000) {
      return `${(mm / 1000).toFixed(2)}m`;
    }
    return `${Math.round(mm)}mm`;
  };

  return (
    <div className="relative w-full h-full bg-white overflow-hidden">
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox={`${viewBox.minX - pan.x / zoom} ${viewBox.minY - pan.y / zoom} ${viewBox.width / zoom} ${viewBox.height / zoom}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
      >
        {/* Defs for patterns */}
        <defs>
          <pattern
            id="wall-pattern"
            patternUnits="userSpaceOnUse"
            width="40"
            height="40"
          >
            <line
              x1="0"
              y1="0"
              x2="40"
              y2="40"
              stroke="#666"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* Grid */}
        <g>{gridLines}</g>

        {/* Floor Plan Boundary */}
        {floorPlan?.boundary && floorPlan.boundary.length > 0 && (
          <polygon
            points={floorPlan.boundary.map(([x, y]) => `${x},${y}`).join(" ")}
            fill="#F9FAFB"
            stroke="#374151"
            strokeWidth={4}
          />
        )}

        {/* Walls */}
        <g>
          {walls.map((wall) => {
            const isSelected = selectedWallId === wall.id;
            const wallThickness = 100;

            // Calculate perpendicular offset for wall thickness
            const dx = wall.endPoint.x - wall.startPoint.x;
            const dy = wall.endPoint.y - wall.startPoint.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const nx = (dy / length) * (wallThickness / 2);
            const ny = (-dx / length) * (wallThickness / 2);

            const points = [
              [wall.startPoint.x + nx, wall.startPoint.y + ny],
              [wall.endPoint.x + nx, wall.endPoint.y + ny],
              [wall.endPoint.x - nx, wall.endPoint.y - ny],
              [wall.startPoint.x - nx, wall.startPoint.y - ny],
            ];

            return (
              <g key={wall.id}>
                {/* Wall shape */}
                <polygon
                  points={points.map(([x, y]) => `${x},${y}`).join(" ")}
                  fill={isSelected ? "#3B82F6" : "#6B7280"}
                  stroke={isSelected ? "#1D4ED8" : "#374151"}
                  strokeWidth={2}
                  className="cursor-pointer transition-colors"
                  onClick={() => onWallSelect?.(wall.id)}
                >
                  <title>Wall {wall.wallIndex + 1}: {formatDimension(wall.length)}</title>
                </polygon>

                {/* Dimension line */}
                {showDimensions && (
                  <>
                    {/* Center line for dimension */}
                    <line
                      x1={wall.startPoint.x}
                      y1={wall.startPoint.y - 150}
                      x2={wall.endPoint.x}
                      y2={wall.endPoint.y - 150}
                      stroke="#EF4444"
                      strokeWidth={2}
                      markerStart="url(#arrow-start)"
                      markerEnd="url(#arrow-end)"
                    />
                    
                    {/* Dimension text */}
                    <text
                      x={(wall.startPoint.x + wall.endPoint.x) / 2}
                      y={(wall.startPoint.y + wall.endPoint.y) / 2 - 200}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#374151"
                      fontSize="60"
                      fontWeight="bold"
                      className="select-none"
                    >
                      {formatDimension(wall.length)}
                    </text>
                  </>
                )}

                {/* Wall label */}
                <text
                  x={(wall.startPoint.x + wall.endPoint.x) / 2}
                  y={(wall.startPoint.y + wall.endPoint.y) / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="50"
                  fontWeight="bold"
                  className="select-none pointer-events-none"
                >
                  {wall.wallIndex + 1}
                </text>
              </g>
            );
          })}
        </g>

        {/* Placed Modules */}
        <g>
          {placedModules.map((module) => {
            const isSelected = selectedModuleId === module.id;
            const rotation = module.rotation || 0;

            return (
              <g
                key={module.id}
                transform={`translate(${module.position.x}, ${module.position.y}) rotate(${rotation})`}
              >
                <rect
                  x={-module.dimensions.width / 2}
                  y={-module.dimensions.depth / 2}
                  width={module.dimensions.width}
                  height={module.dimensions.depth}
                  fill={isSelected ? "#F59E0B" : "#D97706"}
                  stroke={isSelected ? "#B45309" : "#92400E"}
                  strokeWidth={3}
                  className="cursor-pointer transition-colors"
                  onClick={() => onModuleSelect?.(module.id)}
                >
                  <title>{module.template?.name || "Module"}</title>
                </rect>
              </g>
            );
          })}
        </g>

        {/* Origin marker */}
        <g>
          <circle cx={0} cy={0} r={30} fill="#EF4444" />
          <text
            x={50}
            y={50}
            fontSize="40"
            fill="#374151"
            className="select-none"
          >
            Origin
          </text>
        </g>

        {/* Room dimensions */}
        {roomDimensions && showDimensions && (
          <g>
            {/* Width dimension */}
            <text
              x={roomDimensions.width / 2}
              y={-80}
              textAnchor="middle"
              fontSize="80"
              fontWeight="bold"
              fill="#1F2937"
              className="select-none"
            >
              W: {formatDimension(roomDimensions.width)}
            </text>

            {/* Depth dimension */}
            <text
              x={-80}
              y={roomDimensions.depth / 2}
              textAnchor="middle"
              fontSize="80"
              fontWeight="bold"
              fill="#1F2937"
              transform={`rotate(-90, -80, ${roomDimensions.depth / 2})`}
              className="select-none"
            >
              D: {formatDimension(roomDimensions.depth)}
            </text>

            {/* Area */}
            <text
              x={roomDimensions.width / 2}
              y={roomDimensions.depth / 2}
              textAnchor="middle"
              fontSize="100"
              fill="#6B7280"
              className="select-none"
            >
              {roomDimensions.area.toFixed(1)} m²
            </text>
          </g>
        )}
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
        <button
          onClick={() => setZoom((prev) => Math.min(5, prev * 1.2))}
          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-lg font-bold"
        >
          +
        </button>
        <span className="text-xs text-center text-gray-600">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((prev) => Math.max(0.1, prev / 1.2))}
          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-lg font-bold"
        >
          −
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-xs"
          title="Reset view"
        >
          ↺
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-lg shadow p-3 text-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 bg-gray-500 rounded-sm"></div>
          <span>Walls</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 bg-amber-600 rounded-sm"></div>
          <span>Modules</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span>Origin</span>
        </div>
      </div>
    </div>
  );
}
