/**
 * CSV Data Hook
 * Provides utilities for parsing and working with CSV data
 */

import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '@/store/visualiserStore';
import {
  NestResult,
  PlankInput,
  Wall,
  Box,
  Plank,
  InstallationGuideData,
  CutlistData,
  MaterialLegendItem,
} from '@/types/visualiser';

interface UseCSVDataReturn {
  isLoading: boolean;
  error: string | null;
  availableSheets: string[];
  // Data retrieval
  getSheetData: (sheetName: string) => { headers: string[]; rows: string[][] } | null;
  parseInstallationGuideData: () => InstallationGuideData | null;
  parseCutlistData: () => CutlistData | null;
  parsePlankListData: () => PlankInput[] | null;
  // Utilities
  clearError: () => void;
}

export function useCSVData(): UseCSVDataReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { csvData } = useAppStore();

  const clearError = useCallback(() => setError(null), []);

  const availableSheets = useMemo(() => {
    if (!csvData) return [];
    return Object.keys(csvData);
  }, [csvData]);

  /**
   * Get raw data from a specific sheet
   */
  const getSheetData = useCallback((sheetName: string): { headers: string[]; rows: string[][] } | null => {
    if (!csvData || !csvData[sheetName]) {
      return null;
    }
    return {
      headers: csvData[sheetName].headers,
      rows: csvData[sheetName].data,
    };
  }, [csvData]);

  /**
   * Parse CSV data into Installation Guide format
   */
  const parseInstallationGuideData = useCallback((): InstallationGuideData | null => {
    if (!csvData) return null;
    
    // Try to find relevant sheets
    const plankSheet = csvData['Plank List'] || csvData['PlankList'] || csvData['planks'] || Object.values(csvData)[0];
    if (!plankSheet) return null;

    const walls: Wall[] = [];
    const materialColors: Record<string, string> = {};
    const defaultColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#2AB7CA',
      '#F08A5D', '#B22727', '#54A0FF', '#5F27CD', '#FF9F43'
    ];
    let colorIndex = 0;

    const headers = plankSheet.headers.map(h => h.toLowerCase().trim());
    const boxMap = new Map<string, Box>();
    const wallMap = new Map<string, Wall>();

    // Find column indices
    const getColIndex = (names: string[]): number => {
      return headers.findIndex(h => names.some(n => h.includes(n)));
    };

    const roomIdx = getColIndex(['room', 'wall', 'level']);
    const boxIdx = getColIndex(['box', 'cabinet', 'entity']);
    const nameIdx = getColIndex(['name', 'plank', 'part']);
    const matIdx = getColIndex(['material', 'mat']);
    const xIdx = getColIndex(['x', 'posx', 'position x']);
    const yIdx = getColIndex(['y', 'posy', 'position y']);
    const zIdx = getColIndex(['z', 'posz', 'position z']);
    const lenXIdx = getColIndex(['length', 'lenx', 'width']);
    const lenYIdx = getColIndex(['depth', 'leny']);
    const lenZIdx = getColIndex(['height', 'lenz']);
    const stepIdx = getColIndex(['step', 'order', 'sequence']);

    for (let i = 0; i < plankSheet.data.length; i++) {
      const row = plankSheet.data[i];
      
      const roomName = roomIdx >= 0 ? row[roomIdx] || 'Default Wall' : 'Default Wall';
      const boxName = boxIdx >= 0 ? row[boxIdx] || `Box ${i}` : `Box ${i}`;
      const plankName = nameIdx >= 0 ? row[nameIdx] || `Plank ${i}` : `Plank ${i}`;
      const material = matIdx >= 0 ? row[matIdx] || 'Unknown' : 'Unknown';

      // Assign color to material
      if (!materialColors[material]) {
        materialColors[material] = defaultColors[colorIndex++ % defaultColors.length];
      }

      // Create or get wall
      if (!wallMap.has(roomName)) {
        wallMap.set(roomName, {
          id: `wall-${wallMap.size}`,
          entityName: roomName,
          roomName: roomName,
          dimensions: { lenX: 3000, lenY: 600, lenZ: 2400 },
          boxes: [],
        });
      }
      const wall = wallMap.get(roomName)!;

      // Create or get box
      const boxKey = `${roomName}-${boxName}`;
      if (!boxMap.has(boxKey)) {
        const box: Box = {
          id: `box-${boxMap.size}`,
          entityName: boxName,
          roomName: roomName,
          position: { x: wall.boxes.length * 700, y: 0, z: 0 },
          dimensions: { lenX: 600, lenY: 560, lenZ: 720 },
          rowIndex: i,
          planks: [],
          checklist: [],
        };
        boxMap.set(boxKey, box);
        wall.boxes.push(box);
      }
      const box = boxMap.get(boxKey)!;

      // Create plank
      const plank: Plank = {
        id: `P${String(i + 1).padStart(3, '0')}`,
        entityName: plankName,
        material: material,
        materialColor: materialColors[material],
        thickness: 18,
        position: {
          x: xIdx >= 0 ? parseFloat(row[xIdx]) || 0 : 0,
          y: yIdx >= 0 ? parseFloat(row[yIdx]) || 0 : 0,
          z: zIdx >= 0 ? parseFloat(row[zIdx]) || 0 : 0,
        },
        dimensions: {
          lenX: lenXIdx >= 0 ? parseFloat(row[lenXIdx]) || 18 : 18,
          lenY: lenYIdx >= 0 ? parseFloat(row[lenYIdx]) || 100 : 100,
          lenZ: lenZIdx >= 0 ? parseFloat(row[lenZIdx]) || 100 : 100,
        },
        stepNumber: stepIdx >= 0 ? parseInt(row[stepIdx]) || box.planks.length + 1 : box.planks.length + 1,
        rowIndex: i + 1,
        explodeDirection: { x: 0, y: 0, z: 1 },
        assemblyDirection: { arrow: '→', text: 'Attach' },
      };

      box.planks.push(plank);
      box.checklist.push({
        id: plank.id,
        name: plank.entityName,
        material: plank.material,
        dimensions: `${plank.dimensions.lenX}×${plank.dimensions.lenY}×${plank.dimensions.lenZ}`,
      });
    }

    const wallsArray = Array.from(wallMap.values());

    return {
      walls: wallsArray,
      materialLegend: Object.entries(materialColors).map(([name, color]) => ({ name, color })),
      summary: {
        totalWalls: wallsArray.length,
        totalBoxes: wallsArray.reduce((sum, w) => sum + w.boxes.length, 0),
        totalPlanks: wallsArray.reduce((sum, w) => 
          sum + w.boxes.reduce((bSum, b) => bSum + b.planks.length, 0), 0
        ),
      },
    };
  }, [csvData]);

  /**
   * Parse CSV data into Cutlist format
   */
  const parseCutlistData = useCallback((): CutlistData | null => {
    if (!csvData) return null;

    // Try to find nest result sheet
    const nestSheet = csvData['Nest Result'] || csvData['NestResult'] || csvData['cutlist'] || Object.values(csvData)[0];
    if (!nestSheet) return null;

    const headers = nestSheet.headers.map(h => h.toLowerCase().trim());
    const planks: Record<number, NestResult[]> = {};
    const materialColors: Record<string, { color: string; count: number }> = {};
    const sheetUtilization: Record<number, { percentage: string; usedArea: number }> = {};
    
    const defaultColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#2AB7CA',
      '#F08A5D', '#B22727', '#54A0FF', '#5F27CD', '#FF9F43'
    ];
    let colorIndex = 0;

    // Find column indices
    const getColIndex = (names: string[]): number => {
      return headers.findIndex(h => names.some(n => h.includes(n)));
    };

    const idIdx = getColIndex(['id', 'plank id']);
    const nameIdx = getColIndex(['name', 'plank name']);
    const matIdx = getColIndex(['material', 'mat']);
    const thkIdx = getColIndex(['thickness', 'thk']);
    const sheetIdx = getColIndex(['sheet', 'sheet num']);
    const xIdx = getColIndex(['x', 'pos x']);
    const yIdx = getColIndex(['y', 'pos y']);
    const wIdx = getColIndex(['width', 'placed width', 'w']);
    const hIdx = getColIndex(['height', 'placed height', 'h']);
    const rotIdx = getColIndex(['rotated', 'rot']);

    const SHEET_WIDTH = 1220;
    const SHEET_HEIGHT = 2440;

    for (let i = 0; i < nestSheet.data.length; i++) {
      const row = nestSheet.data[i];
      
      const sheetNum = sheetIdx >= 0 ? parseInt(row[sheetIdx]) || 1 : 1;
      const material = matIdx >= 0 ? row[matIdx] || 'Unknown' : 'Unknown';
      const thickness = thkIdx >= 0 ? parseFloat(row[thkIdx]) || 18 : 18;
      
      const matKey = `${material}_${thickness}mm`;
      if (!materialColors[matKey]) {
        materialColors[matKey] = {
          color: defaultColors[colorIndex++ % defaultColors.length],
          count: 0
        };
      }
      materialColors[matKey].count++;

      const plank: NestResult = {
        id: idIdx >= 0 ? row[idIdx] || `P${i + 1}` : `P${i + 1}`,
        name: nameIdx >= 0 ? row[nameIdx] || `Plank ${i + 1}` : `Plank ${i + 1}`,
        material,
        thickness,
        sheetNum,
        x: xIdx >= 0 ? parseFloat(row[xIdx]) || 10 : 10 + (i % 3) * 400,
        y: yIdx >= 0 ? parseFloat(row[yIdx]) || 10 : 10 + Math.floor(i / 3) * 300,
        width: wIdx >= 0 ? parseFloat(row[wIdx]) || 300 : 300,
        height: hIdx >= 0 ? parseFloat(row[hIdx]) || 200 : 200,
        rotated: rotIdx >= 0 ? row[rotIdx]?.toLowerCase() === 'yes' : false,
        color: materialColors[matKey].color,
        holes: [],
      };

      if (!planks[sheetNum]) {
        planks[sheetNum] = [];
      }
      planks[sheetNum].push(plank);
    }

    // Calculate utilization per sheet
    const sheetArea = (SHEET_WIDTH - 20) * (SHEET_HEIGHT - 20);
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
        totalPlanks: nestSheet.data.length,
        totalSheets: Object.keys(planks).length,
        materialThicknessStats: materialColors,
        sheetUtilization,
      },
      constants: {
        SHEET_WIDTH,
        SHEET_HEIGHT,
        SPACING: 10,
      },
    };
  }, [csvData]);

  /**
   * Parse CSV data into Plank Input format for nesting
   */
  const parsePlankListData = useCallback((): PlankInput[] | null => {
    if (!csvData) return null;

    const plankSheet = csvData['Plank List'] || csvData['PlankList'] || csvData['planks'] || Object.values(csvData)[0];
    if (!plankSheet) return null;

    const headers = plankSheet.headers.map(h => h.toLowerCase().trim());
    const planks: PlankInput[] = [];

    const getColIndex = (names: string[]): number => {
      return headers.findIndex(h => names.some(n => h.includes(n)));
    };

    const idIdx = getColIndex(['id', 'plank id']);
    const nameIdx = getColIndex(['name', 'plank name']);
    const matIdx = getColIndex(['material', 'mat']);
    const thkIdx = getColIndex(['thickness', 'thk']);
    const wIdx = getColIndex(['width', 'w', 'length']);
    const hIdx = getColIndex(['height', 'h', 'depth']);
    const grainIdx = getColIndex(['grain', 'direction']);

    for (let i = 0; i < plankSheet.data.length; i++) {
      const row = plankSheet.data[i];
      
      planks.push({
        id: idIdx >= 0 ? row[idIdx] || `P${i + 1}` : `P${i + 1}`,
        name: nameIdx >= 0 ? row[nameIdx] || `Plank ${i + 1}` : `Plank ${i + 1}`,
        material: matIdx >= 0 ? row[matIdx] || 'Unknown' : 'Unknown',
        thickness: thkIdx >= 0 ? parseFloat(row[thkIdx]) || 18 : 18,
        width: wIdx >= 0 ? parseFloat(row[wIdx]) || 300 : 300,
        height: hIdx >= 0 ? parseFloat(row[hIdx]) || 200 : 200,
        grain: grainIdx >= 0 ? row[grainIdx] : undefined,
      });
    }

    return planks;
  }, [csvData]);

  return {
    isLoading,
    error,
    availableSheets,
    getSheetData,
    parseInstallationGuideData,
    parseCutlistData,
    parsePlankListData,
    clearError,
  };
}

export default useCSVData;
