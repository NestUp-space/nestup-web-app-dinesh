'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDesignerStore, useDesignSummary, useAllPlanks } from '@/store/designerStore';
import {
  GenerationStep,
  GenerationProgress,
  FormattedPlankData,
  PlankListItem,
  NestResult,
  MaterialSummary,
  Wall,
  Plank,
} from '@/types/visualiser';
import { EdgeBindingDialog, EBSettings } from '@/components/visualiser/designer/dialogs/EdgeBindingDialog';
import { ClientDetailsDialog } from '@/components/visualiser/designer/dialogs/ClientDetailsDialog';
import { CustomerDetails } from '@/store/designerStore';

// Import generation utilities
import { formatDesignData } from '@/lib/visualiser/dataFormatter';
import { generatePlankList as createPlankList } from '@/lib/visualiser/plankListGenerator';
import { runNesting, AlgorithmType, GAParams, SAParams, PSOParams, generateMaterialSummary as createMaterialSummary } from '@/lib/visualiser/nestingEngine';
import { calculateSFT } from '@/lib/visualiser/sftCalculation';
import { generateRawData, backfillPlankIds, RawDataRow } from '@/lib/visualiser/rawDataGenerator';
import { downloadGCodeZip } from '@/lib/visualiser/gcodeGenerator';

// Import table views
import {
  DataTableModal,
  RawDataTable,
  FormattedDataTable,
  PlankListTable,
  NestResultTable,
  MaterialSummaryTable,
} from '@/components/visualiser/DataTableView';

// Algorithm options for dropdown
const ALGORITHM_OPTIONS: { id: AlgorithmType; name: string; description: string }[] = [
  { id: 'ga', name: 'Genetic Algorithm (GA)', description: 'Population-based optimization' },
  { id: 'sa', name: 'Simulated Annealing (SA)', description: 'Temperature-based probabilistic search' },
  { id: 'pso', name: 'Particle Swarm Optimization (PSO)', description: 'Swarm intelligence optimization' },
];

// Generation steps configuration - includes Raw Data first
const GENERATION_STEPS: Omit<GenerationStep, 'status'>[] = [
  { id: 'raw-data', name: 'Raw Data Export' },
  { id: 'formatted-data', name: 'Formatted Data' },
  { id: 'plank-list', name: 'Plank List' },
  { id: 'cutlist', name: 'Cutlist (MaxRects Nesting)' },
  { id: 'material-summary', name: 'Material Summary' },
  { id: 'material-estimate', name: 'Material Estimate' },
  { id: 'sft-results', name: 'SFT Results' },
  { id: 'input-qa', name: 'Input QA Sheet' },
  { id: 'output-qa', name: 'Output QA Sheet' },
  { id: 'pressing-list', name: 'Pressing List' },
  { id: 'gcode', name: 'G-Code Files' },
];

