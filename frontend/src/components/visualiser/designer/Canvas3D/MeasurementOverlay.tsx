/**
 * MeasurementOverlay Component
 * 
 * HTML overlay UI for the Tape Measure tool.
 * Displays floating measurement labels, hover tooltips, and mode indicators.
 */

'use client';

import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { 
  Position, 
  MeasurementMode, 
  HoverMeasurementInfo,
  MeasurementResult,
} from '@/types/visualiser';
import { MeasurementInferencePoint } from '@/lib/visualiser/measurementTool';

// ============================================
// COORDINATE CONVERSION
// ============================================

function dataToThree(x: number, y: number, z: number): [number, number, number] {
  return [x, z, y];
}

function positionToThree(p: Position): [number, number, number] {
  return dataToThree(p.x, p.y, p.z);
}

// ============================================
// MEASUREMENT LABEL COMPONENT
// ============================================

interface MeasurementLabelProps {
  startPoint: Position;
  endPoint: Position;
  distance: number;
  dominantAxis: 'x' | 'y' | 'z' | '3d' | null;
  measurementAxisLock?: 'x' | 'y' | 'z' | null;
  deltaX: number;
  deltaY: number;
  deltaZ: number;
  cursorScreenPosition?: { x: number; y: number } | null;
}

export const MeasurementLabel: React.FC<MeasurementLabelProps> = ({
  startPoint,
  endPoint,
  distance,
  dominantAxis,
  measurementAxisLock,
  deltaX,
  deltaY,
  deltaZ,
  cursorScreenPosition,
}) => {
  const midpoint = useMemo(() => {
    return positionToThree({
      x: (startPoint.x + endPoint.x) / 2,
      y: (startPoint.y + endPoint.y) / 2,
      z: (startPoint.z + endPoint.z) / 2 + 50, // Offset above the line
    });
  }, [startPoint, endPoint]);

  const axisLabel = measurementAxisLock
    ? ` (${measurementAxisLock.toUpperCase()}-axis)`
    : dominantAxis === '3d'
      ? ''
      : ` along ${dominantAxis?.toUpperCase()}`;

  const content = (
    <div className="bg-gray-900/90 text-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
      <div className="text-lg font-bold text-green-400">
        {distance.toFixed(1)}mm
      </div>
      {axisLabel && (
        <div className="text-xs text-gray-300">{axisLabel}</div>
      )}
      <div className="text-xs text-gray-400 mt-1 flex gap-2">
        <span>ΔX:{Math.round(deltaX)}</span>
        <span>ΔY:{Math.round(deltaY)}</span>
        <span>ΔZ:{Math.round(deltaZ)}</span>
      </div>
    </div>
  );

  if (cursorScreenPosition) {
    return (
      <div
        className="fixed z-[70] pointer-events-none"
        style={{ left: cursorScreenPosition.x + 20, top: cursorScreenPosition.y - 30 }}
      >
        {content}
      </div>
    );
  }

  return (
    <Html position={midpoint} center style={{ pointerEvents: 'none' }}>
      {content}
    </Html>
  );
};

// ============================================
// HOVER TOOLTIP COMPONENT
// ============================================

interface HoverTooltipProps {
  hoverInfo: HoverMeasurementInfo;
}

export const HoverTooltip: React.FC<HoverTooltipProps> = ({ hoverInfo }) => {
  const position = positionToThree({
    ...hoverInfo.position,
    z: hoverInfo.position.z + 30,
  });

  return (
    <Html position={position} center style={{ pointerEvents: 'none' }}>
      <div className="bg-yellow-400 text-gray-900 px-2 py-1 rounded text-sm font-mono shadow-lg whitespace-nowrap">
        {hoverInfo.type === 'edge' ? (
          <span>{hoverInfo.length}mm</span>
        ) : (
          <span>{hoverInfo.area}mm²</span>
        )}
      </div>
    </Html>
  );
};

// ============================================
// SNAP LABEL COMPONENT
// ============================================

interface SnapLabelProps {
  snapPoint: MeasurementInferencePoint;
}

