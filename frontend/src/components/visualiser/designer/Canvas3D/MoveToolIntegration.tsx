'use client';

import React, { useEffect, useRef, useCallback, useMemo, createContext, useContext, useState } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useDesignerStore } from '@/store/designerStore';
import { Position, Box } from '@/types/visualiser';
import { useDragInteraction, DragState, MovePhase } from '@/hooks/useDragInteraction';
import { MoveVisuals } from './MoveVisuals';
import SnapIndicators from './SnapIndicators';
import { detectInferences, InferencePoint } from '@/lib/visualiser/moveInference';
import { emitScreenTip } from './ScreenTip';
import { BoundingBoxGrips } from './BoundingBoxGrips';
import { TOOL_CURSORS } from './toolCursors';

// Shared context so the screen overlay can access the move state without a duplicate hook
interface MoveToolContextType {
  dragState: DragState;
  movePhase: MovePhase;
  applyNumericInput: (input: string) => boolean;
  inferencePoints: InferencePoint[];
  cancelTwoClick: () => void;
  setLockedAxis: (axis: 'x' | 'y' | 'z' | null) => void;
  copyModeToggle: () => void;
}

const MoveToolContext = createContext<MoveToolContextType | null>(null);

export const useMoveToolContext = () => useContext(MoveToolContext);

function dataToThreeVec(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(x, z, y);
}

// ==============================================
// 3D VISUALS (rendered inside Canvas)
// ==============================================

interface MoveToolVisualsInnerProps {
  box: Box;
  dragState: DragState;
  movePhase: MovePhase;
  inferencePoints: InferencePoint[];
}

const MoveToolVisualsInner: React.FC<MoveToolVisualsInnerProps> = ({ box, dragState, movePhase, inferencePoints }) => {
  const isActive = dragState.isDragging || movePhase === 'moving';
  if (!isActive || !dragState.ghostPosition) return null;

  const dims = { w: box.dimensions.lenX, d: box.dimensions.lenY, h: box.dimensions.lenZ };

  return (
    <group>
      <MoveVisuals
        targetPosition={dragState.ghostPosition}
        startPosition={dragState.startPosition}
        boxDimensions={dims}
        lockedAxis={dragState.lockedAxis}
        isValid={dragState.positionValid}
        inferencePoints={inferencePoints.map(ip => ({
          position: ip.position,
          type: ip.type,
          label: ip.label,
        }))}
        isCopyMode={dragState.isCopyMode}
        fromPoint={dragState.fromPoint}
      />
      <SnapIndicators
        visible={true}
        ghostPosition={dragState.ghostPosition}
        startPosition={dragState.startPosition}
        snapResult={dragState.snapResult}
        lockedAxis={dragState.lockedAxis}
        collisions={dragState.collisions}
        boxDimensions={dims}
      />
    </group>
  );
};

// ==============================================
// MAIN INTEGRATION (rendered inside Canvas)
// ==============================================

