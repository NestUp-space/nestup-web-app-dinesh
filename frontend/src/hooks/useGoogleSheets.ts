/**
 * Google Sheets Integration Hook
 * Provides connectivity to Google Sheets API for reading/writing spreadsheet data
 */

import { useState, useCallback } from 'react';
import {
  SheetData,
  SpreadsheetInfo,
  NestResult,
  PlankInput,
  Wall,
  Box,
  Plank,
  InstallationGuideData,
  CutlistData,
  MaterialLegendItem,
} from '@/types/visualiser';

// API Base URL - adjust based on your backend setup
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

interface UseGoogleSheetsReturn {
  isLoading: boolean;
  error: string | null;
  spreadsheetInfo: SpreadsheetInfo | null;
  // Connection
  connectSpreadsheet: (spreadsheetId: string) => Promise<SpreadsheetInfo | null>;
  // Reading
  getSheetData: (sheetName: string) => Promise<SheetData | null>;
  getInstallationGuideData: (spreadsheetId: string) => Promise<InstallationGuideData | null>;
  getCutlistData: (spreadsheetId: string) => Promise<CutlistData | null>;
  getPlankListData: (spreadsheetId: string) => Promise<PlankInput[] | null>;
  getNestResultData: (spreadsheetId: string) => Promise<NestResult[] | null>;
  // Writing
  updatePlankPosition: (rowIndex: number, x: number, y: number, z: number) => Promise<boolean>;
  updateBoxPosition: (boxRowIndex: number, x: number, y: number, z: number, plankUpdates: any[]) => Promise<boolean>;
  // Utilities
  clearError: () => void;
}