export const SnapLabel: React.FC<SnapLabelProps> = ({ snapPoint }) => {
  const position = positionToThree({
    ...snapPoint.position,
    z: snapPoint.position.z + 40,
  });

  return (
    <Html position={position} center style={{ pointerEvents: 'none' }}>
      <div className="bg-gray-800/80 text-white px-2 py-0.5 rounded text-xs whitespace-nowrap">
        {snapPoint.label}
      </div>
    </Html>
  );
};

// ============================================
// MODE INDICATOR COMPONENT
// ============================================

interface ModeIndicatorProps {
  mode: MeasurementMode;
  isCtrlPressed: boolean;
}

export const ModeIndicator: React.FC<ModeIndicatorProps> = ({ mode, isCtrlPressed }) => {
  return (
    <div className="absolute top-4 left-4 bg-gray-900/80 text-white px-3 py-2 rounded-lg text-sm">
      <div className="flex items-center gap-2">
        <span className="text-green-400">📏</span>
        <span className="font-medium">
          {mode === 'measure' ? 'Measure Mode' : 'Guide Create Mode'}
        </span>
      </div>
      <div className="text-xs text-gray-400 mt-1">
        {isCtrlPressed ? 'Release Ctrl for Measure' : 'Hold Ctrl for Guide Create'}
      </div>
    </div>
  );
};

// ============================================
// MEASUREMENT HISTORY PANEL
// ============================================

interface MeasurementHistoryPanelProps {
  measurements: MeasurementResult[];
  onClear: () => void;
  onCopy: (value: number) => void;
}

