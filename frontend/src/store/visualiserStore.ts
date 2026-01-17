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
  QASheetData,
  PressingListItem,
} from '@/types/visualiser';
import type { ProcessedData, FormattedPlank, PlankListItem } from '@/lib/visualiser/rawDataProcessor';

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
interface ReportsState {
  materialEstimates: MaterialEstimate[];
  sftResults: any[];
  invoiceData: any | null;
  qaInputData: QASheetData[];
  qaOutputData: QASheetData[];
  pressingList: PressingListItem[];
  setMaterialEstimates: (estimates: MaterialEstimate[]) => void;
  setSftResults: (results: any[]) => void;
  setInvoiceData: (data: any) => void;
  setQaInputData: (data: QASheetData[]) => void;
  setQaOutputData: (data: QASheetData[]) => void;
  setPressingList: (list: PressingListItem[]) => void;
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

// ---- Processed Data State (Main Pipeline Store) ----
interface ProcessedDataState {
  processedData: ProcessedData | null;
  isProcessing: boolean;
  processingProgress: number;
  processingError: string | null;
  setProcessedData: (data: ProcessedData | null) => void;
  setIsProcessing: (processing: boolean) => void;
  setProcessingProgress: (progress: number) => void;
  setProcessingError: (error: string | null) => void;
  // Getters for specific data
  getFormattedPlanks: () => FormattedPlank[];
  getPlankList: () => PlankListItem[];
  getNestResult: () => Record<number, NestResult[]>;
  getMaterialEstimates: () => MaterialEstimate[];
  getInputQA: () => QASheetData[];
  getOutputQA: () => QASheetData[];
  getPressingList: () => PressingListItem[];
  getInvoice: () => ProcessedData['invoice'] | null;
  getSummary: () => ProcessedData['summary'] | null;
  reset: () => void;
}

export const useProcessedDataStore = create<ProcessedDataState>()(
  devtools(
    persist(
      (set, get) => ({
        processedData: null,
        isProcessing: false,
        processingProgress: 0,
        processingError: null,
        setProcessedData: (data) => set({ processedData: data, processingError: null }),
        setIsProcessing: (processing) => set({ isProcessing: processing }),
        setProcessingProgress: (progress) => set({ processingProgress: progress }),
        setProcessingError: (error) => set({ processingError: error, isProcessing: false }),
        getFormattedPlanks: () => get().processedData?.formattedPlanks || [],
        getPlankList: () => get().processedData?.plankList || [],
        getNestResult: () => get().processedData?.nestResult || {},
        getMaterialEstimates: () => get().processedData?.materialEstimate || [],
        getInputQA: () => get().processedData?.inputQA || [],
        getOutputQA: () => get().processedData?.outputQA || [],
        getPressingList: () => get().processedData?.pressingList || [],
        getInvoice: () => get().processedData?.invoice || null,
        getSummary: () => get().processedData?.summary || null,
        reset: () => set({
          processedData: null,
          isProcessing: false,
          processingProgress: 0,
          processingError: null,
        }),
      }),
      { name: 'processed-data-store' }
    ),
    { name: 'processed-data-store' }
  )
);

// ---- CSV Data Type ----
interface CSVSheet {
  headers: string[];
  data: string[][];
}

// ---- App-level State (CSV data, project info, etc.) ----
interface AppState {
  projectName: string | null;
  projectDescription: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  csvData: Record<string, CSVSheet> | null;
  setProject: (name: string, description: string) => void;
  setCSVData: (data: Record<string, CSVSheet>) => void;
  getCSVSheet: (sheetName: string) => CSVSheet | null;
  setIsConnected: (connected: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  disconnect: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        projectName: null,
        projectDescription: null,
        isConnected: false,
        isLoading: false,
        error: null,
        csvData: null,
        setProject: (name, description) => set({ 
          projectName: name, 
          projectDescription: description,
          isConnected: true 
        }),
        setCSVData: (data) => set({ csvData: data }),
        getCSVSheet: (sheetName) => {
          const state = get();
          return state.csvData?.[sheetName] || null;
        },
        setIsConnected: (connected) => set({ isConnected: connected }),
        setIsLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        disconnect: () => set({ 
          projectName: null, 
          projectDescription: null, 
          isConnected: false,
          csvData: null 
        }),
      }),
      { name: 'visualiser-app-store' }
    ),
    { name: 'app-store' }
  )
);
