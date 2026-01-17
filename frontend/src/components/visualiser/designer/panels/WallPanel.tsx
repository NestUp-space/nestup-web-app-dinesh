/**
 * WallPanel Component
 * Manages wall list with CRUD operations
 */

"use client";

import React, { useState } from "react";
import { useDesignerStore } from "@/store/designerStore";
import type { DesignerWall } from "@/types/visualiser";

// ============================================
// Wall Dialog Component
// ============================================

interface WallDialogProps {
  wall?: DesignerWall;
  onSave: (data: {
    name: string;
    roomName: string;
    width: number;
    height: number;
    depth: number;
  }) => void;
  onClose: () => void;
}

function WallDialog({ wall, onSave, onClose }: WallDialogProps) {
  const [name, setName] = useState(wall?.name || 'New Wall');
  const [roomName, setRoomName] = useState(wall?.roomName || '');
  const [width, setWidth] = useState(wall?.width || 3000);
  const [height, setHeight] = useState(wall?.height || 2700);
  const [depth, setDepth] = useState(wall?.depth || 200);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, roomName, width, height, depth });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-lightest-bg rounded-dls-lg shadow-2xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-light-bw">
          <h3 className="text-lg font-semibold text-neutral-dark">
            {wall ? 'Edit Wall' : 'Add Wall'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-1">
              Wall Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-neutral-dark border border-light-bw rounded-dls-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
              placeholder="e.g., Kitchen Wall A"
              required
            />
          </div>

          {/* Room Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-1">
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-3 py-2 text-neutral-dark border border-light-bw rounded-dls-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
              placeholder="e.g., Kitchen"
            />
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1">
                Width (mm)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full px-3 py-2 text-neutral-dark border border-light-bw rounded-dls-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                min={100}
                max={20000}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1">
                Height (mm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full px-3 py-2 text-neutral-dark border border-light-bw rounded-dls-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                min={100}
                max={10000}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1">
                Depth (mm)
              </label>
              <input
                type="number"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                className="w-full px-3 py-2 text-neutral-dark border border-light-bw rounded-dls-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                min={50}
                max={1000}
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-dark hover:bg-lighter-bg rounded-dls-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-orange text-white rounded-dls-md hover:bg-dark-color transition-colors"
            >
              {wall ? 'Save Changes' : 'Add Wall'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Delete Confirmation Dialog
// ============================================

interface DeleteDialogProps {
  wallName: string;
  boxCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteDialog({ wallName, boxCount, onConfirm, onCancel }: DeleteDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-lightest-bg rounded-dls-lg shadow-2xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-lg font-semibold text-neutral-dark mb-2">
          Delete Wall?
        </h3>
        <p className="text-technical-gray mb-4">
          Are you sure you want to delete <strong>{wallName}</strong>?
          {boxCount > 0 && (
            <span className="block mt-2 text-red-600">
              This will also delete {boxCount} box{boxCount !== 1 ? 'es' : ''} on this wall.
            </span>
          )}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-neutral-dark hover:bg-lighter-bg rounded-dls-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-dls-md hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main WallPanel Component
// ============================================

export function WallPanel() {
  const walls = useDesignerStore((state) => state.walls);
  const currentWallId = useDesignerStore((state) => state.currentWallId);
  const setCurrentWall = useDesignerStore((state) => state.setCurrentWall);
  const addWall = useDesignerStore((state) => state.addWall);
  const updateWall = useDesignerStore((state) => state.updateWall);
  const deleteWall = useDesignerStore((state) => state.deleteWall);
  const isWallPanelOpen = useDesignerStore((state) => state.isWallPanelOpen);
  const toggleWallPanel = useDesignerStore((state) => state.toggleWallPanel);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingWall, setEditingWall] = useState<DesignerWall | null>(null);
  const [deletingWall, setDeletingWall] = useState<DesignerWall | null>(null);

  const handleAddWall = (data: {
    name: string;
    roomName: string;
    width: number;
    height: number;
    depth: number;
  }) => {
    addWall({
      ...data,
      sortOrder: walls.length,
    });
    setShowAddDialog(false);
  };

  const handleEditWall = (data: {
    name: string;
    roomName: string;
    width: number;
    height: number;
    depth: number;
  }) => {
    if (editingWall) {
      updateWall(editingWall.id, data);
      setEditingWall(null);
    }
  };

  const handleDeleteWall = () => {
    if (deletingWall) {
      deleteWall(deletingWall.id);
      setDeletingWall(null);
    }
  };

  if (!isWallPanelOpen) {
    return (
      <button
        onClick={toggleWallPanel}
        className="absolute top-20 left-4 bg-lightest-bg/95 backdrop-blur p-2 rounded-dls-md shadow-lg z-30 hover:bg-lighter-bg transition-colors"
        title="Show Walls"
      >
        🧱
      </button>
    );
  }

  return (
    <>
      <div className="absolute top-20 left-4 w-64 bg-lightest-bg/95 backdrop-blur rounded-dls-lg shadow-lg overflow-hidden z-30">
        {/* Header */}
        <div className="px-4 py-3 bg-lighter-bg border-b border-light-bw flex items-center justify-between">
          <h3 className="font-semibold text-neutral-dark">Walls</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAddDialog(true)}
              className="p-1.5 hover:bg-light-bg rounded-dls-sm transition-colors"
              title="Add Wall"
            >
              ➕
            </button>
            <button
              onClick={toggleWallPanel}
              className="p-1.5 hover:bg-light-bg rounded-dls-sm transition-colors"
              title="Hide Panel"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Wall List */}
        <div className="p-2 max-h-80 overflow-y-auto">
          {walls.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-technical-gray text-sm mb-3">No walls yet</p>
              <button
                onClick={() => setShowAddDialog(true)}
                className="px-4 py-2 bg-primary-orange text-white rounded-dls-md text-sm hover:bg-dark-color transition-colors"
              >
                Add First Wall
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {walls
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((wall) => (
                  <div
                    key={wall.id}
                    className={`group flex items-center gap-2 p-2 rounded-dls-md cursor-pointer transition-colors ${
                      currentWallId === wall.id
                        ? "bg-lighter-interactive/30 border border-light-border"
                        : "hover:bg-lighter-bg"
                    }`}
                    onClick={() => setCurrentWall(wall.id)}
                  >
                    {/* Wall info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-neutral-dark truncate">
                        {wall.name}
                      </div>
                      <div className="text-xs text-technical-gray">
                        {wall.width} × {wall.height}mm • {wall.boxes.length} boxes
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingWall(wall);
                        }}
                        className="p-1 hover:bg-light-bg rounded-dls-sm text-technical-gray hover:text-neutral-dark"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingWall(wall);
                        }}
                        className="p-1 hover:bg-red-100 rounded-dls-sm text-technical-gray hover:text-red-600"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Quick Add */}
        {walls.length > 0 && (
          <div className="px-4 py-3 border-t border-light-bw">
            <button
              onClick={() => setShowAddDialog(true)}
              className="w-full py-2 text-sm text-primary-orange hover:bg-lighter-interactive/20 rounded-dls-md transition-colors"
            >
              + Add Wall
            </button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showAddDialog && (
        <WallDialog
          onSave={handleAddWall}
          onClose={() => setShowAddDialog(false)}
        />
      )}

      {editingWall && (
        <WallDialog
          wall={editingWall}
          onSave={handleEditWall}
          onClose={() => setEditingWall(null)}
        />
      )}

      {deletingWall && (
        <DeleteDialog
          wallName={deletingWall.name}
          boxCount={deletingWall.boxes.length}
          onConfirm={handleDeleteWall}
          onCancel={() => setDeletingWall(null)}
        />
      )}
    </>
  );
}

export default WallPanel;
