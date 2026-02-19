/**
 * WallTabs Component
 * Internal tab bar for managing multiple walls in the designer
 * 
 * Features:
 * - Horizontal tab bar with wall names
 * - Active tab highlighted in orange
 * - Double-click to rename
 * - Right-click context menu: Rename, Duplicate, Delete
 * - "+ Add Wall" button at end
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Wall } from '@/types/visualiser';

// ============================================
// TYPES
// ============================================

interface WallTabsProps {
  walls: Wall[];
  activeWallId: string | null;
  onSelectWall: (id: string) => void;
  onAddWall: () => void;
  onRenameWall: (id: string, newName: string) => void;
  onDeleteWall: (id: string) => void;
  onDuplicateWall?: (id: string) => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  wallId: string | null;
}

// ============================================
// WALL TAB COMPONENT
// ============================================

interface WallTabProps {
  wall: Wall;
  isActive: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRename: (newName: string) => void;
  onCancelEdit: () => void;
}

const WallTab: React.FC<WallTabProps> = ({
  wall,
  isActive,
  isEditing,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onRename,
  onCancelEdit,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState(wall.entityName);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(wall.entityName);
  }, [wall.entityName]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onRename(editValue.trim() || wall.entityName);
    } else if (e.key === 'Escape') {
      setEditValue(wall.entityName);
      onCancelEdit();
    }
  };

  const handleBlur = () => {
    onRename(editValue.trim() || wall.entityName);
  };

  return (
    <div
      className={`
        relative flex items-center px-4 py-2 cursor-pointer select-none
        border-b-2 transition-colors duration-150
        ${isActive 
          ? 'bg-orange-50 border-orange-500 text-gray-900' 
          : 'bg-white border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'
        }
      `}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="bg-white text-gray-900 px-2 py-0.5 rounded text-sm w-24 outline-none ring-1 ring-orange-500"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="text-sm font-medium truncate max-w-[120px]">
            {wall.entityName}
          </span>
          {isActive && (
            <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full" />
          )}
        </>
      )}
    </div>
  );
};

// ============================================
// CONTEXT MENU COMPONENT
// ============================================

interface ContextMenuProps {
  x: number;
  y: number;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onRename,
  onDuplicate,
  onDelete,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[140px]"
      style={{ left: x, top: y }}
    >
      <button
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
        onClick={() => { onRename(); onClose(); }}
      >
        <span className="text-gray-400">✏️</span>
        Rename
      </button>
      <button
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
        onClick={() => { onDuplicate(); onClose(); }}
      >
        <span className="text-gray-400">📋</span>
        Duplicate
      </button>
      <div className="border-t border-gray-200 my-1" />
      <button
        className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
        onClick={() => { onDelete(); onClose(); }}
      >
        <span>🗑️</span>
        Delete
      </button>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const WallTabs: React.FC<WallTabsProps> = ({
  walls,
  activeWallId,
  onSelectWall,
  onAddWall,
  onRenameWall,
  onDeleteWall,
  onDuplicateWall,
}) => {
  const [editingWallId, setEditingWallId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    wallId: null,
  });

  const handleContextMenu = useCallback((e: React.MouseEvent, wallId: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      wallId,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false, wallId: null }));
  }, []);

  const handleRename = useCallback((wallId: string, newName: string) => {
    onRenameWall(wallId, newName);
    setEditingWallId(null);
  }, [onRenameWall]);

  const handleDuplicate = useCallback(() => {
    if (contextMenu.wallId && onDuplicateWall) {
      onDuplicateWall(contextMenu.wallId);
    }
  }, [contextMenu.wallId, onDuplicateWall]);

  const handleDelete = useCallback(() => {
    if (contextMenu.wallId) {
      onDeleteWall(contextMenu.wallId);
    }
  }, [contextMenu.wallId, onDeleteWall]);

  return (
    <div className="flex items-center bg-white border-b border-gray-200 overflow-x-auto">
      {/* Wall Tabs */}
      <div className="flex items-center">
        {walls.map((wall) => (
          <WallTab
            key={wall.id}
            wall={wall}
            isActive={wall.id === activeWallId}
            isEditing={wall.id === editingWallId}
            onSelect={() => onSelectWall(wall.id)}
            onDoubleClick={() => setEditingWallId(wall.id)}
            onContextMenu={(e) => handleContextMenu(e, wall.id)}
            onRename={(newName) => handleRename(wall.id, newName)}
            onCancelEdit={() => setEditingWallId(null)}
          />
        ))}
      </div>

      {/* Add Wall Button */}
      <button
        onClick={onAddWall}
        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-orange-500 hover:bg-orange-50 transition-colors border-b-2 border-transparent"
        title="Add new wall"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Wall</span>
      </button>

      {/* Wall Count Indicator */}
      {walls.length > 0 && (
        <div className="ml-auto px-4 py-2 text-xs text-gray-400">
          {walls.length} wall{walls.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.wallId && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onRename={() => setEditingWallId(contextMenu.wallId)}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};

export default WallTabs;
