# SketchUp Desktop 2024 Behavior Matrix (Move + Tape)

This matrix defines expected Desktop-like behavior and the mapped implementation points in this project.

## Move Tool

- **State flow**
  - Idle -> pick source -> moving -> place/cancel
  - `frontend/src/hooks/useDragInteraction.ts` (`movePhase`, `beginMoveFromSelection`, `place`, `cancelTwoClick`)
- **Axis lock precedence**
  - Explicit lock only (X/Y/Z, arrows); no implicit auto-lock drift
  - `frontend/src/hooks/useDragInteraction.ts` (`lockedAxisRef`, key handlers)
- **Escape layering**
  - 1st: unlock axis, 2nd: cancel move, 3rd: exit Move tool
  - `frontend/src/hooks/useDragInteraction.ts` (Escape handler)
- **Copy/Stamp**
  - Ctrl tap toggles copy, double-tap enters stamp
  - `frontend/src/hooks/useDragInteraction.ts` (`copyModeActiveRef`, `stampModeRef`)
- **VCB**
  - Type while moving, Enter commits distance
  - `frontend/src/components/visualiser/designer/Canvas3D/MoveToolIntegration.tsx`
- **Camera ownership**
  - LMB for tool action, MMB orbit, RMB pan, wheel zoom
  - `frontend/src/components/visualiser/designer/Canvas3D/index.tsx`

## Tape Measure Tool

- **Mode flow**
  - Ctrl released: measure mode; Ctrl held: guide create mode
  - `frontend/src/hooks/useMeasurementTool.ts` (`measurementMode`, `isCtrlPressed`)
- **Measure axis lock**
  - In measure mode after first click, arrows lock X/Y/Z and apply on preview + final click
  - `frontend/src/hooks/useMeasurementTool.ts` (`measurementAxisLock`, `constrainToAxis`)
- **Parallel guide from edge**
  - Click edge -> preview offset -> Enter/click finalize
  - `frontend/src/hooks/useMeasurementTool.ts` (`clickedEdge`, `guideOffset`)
  - `frontend/src/components/visualiser/designer/Canvas3D/MeasurementVisuals.tsx` (`ParallelGuidePreview`)
- **Double-click edge**
  - Double-click same edge creates immediate guide
  - `frontend/src/hooks/useMeasurementTool.ts` (`lastClickRef`, `DOUBLE_CLICK_MS`)
- **Guide intersections**
  - Intersections should become snap candidates
  - `frontend/src/lib/visualiser/measurementTool.ts` (`calculateGuideIntersections`, `detectMeasurementInferences`)
- **Guide selection hit-test**
  - Hit volume must align with rendered guide direction
  - `frontend/src/components/visualiser/designer/Canvas3D/MeasurementVisuals.tsx` (`InfiniteGuideLine`)

## Input Arbitration Rules

- Global shortcuts do not override Move/Measure local key handlers for Escape/Delete
  - `frontend/src/hooks/useDesignerShortcuts.ts`
- Move context menu opens only on Shift+RMB so normal RMB pan remains available
  - `frontend/src/components/visualiser/designer/Canvas3D/MoveToolIntegration.tsx`

## Undo/Redo Transaction Rules

- Multi-step operations should create one history snapshot:
  - copy arrays, array revision, multi-guide workflows
- Snapshot must include:
  - walls, guidelines, measure guides/points, measurement history
- Implementation:
  - `frontend/src/store/designerStore.ts` (`beginHistoryTransaction`, `endHistoryTransaction`, `runInHistoryTransaction`)
  - `frontend/src/store/historyMiddleware.ts` (`DesignSnapshot` extension)