export const MoveToolIntegration: React.FC = () => {
  const { camera, gl, size: canvasSize } = useThree();
  const {
    walls,
    activeWallId,
    selectedBoxId,
    designMode,
    setDesignMode,
    setMoveToolRuntime,
  } = useDesignerStore();

  const isMoveTool = designMode === 'move';

  const selectedBox = useMemo(() => {
    if (!selectedBoxId || !activeWallId) return null;
    const wall = walls.find(w => w.id === activeWallId);
    return wall?.boxes.find(b => b.id === selectedBoxId) ?? null;
  }, [walls, activeWallId, selectedBoxId]);

  const otherBoxes = useMemo(() => {
    if (!activeWallId || !selectedBoxId) return [];
    const wall = walls.find(w => w.id === activeWallId);
    return wall?.boxes.filter(b => b.id !== selectedBoxId) ?? [];
  }, [walls, activeWallId, selectedBoxId]);

  const enabled = isMoveTool && !!selectedBox;

  const onExitTool = useCallback(() => {
    setDesignMode('select');
  }, [setDesignMode]);

  const {
    dragState,
    movePhase,
    handlers,
    applyNumericInput,
    setGhostFromRay,
    place,
    cancelTwoClick,
    setLockedAxis,
    copyModeToggle,
    beginMoveFromSelection,
  } = useDragInteraction({
    boxId: selectedBoxId ?? '',
    enabled,
    interactionMode: 'twoclick',
    onExitTool,
  });

  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const cursorPxRef = useRef({ x: 0, y: 0 });
  const [inferencePoints, setInferencePoints] = useState<InferencePoint[]>([]);
  const inferRafRef = useRef<number | null>(null);
  const pendingInferEventRef = useRef<PointerEvent | null>(null);

  // Publish context for screen overlay to read (reactive store; no polling)
  useEffect(() => {
    setMoveToolRuntime({
      dragState,
      movePhase,
      applyNumericInput,
      inferencePoints,
      cancelTwoClick,
      setLockedAxis,
      copyModeToggle,
      beginMoveFromSelection,
    });
    return () => setMoveToolRuntime(null);
  }, [dragState, movePhase, applyNumericInput, inferencePoints, cancelTwoClick, setLockedAxis, copyModeToggle, beginMoveFromSelection, setMoveToolRuntime]);

  useEffect(() => {
    if (!isMoveTool || !selectedBox) return;
    const canvasEl = gl.domElement;

    const computeInferenceAndTip = (e: PointerEvent) => {
      const rect = canvasEl.getBoundingClientRect();
      pointerRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      cursorPxRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      raycasterRef.current.setFromCamera(pointerRef.current, camera);

      if (movePhase === 'moving') {
        setGhostFromRay(raycasterRef.current.ray);
      }

      const detected = detectInferences(
        camera,
        { width: canvasSize.width, height: canvasSize.height },
        cursorPxRef.current,
        null,
        otherBoxes,
        dragState.ghostPosition ?? selectedBox.position,
        selectedBoxId ?? undefined,
        dragState.startPosition,
        false,
        dragState.fromPoint ?? undefined,
      );
      setInferencePoints(detected.slice(0, 5));

      // Emit ScreenTip (SketchUp-aligned: axis "On Red/Green/Blue Axis from Point", idle "Select point to move from", copy "Move/Copy")
      const tipX = e.clientX - rect.left;
      const tipY = e.clientY - rect.top;
      const axisNames: Record<string, string> = { x: 'Red', y: 'Green', z: 'Blue' };
      const copySuffix = dragState.isCopyMode ? ' (Move/Copy)' : '';

      let message = '';
      if (dragState.ghostPosition && !dragState.positionValid) {
        message = (dragState.collisions?.length ?? 0) > 0 ? 'Cannot place: Collision' : 'Invalid position';
      } else if (dragState.lockedAxis) {
        const axisLabel = axisNames[dragState.lockedAxis] ?? 'Axis';
        const extra = detected.length > 0 ? ` and ${detected[0].label}` : '';
        message = `On ${axisLabel} Axis from Point${extra}`;
      } else if (detected.length > 0) {
        message = detected[0].label;
      } else if (movePhase === 'idle') {
        message = 'Select point to move from';
      }
      if (message) {
        emitScreenTip(message + copySuffix, tipX, tipY);
      } else {
        emitScreenTip('', 0, 0);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      pendingInferEventRef.current = e;
      if (inferRafRef.current != null) return;
      inferRafRef.current = requestAnimationFrame(() => {
        inferRafRef.current = null;
        if (pendingInferEventRef.current) {
          computeInferenceAndTip(pendingInferEventRef.current);
        }
      });
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest?.('form') || target?.closest?.('button') || target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.button !== 0) return;

      if (movePhase === 'moving') {
        e.preventDefault();
        e.stopPropagation();
        place();
      }
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerdown', handlePointerDown, true);

    // SketchUp-like cursor states
    if (!selectedBoxId) {
      canvasEl.style.cursor = TOOL_CURSORS.moveIdle;
    } else if (!dragState.positionValid) {
      canvasEl.style.cursor = TOOL_CURSORS.moveInvalid;
    } else if (dragState.isStampMode) {
      canvasEl.style.cursor = TOOL_CURSORS.moveStamp;
    } else if (dragState.isCopyMode) {
      canvasEl.style.cursor = TOOL_CURSORS.moveCopy;
    } else if (movePhase === 'moving' || dragState.isDragging) {
      canvasEl.style.cursor = TOOL_CURSORS.moveDragging;
    } else {
      canvasEl.style.cursor = TOOL_CURSORS.moveSelected;
    }

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      if (inferRafRef.current != null) cancelAnimationFrame(inferRafRef.current);
      canvasEl.style.cursor = 'default';
    };
  }, [isMoveTool, selectedBox, selectedBoxId, movePhase, camera, gl, canvasSize, otherBoxes, dragState.ghostPosition, dragState.startPosition, dragState.lockedAxis, dragState.isCopyMode, dragState.positionValid, dragState.collisions, setGhostFromRay, place]);

  // One-action move: click a box while Move tool active and immediately enter moving phase.
  useEffect(() => {
    if (!isMoveTool) return;
    const handler = (evt: Event) => {
      const detail = (evt as CustomEvent<{ boxId: string }>).detail;
      if (!detail?.boxId) return;
      if (detail.boxId !== selectedBoxId) return;
      beginMoveFromSelection();
    };
    window.addEventListener('move-tool-start-request', handler as EventListener);
    return () => window.removeEventListener('move-tool-start-request', handler as EventListener);
  }, [isMoveTool, selectedBoxId, beginMoveFromSelection]);

  if (!isMoveTool || !selectedBox) return null;

  const isIdle = !dragState.isDragging && movePhase !== 'moving';

  // Hit-test mesh center for the selected box (used for two-click start)
  const boxW = selectedBox.dimensions.lenX;
  const boxD = selectedBox.dimensions.lenY;
  const boxH = selectedBox.dimensions.lenZ;
  const hitPos = dataToThreeVec(
    selectedBox.position.x + boxW / 2,
    selectedBox.position.y + boxD / 2,
    selectedBox.position.z + boxH / 2,
  );

  return (
    <>
      {/* Invisible hit-test mesh over selected box for move tool pointer events */}
      <mesh
        position={hitPos}
        onPointerDown={handlers.onPointerDown}
        onPointerMove={handlers.onPointerMove}
        onPointerUp={handlers.onPointerUp}
        renderOrder={20}
      >
        <boxGeometry args={[boxW, boxH, boxD]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Bounding box grips when idle and box is selected (spec Section 4) */}
      <BoundingBoxGrips box={selectedBox} visible={isIdle} />

      {/* Move visuals (ghost, snap indicators, inference) when actively moving */}
      <MoveToolVisualsInner
        box={selectedBox}
        dragState={dragState}
        movePhase={movePhase}
        inferencePoints={inferencePoints}
      />
    </>
  );
};

