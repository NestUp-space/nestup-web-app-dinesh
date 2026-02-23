/**
 * Visualiser State Management using Zustand
 * Central state store for the entire visualiser application
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  Wall,
  Box,
  Plank,
  NestResult,
  CutlistData,
  InstallationGuideData,
  EditMode,
  GCodeResult,
  MaterialEstimate,
  DesignerState,
} from '@/types/visualiser';

// ---- Installation Guide State ----
interface InstallationGuideState {
  data: InstallationGuideData | null;
  currentWallIndex: number;
  currentBoxIndex: number;
  currentStep: number;
  explodeAmount: number;
  editMode: EditMode;
  selectedPlankId: string | null;
  selectedBoxId: string | null;
  setData: (data: InstallationGuideData) => void;
  setCurrentWall: (index: number) => void;
  setCurrentBox: (index: number) => void;
  setCurrentStep: (step: number) => void;
  setExplodeAmount: (amount: number) => void;
  setEditMode: (mode: EditMode) => void;
  setSelectedPlank: (id: string | null) => void;
  setSelectedBox: (id: string | null) => void;
  reset: () => void;
}

export const useInstallationGuideStore = create<InstallationGuideState>()(
  devtools(
    (set) => ({
      data: null,
      currentWallIndex: -1,
      currentBoxIndex: -1,
      currentStep: 0,
      explodeAmount: 0,
      editMode: 'view',
      selectedPlankId: null,
      selectedBoxId: null,
      setData: (data) => set({ data }),
      setCurrentWall: (index) => set({ 
        currentWallIndex: index, 
        currentBoxIndex: -1, 
        currentStep: 0 
      }),
      setCurrentBox: (index) => set({ 
        currentBoxIndex: index, 
        currentStep: 0,
        explodeAmount: 0 
      }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setExplodeAmount: (amount) => set({ explodeAmount: amount }),
      setEditMode: (mode) => set({ editMode: mode }),
      setSelectedPlank: (id) => set({ selectedPlankId: id }),
      setSelectedBox: (id) => set({ selectedBoxId: id }),
      reset: () => set({
        data: null,
        currentWallIndex: -1,
        currentBoxIndex: -1,
        currentStep: 0,
        explodeAmount: 0,
        editMode: 'view',
        selectedPlankId: null,
        selectedBoxId: null,
      }),
    }),
    { name: 'installation-guide-store' }
  )
);

// ---- Cutlist Visualization State ----
interface CutlistState {
  data: CutlistData | null;
  selectedSheet: number | 'all';
  zoom: number;
  showIds: boolean;
  showDimensions: boolean;
  showHoles: boolean;
  showHoleLabels: boolean;
  highlightSearch: boolean;
  searchTerm: string;
  setData: (data: CutlistData) => void;
  setSelectedSheet: (sheet: number | 'all') => void;
  setZoom: (zoom: number) => void;
  setShowIds: (show: boolean) => void;
  setShowDimensions: (show: boolean) => void;
  setShowHoles: (show: boolean) => void;
  setShowHoleLabels: (show: boolean) => void;
  setHighlightSearch: (highlight: boolean) => void;
  setSearchTerm: (term: string) => void;
  reset: () => void;
}

export const useCutlistStore = create<CutlistState>()(
  devtools(
    (set) => ({
      data: null,
      selectedSheet: 'all',
      zoom: 50,
      showIds: true,
      showDimensions: false,
      showHoles: true,
      showHoleLabels: false,
      highlightSearch: true,
      searchTerm: '',
      setData: (data) => set({ data }),
      setSelectedSheet: (sheet) => set({ selectedSheet: sheet }),
      setZoom: (zoom) => set({ zoom }),
      setShowIds: (show) => set({ showIds: show }),
      setShowDimensions: (show) => set({ showDimensions: show }),
      setShowHoles: (show) => set({ showHoles: show }),
      setShowHoleLabels: (show) => set({ showHoleLabels: show }),
      setHighlightSearch: (highlight) => set({ highlightSearch: highlight }),
      setSearchTerm: (term) => set({ searchTerm: term }),
      reset: () => set({
        data: null,
        selectedSheet: 'all',
        zoom: 50,
        showIds: true,
        showDimensions: false,
        showHoles: true,
        showHoleLabels: false,
        highlightSearch: true,
        searchTerm: '',
      }),
    }),
    { name: 'cutlist-store' }
  )
);

// ---- G-Code Generator State ----
interface GCodeState {
  results: GCodeResult[];
  isGenerating: boolean;
  progress: number;
  setResults: (results: GCodeResult[]) => void;
  setIsGenerating: (generating: boolean) => void;
  setProgress: (progress: number) => void;
  reset: () => void;
}

export const useGCodeStore = create<GCodeState>()(
  devtools(
    (set) => ({
      results: [],
      isGenerating: false,
      progress: 0,
      setResults: (results) => set({ results }),
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setProgress: (progress) => set({ progress }),
      reset: () => set({ results: [], isGenerating: false, progress: 0 }),
    }),
    { name: 'gcode-store' }
  )
);

// ---- Reports State ----
type ReportRecord = Record<string, unknown>;

interface ReportsState {
  materialEstimates: MaterialEstimate[];
  sftResults: ReportRecord[];
  invoiceData: ReportRecord | null;
  qaInputData: ReportRecord[];
  qaOutputData: ReportRecord[];
  pressingList: ReportRecord[];
  setMaterialEstimates: (estimates: MaterialEstimate[]) => void;
  setSftResults: (results: ReportRecord[]) => void;
  setInvoiceData: (data: ReportRecord) => void;
  setQaInputData: (data: ReportRecord[]) => void;
  setQaOutputData: (data: ReportRecord[]) => void;
  setPressingList: (list: ReportRecord[]) => void;
  reset: () => void;
}

export const useReportsStore = create<ReportsState>()(
  devtools(
    (set) => ({
      materialEstimates: [],
      sftResults: [],
      invoiceData: null,
      qaInputData: [],
      qaOutputData: [],
      pressingList: [],
      setMaterialEstimates: (estimates) => set({ materialEstimates: estimates }),
      setSftResults: (results) => set({ sftResults: results }),
      setInvoiceData: (data) => set({ invoiceData: data }),
      setQaInputData: (data) => set({ qaInputData: data }),
      setQaOutputData: (data) => set({ qaOutputData: data }),
      setPressingList: (list) => set({ pressingList: list }),
      reset: () => set({
        materialEstimates: [],
        sftResults: [],
        invoiceData: null,
        qaInputData: [],
        qaOutputData: [],
        pressingList: [],
      }),
    }),
    { name: 'reports-store' }
  )
);

// ---- App-level State (Spreadsheet connection, etc.) ----
interface AppState {
  spreadsheetId: string | null;
  spreadsheetName: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  setSpreadsheet: (id: string, name: string) => void;
  setIsConnected: (connected: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  disconnect: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        spreadsheetId: null,
        spreadsheetName: null,
        isConnected: false,
        isLoading: false,
        error: null,
        setSpreadsheet: (id, name) => set({ 
          spreadsheetId: id, 
          spreadsheetName: name,
          isConnected: true 
        }),
        setIsConnected: (connected) => set({ isConnected: connected }),
        setIsLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        disconnect: () => set({ 
          spreadsheetId: null, 
          spreadsheetName: null, 
          isConnected: false 
        }),
      }),
      { name: 'visualiser-app-store' }
    ),
    { name: 'app-store' }
  )
);