export const MeasurementHistoryPanel: React.FC<MeasurementHistoryPanelProps> = ({
  measurements,
  onClear,
  onCopy,
}) => {
  if (measurements.length === 0) return null;

  return (
    <div className="absolute bottom-4 right-4 bg-gray-900/90 text-white rounded-lg shadow-lg w-64 max-h-64 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <span className="text-sm font-medium">Measurements</span>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-white"
        >
          Clear
        </button>
      </div>
      <div className="overflow-y-auto max-h-48">
        {measurements.slice(0, 10).map((m, index) => (
          <div
            key={m.id}
            className="flex items-center justify-between px-3 py-2 border-b border-gray-800 hover:bg-gray-800/50"
          >
            <div>
              <span className="text-green-400 font-mono">
                Length: {m.distance.toFixed(1)}mm
              </span>
              <div className="text-xs text-gray-500">
                ΔX:{Math.round(m.deltaX)} ΔY:{Math.round(m.deltaY)} ΔZ:{Math.round(m.deltaZ)}
              </div>
            </div>
            <button
              onClick={() => onCopy(m.distance)}
              className="text-gray-400 hover:text-white p-1"
              title="Copy to clipboard"
            >
              📋
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// GUIDE OFFSET INPUT
// ============================================

interface GuideOffsetInputProps {
  value: number | null;
  onChange: (value: number) => void;
  onSubmit: () => void;
  position: Position;
}

export const GuideOffsetInput: React.FC<GuideOffsetInputProps> = ({
  value,
  onChange,
  onSubmit,
  position,
}) => {
  const threePosition = positionToThree({
    ...position,
    z: position.z + 60,
  });

  return (
    <Html position={threePosition} center>
      <div className="bg-gray-900/95 text-white px-3 py-2 rounded-lg shadow-lg">
        <div className="text-xs text-gray-400 mb-1">Offset distance (mm)</div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSubmit();
              }
            }}
            className="w-24 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-green-500"
            placeholder="100"
            autoFocus
          />
          <button
            onClick={onSubmit}
            className="bg-green-600 hover:bg-green-500 px-2 py-1 rounded text-sm"
          >
            Create
          </button>
        </div>
      </div>
    </Html>
  );
};

// ============================================
// MAIN OVERLAY COMPONENT
// ============================================

interface MeasurementOverlayProps {
  mode: MeasurementMode;
  isActive: boolean;
  startPoint: Position | null;
  currentPoint: Position | null;
  distance: number | null;
  dominantAxis: 'x' | 'y' | 'z' | '3d' | null;
  measurementAxisLock: 'x' | 'y' | 'z' | null;
  hoverInfo: HoverMeasurementInfo | null;
  snapPoint: MeasurementInferencePoint | null;
  isCtrlPressed: boolean;
  measurements: MeasurementResult[];
  guideOffset: number | null;
  onSetGuideOffset: (value: number) => void;
  onFinishGuide: () => void;
  onClearHistory: () => void;
  cursorScreenPosition: { x: number; y: number } | null;
}

export const MeasurementOverlay: React.FC<MeasurementOverlayProps> = ({
  mode,
  isActive,
  startPoint,
  currentPoint,
  distance,
  dominantAxis,
  measurementAxisLock,
  hoverInfo,
  snapPoint,
  isCtrlPressed,
  measurements,
  guideOffset,
  onSetGuideOffset,
  onFinishGuide,
  onClearHistory,
  cursorScreenPosition,
}) => {
  if (!isActive) return null;

  const deltaX = startPoint && currentPoint ? Math.abs(currentPoint.x - startPoint.x) : 0;
  const deltaY = startPoint && currentPoint ? Math.abs(currentPoint.y - startPoint.y) : 0;
  const deltaZ = startPoint && currentPoint ? Math.abs(currentPoint.z - startPoint.z) : 0;

  const handleCopy = (value: number) => {
    navigator.clipboard.writeText(value.toFixed(1));
  };

  return (
    <>
      {/* Active measurement label */}
      {startPoint && currentPoint && distance !== null && distance > 0 && (
        <MeasurementLabel
          startPoint={startPoint}
          endPoint={currentPoint}
          distance={distance}
          dominantAxis={dominantAxis}
          measurementAxisLock={measurementAxisLock}
          deltaX={deltaX}
          deltaY={deltaY}
          deltaZ={deltaZ}
          cursorScreenPosition={cursorScreenPosition}
        />
      )}

      {/* Hover tooltip */}
      {hoverInfo && !startPoint && <HoverTooltip hoverInfo={hoverInfo} />}

      {/* Snap label */}
      {snapPoint && <SnapLabel snapPoint={snapPoint} />}

      {/* Guide offset input */}
      {mode === 'guide_create' && startPoint && currentPoint && (
        <GuideOffsetInput
          value={guideOffset}
          onChange={onSetGuideOffset}
          onSubmit={onFinishGuide}
          position={currentPoint}
        />
      )}
    </>
  );
};

// ============================================
// HTML OVERLAY FOR SCREEN-SPACE UI
// ============================================

interface MeasurementScreenOverlayProps {
  mode: MeasurementMode;
  isActive: boolean;
  isCtrlPressed: boolean;
  measurements: MeasurementResult[];
  onClearHistory: () => void;
}

export const MeasurementScreenOverlay: React.FC<MeasurementScreenOverlayProps> = ({
  mode,
  isActive,
  isCtrlPressed,
  measurements,
  onClearHistory,
}) => {
  if (!isActive) return null;

  const handleCopy = (value: number) => {
    navigator.clipboard.writeText(value.toFixed(1));
  };

  const lastLength = measurements.length > 0 ? measurements[0].distance : null;

  return (
    <>
      {/* VCB-style length readout (last or current) */}
      <div className="absolute bottom-4 left-4 z-50 bg-gray-900/90 text-white px-3 py-2 rounded-lg shadow-lg font-mono text-sm">
        <span className="text-gray-400">Length: </span>
        <span className="text-green-400 font-bold">
          {lastLength != null ? `${lastLength.toFixed(1)}mm` : '—'}
        </span>
      </div>

      {/* Mode indicator */}
      <ModeIndicator mode={mode} isCtrlPressed={isCtrlPressed} />

      {/* Measurement history */}
      <MeasurementHistoryPanel
        measurements={measurements}
        onClear={onClearHistory}
        onCopy={handleCopy}
      />
    </>
  );
};

export default MeasurementOverlay;