// ==============================================
// SCREEN OVERLAY (rendered outside Canvas, in DOM)
// ==============================================

export const MoveToolScreenOverlay: React.FC = () => {
  const { designMode, selectedBoxId, moveToolRuntime } = useDesignerStore();
  const isMoveTool = designMode === 'move';

  const [vcbValue, setVcbValue] = useState('');
  const vcbInputRef = useRef<HTMLInputElement>(null);
  const vcbBufferRef = useRef('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [flashVcb, setFlashVcb] = useState(false);
  const ctx = (moveToolRuntime as MoveToolContextType | null) ?? null;

  const dragState = ctx?.dragState;
  const movePhase = ctx?.movePhase;
  const applyNumericInput = ctx?.applyNumericInput;
  const isActive = dragState?.isDragging || movePhase === 'moving';

  const handleVcbSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (vcbValue.trim() && applyNumericInput) {
      const success = applyNumericInput(vcbValue.trim());
      if (success) setVcbValue('');
    }
  }, [vcbValue, applyNumericInput]);

  // "Just type" behavior: capture number keys globally and funnel to VCB
  useEffect(() => {
    if (!isMoveTool) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      if (!isActive) return;

      const isDigit = /^[0-9]$/.test(e.key);
      const isOperator = ['.', ',', '-', '[', ']', '<', '>', '/', '*', "'", '"'].includes(e.key);

      if (isDigit || isOperator) {
        e.preventDefault();
        if (!vcbBufferRef.current) {
          setFlashVcb(true);
          window.setTimeout(() => setFlashVcb(false), 140);
        }
        vcbBufferRef.current += e.key;
        setVcbValue(vcbBufferRef.current);
        setTimeout(() => vcbInputRef.current?.focus(), 0);
      }

      if (e.key === 'Enter' && vcbValue.trim() && applyNumericInput) {
        e.preventDefault();
        const value = vcbBufferRef.current.trim() || vcbValue.trim();
        const success = applyNumericInput(value);
        if (success) {
          vcbBufferRef.current = '';
          setVcbValue('');
        }
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        vcbBufferRef.current = vcbBufferRef.current.slice(0, -1);
        setVcbValue(vcbBufferRef.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMoveTool, isActive, vcbValue, applyNumericInput]);

  // Context menu (right-click): Shift + Right click only, so normal RMB pan remains fluid.
  useEffect(() => {
    if (!isMoveTool) return;
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest?.('input') || target?.closest?.('button')) return;
      if (!e.shiftKey) return;
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [isMoveTool]);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  if (!isMoveTool) return null;

  const distance = dragState?.ghostPosition && dragState?.startPosition
    ? Math.round(Math.sqrt(
        (dragState.ghostPosition.x - dragState.startPosition.x) ** 2 +
        (dragState.ghostPosition.y - dragState.startPosition.y) ** 2 +
        (dragState.ghostPosition.z - dragState.startPosition.z) ** 2
      ))
    : 0;

  const runAndClose = (fn: () => void) => {
    fn();
    setContextMenu(null);
  };

  return (
    <>
      {contextMenu && ctx && (
        <div
          ref={contextMenuRef}
          className="fixed z-[100] min-w-[160px] rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {ctx.movePhase === 'moving' && (
            <button
              type="button"
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
              onClick={() => runAndClose(ctx.cancelTwoClick)}
            >
              Cancel Move
            </button>
          )}
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
            onClick={() => runAndClose(() => ctx.setLockedAxis(ctx.dragState?.lockedAxis === 'x' ? null : 'x'))}
          >
            Lock to X
          </button>
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
            onClick={() => runAndClose(() => ctx.setLockedAxis(ctx.dragState?.lockedAxis === 'y' ? null : 'y'))}
          >
            Lock to Y
          </button>
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
            onClick={() => runAndClose(() => ctx.setLockedAxis(ctx.dragState?.lockedAxis === 'z' ? null : 'z'))}
          >
            Lock to Z
          </button>
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
            onClick={() => runAndClose(ctx.copyModeToggle)}
          >
            {ctx.dragState?.isCopyMode ? 'Copy Mode (on)' : 'Copy Mode'}
          </button>
        </div>
      )}
    <div className="absolute bottom-4 right-4 z-50">
      <form onSubmit={handleVcbSubmit} className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">Distance:</span>
        <input
          ref={vcbInputRef}
          type="text"
          value={vcbValue || (isActive ? `${distance}mm` : '')}
          onChange={(e) => {
            vcbBufferRef.current = e.target.value;
            setVcbValue(e.target.value);
          }}
          onFocus={() => {
            if (!vcbValue && isActive) setVcbValue('');
          }}
          placeholder={isActive ? 'Type distance and Enter to move' : 'Select point to move from'}
          className={`w-40 px-2 py-1 text-sm font-mono bg-white border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${flashVcb ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'}`}
        />
        {dragState?.lockedAxis && (
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
            dragState.lockedAxis === 'x' ? 'bg-red-100 text-red-700' :
            dragState.lockedAxis === 'y' ? 'bg-green-100 text-green-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {dragState.lockedAxis.toUpperCase()}
          </span>
        )}
        {dragState?.isCopyMode && (
          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
            {dragState?.isStampMode ? '++ STAMP' : '+ COPY'}
          </span>
        )}
      </form>
      {isMoveTool && !isActive && (
        <div className="mt-1 text-[10px] text-gray-400">
          Click a box to start moving. M to activate.
        </div>
      )}
      {isActive && (
        <div className="mt-1 text-[10px] text-gray-400">
          Type distance, [x,y,z] absolute, or &lt;x,y,z&gt; relative. Arrow keys lock axis. Shift+RMB for Move menu.
        </div>
      )}
    </div>
    </>
  );
};