export default function GeneratePage() {
  const router = useRouter();
  const summary = useDesignSummary();
  const allPlanks = useAllPlanks();

  const {
    walls,
    projectName,
    generationProgress,
    setGenerationProgress,
    updateGenerationStep,
    rawData,
    setRawData,
    formattedData,
    setFormattedData,
    plankList,
    setPlankList,
    nestResults,
    setNestResults,
    materialSummary,
    setMaterialSummary,
  } = useDesignerStore();

  const customerDetails = useDesignerStore((state) => state.customerDetails);
  const setCustomerDetails = useDesignerStore((state) => state.setCustomerDetails);

  const [isGenerating, setIsGenerating] = useState(false);
  const [completedFiles, setCompletedFiles] = useState<string[]>([]);
  
  // Pre-generation dialog states
  const [showEBDialog, setShowEBDialog] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [ebSettings, setEbSettings] = useState<EBSettings>({});
  
  // Algorithm optimization state
  const [showAlgorithmDropdown, setShowAlgorithmDropdown] = useState(false);
  const [isRunningAlgorithm, setIsRunningAlgorithm] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType | null>(null);
  
  // Data view modal state - which data table to show
  const [viewingData, setViewingData] = useState<string | null>(null);
  const [gcodeDownloading, setGcodeDownloading] = useState(false);

  // Collect unique materials from all planks for EB dialog
  const uniqueMaterials = useMemo(() => {
    const materials = new Set<string>();
    walls.forEach((wall) => {
      wall.boxes.forEach((box) => {
        box.planks.forEach((plank) => {
          if (plank.material) {
            materials.add(plank.material);
          }
        });
        // Also add default material if no planks
        if (box.planks.length === 0) {
          materials.add('Plywood 18mm');
        }
      });
    });
    return Array.from(materials).sort();
  }, [walls]);

  // ====== LEVEL 3 DIAGNOSTICS ======
  // Calculate Level 3 data statistics for debugging
  const level3Diagnostics = useMemo(() => {
    let planksWithOperations = 0;
    let planksWithoutOperations = 0;
    const operationCounts: Record<string, number> = {
      screws: 0,
      hinges: 0,
      vb_main: 0,
      vb_double: 0,
      slots: 0,
      grooves: 0,
      profiles: 0,
      l_cuts: 0,
    };

    walls.forEach((wall) => {
      wall.boxes.forEach((box) => {
        box.planks.forEach((plank) => {
          if (plank.operations) {
            const ops = plank.operations;
            const hasAnyOp =
              (ops.screws && ops.screws.length > 0) ||
              (ops.hinges && ops.hinges.length > 0) ||
              (ops.vb_main && ops.vb_main.length > 0) ||
              (ops.vb_double && ops.vb_double.length > 0) ||
              (ops.slots && ops.slots.length > 0) ||
              (ops.grooves && ops.grooves.length > 0) ||
              (ops.profiles && ops.profiles.length > 0) ||
              (ops.l_cuts && ops.l_cuts.length > 0);

            if (hasAnyOp) {
              planksWithOperations++;
              operationCounts.screws += ops.screws?.length || 0;
              operationCounts.hinges += ops.hinges?.length || 0;
              operationCounts.vb_main += ops.vb_main?.length || 0;
              operationCounts.vb_double += ops.vb_double?.length || 0;
              operationCounts.slots += ops.slots?.length || 0;
              operationCounts.grooves += ops.grooves?.length || 0;
              operationCounts.profiles += ops.profiles?.length || 0;
              operationCounts.l_cuts += ops.l_cuts?.length || 0;
            } else {
              planksWithoutOperations++;
            }
          } else {
            planksWithoutOperations++;
          }
        });
      });
    });

    const totalOperations = Object.values(operationCounts).reduce((a, b) => a + b, 0);
    const hasLevel3Data = totalOperations > 0;

    return {
      planksWithOperations,
      planksWithoutOperations,
      operationCounts,
      totalOperations,
      hasLevel3Data,
    };
  }, [walls]);

  // Redirect if no design
  useEffect(() => {
    if (summary.totalPlanks === 0 && summary.totalBoxes === 0) {
      router.push('/visualiser/designer');
    }
  }, [summary, router]);

  // Initialize progress on mount
  useEffect(() => {
    if (!generationProgress) {
      setGenerationProgress({
        steps: GENERATION_STEPS.map((s) => ({ ...s, status: 'pending' })),
        currentStepId: null,
        isComplete: false,
        hasError: false,
      });
    }
  }, [generationProgress, setGenerationProgress]);

  // Handle clicking "Start Generation" - shows dialogs first
  const handleStartGeneration = () => {
    setShowEBDialog(true);
  };

  // Handle EB dialog submission - show client dialog next
  const handleEBSubmit = (settings: EBSettings) => {
    setEbSettings(settings);
    setShowEBDialog(false);
    setShowClientDialog(true);
  };

  // Handle client dialog submission - start generation
  const handleClientSubmit = (details: CustomerDetails) => {
    setCustomerDetails(details);
    setShowClientDialog(false);
    generateFiles(ebSettings);
  };

  // Handle going back from client dialog to EB dialog
  const handleClientBack = () => {
    setShowClientDialog(false);
    setShowEBDialog(true);
  };

  // Actual file generation (after dialogs)
  const generateFiles = useCallback(async (eb: EBSettings) => {
    setIsGenerating(true);
    setCompletedFiles([]);
    
    console.log('[Generate] Starting with EB settings:', eb);
    console.log('[Generate] Customer details:', customerDetails);

    const steps = GENERATION_STEPS.map((s) => ({ ...s, status: 'pending' as const }));
    setGenerationProgress({
      steps,
      currentStepId: null,
      isComplete: false,
      hasError: false,
    });

    try {
      let generatedRawData: RawDataRow[] = [];
      let generatedFormattedData: FormattedPlankData[] = [];
      let generatedPlankList: PlankListItem[] = [];
      let plankIdMap: Map<string, string> = new Map();

      for (const step of steps) {
        // Update current step to processing
        updateGenerationStep(step.id, { status: 'processing' });
        const currentProgress = useDesignerStore.getState().generationProgress;
        if (currentProgress) {
          setGenerationProgress({ ...currentProgress, currentStepId: step.id });
        }

        // Generate actual data based on step
        switch (step.id) {
          case 'raw-data':
            // Generate raw data first (Level 0-3 hierarchy)
            console.log('[Generate] Generating raw data...');
            generatedRawData = generateRawData(walls);
            console.log(`[Generate] Raw data generated: ${generatedRawData.length} rows`);
            // Store temporarily - will backfill IDs after formatted data step
            setRawData(generatedRawData as unknown as Record<string, unknown>[]);
            break;

          case 'formatted-data':
            // Use actual dataFormatter - this generates plank IDs
            console.log('[Generate] Formatting data...');
            const formatResult = formatDesignData(walls, {
              validateSize: true,
              includeOperations: true,
              ebSettings: eb,
            });
            generatedFormattedData = formatResult.data;
            plankIdMap = formatResult.plankIdMap;
            setFormattedData(generatedFormattedData);
            console.log(`[Generate] Formatted data: ${generatedFormattedData.length} planks with IDs`);
            
            // Backfill plank IDs to raw data
            if (generatedRawData.length > 0) {
              console.log('[Generate] Backfilling plank IDs to raw data...');
              const rawDataWithIds = backfillPlankIds(generatedRawData, plankIdMap);
              // Also backfill Level 3 (operations) with parent plank IDs
              let lastPlankId = '';
              const finalRawData = rawDataWithIds.map(row => {
                if (row.level === 2 && row.plankId) {
                  lastPlankId = row.plankId;
                } else if (row.level === 3 && !row.plankId && lastPlankId) {
                  return { ...row, plankId: lastPlankId };
                }
                return row;
              });
              setRawData(finalRawData as unknown as Record<string, unknown>[]);
              generatedRawData = finalRawData;
              console.log('[Generate] Raw data backfilled with plank IDs');
            }
            break;

          case 'plank-list':
            // Use actual plankListGenerator
            console.log('[Generate] Generating plank list...');
            const plankResult = createPlankList(generatedFormattedData);
            generatedPlankList = plankResult.plankList;
            setPlankList(generatedPlankList);
            console.log(`[Generate] Plank list: ${generatedPlankList.length} planks`);
            break;

          case 'cutlist':
            // Auto-run MaxRects nesting algorithm
            console.log('[Generate] Running MaxRects nesting algorithm...');
            const nestingResult = runNesting(
              generatedPlankList, 
              'maxrects', // Auto-run MaxRects
              undefined,
              (message, percent) => {
                console.log(`[Nesting] ${message} (${percent}%)`);
              }
            );
            
            // Helper: find source plank from walls by id (for L-cuts/Gola in sheet space)
            const findPlankById = (plankId: string): Plank | null => {
              for (const wall of walls) {
                for (const box of wall.boxes) {
                  const plank = box.planks.find((pl) => pl.id === plankId);
                  if (plank) return plank;
                }
              }
              return null;
            };
            const toSheetSpace = (
              localX: number,
              localY: number,
              sheetX: number,
              sheetY: number,
              placedHeight: number,
              rotated: boolean
            ): { x: number; y: number } => {
              if (!rotated) return { x: sheetX + localX, y: sheetY + localY };
              return { x: sheetX + localY, y: sheetY + (placedHeight - localX) };
            };

            // Store nesting results in expected format (with l_cuts/gola_profiles in sheet space)
            const generatedNestResults: NestResult[] = nestingResult.allPlacedPlanks.map((p) => {
              const sourcePlank = findPlankById(p.id);
              let l_cuts: NestResult['l_cuts'];
              let gola_profiles: NestResult['gola_profiles'];
              if (sourcePlank?.operations?.l_cuts?.length) {
                l_cuts = sourcePlank.operations.l_cuts.map((lc) => ({
                  start: toSheetSpace(lc.start.x, lc.start.y, p.x, p.y, p.placedHeight, p.rotated),
                  center: toSheetSpace(lc.center.x, lc.center.y, p.x, p.y, p.placedHeight, p.rotated),
                  end: toSheetSpace(lc.end.x, lc.end.y, p.x, p.y, p.placedHeight, p.rotated),
                }));
              }
              // Gola: if we had triplet profiles we could map here; for now leave undefined
              gola_profiles = undefined;

              return {
                id: p.id,
                name: p.name,
                material: p.material,
                thickness: p.thickness,
                sheetNum: p.sheetNum,
                x: p.x,
                y: p.y,
                width: p.placedWidth,
                height: p.placedHeight,
                rotated: p.rotated,
                color: p.color || '#4ECDC4',
                originalWidth: p.originalWidth,
                originalHeight: p.originalHeight,
                ebValue: p.ebValue,
                holes: p.operations.map((op) => ({
                  x: op.x,
                  y: op.y,
                  type: op.type,
                  isRectangular: op.isRectangular,
                  description: op.description,
                  diameter: op.diameter,
                  width: op.width,
                  length: op.length,
                })),
                l_cuts,
                gola_profiles,
              };
            });
            setNestResults(generatedNestResults);
            console.log(`[Generate] Nesting complete: ${nestingResult.totalSheets} sheets, ${nestingResult.totalUtilization.toFixed(1)}% utilization`);
            break;

          case 'material-summary':
            // Generate material summary from nesting results
            const currentNestResults = useDesignerStore.getState().nestResults;
            if (currentNestResults) {
              // Group by material_thickness
              const summaryMap = new Map<string, MaterialSummary>();
              const ebTotals: { [key: string]: number } = {};
              
              currentNestResults.forEach((plank) => {
                const baseMaterial = plank.material
                  .replace(/\(\s*\d+(\.\d+)?\s*mm\s*\)/gi, '')
                  .replace(/\s*\([^)]+\)/g, '')
                  .trim();
                const key = `${baseMaterial}_${plank.thickness}mm`;
                
                const existing = summaryMap.get(key);
                if (existing) {
                  existing.plankCount++;
                  existing.totalArea += plank.width * plank.height;
                } else {
                  summaryMap.set(key, {
                    materialThickness: `${baseMaterial} (${plank.thickness}mm)`,
                    baseMaterial,
                    thickness: plank.thickness,
                    roomNames: 'N/A',
                    plankCount: 1,
                    totalArea: plank.width * plank.height,
                    sheetsUsed: 0,
                    avgAreaPerSheet: 0,
                    utilization: 0,
                    totalEdge: 0,
                  });
                }
              });
              
              // Calculate sheets used
              const SHEET_AREA = 1220 * 2440;
              summaryMap.forEach((summary) => {
                summary.sheetsUsed = Math.ceil(summary.totalArea / SHEET_AREA);
                summary.avgAreaPerSheet = summary.totalArea / summary.sheetsUsed;
                summary.utilization = (summary.totalArea / (summary.sheetsUsed * SHEET_AREA)) * 100;
              });
              
              setMaterialSummary(Array.from(summaryMap.values()));
            }
            break;
            
          case 'sft-results':
            // Calculate SFT
            const sftResult = calculateSFT(walls);
            console.log(`[Generate] SFT calculated: ${sftResult.totalSquareFeet.toFixed(2)} sq ft`);
            break;
        }

        // Small delay for visual feedback
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Mark step complete
        updateGenerationStep(step.id, { status: 'complete' });
        setCompletedFiles((prev) => [...prev, step.id]);
      }

      // All done
      const finalProgress = useDesignerStore.getState().generationProgress;
      if (finalProgress) {
        setGenerationProgress({ ...finalProgress, isComplete: true, currentStepId: null });
      }
    } catch (error) {
      console.error('Generation error:', error);
      const errorProgress = useDesignerStore.getState().generationProgress;
      if (errorProgress) {
        setGenerationProgress({ ...errorProgress, hasError: true });
      }
    } finally {
      setIsGenerating(false);
    }
  }, [updateGenerationStep, setGenerationProgress, setFormattedData, setPlankList, setNestResults, setMaterialSummary, walls, customerDetails]);

  // Run optimization algorithm (optional, after initial generation)
  const runOptimizationAlgorithm = useCallback(async (algorithm: AlgorithmType) => {
    const plankList = useDesignerStore.getState().plankList;
    if (!plankList || plankList.length === 0) {
      alert('Please generate files first before running optimization.');
      return;
    }

    setIsRunningAlgorithm(true);
    setSelectedAlgorithm(algorithm);
    setShowAlgorithmDropdown(false);

    console.log(`[Generate] Running ${algorithm.toUpperCase()} optimization...`);

    try {
      // Default parameters for each algorithm
      let params: GAParams | SAParams | PSOParams;
      switch (algorithm) {
        case 'ga':
          params = { populationSize: 20, generations: 50, mutationRate: 2 } as GAParams;
          break;
        case 'sa':
          params = { iterations: 1000, initialTemperature: 100, coolingRate: 0.995 } as SAParams;
          break;
        case 'pso':
          params = { particles: 20, iterations: 50, inertia: 0.7, cognitive: 1.5, social: 1.5 } as PSOParams;
          break;
        default:
          params = {} as GAParams;
      }

      const nestingResult = runNesting(
        plankList,
        algorithm,
        params,
        (message, percent) => {
          console.log(`[${algorithm.toUpperCase()}] ${message} (${percent}%)`);
        }
      );

      // Enrich with l_cuts/gola_profiles in sheet space (same as initial cutlist step)
      const wallsForOptimizer = useDesignerStore.getState().walls;
      const findPlankByIdOpt = (plankId: string) => {
        for (const wall of wallsForOptimizer) {
          for (const box of wall.boxes) {
            const plank = box.planks.find((pl) => pl.id === plankId);
            if (plank) return plank;
          }
        }
        return null;
      };
      const toSheetSpaceOpt = (localX: number, localY: number, sheetX: number, sheetY: number, placedHeight: number, rotated: boolean) =>
        !rotated ? { x: sheetX + localX, y: sheetY + localY } : { x: sheetX + localY, y: sheetY + (placedHeight - localX) };

      const nestResults: NestResult[] = nestingResult.allPlacedPlanks.map((p) => {
        const sourcePlank = findPlankByIdOpt(p.id);
        let l_cuts: NestResult['l_cuts'];
        if (sourcePlank?.operations?.l_cuts?.length) {
          l_cuts = sourcePlank.operations.l_cuts.map((lc) => ({
            start: toSheetSpaceOpt(lc.start.x, lc.start.y, p.x, p.y, p.placedHeight, p.rotated),
            center: toSheetSpaceOpt(lc.center.x, lc.center.y, p.x, p.y, p.placedHeight, p.rotated),
            end: toSheetSpaceOpt(lc.end.x, lc.end.y, p.x, p.y, p.placedHeight, p.rotated),
          }));
        }
        return {
          id: p.id,
          name: p.name,
          material: p.material,
          thickness: p.thickness,
          sheetNum: p.sheetNum,
          x: p.x,
          y: p.y,
          width: p.placedWidth,
          height: p.placedHeight,
          rotated: p.rotated,
          color: p.color || '#4ECDC4',
          originalWidth: p.originalWidth,
          originalHeight: p.originalHeight,
          ebValue: p.ebValue,
          holes: p.operations.map((op) => ({
            x: op.x,
            y: op.y,
            type: op.type,
            isRectangular: op.isRectangular,
            description: op.description,
            diameter: op.diameter,
            width: op.width,
            length: op.length,
          })),
          l_cuts,
          gola_profiles: undefined,
        };
      });
      setNestResults(nestResults);

      console.log(`[Generate] ${algorithm.toUpperCase()} optimization complete: ${nestingResult.totalSheets} sheets, ${nestingResult.totalUtilization.toFixed(1)}% utilization`);
      alert(`${algorithm.toUpperCase()} optimization complete!\n\nSheets: ${nestingResult.totalSheets}\nUtilization: ${nestingResult.totalUtilization.toFixed(1)}%`);

    } catch (error) {
      console.error('Algorithm error:', error);
      alert(`Error running ${algorithm}: ${error}`);
    } finally {
      setIsRunningAlgorithm(false);
      setSelectedAlgorithm(null);
    }
  }, [setNestResults]);

  const getStepIcon = (status: GenerationStep['status']) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
        );
      case 'processing':
        return (
          <div className="w-6 h-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
        );
      case 'complete':
        return (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
    }
  };

  const downloadAll = () => {
    const base = window.location.origin;
    const reportPaths = [
      '/visualiser/reports/material-estimate',
      '/visualiser/reports/invoice',
      '/visualiser/reports/cutlist',
      '/visualiser/reports/hardware',
      '/visualiser/reports/qa-input',
      '/visualiser/reports/qa-output',
      '/visualiser/reports/pressing-list',
    ];
    reportPaths.forEach((path, i) => {
      setTimeout(() => window.open(`${base}${path}`, '_blank', 'noopener,noreferrer'), i * 300);
    });
    // G-code is downloaded from Cutlist page; user can print each report tab to PDF
  };

  // Handle viewing data - opens modal for data table steps, navigates for others
  const handleViewData = (stepId: string) => {
    // Steps that should show data table modals
    const dataTableSteps = ['raw-data', 'formatted-data', 'plank-list', 'material-summary'];
    
    if (dataTableSteps.includes(stepId)) {
      setViewingData(stepId);
    } else {
      // Navigate to the report page for other steps
      const link = getReportLink(stepId);
      router.push(link);
    }
  };

  // Render the data view modal based on viewingData state
  const renderDataModal = () => {
    if (!viewingData) return null;

    const closeModal = () => setViewingData(null);

    switch (viewingData) {
      case 'raw-data':
        if (!rawData || rawData.length === 0) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-7xl max-h-[90vh] overflow-auto">
              <RawDataTable data={rawData as unknown as RawDataRow[]} onClose={closeModal} />
            </div>
          </div>
        );
      case 'formatted-data':
        if (!formattedData || formattedData.length === 0) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-7xl max-h-[90vh] overflow-auto">
              <FormattedDataTable data={formattedData} onClose={closeModal} />
            </div>
          </div>
        );
      case 'plank-list':
        if (!plankList || plankList.length === 0) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-7xl max-h-[90vh] overflow-auto">
              <PlankListTable data={plankList} onClose={closeModal} />
            </div>
          </div>
        );
      case 'material-summary':
        if (!materialSummary || materialSummary.length === 0) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-7xl max-h-[90vh] overflow-auto">
              <MaterialSummaryTable data={materialSummary} onClose={closeModal} />
            </div>
          </div>
        );
      case 'cutlist':
        // Navigate to cutlist page for visualization
        router.push(getReportLink(viewingData));
        setViewingData(null);
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen h-screen flex flex-col bg-white overflow-hidden">
      {/* Data View Modals */}
      {renderDataModal()}

      {/* Pre-Generation Dialogs */}
      <EdgeBindingDialog
        isOpen={showEBDialog}
        materials={uniqueMaterials}
        onSubmit={handleEBSubmit}
        onCancel={() => setShowEBDialog(false)}
      />
      <ClientDetailsDialog
        isOpen={showClientDialog}
        onClose={() => setShowClientDialog(false)}
        onSave={handleClientSubmit}
      />

      {/* Header - Brand Colors */}
      <header className="flex-shrink-0 border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/visualiser/designer"
                className="text-gray-500 hover:text-orange-500 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-blue-900">Generate Files</h1>
                <p className="text-sm text-gray-500">{projectName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {summary.totalBoxes} boxes | {summary.totalPlanks} planks
              </span>
              {/* Level 3 Data Indicator */}
              {level3Diagnostics.hasLevel3Data ? (
                <span className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full" title={`Operations: ${level3Diagnostics.totalOperations}`}>
                  ✓ L3: {level3Diagnostics.totalOperations} ops
                </span>
              ) : (
                <span className="text-sm text-red-700 bg-red-100 px-3 py-1 rounded-full" title="No Level 3 operations found">
                  ⚠ No Level 3 data
                </span>
              )}
              {/* Nestup Logo/Brand */}
              <span className="text-orange-500 font-bold text-lg">NESTUP</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable (min-h-0 allows flex child to shrink and scroll) */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="container mx-auto px-6 py-8 max-w-4xl min-h-full">
        
        {/* Level 3 Diagnostics Panel - Show only when there's a problem */}
        {!level3Diagnostics.hasLevel3Data && summary.totalPlanks > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800">Level 3 Data Missing</h3>
                <p className="text-sm text-amber-700 mt-1">
                  No operations (holes, grooves, L-cuts) found on any planks. 
                  This usually means the catalog data didn&apos;t include Level 3 rows, 
                  or the data wasn&apos;t transferred correctly when boxes were added.
                </p>
                <div className="mt-3 text-xs text-amber-600 bg-amber-100 p-3 rounded font-mono">
                  <p><strong>Debug Info:</strong></p>
                  <p>Planks with operations: {level3Diagnostics.planksWithOperations}</p>
                  <p>Planks without operations: {level3Diagnostics.planksWithoutOperations}</p>
                  <p className="mt-2">
                    Check browser console for [CatalogParser] and [Store] logs to trace data flow.
                  </p>
                  <button
                    onClick={() => {
                      // Debug: Dump catalog state to console
                      const catalogBoxes = useDesignerStore.getState().catalogBoxesWithPlanks;
                      console.log('=== CATALOG DEBUG DUMP ===');
                      console.log(`Total catalog boxes: ${catalogBoxes.length}`);
                      catalogBoxes.forEach((box, bIdx) => {
                        const totalSubs = box.planks.reduce((sum, p) => sum + (p.subComponents?.length || 0), 0);
                        console.log(`[Box ${bIdx}] "${box.entityName}" - ${box.planks.length} planks, ${totalSubs} subComponents`);
                        box.planks.forEach((plank, pIdx) => {
                          console.log(`  [Plank ${pIdx}] "${plank.entityName}" - ${plank.subComponents?.length || 0} subComponents`);
                          if (plank.subComponents && plank.subComponents.length > 0) {
                            plank.subComponents.forEach((sc, scIdx) => {
                              console.log(`    [SubComp ${scIdx}] "${sc.entityName}" at (${sc.x}, ${sc.y}, ${sc.z})`);
                            });
                          }
                        });
                      });
                      
                      // Also dump wall/box/plank operations
                      console.log('=== DESIGN DATA DEBUG DUMP ===');
                      walls.forEach((wall, wIdx) => {
                        console.log(`[Wall ${wIdx}] "${wall.entityName}" - ${wall.boxes.length} boxes`);
                        wall.boxes.forEach((box, bIdx) => {
                          console.log(`  [Box ${bIdx}] "${box.entityName}" - ${box.planks.length} planks`);
                          box.planks.forEach((plank, pIdx) => {
                            const ops = plank.operations;
                            const opCount = ops ? 
                              (ops.screws?.length || 0) + (ops.hinges?.length || 0) +
                              (ops.vb_main?.length || 0) + (ops.vb_double?.length || 0) +
                              (ops.slots?.length || 0) + (ops.grooves?.length || 0) +
                              (ops.profiles?.length || 0) + (ops.l_cuts?.length || 0) : 0;
                            console.log(`    [Plank ${pIdx}] "${plank.entityName}" - ${opCount} operations`);
                          });
                        });
                      });
                    }}
                    className="mt-2 px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-800 rounded text-xs font-medium"
                  >
                    Dump Debug to Console
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Level 3 Summary Panel - Show when data exists */}
        {level3Diagnostics.hasLevel3Data && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">Level 3 Data Found</h3>
                <p className="text-sm text-green-700 mt-1">
                  {level3Diagnostics.planksWithOperations} planks have operations.
                  Total: {level3Diagnostics.totalOperations} operations found.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {level3Diagnostics.operationCounts.screws > 0 && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Screws: {level3Diagnostics.operationCounts.screws}
                    </span>
                  )}
                  {level3Diagnostics.operationCounts.hinges > 0 && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Hinges: {level3Diagnostics.operationCounts.hinges}
                    </span>
                  )}
                  {level3Diagnostics.operationCounts.vb_main > 0 && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      VB Main: {level3Diagnostics.operationCounts.vb_main}
                    </span>
                  )}
                  {level3Diagnostics.operationCounts.vb_double > 0 && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      VB Double: {level3Diagnostics.operationCounts.vb_double}
                    </span>
                  )}
                  {level3Diagnostics.operationCounts.slots > 0 && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Slots: {level3Diagnostics.operationCounts.slots}
                    </span>
                  )}
                  {level3Diagnostics.operationCounts.grooves > 0 && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Grooves: {level3Diagnostics.operationCounts.grooves}
                    </span>
                  )}
                  {level3Diagnostics.operationCounts.profiles > 0 && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Profiles: {level3Diagnostics.operationCounts.profiles}
                    </span>
                  )}
                  {level3Diagnostics.operationCounts.l_cuts > 0 && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      L-Cuts: {level3Diagnostics.operationCounts.l_cuts}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generation Card - Brand Colors */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-orange-50">
            <div>
              <h2 className="text-lg font-semibold text-blue-900">File Generation Pipeline</h2>
              <p className="text-sm text-gray-600">
                Generate all required production files from your design
              </p>
            </div>
            {!isGenerating && !generationProgress?.isComplete && (
              <button
                onClick={handleStartGeneration}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all shadow-md shadow-orange-500/25"
              >
                Start Generation
              </button>
            )}
            {generationProgress?.isComplete && (
              <div className="flex items-center gap-3">
                {/* Run Algorithm Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowAlgorithmDropdown(!showAlgorithmDropdown)}
                    disabled={isRunningAlgorithm}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50 border border-gray-300"
                  >
                    {isRunningAlgorithm ? (
                      <>
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-orange-600">Running {selectedAlgorithm?.toUpperCase()}...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Run Algorithm
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showAlgorithmDropdown && (
                    <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
                      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
                        <p className="text-xs text-gray-500">Optional: Run additional optimization</p>
                      </div>
                      {ALGORITHM_OPTIONS.map((algo) => (
                        <button
                          key={algo.id}
                          onClick={() => runOptimizationAlgorithm(algo.id)}
                          className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors"
                        >
                          <p className="font-medium text-blue-900">{algo.name}</p>
                          <p className="text-xs text-gray-500">{algo.description}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Download All Button */}
                <button
                  onClick={downloadAll}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download All
                </button>
              </div>
            )}
          </div>

          {/* Progress Steps - Brand Colors */}
          <div className="p-6">
            <div className="space-y-3">
              {generationProgress?.steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    step.status === 'processing'
                      ? 'bg-orange-50 border border-orange-300'
                      : step.status === 'complete'
                      ? 'bg-green-50 border border-green-200'
                      : step.status === 'error'
                      ? 'bg-red-50 border border-red-300'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  {/* Step Number */}
                  <div className="text-sm text-gray-400 w-6 font-medium">{index + 1}.</div>

                  {/* Status Icon */}
                  {getStepIcon(step.status)}

                  {/* Step Name */}
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        step.status === 'processing'
                          ? 'text-orange-600'
                          : step.status === 'complete'
                          ? 'text-green-600'
                          : step.status === 'error'
                          ? 'text-red-600'
                          : 'text-gray-700'
                      }`}
                    >
                      {step.name}
                    </p>
                    {step.status === 'processing' && (
                      <p className="text-xs text-orange-500 mt-1">Generating...</p>
                    )}
                    {step.status === 'error' && step.error && (
                      <p className="text-xs text-red-500 mt-1">{step.error}</p>
                    )}
                  </div>

                  {/* Status Text */}
                  <div className="text-sm font-medium">
                    {step.status === 'pending' && (
                      <span className="text-gray-400">Pending</span>
                    )}
                    {step.status === 'processing' && (
                      <span className="text-orange-500">Processing...</span>
                    )}
                    {step.status === 'complete' && (
                      <span className="text-green-500">Done</span>
                    )}
                    {step.status === 'error' && (
                      <span className="text-red-500">Error</span>
                    )}
                  </div>

                  {/* View Buttons (for completed steps) - Different types for different steps */}
                  {step.status === 'complete' && (
                    <div className="flex gap-2">
                      {/* View Table Format - for data tables */}
                      {['raw-data', 'formatted-data', 'plank-list', 'material-summary'].includes(step.id) && (
                        <button
                          onClick={() => handleViewData(step.id)}
                          className="text-xs px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium transition-colors"
                        >
                          View Table Format
                        </button>
                      )}
                      {/* View - for visualizations and reports */}
                      {['cutlist', 'material-estimate', 'sft-results', 'input-qa', 'output-qa', 'pressing-list', 'gcode'].includes(step.id) && (
                        <button
                          onClick={() => router.push(getReportLink(step.id))}
                          className="text-xs px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded font-medium transition-colors"
                        >
                          View
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Overall Progress - Brand Colors */}
            {isGenerating && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 font-medium">Overall Progress</span>
                  <span className="text-blue-900 font-bold">
                    {completedFiles.length} / {GENERATION_STEPS.length}
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-300"
                    style={{
                      width: `${(completedFiles.length / GENERATION_STEPS.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Completion Message - Brand Colors */}
            {generationProgress?.isComplete && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <svg
                    className="w-12 h-12 text-green-500 mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-green-700">
                    All Files Generated Successfully!
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Click on individual files to view or download all at once.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Download Files - NestUp theme: all report links with logo + theme on each page */}
        {generationProgress?.isComplete && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Download Files</h3>
            <p className="text-sm text-gray-500 mb-4">
              Each report opens in a new page with NestUp logo and theme. Use &quot;Download / Print&quot; on the report to save as PDF. G-Code downloads a ZIP of .nc files for CNC 8×4 sheets.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {DOWNLOAD_FILES.map((file) =>
                file.id === 'gcode' ? (
                  <button
                    key={file.id}
                    type="button"
                    disabled={gcodeDownloading || !nestResults?.length}
                    onClick={async () => {
                      if (!nestResults?.length) return;
                      setGcodeDownloading(true);
                      try {
                        await downloadGCodeZip(nestResults, projectName || 'CNC_Project');
                      } catch (e) {
                        console.error(e);
                        alert('Error generating G-code: ' + (e instanceof Error ? e.message : 'Unknown error'));
                      } finally {
                        setGcodeDownloading(false);
                      }
                    }}
                    className="p-4 bg-white rounded-xl border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-100 transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed w-full"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">{file.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{file.description}</p>
                      </div>
                    </div>
                  </button>
                ) : (
                  <Link
                    key={file.id}
                    href={file.href}
                    className="p-4 bg-white rounded-xl border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-100 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">{file.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{file.description}</p>
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={downloadAll}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2 shadow-md shadow-orange-500/25"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Open all reports (new tabs)
              </button>
              <Link
                href="/visualiser/designer"
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Designer
              </Link>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getReportLink(stepId: string): string {
  // Note: raw-data, formatted-data, plank-list now open modals directly
  // This function is used for steps that navigate to report pages
  const links: Record<string, string> = {
    'raw-data': '/visualiser/generate', // Modal handled separately
    'formatted-data': '/visualiser/generate', // Modal handled separately
    'plank-list': '/visualiser/generate', // Modal handled separately
    'cutlist': '/visualiser/reports/cutlist',
    'material-summary': '/visualiser/reports/material-estimate',
    'material-estimate': '/visualiser/reports/material-estimate',
    'sft-results': '/visualiser/reports/sft',
    'input-qa': '/visualiser/reports/qa-input',
    'output-qa': '/visualiser/reports/qa-output',
    'pressing-list': '/visualiser/reports/pressing-list',
    'gcode': '/visualiser/reports/cutlist',
    'invoice': '/visualiser/reports/invoice',
    'hardware': '/visualiser/reports/hardware',
  };
  return links[stepId] || '/visualiser';
}

// Download file links for the Downloads section (NestUp theme)
const DOWNLOAD_FILES = [
  { id: 'material-estimate', name: 'Material Estimate', href: '/visualiser/reports/material-estimate', description: 'Plywood, laminate, EB, hardware' },
  { id: 'invoice', name: 'Invoice', href: '/visualiser/reports/invoice', description: 'Customer invoice with SFT & logistics' },
  { id: 'cutlist', name: 'Cutlist', href: '/visualiser/reports/cutlist', description: 'Nesting layout + CSV download' },
  { id: 'hardware', name: 'Hardware', href: '/visualiser/reports/hardware', description: 'Hardware list (Description, Quantity)' },
  { id: 'qa-input', name: 'Input QA Sheet', href: '/visualiser/reports/qa-input', description: 'Material quality check' },
  { id: 'qa-output', name: 'Output QA Sheet', href: '/visualiser/reports/qa-output', description: 'Cut pieces QA' },
  { id: 'pressing-list', name: 'Pressing List', href: '/visualiser/reports/pressing-list', description: 'Laminate pressing schedule' },
  { id: 'gcode', name: 'G-Code', href: '/visualiser/reports/cutlist', description: 'Download .nc ZIP for CNC 8×4 sheets' },
] as const;
