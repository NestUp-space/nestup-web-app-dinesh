/**
 * useMeasurementTool Hook
 * 
 * React hook for the Tape Measure tool interaction.
 * Manages measurement state, event handlers, and integrates with the designer store.
 * 
 * Features:
 * - Dual mode: Measure (Ctrl off) and Guide Create (Ctrl on)
 * - Click-to-measure workflow
 * - Hover measurement display
 * - Smart snapping to inference points
 * - Keyboard shortcuts (Ctrl toggle, Escape cancel, Delete guide)
 */

'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useDesignerStore, useAllBoxes } from '@/store/designerStore';
import { 
  Position, 
  MeasurementMode, 
  MeasurementResult,
  MeasureGuideLine,
  MeasureGuidePoint,
  HoverMeasurementInfo, 
  BoxEdge,
} from '@/types/visualiser';
import {
  measureDistance,
  getDominantAxis,
  detectHoverMeasurement,
  detectMeasurementInferences,
  findNearestEdge,
  createParallelGuide,
  createAxisGuide,
  createPointToPointGuide,
  getFloorPosition,
  calculatePerpendicularOffset,
  constrainToAxis,
  MeasurementInferencePoint,
  MEASUREMENT_CONFIG,
} from '@/lib/visualiser/measurementTool';

// ============================================
// TYPES
// ============================================

export interface MeasurementToolState {
  mode: MeasurementMode;
  isActive: boolean;
  startPoint: Position | null;
  currentPoint: Position | null;
  hoverInfo: HoverMeasurementInfo | null;
  snapPoint: MeasurementInferencePoint | null;
  nearestEdge: BoxEdge | null;
  /** When in guide_create, first click on edge sets this; second click or Enter creates parallel guide at offset */
  clickedEdge: BoxEdge | null;
  /** In measure mode with startPoint set: lock measurement to X/Y/Z (arrow keys) */
  measurementAxisLock: 'x' | 'y' | 'z' | null;
  currentDistance: number | null;
  dominantAxis: 'x' | 'y' | 'z' | '3d' | null;
  isCtrlPressed: boolean;
  isShiftPressed: boolean;
  guideOffset: number | null;
  cursorScreenPosition: { x: number; y: number } | null;
}

export interface MeasurementToolHandlers {
  handlePointerMove: (
    event: PointerEvent,
    raycaster: THREE.Raycaster,
    camera: THREE.Camera,
    canvasSize: { width: number; height: number }
  ) => void;
  handlePointerDown: (
    event: PointerEvent,
    raycaster: THREE.Raycaster,
    camera: THREE.Camera,
    canvasSize: { width: number; height: number }
  ) => void;
  handleKeyDown: (event: KeyboardEvent) => void;
  handleKeyUp: (event: KeyboardEvent) => void;
  cancelMeasurement: () => void;
  setGuideOffset: (offset: number) => void;
  finishGuideWithOffset: () => void;
}

