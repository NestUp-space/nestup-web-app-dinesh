'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Toolbar } from '@/components/visualiser/designer/Toolbar';
import { PropertiesPanel } from '@/components/visualiser/designer/panels/PropertiesPanel';
import { CatalogPanel } from '@/components/visualiser/designer/panels/CatalogPanel';
import { LaminatePanel } from '@/components/visualiser/designer/panels/LaminatePanel';
import { WallTabs } from '@/components/visualiser/designer/WallTabs';
import { useDesignerStore } from '@/stores/designerStore';
import { 
  loadCatalogFromSampleData, 
  refreshCatalogFromGoogleSheets,
  isGoogleSheetsConfigured 
} from '@/lib/visualiser/catalogParser';
import { REFRESH_INTERVAL_MS } from '@/lib/visualiser/googleSheetsService';
import { useDesignerShortcuts } from '@/hooks/useDesignerShortcuts';
import {
  readAndClearArUcoPayload,
  getPayloadFromUrl,
  ARUCO_DESIGN_QUERY_PARAM,
  ARUCO_DESIGN_DATA_PARAM,
} from '@/lib/arucoDesignBridge';

// Dynamically import Canvas3D to avoid SSR issues with Three.js
const Canvas3D = dynamic(
  () => import('@/components/visualiser/designer/Canvas3D').then((mod) => mod.Canvas3D),
  { ssr: false }
);

