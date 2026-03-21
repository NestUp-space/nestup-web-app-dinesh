'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDesignerStore, useDesignSummary } from '@/stores/designerStore';
import { DesignMode } from '@/types/visualiser';

interface ToolbarProps {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  /** When false, hide the Logo & Back link at the start (e.g. in visualiser designer). Default true. */
  showLogoBack?: boolean;
}

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  icon,
  label,
  active,
  disabled,
  onClick,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center justify-center px-3 py-1.5 rounded transition-all ${
      active
        ? 'bg-orange-500 text-white'
        : disabled
        ? 'text-gray-300 cursor-not-allowed'
        : 'text-gray-600 hover:text-orange-500 hover:bg-orange-50'
    }`}
    title={label}
  >
    {icon}
    <span className="text-[10px] mt-0.5">{label}</span>
  </button>
);

const Divider = () => <div className="w-px h-8 bg-gray-200 mx-0.5 shrink-0" />;

export const Toolbar: React.FC<ToolbarProps> = ({
  leftPanelOpen,
  rightPanelOpen,
  onToggleLeftPanel,
  onToggleRightPanel,
  showLogoBack = true,
}) => {
  const router = useRouter();
  const summary = useDesignSummary();

  const {
    designMode,
    setDesignMode,
    showGrid,
    showAxes,
    showLabels,
    snapEnabled,
    toggleGrid,
    toggleAxes,
    toggleLabels,
    toggleSnap,
    resetCamera,
    setViewMode,
    addWall,
    setActiveWall,
    clearDesign,
    getDesignData,
    projectName,
  } = useDesignerStore();

  const handleAddWall = () => {
    const wallCount = summary.totalWalls;
    // Coordinate system: X=right, Y=depth (backward), Z=height (up)
    // Wall at origin, extending in X for width, Y for depth (thickness), Z for height
    const newWallId = addWall({
      entityName: `Wall ${wallCount + 1}`,
      roomName: 'Room 1',
      unitLocation: ['North', 'South', 'East', 'West'][wallCount % 4],
      position: { x: 0, y: 0, z: 0 }, // Wall always at origin in single-wall mode
      dimensions: {
        lenX: 3000,  // Width (X direction)
        lenY: 200,   // Depth/thickness (Y direction, extends backward)
        lenZ: 2700   // Height (Z direction, up)
      },
    });
    setActiveWall(newWallId);
  };

  const handleExport = () => {
    const data = getDesignData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '_')}_design.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const setDataSource = useDesignerStore((s) => s.setDataSource);

  const handleGenerateFiles = () => {
    if (summary.totalPlanks === 0) {
      alert('Please add some boxes to your design first.');
      return;
    }
    setDataSource('designer');
    router.push('/visualiser/generate');
  };

  const handleClearDesign = () => {
    if (summary.totalWalls === 0) return;
    const confirmed = window.confirm(
      'This will clear your entire design. Are you sure?'
    );
    if (confirmed) {
      clearDesign();
    }
  };

  const modeIcons: Record<DesignMode, React.ReactNode> = {
    select: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2z" />
      </svg>
    ),
    place: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    move: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
    rotate: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    paint: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    guidelines: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {/* Construction lines icon */}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    measure: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {/* Tape measure/ruler icon */}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12M6 12l3-3m-3 3l3 3m9-6l-3 3m3-3l-3-3" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h2M3 12h2M3 18h2M19 6h2M19 12h2M19 18h2" />
      </svg>
    ),
  };

  return (
    <div className="h-14 border-b border-gray-200 bg-white backdrop-blur-sm flex items-center px-2 gap-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      {showLogoBack && (
        <>
          {/* Logo & Back */}
          <Link
            href="/visualiser"
            className="flex items-center gap-2 mr-2 text-orange-500 hover:text-orange-600 transition-colors shrink-0"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-semibold">Visualiser</span>
          </Link>
          <Divider />
        </>
      )}

      {/* Panel Toggles */}
      <ToolButton
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        }
        label="Catalog"
        active={leftPanelOpen}
        onClick={onToggleLeftPanel}
      />
      <ToolButton
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        }
        label="Properties"
        active={rightPanelOpen}
        onClick={onToggleRightPanel}
      />

      <Divider />

      {/* Design Tools */}
      <ToolButton
        icon={modeIcons.select}
        label="Select"
        active={designMode === 'select'}
        onClick={() => setDesignMode('select')}
      />
      <ToolButton
        icon={modeIcons.move}
        label="Move"
        active={designMode === 'move'}
        onClick={() => setDesignMode('move')}
      />
      <ToolButton
        icon={modeIcons.rotate}
        label="Rotate"
        active={designMode === 'rotate'}
        onClick={() => setDesignMode('rotate')}
      />
      <ToolButton
        icon={modeIcons.paint}
        label="Paint"
        active={designMode === 'paint'}
        onClick={() => setDesignMode('paint')}
      />
      <ToolButton
        icon={modeIcons.guidelines}
        label="Guide"
        active={designMode === 'guidelines'}
        onClick={() => setDesignMode('guidelines')}
      />
      <ToolButton
        icon={modeIcons.measure}
        label="Measure"
        active={designMode === 'measure'}
        onClick={() => setDesignMode('measure')}
      />

      <Divider />

      {/* Add Elements */}
      <ToolButton
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        }
        label="Add Wall"
        onClick={handleAddWall}
      />

      <Divider />

      {/* View Controls */}
      <ToolButton
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        }
        label="Grid"
        active={showGrid}
        onClick={toggleGrid}
      />
      <ToolButton
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21V3m0 18l4-4m-4 4l-4-4M17 3v18m0-18l4 4m-4-4l-4 4" />
          </svg>
        }
        label="Axes"
        active={showAxes}
        onClick={toggleAxes}
      />
      <ToolButton
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        }
        label="Labels"
        active={showLabels}
        onClick={toggleLabels}
      />
      <ToolButton
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
        label="Snap"
        active={snapEnabled}
        onClick={toggleSnap}
      />

      <Divider />

      {/* Camera Views */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => setViewMode('perspective')}
          className="px-1.5 py-1 text-xs rounded text-gray-500 hover:text-orange-500 hover:bg-orange-50"
        >
          3D
        </button>
        <button
          onClick={() => setViewMode('top')}
          className="px-1.5 py-1 text-xs rounded text-gray-500 hover:text-orange-500 hover:bg-orange-50"
        >
          Top
        </button>
        <button
          onClick={() => setViewMode('front')}
          className="px-1.5 py-1 text-xs rounded text-gray-500 hover:text-orange-500 hover:bg-orange-50"
        >
          Front
        </button>
        <button
          onClick={resetCamera}
          className="px-1.5 py-1 text-xs rounded text-gray-500 hover:text-orange-500 hover:bg-orange-50"
        >
          Reset
        </button>
      </div>

      {/* Spacer - flexible but with minimum */}
      <div className="flex-1 min-w-[8px]" />

      {/* Right Actions - always visible */}
      <div className="flex items-center gap-1 shrink-0 sticky right-0 bg-white/95 pl-2">
        <ToolButton
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          }
          label="Export"
          onClick={handleExport}
          disabled={summary.totalWalls === 0}
        />

        <ToolButton
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          }
          label="Clear"
          onClick={handleClearDesign}
          disabled={summary.totalWalls === 0}
        />

        <Divider />

        {/* Installation Guide - Preview */}
        <ToolButton
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
          label="Guide"
          onClick={() => router.push('/visualiser/installation-guide')}
          disabled={summary.totalPlanks === 0}
        />

        <Divider />

        {/* Generate Files - Main Action - always visible */}
        <button
          onClick={handleGenerateFiles}
          disabled={summary.totalPlanks === 0}
          className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-all whitespace-nowrap shrink-0 text-sm ${
            summary.totalPlanks > 0
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-200'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="hidden md:inline">Generate Files</span>
          <span className="md:hidden">Generate</span>
        </button>
      </div>
    </div>
  );
};