export interface UseMeasurementToolReturn {
  state: MeasurementToolState;
  handlers: MeasurementToolHandlers;
  measurementHistory: MeasurementResult[];
  measureGuideLines: MeasureGuideLine[];
  measureGuidePoints: MeasureGuidePoint[];
  measureGuidesVisible: boolean;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useMeasurementTool(): UseMeasurementToolReturn {
  // Store state
  const {
    designMode,
    measurementMode,
    measurementHistory,
    measureGuideLines,
    measureGuidePoints,
    measureGuidesVisible,
    activeMeasurement,
    setMeasurementMode,
    addMeasurement,
    addMeasureGuideLine,
    setActiveMeasurement,
    deleteMeasureGuideLine,
    selectedMeasureGuideId,
    selectMeasureGuide,
  } = useDesignerStore();
  
  const boxes = useAllBoxes();
  
  // Local state
  const [startPoint, setStartPoint] = useState<Position | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Position | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverMeasurementInfo | null>(null);
  const [snapPoint, setSnapPoint] = useState<MeasurementInferencePoint | null>(null);
  const [nearestEdge, setNearestEdge] = useState<BoxEdge | null>(null);
  const [clickedEdge, setClickedEdge] = useState<BoxEdge | null>(null);
  const [measurementAxisLock, setMeasurementAxisLock] = useState<'x' | 'y' | 'z' | null>(null);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [guideOffset, setGuideOffsetState] = useState<number | null>(null);
  const [cursorScreenPosition, setCursorScreenPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Refs for event handlers
  const startPointRef = useRef(startPoint);
  startPointRef.current = startPoint;
  const clickedEdgeRef = useRef<BoxEdge | null>(clickedEdge);
  clickedEdgeRef.current = clickedEdge;
  const manualGuideOffsetRef = useRef(false);
  const lastClickRef = useRef<{ edge: BoxEdge | null; time: number }>({ edge: null, time: 0 });
  const DOUBLE_CLICK_MS = 300;

  const isActive = designMode === 'measure';
  
  // Calculate derived values
  const currentDistance = useMemo(() => {
    if (!startPoint || !currentPoint) return null;
    const result = measureDistance(startPoint, currentPoint);
    return result.distance;
  }, [startPoint, currentPoint]);
  
  const dominantAxis = useMemo(() => {
    if (!startPoint || !currentPoint) return null;
    return getDominantAxis(startPoint, currentPoint);
  }, [startPoint, currentPoint]);
  
  // Sync active measurement to store
  useEffect(() => {
    if (startPoint && currentPoint) {
      setActiveMeasurement({ startPoint, currentPoint });
    } else {
      setActiveMeasurement(null);
    }
  }, [startPoint, currentPoint, setActiveMeasurement]);
  
  // Handle Ctrl key for mode toggle
  useEffect(() => {
    if (isActive) {
      const newMode = isCtrlPressed ? 'guide_create' : 'measure';
      if (measurementMode !== newMode) {
        setMeasurementMode(newMode);
      }
    }
  }, [isCtrlPressed, isActive, measurementMode, setMeasurementMode]);
  
  // Clear state when tool deactivates
  useEffect(() => {
    if (!isActive) {
      setStartPoint(null);
      setCurrentPoint(null);
      setHoverInfo(null);
      setSnapPoint(null);
      setNearestEdge(null);
      setClickedEdge(null);
      setGuideOffsetState(null);
      setMeasurementAxisLock(null);
      setCursorScreenPosition(null);
      manualGuideOffsetRef.current = false;
      lastClickRef.current = { edge: null, time: 0 };
    }
  }, [isActive]);
  
  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  const handlePointerMove = useCallback((
    event: PointerEvent,
    raycaster: THREE.Raycaster,
    camera: THREE.Camera,
    canvasSize: { width: number; height: number }
  ) => {
    if (!isActive) return;
    
    const cursorPx = { x: event.clientX, y: event.clientY };
    setCursorScreenPosition(cursorPx);
    
    // Detect inference points for snapping (include guide intersections when guides visible)
    const guidesForInference = measureGuidesVisible ? measureGuideLines : [];
    const inferences = detectMeasurementInferences(
      camera,
      canvasSize,
      cursorPx,
      boxes,
      undefined,
      guidesForInference
    );
    
    const bestSnap = inferences.length > 0 ? inferences[0] : null;
    
    // Get raw position from floor plane
    const rawPosition = getFloorPosition(raycaster, 0);
    
    // In parallel-guide-from-edge flow, use raw cursor/floor position to keep
    // perpendicular offset stable and deterministic (no snap jitter).
    const guideFromEdgeActive = !!clickedEdgeRef.current;
    setSnapPoint(guideFromEdgeActive ? null : bestSnap);
    let position = guideFromEdgeActive
      ? rawPosition
      : (bestSnap ? bestSnap.position : rawPosition);
    if (position && startPointRef.current && measurementAxisLock) {
      position = constrainToAxis(startPointRef.current, position, measurementAxisLock);
    }
    if (position) {
      setCurrentPoint(position);
    }
    
    // When clickedEdge is set (parallel guide from edge): update guideOffset from cursor
    if (clickedEdgeRef.current && position && !manualGuideOffsetRef.current) {
      setGuideOffsetState(calculatePerpendicularOffset(clickedEdgeRef.current, position));
    }
    
    // Hover measurement (only when not actively measuring and no clicked edge)
    if (!startPointRef.current && !clickedEdge) {
      const hover = detectHoverMeasurement(camera, canvasSize, cursorPx, boxes);
      setHoverInfo(hover);
      
      // Detect nearest edge for guide creation mode
      if (measurementMode === 'guide_create') {
        const edge = findNearestEdge(camera, canvasSize, cursorPx, boxes);
        setNearestEdge(edge);
      } else {
        setNearestEdge(null);
      }
    } else {
      setHoverInfo(null);
    }
  }, [isActive, boxes, measurementMode, clickedEdge, measurementAxisLock, measureGuidesVisible, measureGuideLines]);
  
  const handlePointerDown = useCallback((
    event: PointerEvent,
    raycaster: THREE.Raycaster,
    camera: THREE.Camera,
    canvasSize: { width: number; height: number }
  ) => {
    if (!isActive) return;
    if (event.button !== 0) return; // Only left click
    
    const cursorPx = { x: event.clientX, y: event.clientY };
    
    // Get position (with snap, including guide intersections)
    const guidesForInferenceDown = measureGuidesVisible ? measureGuideLines : [];
    const inferences = detectMeasurementInferences(
      camera,
      canvasSize,
      cursorPx,
      boxes,
      undefined,
      guidesForInferenceDown
    );
    
    const bestSnap = inferences.length > 0 ? inferences[0] : null;
    const rawPosition = getFloorPosition(raycaster, 0);
    let position = bestSnap ? bestSnap.position : rawPosition;
    
    if (!position) return;
    
    if (measurementMode === 'measure') {
      // Measure mode: click-to-measure workflow
      if (!startPoint) {
        // First click: set start point
        setStartPoint(position);
        setCurrentPoint(position);
      } else {
        if (measurementAxisLock) {
          position = constrainToAxis(startPoint, position, measurementAxisLock);
        }
        // Second click: complete measurement
        const result = measureDistance(startPoint, position);
        addMeasurement(result);
        setMeasurementAxisLock(null);
        setStartPoint(null);
        setCurrentPoint(null);
      }
    } else {
      // Guide create mode
      if (clickedEdgeRef.current) {
        // Second action: create parallel guide at current offset and reset
        const offset = guideOffset ?? calculatePerpendicularOffset(clickedEdgeRef.current, position);
        const guide = createParallelGuide(clickedEdgeRef.current, offset);
        addMeasureGuideLine(guide);
        setClickedEdge(null);
        setGuideOffsetState(null);
        manualGuideOffsetRef.current = false;
      } else if (!startPoint) {
        // First click: double-click on same edge → instant guide; else select edge or set start point
        const edgeUnderCursor = findNearestEdge(camera, canvasSize, cursorPx, boxes);
        if (edgeUnderCursor) {
          const now = Date.now();
          const sameEdge = lastClickRef.current.edge?.id === edgeUnderCursor.id;
          if (sameEdge && now - lastClickRef.current.time < DOUBLE_CLICK_MS) {
            const guide = createPointToPointGuide(edgeUnderCursor.start, edgeUnderCursor.end);
            addMeasureGuideLine(guide);
            lastClickRef.current = { edge: null, time: 0 };
            setClickedEdge(null);
            setGuideOffsetState(null);
            manualGuideOffsetRef.current = false;
          } else {
            lastClickRef.current = { edge: edgeUnderCursor, time: now };
            setClickedEdge(edgeUnderCursor);
            setCurrentPoint(position);
            setGuideOffsetState(calculatePerpendicularOffset(edgeUnderCursor, position));
            manualGuideOffsetRef.current = false;
          }
        } else {
          lastClickRef.current = { edge: null, time: 0 };
          setStartPoint(position);
          setCurrentPoint(position);
        }
      } else {
        // Second click (point-to-point): create guide
        const guide = createPointToPointGuide(startPoint, position);
        addMeasureGuideLine(guide);
        setStartPoint(null);
        setCurrentPoint(null);
        setGuideOffsetState(null);
        manualGuideOffsetRef.current = false;
      }
    }
  }, [
    isActive,
    measurementMode,
    startPoint,
    boxes,
    measurementAxisLock,
    clickedEdge,
    guideOffset,
    measureGuidesVisible,
    measureGuideLines,
    addMeasurement,
    addMeasureGuideLine,
  ]);
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive) return;
    
    switch (event.key) {
      case 'Control':
        setIsCtrlPressed(true);
        break;
        
      case 'Shift':
        setIsShiftPressed(true);
        break;
        
      case 'Escape':
        // Cancel current measurement or parallel-guide-from-edge selection
        if (clickedEdge) {
          setClickedEdge(null);
          setGuideOffsetState(null);
          manualGuideOffsetRef.current = false;
        } else {
          setStartPoint(null);
          setCurrentPoint(null);
          setGuideOffsetState(null);
          setMeasurementAxisLock(null);
        }
        break;
      case 'ArrowRight':
        if (measurementMode === 'measure' && startPoint) {
          setMeasurementAxisLock((prev) => (prev === 'x' ? null : 'x'));
        }
        break;
      case 'ArrowLeft':
        if (measurementMode === 'measure' && startPoint) {
          setMeasurementAxisLock((prev) => (prev === 'y' ? null : 'y'));
        }
        break;
      case 'ArrowUp':
        if (measurementMode === 'measure' && startPoint) {
          setMeasurementAxisLock((prev) => (prev === 'z' ? null : 'z'));
        }
        break;
        
      case 'Delete':
      case 'Backspace':
        // Delete selected guide
        if (selectedMeasureGuideId) {
          deleteMeasureGuideLine(selectedMeasureGuideId);
        }
        break;
        
      case 'h':
      case 'H':
        // Toggle guide visibility (handled at store level)
        useDesignerStore.getState().toggleMeasureGuidesVisible();
        break;
        
      case 'x':
      case 'X':
        // Create X-axis guide at current point
        if (measurementMode === 'guide_create' && currentPoint) {
          const guide = createAxisGuide(currentPoint, 'x');
          addMeasureGuideLine(guide);
        }
        break;
        
      case 'y':
      case 'Y':
        // Create Y-axis guide at current point
        if (measurementMode === 'guide_create' && currentPoint) {
          const guide = createAxisGuide(currentPoint, 'y');
          addMeasureGuideLine(guide);
        }
        break;
        
      case 'z':
      case 'Z':
        // Create Z-axis guide at current point
        if (measurementMode === 'guide_create' && currentPoint) {
          const guide = createAxisGuide(currentPoint, 'z');
          addMeasureGuideLine(guide);
        }
        break;
        
      case 'Enter':
        // Finalize parallel guide from edge (typed offset or current cursor offset)
        if (clickedEdge) {
          const offset = guideOffset ?? (currentPoint ? calculatePerpendicularOffset(clickedEdge, currentPoint) : 0);
          const guide = createParallelGuide(clickedEdge, offset);
          addMeasureGuideLine(guide);
          setClickedEdge(null);
          setGuideOffsetState(null);
          manualGuideOffsetRef.current = false;
        }
        break;
    }
  }, [
    isActive,
    measurementMode,
    startPoint,
    currentPoint,
    selectedMeasureGuideId,
    guideOffset,
    nearestEdge,
    clickedEdge,
    deleteMeasureGuideLine,
    addMeasureGuideLine,
  ]);
  
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'Control':
        setIsCtrlPressed(false);
        break;
        
      case 'Shift':
        setIsShiftPressed(false);
        break;
    }
  }, []);
  
  const cancelMeasurement = useCallback(() => {
    setStartPoint(null);
    setCurrentPoint(null);
    setClickedEdge(null);
    setMeasurementAxisLock(null);
    setGuideOffsetState(null);
    manualGuideOffsetRef.current = false;
  }, []);
  
  const setGuideOffset = useCallback((offset: number) => {
    manualGuideOffsetRef.current = true;
    setGuideOffsetState(offset);
  }, []);
  
  const finishGuideWithOffset = useCallback(() => {
    if (guideOffset !== null && clickedEdge) {
      const guide = createParallelGuide(clickedEdge, guideOffset);
      addMeasureGuideLine(guide);
      setClickedEdge(null);
      setGuideOffsetState(null);
      manualGuideOffsetRef.current = false;
    }
  }, [guideOffset, clickedEdge, addMeasureGuideLine]);
  
  // ============================================
  // RETURN VALUE
  // ============================================
  
  const state: MeasurementToolState = {
    mode: measurementMode,
    isActive,
    startPoint,
    currentPoint,
    hoverInfo,
    snapPoint,
    nearestEdge,
    clickedEdge,
    measurementAxisLock,
    currentDistance,
    dominantAxis,
    isCtrlPressed,
    isShiftPressed,
    guideOffset,
    cursorScreenPosition,
  };
  
  const handlers: MeasurementToolHandlers = {
    handlePointerMove,
    handlePointerDown,
    handleKeyDown,
    handleKeyUp,
    cancelMeasurement,
    setGuideOffset,
    finishGuideWithOffset,
  };
  
  return {
    state,
    handlers,
    measurementHistory,
    measureGuideLines,
    measureGuidePoints,
    measureGuidesVisible,
  };
}

export default useMeasurementTool;
