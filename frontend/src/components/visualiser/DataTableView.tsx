'use client';

/**
 * DataTableView Component
 * Spreadsheet-like display for generated data
 * Similar to Google Sheets view in Apps Script
 * 
 * Features:
 * - Column headers with sorting
 * - Row numbers
 * - Scrollable with sticky header
 * - Export to CSV
 * - Search/filter
 */

import { useState, useMemo, useCallback } from 'react';

// ============================================
// TYPES
// ============================================

export interface DataTableColumn {
  key: string;
  header: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: unknown) => string;
}

export interface DataTableProps {
  title: string;
  columns: DataTableColumn[];
  data: Record<string, unknown>[];
  onExportCSV?: () => void;
  onClose?: () => void;
  showRowNumbers?: boolean;
  maxHeight?: string;
  summary?: { label: string; value: string }[];
}

// ============================================
// COMPONENT
// ============================================

export function DataTableView({
  title,
  columns,
  data,
  onExportCSV,
  onClose,
  showRowNumbers = true,
  maxHeight = '70vh',
  summary,
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const value = row[col.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, columns, searchQuery]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal == null) return sortDirection === 'asc' ? -1 : 1;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Handle column header click for sorting
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Format cell value
  const formatCellValue = (column: DataTableColumn, value: unknown): string => {
    if (value == null) return '';
    if (column.format) return column.format(value);
    if (typeof value === 'number') {
      return Number.isInteger(value) ? String(value) : value.toFixed(2);
    }
    return String(value);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (onExportCSV) {
      onExportCSV();
      return;
    }

    // Default CSV export
    const headers = columns.map((c) => c.header).join(',');
    const rows = sortedData.map((row) =>
      columns
        .map((col) => {
          const value = formatCellValue(col, row[col.key]);
          // Escape commas and quotes
          if (value.includes(',') || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <span className="text-sm text-gray-500">
            {sortedData.length} {sortedData.length === 1 ? 'row' : 'rows'}
            {searchQuery && ` (filtered from ${data.length})`}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-48 pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download CSV
          </button>

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full border-collapse min-w-max">
          {/* Header */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-100">
              {showRowNumbers && (
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 text-center border-b border-r border-gray-200 bg-gray-100 w-12">
                  #
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className="px-3 py-2 text-xs font-semibold text-gray-700 border-b border-r border-gray-200 bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                  style={{
                    width: column.width,
                    textAlign: column.align || 'left',
                  }}
                >
                  <div className="flex items-center gap-1 justify-between">
                    <span>{column.header}</span>
                    {sortColumn === column.key && (
                      <svg
                        className={`w-3 h-3 transition-transform ${
                          sortDirection === 'desc' ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (showRowNumbers ? 1 : 0)}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  {searchQuery ? 'No matching records found' : 'No data available'}
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-blue-50 transition-colors border-b border-gray-100"
                >
                  {showRowNumbers && (
                    <td className="px-3 py-2 text-xs text-gray-400 text-center border-r border-gray-100 bg-gray-50">
                      {rowIndex + 1}
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-3 py-2 text-sm text-gray-900 border-r border-gray-100"
                      style={{ textAlign: column.align || 'left' }}
                    >
                      {formatCellValue(column, row[column.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      {summary && summary.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t flex items-center gap-6">
          {summary.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{item.label}:</span>
              <span className="text-sm font-semibold text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// MODAL WRAPPER
// ============================================

interface DataTableModalProps extends DataTableProps {
  isOpen: boolean;
}

export function DataTableModal({ isOpen, ...props }: DataTableModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-6xl max-h-[90vh]">
        <DataTableView {...props} maxHeight="80vh" />
      </div>
    </div>
  );
}

// ============================================
// PRE-CONFIGURED TABLE VIEWS
// ============================================

import { FormattedPlankData, PlankListItem, MaterialSummary, NestResult } from '@/types/visualiser';
import type { RawDataRow } from '@/lib/visualiser/rawDataGenerator';

// ============================================
// RAW DATA TABLE (LEVEL 0-3 HIERARCHY)
// ============================================

/**
 * Raw Data Table - Hierarchical view with Level 0-3
 * Shows Walls, Boxes, Planks, and Operations
 */
export function RawDataTable({
  data,
  onClose,
}: {
  data: RawDataRow[];
  onClose?: () => void;
}) {
  const columns: DataTableColumn[] = [
    { key: 'entityName', header: 'Entity Name', width: 200 },
    { key: 'level', header: 'Level', width: 60, align: 'center' },
    { key: 'material', header: 'Material', width: 120 },
    { key: 'roomName', header: 'Room_Name', width: 120 },
    { key: 'unitLocation', header: 'Unit_Location', width: 100 },
    { key: 'boxModel', header: 'Box_Model', width: 120 },
    { key: 'boxType', header: 'Box_Type', width: 100 },
    { key: 'lenX', header: 'LenX', width: 80, align: 'right' },
    { key: 'lenY', header: 'LenY', width: 80, align: 'right' },
    { key: 'lenZ', header: 'LenZ', width: 80, align: 'right' },
    { key: 'x', header: 'X', width: 80, align: 'right' },
    { key: 'y', header: 'Y', width: 80, align: 'right' },
    { key: 'z', header: 'Z', width: 80, align: 'right' },
    { key: 'plankId', header: 'plank_id', width: 80, align: 'center' },
  ];

  // Calculate statistics
  const wallCount = data.filter(r => r.level === 0).length;
  const boxCount = data.filter(r => r.level === 1).length;
  const plankCount = data.filter(r => r.level === 2).length;
  const operationCount = data.filter(r => r.level === 3).length;

  return (
    <DataTableView
      title="Raw Data (Hierarchical)"
      columns={columns}
      data={data as unknown as Record<string, unknown>[]}
      onClose={onClose}
      summary={[
        { label: 'Walls', value: String(wallCount) },
        { label: 'Boxes', value: String(boxCount) },
        { label: 'Planks', value: String(plankCount) },
        { label: 'Operations', value: String(operationCount) },
      ]}
    />
  );
}

// ============================================
// FORMATTED DATA TABLE
// ============================================

/**
 * Formatted Data Table with Dynamic Operation Columns
 * Shows Level 3 operations (hinges, screws, VB holes, grooves, L-cuts)
 * Matches AppScript Formatted_Plank_Data output
 */
export function FormattedDataTable({
  data,
  onClose,
}: {
  data: FormattedPlankData[];
  onClose?: () => void;
}) {
  // Build dynamic operation columns based on max counts in data
  const operationColumns = useMemo(() => {
    const maxCounts: Record<string, number> = {
      hinges: 0,
      screws: 0,
      vb_main: 0,
      vb_double: 0,
      grooves: 0,
      slots: 0,
      profiles: 0,
      l_cuts: 0,
    };

    // Find max operation counts across all planks
    data.forEach(plank => {
      if (plank.operations) {
        maxCounts.hinges = Math.max(maxCounts.hinges, plank.operations.hinges?.length || 0);
        maxCounts.screws = Math.max(maxCounts.screws, plank.operations.screws?.length || 0);
        maxCounts.vb_main = Math.max(maxCounts.vb_main, plank.operations.vb_main?.length || 0);
        maxCounts.vb_double = Math.max(maxCounts.vb_double, plank.operations.vb_double?.length || 0);
        maxCounts.grooves = Math.max(maxCounts.grooves, plank.operations.grooves?.length || 0);
        maxCounts.slots = Math.max(maxCounts.slots, plank.operations.slots?.length || 0);
        maxCounts.profiles = Math.max(maxCounts.profiles, plank.operations.profiles?.length || 0);
        maxCounts.l_cuts = Math.max(maxCounts.l_cuts, plank.operations.l_cuts?.length || 0);
      }
    });

    const cols: DataTableColumn[] = [];
    
    // Add hinge columns
    for (let i = 1; i <= maxCounts.hinges; i++) {
      cols.push({ key: `hing_${i}_X`, header: `hing_${i}_X`, width: 70, align: 'right' });
      cols.push({ key: `hing_${i}_Y`, header: `hing_${i}_Y`, width: 70, align: 'right' });
      cols.push({ key: `hing_${i}_Z`, header: `hing_${i}_Z`, width: 70, align: 'right' });
    }
    
    // Add screw columns
    for (let i = 1; i <= maxCounts.screws; i++) {
      cols.push({ key: `screw_${i}_X`, header: `screw_${i}_X`, width: 70, align: 'right' });
      cols.push({ key: `screw_${i}_Y`, header: `screw_${i}_Y`, width: 70, align: 'right' });
      cols.push({ key: `screw_${i}_Z`, header: `screw_${i}_Z`, width: 70, align: 'right' });
    }
    
    // Add VB main columns
    for (let i = 1; i <= maxCounts.vb_main; i++) {
      cols.push({ key: `vb_main_${i}_X`, header: `vb_main_${i}_X`, width: 70, align: 'right' });
      cols.push({ key: `vb_main_${i}_Y`, header: `vb_main_${i}_Y`, width: 70, align: 'right' });
      cols.push({ key: `vb_main_${i}_Z`, header: `vb_main_${i}_Z`, width: 70, align: 'right' });
    }
    
    // Add VB double columns
    for (let i = 1; i <= maxCounts.vb_double; i++) {
      cols.push({ key: `vb_double_${i}_X`, header: `vb_double_${i}_X`, width: 70, align: 'right' });
      cols.push({ key: `vb_double_${i}_Y`, header: `vb_double_${i}_Y`, width: 70, align: 'right' });
      cols.push({ key: `vb_double_${i}_Z`, header: `vb_double_${i}_Z`, width: 70, align: 'right' });
    }
    
    // Add groove columns (with length and width)
    for (let i = 1; i <= maxCounts.grooves; i++) {
      cols.push({ key: `groove_${i}_X`, header: `groove_${i}_X`, width: 70, align: 'right' });
      cols.push({ key: `groove_${i}_Y`, header: `groove_${i}_Y`, width: 70, align: 'right' });
      cols.push({ key: `groove_${i}_Z`, header: `groove_${i}_Z`, width: 70, align: 'right' });
      cols.push({ key: `groove_${i}_length`, header: `groove_${i}_length`, width: 80, align: 'right' });
      cols.push({ key: `groove_${i}_width`, header: `groove_${i}_width`, width: 80, align: 'right' });
    }
    
    // Add slot columns (with length and width)
    for (let i = 1; i <= maxCounts.slots; i++) {
      cols.push({ key: `slot_${i}_X`, header: `slot_${i}_X`, width: 70, align: 'right' });
      cols.push({ key: `slot_${i}_Y`, header: `slot_${i}_Y`, width: 70, align: 'right' });
      cols.push({ key: `slot_${i}_Z`, header: `slot_${i}_Z`, width: 70, align: 'right' });
      cols.push({ key: `slot_${i}_length`, header: `slot_${i}_length`, width: 80, align: 'right' });
      cols.push({ key: `slot_${i}_width`, header: `slot_${i}_width`, width: 80, align: 'right' });
    }
    
    // Add profile columns (with length and width)
    for (let i = 1; i <= maxCounts.profiles; i++) {
      cols.push({ key: `profile_${i}_X`, header: `profile_${i}_X`, width: 70, align: 'right' });
      cols.push({ key: `profile_${i}_Y`, header: `profile_${i}_Y`, width: 70, align: 'right' });
      cols.push({ key: `profile_${i}_Z`, header: `profile_${i}_Z`, width: 70, align: 'right' });
      cols.push({ key: `profile_${i}_length`, header: `profile_${i}_length`, width: 80, align: 'right' });
      cols.push({ key: `profile_${i}_width`, header: `profile_${i}_width`, width: 80, align: 'right' });
    }
    
    // Add L-cut triplet columns
    for (let i = 1; i <= maxCounts.l_cuts; i++) {
      cols.push({ key: `L_cut_${i}_start_X`, header: `L_cut_${i}_start_X`, width: 90, align: 'right' });
      cols.push({ key: `L_cut_${i}_start_Y`, header: `L_cut_${i}_start_Y`, width: 90, align: 'right' });
      cols.push({ key: `L_cut_${i}_center_X`, header: `L_cut_${i}_center_X`, width: 90, align: 'right' });
      cols.push({ key: `L_cut_${i}_center_Y`, header: `L_cut_${i}_center_Y`, width: 90, align: 'right' });
      cols.push({ key: `L_cut_${i}_end_X`, header: `L_cut_${i}_end_X`, width: 90, align: 'right' });
      cols.push({ key: `L_cut_${i}_end_Y`, header: `L_cut_${i}_end_Y`, width: 90, align: 'right' });
    }

    return cols;
  }, [data]);

  // Flatten operations into row data
  const flattenedData = useMemo(() => {
    return data.map(plank => {
      const row: Record<string, unknown> = {
        roomName: plank.roomName,
        boxType: plank.boxType,
        boxModel: plank.boxModel,
        boxOrientation: plank.boxOrientation,
        boxName: plank.boxName,
        plankName: plank.plankName,
        plankId: plank.plankId,
        plankLength: plank.plankLength,
        plankWidth: plank.plankWidth,
        plankThickness: plank.plankThickness,
        plankMaterial: plank.plankMaterial,
        ebValue: plank.ebValue,
      };

      // Flatten operations
      if (plank.operations) {
        // Hinges
        plank.operations.hinges?.forEach((op, i) => {
          row[`hing_${i + 1}_X`] = op.x?.toFixed(1);
          row[`hing_${i + 1}_Y`] = op.y?.toFixed(1);
          row[`hing_${i + 1}_Z`] = op.z?.toFixed(1);
        });
        
        // Screws
        plank.operations.screws?.forEach((op, i) => {
          row[`screw_${i + 1}_X`] = op.x?.toFixed(1);
          row[`screw_${i + 1}_Y`] = op.y?.toFixed(1);
          row[`screw_${i + 1}_Z`] = op.z?.toFixed(1);
        });
        
        // VB Main
        plank.operations.vb_main?.forEach((op, i) => {
          row[`vb_main_${i + 1}_X`] = op.x?.toFixed(1);
          row[`vb_main_${i + 1}_Y`] = op.y?.toFixed(1);
          row[`vb_main_${i + 1}_Z`] = op.z?.toFixed(1);
        });
        
        // VB Double
        plank.operations.vb_double?.forEach((op, i) => {
          row[`vb_double_${i + 1}_X`] = op.x?.toFixed(1);
          row[`vb_double_${i + 1}_Y`] = op.y?.toFixed(1);
          row[`vb_double_${i + 1}_Z`] = op.z?.toFixed(1);
        });
        
        // Grooves
        plank.operations.grooves?.forEach((op, i) => {
          row[`groove_${i + 1}_X`] = op.x?.toFixed(1);
          row[`groove_${i + 1}_Y`] = op.y?.toFixed(1);
          row[`groove_${i + 1}_Z`] = op.z?.toFixed(1);
          row[`groove_${i + 1}_length`] = op.length?.toFixed(1);
          row[`groove_${i + 1}_width`] = op.width?.toFixed(1);
        });
        
        // Slots
        plank.operations.slots?.forEach((op, i) => {
          row[`slot_${i + 1}_X`] = op.x?.toFixed(1);
          row[`slot_${i + 1}_Y`] = op.y?.toFixed(1);
          row[`slot_${i + 1}_Z`] = op.z?.toFixed(1);
          row[`slot_${i + 1}_length`] = op.length?.toFixed(1);
          row[`slot_${i + 1}_width`] = op.width?.toFixed(1);
        });
        
        // Profiles
        plank.operations.profiles?.forEach((op, i) => {
          row[`profile_${i + 1}_X`] = op.x?.toFixed(1);
          row[`profile_${i + 1}_Y`] = op.y?.toFixed(1);
          row[`profile_${i + 1}_Z`] = op.z?.toFixed(1);
          row[`profile_${i + 1}_length`] = op.length?.toFixed(1);
          row[`profile_${i + 1}_width`] = op.width?.toFixed(1);
        });
        
        // L-cuts (triplets)
        plank.operations.l_cuts?.forEach((lc, i) => {
          row[`L_cut_${i + 1}_start_X`] = lc.start?.x?.toFixed(1);
          row[`L_cut_${i + 1}_start_Y`] = lc.start?.y?.toFixed(1);
          row[`L_cut_${i + 1}_center_X`] = lc.center?.x?.toFixed(1);
          row[`L_cut_${i + 1}_center_Y`] = lc.center?.y?.toFixed(1);
          row[`L_cut_${i + 1}_end_X`] = lc.end?.x?.toFixed(1);
          row[`L_cut_${i + 1}_end_Y`] = lc.end?.y?.toFixed(1);
        });
      }

      return row;
    });
  }, [data]);

  // Base columns
  const baseColumns: DataTableColumn[] = [
    { key: 'roomName', header: 'room_name', width: 100 },
    { key: 'boxType', header: 'box_type', width: 100 },
    { key: 'boxModel', header: 'box_model', width: 120 },
    { key: 'boxOrientation', header: 'box_orientation', width: 80, align: 'center' },
    { key: 'boxName', header: 'box_name', width: 150 },
    { key: 'plankName', header: 'plank_name', width: 120 },
    { key: 'plankId', header: 'plank_id', width: 80, align: 'center' },
    { key: 'plankLength', header: 'plank_length', width: 100, align: 'right' },
    { key: 'plankWidth', header: 'plank_width', width: 100, align: 'right' },
    { key: 'plankThickness', header: 'plank_thickness', width: 80, align: 'right' },
    { key: 'plankMaterial', header: 'plank_material', width: 150 },
    { key: 'ebValue', header: 'EB_Value', width: 80, align: 'right' },
  ];

  // Combine base columns with dynamic operation columns
  const allColumns = [...baseColumns, ...operationColumns];

  // Count operations
  const totalOperations = data.reduce((sum, plank) => {
    if (!plank.operations) return sum;
    return sum + 
      (plank.operations.hinges?.length || 0) +
      (plank.operations.screws?.length || 0) +
      (plank.operations.vb_main?.length || 0) +
      (plank.operations.vb_double?.length || 0) +
      (plank.operations.grooves?.length || 0) +
      (plank.operations.slots?.length || 0) +
      (plank.operations.profiles?.length || 0) +
      (plank.operations.l_cuts?.length || 0);
  }, 0);

  return (
    <DataTableView
      title="Formatted Data (with Level 3 Operations)"
      columns={allColumns}
      data={flattenedData}
      onClose={onClose}
      summary={[
        { label: 'Total Planks', value: String(data.length) },
        { label: 'Total Operations', value: String(totalOperations) },
        { label: 'Operation Columns', value: String(operationColumns.length) },
      ]}
    />
  );
}

/**
 * Plank List Table
 */
export function PlankListTable({
  data,
  onClose,
}: {
  data: PlankListItem[];
  onClose?: () => void;
}) {
  const columns: DataTableColumn[] = [
    { key: 'plankName', header: 'Plank Name', width: 150 },
    { key: 'material', header: 'Material', width: 200 },
    { key: 'width', header: 'Width (mm)', width: 100, align: 'right' },
    { key: 'height', header: 'Height (mm)', width: 100, align: 'right' },
    { key: 'thickness', header: 'Thickness (mm)', width: 100, align: 'right' },
    { key: 'plankId', header: 'Plank ID', width: 80, align: 'center' },
    { key: 'grain', header: 'Grain', width: 60, align: 'center' },
    { key: 'edgeBinding', header: 'Edge Binding (m)', width: 120, align: 'right', format: (v) => Number(v).toFixed(3) },
  ];

  const totalEB = data.reduce((sum, p) => sum + (p.edgeBinding || 0), 0);

  return (
    <DataTableView
      title="Plank List"
      columns={columns}
      data={data as unknown as Record<string, unknown>[]}
      onClose={onClose}
      summary={[
        { label: 'Total Planks', value: String(data.length) },
        { label: 'Total Edge Binding', value: `${totalEB.toFixed(2)} m` },
      ]}
    />
  );
}

/**
 * Material Summary Table
 */
export function MaterialSummaryTable({
  data,
  onClose,
}: {
  data: MaterialSummary[];
  onClose?: () => void;
}) {
  const columns: DataTableColumn[] = [
    { key: 'materialThickness', header: 'Material & Thickness', width: 200 },
    { key: 'roomNames', header: 'Room Name(s)', width: 150 },
    { key: 'plankCount', header: 'Plank Count', width: 100, align: 'right' },
    { key: 'totalArea', header: 'Total Area (mm²)', width: 130, align: 'right', format: (v) => Number(v).toLocaleString() },
    { key: 'sheetsUsed', header: 'Sheets Used', width: 100, align: 'right' },
    { key: 'avgAreaPerSheet', header: 'Avg Area/Sheet', width: 120, align: 'right', format: (v) => Number(v).toLocaleString() },
    { key: 'utilization', header: 'Utilization %', width: 100, align: 'right', format: (v) => `${Number(v).toFixed(1)}%` },
    { key: 'totalEdge', header: 'Total Edge (m)', width: 110, align: 'right', format: (v) => Number(v).toFixed(2) },
  ];

  const totalSheets = data.reduce((sum, d) => sum + d.sheetsUsed, 0);

  return (
    <DataTableView
      title="Material Summary"
      columns={columns}
      data={data as unknown as Record<string, unknown>[]}
      onClose={onClose}
      summary={[
        { label: 'Material Types', value: String(data.length) },
        { label: 'Total Sheets', value: String(totalSheets) },
      ]}
    />
  );
}

/**
 * Nest Result Table
 */
export function NestResultTable({
  data,
  onClose,
}: {
  data: NestResult[];
  onClose?: () => void;
}) {
  const columns: DataTableColumn[] = [
    { key: 'id', header: 'Plank ID', width: 100 },
    { key: 'name', header: 'Plank Name', width: 150 },
    { key: 'material', header: 'Material', width: 180 },
    { key: 'thickness', header: 'Thickness', width: 80, align: 'right' },
    { key: 'sheetNum', header: 'Sheet', width: 60, align: 'center' },
    { key: 'x', header: 'X', width: 70, align: 'right', format: (v) => Number(v).toFixed(1) },
    { key: 'y', header: 'Y', width: 70, align: 'right', format: (v) => Number(v).toFixed(1) },
    { key: 'width', header: 'Placed Width', width: 100, align: 'right', format: (v) => Number(v).toFixed(1) },
    { key: 'height', header: 'Placed Height', width: 100, align: 'right', format: (v) => Number(v).toFixed(1) },
    { key: 'rotated', header: 'Rotated', width: 70, align: 'center', format: (v) => v ? 'Yes' : 'No' },
    { key: 'originalWidth', header: 'Orig Width', width: 100, align: 'right', format: (v) => Number(v).toFixed(1) },
    { key: 'originalHeight', header: 'Orig Height', width: 100, align: 'right', format: (v) => Number(v).toFixed(1) },
    { key: 'ebValue', header: 'EB Value', width: 80, align: 'right' },
  ];

  const totalSheets = new Set(data.map((d) => d.sheetNum)).size;

  return (
    <DataTableView
      title="Nest Result"
      columns={columns}
      data={data as unknown as Record<string, unknown>[]}
      onClose={onClose}
      summary={[
        { label: 'Total Planks', value: String(data.length) },
        { label: 'Total Sheets', value: String(totalSheets) },
      ]}
    />
  );
}

// ============================================
// QA SHEET TABLES WITH CHECKBOXES
// ============================================

import { QASheetItem, PressingListItem } from '@/types/visualiser';

/**
 * Input QA Sheet Table
 * Shows materials to be received for quality verification
 */
export function InputQATable({
  data,
  onClose,
  onCheckChange,
}: {
  data: QASheetItem[];
  onClose?: () => void;
  onCheckChange?: (id: string, checked: boolean) => void;
}) {
  const columns: DataTableColumn[] = [
    { key: 'checked', header: '✓', width: 40, align: 'center' },
    { key: 'description', header: 'Description', width: 200 },
    { key: 'brandColourCode', header: 'Brand/Colour/Code', width: 150 },
    { key: 'thickness', header: 'Thickness', width: 80 },
    { key: 'count', header: 'Qty Needed', width: 100, align: 'right' },
    { key: 'comments', header: 'Comments', width: 150 },
  ];

  // Add checkbox rendering
  const dataWithCheckbox = data.map(item => ({
    ...item,
    checked: item.checked ? '☑' : '☐',
  }));

  const checkedCount = data.filter(d => d.checked).length;

  return (
    <DataTableView
      title="Input QA Sheet (Materials Received)"
      columns={columns}
      data={dataWithCheckbox as unknown as Record<string, unknown>[]}
      onClose={onClose}
      summary={[
        { label: 'Total Items', value: String(data.length) },
        { label: 'Verified', value: `${checkedCount} / ${data.length}` },
      ]}
    />
  );
}

/**
 * Output QA Sheet Table
 * Shows cut pieces to verify for quality control
 */
export function OutputQATable({
  data,
  onClose,
  onCheckChange,
}: {
  data: QASheetItem[];
  onClose?: () => void;
  onCheckChange?: (id: string, checked: boolean) => void;
}) {
  const columns: DataTableColumn[] = [
    { key: 'checked', header: '✓', width: 40, align: 'center' },
    { key: 'id', header: 'Plank ID', width: 80 },
    { key: 'description', header: 'Plank Name', width: 150 },
    { key: 'width', header: 'Width (mm)', width: 90, align: 'right' },
    { key: 'height', header: 'Height (mm)', width: 90, align: 'right' },
    { key: 'thickness', header: 'Thickness', width: 80 },
    { key: 'brandColourCode', header: 'Material', width: 120 },
    { key: 'comments', header: 'Comments', width: 150 },
  ];

  const dataWithCheckbox = data.map(item => ({
    ...item,
    checked: item.checked ? '☑' : '☐',
  }));

  const checkedCount = data.filter(d => d.checked).length;

  return (
    <DataTableView
      title="Output QA Sheet (Cut Pieces)"
      columns={columns}
      data={dataWithCheckbox as unknown as Record<string, unknown>[]}
      onClose={onClose}
      summary={[
        { label: 'Total Pieces', value: String(data.length) },
        { label: 'QC Passed', value: `${checkedCount} / ${data.length}` },
      ]}
    />
  );
}

/**
 * Pressing List Table
 * Shows lamination work to be done
 */
export function PressingListTable({
  data,
  onClose,
  onCheckChange,
}: {
  data: PressingListItem[];
  onClose?: () => void;
  onCheckChange?: (sno: number, checked: boolean) => void;
}) {
  const columns: DataTableColumn[] = [
    { key: 'pressingCompleted', header: '✓', width: 40, align: 'center' },
    { key: 'sno', header: 'S.No', width: 60, align: 'center' },
    { key: 'material', header: 'Material', width: 150 },
    { key: 'plyType', header: 'Ply Type', width: 100 },
    { key: 'thickness', header: 'Thickness', width: 80 },
    { key: 'sheetQuantity', header: 'Sheet Qty', width: 100, align: 'right' },
    { key: 'comments', header: 'Comments', width: 150 },
  ];

  const dataWithCheckbox = data.map(item => ({
    ...item,
    pressingCompleted: item.pressingCompleted ? '☑' : '☐',
  }));

  const completedCount = data.filter(d => d.pressingCompleted).length;
  const totalSheets = data.reduce((sum, d) => sum + d.sheetQuantity, 0);

  return (
    <DataTableView
      title="Pressing List (Lamination)"
      columns={columns}
      data={dataWithCheckbox as unknown as Record<string, unknown>[]}
      onClose={onClose}
      summary={[
        { label: 'Total Items', value: String(data.length) },
        { label: 'Total Sheets', value: String(totalSheets) },
        { label: 'Completed', value: `${completedCount} / ${data.length}` },
      ]}
    />
  );
}

// ============================================
// GENERATE QA DATA FROM NEST RESULTS
// ============================================

/**
 * Generate Input QA data from Material Summary
 */
export function generateInputQAData(materialSummary: MaterialSummary[]): QASheetItem[] {
  return materialSummary.map((mat, index) => ({
    id: `input-${index + 1}`,
    description: mat.baseMaterial || mat.materialThickness.split('_')[0],
    brandColourCode: mat.materialThickness,
    thickness: `${mat.thickness}mm`,
    count: mat.sheetsUsed,
    checked: false,
    comments: '',
  }));
}

/**
 * Generate Output QA data from Nest Results
 */
export function generateOutputQAData(nestResults: NestResult[]): QASheetItem[] {
  return nestResults.map((plank) => ({
    id: plank.id,
    description: plank.name,
    brandColourCode: plank.material,
    thickness: `${plank.thickness}mm`,
    width: plank.originalWidth || plank.width,
    height: plank.originalHeight || plank.height,
    checked: false,
    comments: '',
  }));
}

/**
 * Generate Pressing List data from Material Summary
 */
export function generatePressingListData(materialSummary: MaterialSummary[]): PressingListItem[] {
  return materialSummary.map((mat, index) => {
    // Extract ply type from material name
    const materialLower = (mat.baseMaterial || mat.materialThickness).toLowerCase();
    let plyType = 'Plywood';
    if (materialLower.includes('bwp')) plyType = 'BWP';
    else if (materialLower.includes('hdhmr')) plyType = 'HDHMR';
    else if (materialLower.includes('mdf')) plyType = 'MDF';
    else if (materialLower.includes('bb')) plyType = 'Blockboard';

    return {
      sno: index + 1,
      material: mat.materialThickness,
      plyType,
      thickness: `${mat.thickness}mm`,
      sheetQuantity: mat.sheetsUsed,
      pressingCompleted: false,
      comments: '',
    };
  });
}

export default DataTableView;