export function useGoogleSheets(): UseGoogleSheetsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<SpreadsheetInfo | null>(null);
  const [currentSpreadsheetId, setCurrentSpreadsheetId] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Connect to a Google Spreadsheet and get its metadata
   */
  const connectSpreadsheet = useCallback(async (spreadsheetId: string): Promise<SpreadsheetInfo | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/sheets/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to connect: ${response.statusText}`);
      }

      const data = await response.json();
      setSpreadsheetInfo(data);
      setCurrentSpreadsheetId(spreadsheetId);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to spreadsheet';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get raw data from a specific sheet
   */
  const getSheetData = useCallback(async (sheetName: string): Promise<SheetData | null> => {
    if (!currentSpreadsheetId) {
      setError('No spreadsheet connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sheets/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          spreadsheetId: currentSpreadsheetId, 
          sheetName 
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get sheet data: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get sheet data';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentSpreadsheetId]);

  /**
   * Get Installation Guide data (walls, boxes, planks for 3D viewer)
   */
  const getInstallationGuideData = useCallback(async (spreadsheetId: string): Promise<InstallationGuideData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sheets/installation-guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get installation guide data: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get installation guide data';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get Cutlist visualization data
   */
  const getCutlistData = useCallback(async (spreadsheetId: string): Promise<CutlistData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sheets/cutlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get cutlist data: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get cutlist data';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get Plank List data for nesting
   */
  const getPlankListData = useCallback(async (spreadsheetId: string): Promise<PlankInput[] | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sheets/plank-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get plank list data: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get plank list data';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get Nest Result data
   */
  const getNestResultData = useCallback(async (spreadsheetId: string): Promise<NestResult[] | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sheets/nest-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get nest result data: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get nest result data';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update a plank's position in the spreadsheet
   */
  const updatePlankPosition = useCallback(async (
    rowIndex: number, 
    x: number, 
    y: number, 
    z: number
  ): Promise<boolean> => {
    if (!currentSpreadsheetId) {
      setError('No spreadsheet connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sheets/update-plank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          spreadsheetId: currentSpreadsheetId,
          rowIndex,
          position: { x, y, z }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update plank position: ${response.statusText}`);
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update plank position';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentSpreadsheetId]);

  /**
   * Update a box and all its planks' positions
   */
  const updateBoxPosition = useCallback(async (
    boxRowIndex: number,
    x: number,
    y: number,
    z: number,
    plankUpdates: any[]
  ): Promise<boolean> => {
    if (!currentSpreadsheetId) {
      setError('No spreadsheet connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sheets/update-box`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          spreadsheetId: currentSpreadsheetId,
          boxRowIndex,
          position: { x, y, z },
          plankUpdates
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update box position: ${response.statusText}`);
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update box position';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentSpreadsheetId]);

  return {
    isLoading,
    error,
    spreadsheetInfo,
    connectSpreadsheet,
    getSheetData,
    getInstallationGuideData,
    getCutlistData,
    getPlankListData,
    getNestResultData,
    updatePlankPosition,
    updateBoxPosition,
    clearError,
  };
}

// ============================================
// DATA TRANSFORMATION UTILITIES
// ============================================

/**
 * Parse raw sheet data into Installation Guide format
 */
export function parseInstallationGuideData(rawData: SheetData): InstallationGuideData {
  const walls: Wall[] = [];
  const materialColors: Record<string, string> = {};
  const defaultColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#2AB7CA',
    '#F08A5D', '#B22727', '#54A0FF', '#5F27CD', '#FF9F43'
  ];
  let colorIndex = 0;

  // Group by Level (Wall) -> Box -> Plank hierarchy
  const wallMap = new Map<string, Wall>();

  for (const row of rawData.rows) {
    const level = String(row[rawData.headers.indexOf('level')] || '').trim();
    if (level !== '0') continue; // Level 0 = Wall

    // Process wall-level data...
    // This would be populated based on actual sheet structure
  }

  const materialLegend: MaterialLegendItem[] = Object.entries(materialColors).map(
    ([name, color]) => ({ name, color })
  );

  return {
    walls: Array.from(wallMap.values()),
    materialLegend,
    summary: {
      totalWalls: walls.length,
      totalBoxes: walls.reduce((sum, w) => sum + w.boxes.length, 0),
      totalPlanks: walls.reduce((sum, w) => 
        sum + w.boxes.reduce((bSum, b) => bSum + b.planks.length, 0), 0
      ),
    },
  };
}

/**
 * Parse Nest Result sheet into CutlistData format
 */
export function parseNestResultData(rawData: SheetData, constants: { width: number; height: number }): CutlistData {
  const headers = rawData.headers.map(h => String(h).trim());
  const planks: Record<number, NestResult[]> = {};
  const materialColors: Record<string, { color: string; count: number }> = {};
  const sheetUtilization: Record<number, { percentage: string; usedArea: number }> = {};
  
  const defaultColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#2AB7CA',
    '#F08A5D', '#B22727', '#54A0FF', '#5F27CD', '#FF9F43'
  ];
  let colorIndex = 0;

  const idIdx = headers.indexOf('Plank ID');
  const nameIdx = headers.indexOf('Plank Name');
  const matIdx = headers.indexOf('Material');
  const thkIdx = headers.indexOf('Thickness');
  const sheetIdx = headers.indexOf('Sheet');
  const xIdx = headers.indexOf('X');
  const yIdx = headers.indexOf('Y');
  const wIdx = headers.indexOf('Placed Width');
  const hIdx = headers.indexOf('Placed Height');
  const rotIdx = headers.indexOf('Rotated');

  for (const row of rawData.rows) {
    const sheetNum = Number(row[sheetIdx]);
    const material = String(row[matIdx] || '').trim();
    const thickness = Number(row[thkIdx]);
    
    // Get or assign color
    const matKey = `${material}_${thickness}mm`;
    if (!materialColors[matKey]) {
      materialColors[matKey] = {
        color: defaultColors[colorIndex++ % defaultColors.length],
        count: 0
      };
    }
    materialColors[matKey].count++;

    const plank: NestResult = {
      id: String(row[idIdx]),
      name: String(row[nameIdx]),
      material,
      thickness,
      sheetNum,
      x: Number(row[xIdx]),
      y: Number(row[yIdx]),
      width: Number(row[wIdx]),
      height: Number(row[hIdx]),
      rotated: String(row[rotIdx]).toLowerCase() === 'yes',
      color: materialColors[matKey].color,
      holes: [], // Would parse operation columns
    };

    if (!planks[sheetNum]) {
      planks[sheetNum] = [];
    }
    planks[sheetNum].push(plank);
  }

  // Calculate utilization per sheet
  const sheetArea = constants.width * constants.height;
  for (const [sheetNum, sheetPlanks] of Object.entries(planks)) {
    const usedArea = sheetPlanks.reduce((sum, p) => sum + p.width * p.height, 0);
    sheetUtilization[Number(sheetNum)] = {
      percentage: ((usedArea / sheetArea) * 100).toFixed(1),
      usedArea
    };
  }

  return {
    planks,
    stats: {
      totalPlanks: rawData.rows.length,
      totalSheets: Object.keys(planks).length,
      materialThicknessStats: materialColors,
      sheetUtilization,
    },
    constants: {
      SHEET_WIDTH: constants.width,
      SHEET_HEIGHT: constants.height,
      SPACING: 10,
    },
  };
}

export default useGoogleSheets;