export default function DesignerPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [laminatePanelOpen, setLaminatePanelOpen] = useState(false);
  const [catalogSource, setCatalogSource] = useState<'google-sheets' | 'csv'>('csv');

  // Enable keyboard shortcuts
  const { canUndo, canRedo } = useDesignerShortcuts({ enabled: true });

  const searchParams = useSearchParams();
  const arUcoAppliedRef = useRef(false);

  const {
    setCatalogModels,
    setCatalogBoxesWithPlanks,
    setPlywoodLibrary,
    setLaminateLibrary,
    setCatalogLoaded,
    setLastCatalogRefresh,
    setIsRefreshingCatalog,
    catalogLoaded,
    lastCatalogRefresh,
    isRefreshingCatalog,
    projectName,
    isDirty,
    walls,
    activeWallId,
    setActiveWall,
    addWall,
    updateWall,
    deleteWall,
    clearDesign,
    laminateLibrary,
    plywoodLibrary,
  } = useDesignerStore();

  // Load catalog data function
  const loadCatalog = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshingCatalog(true);
      }
      
      // Load from Google Sheets (if configured) or CSV files
      const catalogData = await loadCatalogFromSampleData();
      
      if (catalogData.models.length > 0 || catalogData.laminateOptions.length > 0) {
        setCatalogModels(catalogData.models);
        setCatalogBoxesWithPlanks(catalogData.catalogBoxesWithPlanks);
        setPlywoodLibrary(catalogData.plywoodOptions);
        setLaminateLibrary(catalogData.laminateOptions);
        setCatalogSource(catalogData.source);
        setLastCatalogRefresh(new Date().toISOString());
        console.log(`[Designer] Loaded from ${catalogData.source}:`);
        console.log(`  - ${catalogData.models.length} cabinet models`);
        console.log(`  - ${catalogData.laminateOptions.length} laminates`);
        console.log(`  - ${catalogData.plywoodOptions.length} plywood options`);
      } else {
        console.warn('[Designer] No catalog data loaded');
      }
      
      setCatalogLoaded(true);
    } catch (error) {
      console.error('[Designer] Error loading catalog:', error);
      setCatalogLoaded(true);
    } finally {
      setIsLoading(false);
      setIsRefreshingCatalog(false);
    }
  }, [
    setCatalogModels,
    setCatalogBoxesWithPlanks,
    setPlywoodLibrary,
    setLaminateLibrary,
    setCatalogLoaded,
    setLastCatalogRefresh,
    setIsRefreshingCatalog,
  ]);

  // Initial load
  useEffect(() => {
    if (!catalogLoaded) {
      loadCatalog();
    } else {
      setIsLoading(false);
    }
  }, [catalogLoaded, loadCatalog]);

  // Apply ArUco measurement payload when arriving via "Continue to design" (URL first, then sessionStorage)
  useEffect(() => {
    if (arUcoAppliedRef.current) return;
    const fromArUco = searchParams.get(ARUCO_DESIGN_QUERY_PARAM);
    if (fromArUco !== '1') return;

    const cleanArUcoParams = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      params.delete(ARUCO_DESIGN_QUERY_PARAM);
      params.delete(ARUCO_DESIGN_DATA_PARAM);
      const search = params.toString();
      const url = search ? `${window.location.pathname}?${search}` : window.location.pathname;
      window.history.replaceState({}, '', url);
    };

    let payload = getPayloadFromUrl(searchParams.get(ARUCO_DESIGN_DATA_PARAM));
    if (!payload) payload = readAndClearArUcoPayload();

    if (!payload) {
      cleanArUcoParams();
      return;
    }

    arUcoAppliedRef.current = true;
    clearDesign();
    const wallId = addWall({
      entityName: 'Wall 1',
      roomName: payload.wallContext?.roomName ?? '',
      unitLocation: payload.wallContext?.direction ?? '',
      dimensions: { lenX: payload.wall_width_mm, lenY: 100, lenZ: payload.wall_height_mm },
      position: { x: 0, y: 0, z: 0 },
      wallFeatures: payload.features ?? [],
    });
    setActiveWall(wallId);
    cleanArUcoParams();
  }, [searchParams, clearDesign, addWall, setActiveWall]);

  // Auto-refresh from Google Sheets every 5 minutes
  useEffect(() => {
    // Only set up refresh if Google Sheets is configured
    if (!isGoogleSheetsConfigured()) {
      console.log('[Designer] Google Sheets not configured, skipping auto-refresh');
      return;
    }
    
    console.log(`[Designer] Setting up auto-refresh every ${REFRESH_INTERVAL_MS / 1000 / 60} minutes`);
    
    const refreshTimer = setInterval(async () => {
      console.log('[Designer] Auto-refreshing catalog from Google Sheets...');
      const newData = await refreshCatalogFromGoogleSheets();
      
      if (newData) {
        setCatalogModels(newData.models);
        setCatalogBoxesWithPlanks(newData.catalogBoxesWithPlanks);
        setPlywoodLibrary(newData.plywoodOptions);
        setLaminateLibrary(newData.laminateOptions);
        setLastCatalogRefresh(new Date().toISOString());
        setCatalogSource('google-sheets');
        console.log(`[Designer] Auto-refresh complete: ${newData.models.length} models`);
      }
    }, REFRESH_INTERVAL_MS);
    
    return () => clearInterval(refreshTimer);
  }, [setCatalogModels, setCatalogBoxesWithPlanks, setPlywoodLibrary, setLaminateLibrary, setLastCatalogRefresh]);

  // Wall management handlers
  const handleAddWall = useCallback(() => {
    const wallNumber = walls.length + 1;
    const newWallId = addWall({
      entityName: `Wall ${wallNumber}`,
      roomName: '',
      unitLocation: '',
      dimensions: { lenX: 3000, lenY: 100, lenZ: 2400 },
      position: { x: 0, y: 0, z: 0 }, // All walls at origin
    });
    
    // Set as active wall
    setActiveWall(newWallId);
  }, [walls.length, addWall, setActiveWall]);

  const handleRenameWall = useCallback((wallId: string, newName: string) => {
    updateWall(wallId, { entityName: newName });
  }, [updateWall]);

  const handleDuplicateWall = useCallback((wallId: string) => {
    const sourceWall = walls.find(w => w.id === wallId);
    if (!sourceWall) return;
    
    const wallNumber = walls.length + 1;
    const newWallId = addWall({
      entityName: `${sourceWall.entityName} (Copy)`,
      roomName: sourceWall.roomName,
      unitLocation: sourceWall.unitLocation,
      dimensions: { ...sourceWall.dimensions },
      position: { x: 0, y: 0, z: 0 },
    });
    
    // Copy boxes to new wall
    // TODO: Deep copy boxes with new IDs
    
    setActiveWall(newWallId);
  }, [walls, addWall, setActiveWall]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-900 text-lg">Loading Designer...</p>
          <p className="text-gray-500 text-sm mt-2">Preparing catalog and tools</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Toolbar */}
      <Toolbar
        leftPanelOpen={leftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        onToggleLeftPanel={() => setLeftPanelOpen(!leftPanelOpen)}
        onToggleRightPanel={() => setRightPanelOpen(!rightPanelOpen)}
        showLogoBack={false}
      />

      {/* Wall Tabs */}
      <WallTabs
        walls={walls}
        activeWallId={activeWallId}
        onSelectWall={setActiveWall}
        onAddWall={handleAddWall}
        onRenameWall={handleRenameWall}
        onDeleteWall={deleteWall}
        onDuplicateWall={handleDuplicateWall}
      />

      {/* Laminate Panel (overlay) */}
      <LaminatePanel 
        isOpen={laminatePanelOpen} 
        onClose={() => setLaminatePanelOpen(false)} 
      />

      {/* Main Content Area — min-h-0 so flex gives height to canvas; otherwise 3D canvas can get 0 height */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel - Catalog */}
        {leftPanelOpen && (
          <div className="w-80 border-r border-gray-200 bg-white overflow-hidden flex flex-col">
            <CatalogPanel />
          </div>
        )}

        {/* 3D Canvas — min-h-0 so it receives remaining height from flex; required for R3F canvas to render */}
        <div className="flex-1 relative min-h-0">
          <Canvas3D />
          
          {/* Project Name & Status Overlay */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <p className="text-gray-900 font-medium">{projectName}</p>
              {/* Manual Refresh Button */}
              <button
                onClick={() => loadCatalog(true)}
                disabled={isRefreshingCatalog}
                className={`p-1 rounded transition-colors ${
                  isRefreshingCatalog 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'
                }`}
                title="Refresh catalog data"
              >
                <svg 
                  className={`w-4 h-4 ${isRefreshingCatalog ? 'animate-spin' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {isDirty && (
                <span className="text-orange-500">• Unsaved changes</span>
              )}
              {isRefreshingCatalog && (
                <span className="text-orange-400">• Syncing catalog...</span>
              )}
            </div>
            {lastCatalogRefresh && (
              <p className="text-xs text-gray-400 mt-1">
                {catalogSource === 'google-sheets' ? 'Live sync' : 'Local CSV'} • Last: {new Date(lastCatalogRefresh).toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Undo/Redo Indicator */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 shadow-sm text-xs text-gray-500 flex items-center gap-2">
            <span className={canUndo ? 'text-gray-900' : 'text-gray-400'}>
              Ctrl+Z Undo
            </span>
            <span>|</span>
            <span className={canRedo ? 'text-gray-900' : 'text-gray-400'}>
              Ctrl+Y Redo
            </span>
          </div>

          {/* Controls Help Overlay */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 shadow-sm text-xs text-gray-500">
            <p>
              <span className="text-gray-900">LMB</span> Rotate |{' '}
              <span className="text-gray-900">RMB</span> Pan |{' '}
              <span className="text-gray-900">Scroll</span> Zoom |{' '}
              <span className="text-gray-900">Arrow Keys</span> Nudge
            </p>
          </div>

          {/* Laminate Picker Button */}
          <button
            onClick={() => setLaminatePanelOpen(true)}
            className="absolute bottom-4 right-4 bg-orange-500 hover:bg-orange-600 backdrop-blur-sm rounded-lg px-4 py-2 border border-orange-400 text-sm text-white flex items-center gap-2 transition-colors shadow-lg shadow-orange-200"
          >
            <span className="text-lg">🎨</span>
            <span>Laminate Picker</span>
          </button>
        </div>

        {/* Right Panel - Properties */}
        {rightPanelOpen && (
          <div className="w-80 border-l border-gray-200 bg-white overflow-hidden flex flex-col">
            <PropertiesPanel />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-8 border-t border-gray-200 bg-white flex items-center justify-between px-4 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>NestUp Visualiser v1.0</span>
          <span>|</span>
          <span>Units: mm</span>
          {walls.length > 0 && (
            <>
              <span>|</span>
              <span className="text-gray-900">{walls.length} Wall{walls.length !== 1 ? 's' : ''}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* Material counts */}
          {laminateLibrary.length > 0 && (
            <>
              <span className="text-gray-700">{laminateLibrary.length} Laminates</span>
              <span>|</span>
            </>
          )}
          {plywoodLibrary.length > 0 && (
            <>
              <span className="text-gray-700">{plywoodLibrary.length} Plywood</span>
              <span>|</span>
            </>
          )}
          {catalogSource === 'google-sheets' && (
            <>
              <span className="text-orange-500">● Live</span>
              <span>|</span>
            </>
          )}
          <span>Grid: 50mm</span>
          <span>|</span>
          <span>Snap: ON</span>
        </div>
      </div>
    </div>
  );
}
