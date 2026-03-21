'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDesignerStore, useDesignSummary } from '@/stores/designerStore';
import {
  GenerationStep,
  GenerationProgress,
  Wall,
} from '@/types/visualiser';
import { EdgeBindingDialog, EBSettings } from '@/components/visualiser/designer/dialogs/EdgeBindingDialog';
import { ClientDetailsDialog } from '@/components/visualiser/designer/dialogs/ClientDetailsDialog';
import { CustomerDetails } from '@/stores/designerStore';

// AppScript-ported pipeline and converters
import {
  runPipelineAsync,
  convertDesignerRawDataTo2D,
  pipelineFormattedToStore,
  pipelinePlankListToStore,
  pipelineNestToStore,
  pipelineMaterialSummaryToStore,
  rows2DToObjects,
  exportToCSV,
  exportAllAsZip,
  syncPlankIdsToRaw,
  generateGCodeFiles,
  buildGCodeZip,
  downloadGCodeZip,
} from '@/lib/visualiser/appscript-port';
import type { GCodeResult } from '@/lib/visualiser/appscript-port';
import { generateRawData, RawDataRow } from '@/lib/visualiser/rawDataGenerator';

// Import table views
import {
  DataTableView,
  RawDataTable,
  FormattedDataTable,
  PlankListTable,
  MaterialSummaryTable,
} from '@/components/visualiser/DataTableView';

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
  { id: 'installation-guide', name: 'Installation Guide' },
];

export default function GeneratePage() {
  const router = useRouter();
  const designSummary = useDesignSummary();

  const {
    walls,
    projectName,
    dataSource,
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
    pipelineResult,
    setPipelineResult,
  } = useDesignerStore();

  const customerDetails = useDesignerStore((state) => state.customerDetails);
  const setCustomerDetails = useDesignerStore((state) => state.setCustomerDetails);

  const summary = useMemo(() => {
    if (dataSource === 'import' && pipelineResult) {
      const totalPlanks = pipelineResult.plankList?.rows?.length ?? 0;
      const boxSet = new Set<string>();
      if (pipelineResult.formattedData?.rows) {
        const boxCol = pipelineResult.formattedData.header.indexOf('box_model');
        if (boxCol >= 0) {
          pipelineResult.formattedData.rows.forEach((r) => {
            const v = String(r[boxCol] ?? '').trim();
            if (v) boxSet.add(v);
          });
        }
      }
      return { totalWalls: 0, totalBoxes: boxSet.size || 1, totalPlanks };
    }
    return designSummary;
  }, [dataSource, pipelineResult, designSummary]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [completedFiles, setCompletedFiles] = useState<string[]>([]);
  const [gcodeResults, setGcodeResults] = useState<GCodeResult[] | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<'bfd' | 'ga' | 'sa' | 'pso' | 'tournament'>('tournament');
  
  // Pre-generation dialog states
  const [showEBDialog, setShowEBDialog] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [ebSettings, setEbSettings] = useState<EBSettings>({});

  // Data view modal state - which data table to show
  const [viewingData, setViewingData] = useState<string | null>(null);

  // Collect unique materials from all planks for EB dialog
  const uniqueMaterials = useMemo(() => {
    const materials = new Set<string>();
    if (dataSource === 'import' && pipelineResult?.formattedData?.rows) {
      const matCol = pipelineResult.formattedData.header.indexOf('plank_material');
      if (matCol >= 0) {
        pipelineResult.formattedData.rows.forEach((r) => {
          const v = String(r[matCol] ?? '').trim();
          if (v) materials.add(v);
        });
      }
    } else {
      walls.forEach((wall) => {
        wall.boxes.forEach((box) => {
          box.planks.forEach((plank) => {
            if (plank.material) {
              materials.add(plank.material);
            }
          });
          if (box.planks.length === 0) {
            materials.add('Plywood 18mm');
          }
        });
      });
    }
    return Array.from(materials).sort();
  }, [walls, dataSource, pipelineResult]);

  // ====== LEVEL 3 DIAGNOSTICS ======
  // NOTE: When dataSource is 'import', diagnostics come from formattedData (already handled below via the else-if branch).
  const level3Diagnostics = useMemo(() => {
    let planksWithOperations = 0;
    let planksWithoutOperations = 0;
    const operationCounts: Record<string, number> = {
      screws: 0, hinges: 0, vb_main: 0, vb_double: 0,
      slots: 0, grooves: 0, profiles: 0, l_cuts: 0,
    };

    const countOps = (ops: typeof operationCounts extends Record<string, number> ? Record<string, number> : never) => {
      void ops;
    };
    void countOps;

    const processPlankOps = (ops: {
      screws?: unknown[]; hinges?: unknown[]; vb_main?: unknown[]; vb_double?: unknown[];
      slots?: unknown[]; grooves?: unknown[]; profiles?: unknown[]; l_cuts?: unknown[];
    }) => {
      const hasAnyOp =
        (ops.screws && ops.screws.length > 0) || (ops.hinges && ops.hinges.length > 0) ||
        (ops.vb_main && ops.vb_main.length > 0) || (ops.vb_double && ops.vb_double.length > 0) ||
        (ops.slots && ops.slots.length > 0) || (ops.grooves && ops.grooves.length > 0) ||
        (ops.profiles && ops.profiles.length > 0) || (ops.l_cuts && ops.l_cuts.length > 0);
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
    };

    if (walls.length > 0) {
      walls.forEach((wall) => {
        wall.boxes.forEach((box) => {
          box.planks.forEach((plank) => {
            if (plank.operations) processPlankOps(plank.operations);
            else planksWithoutOperations++;
          });
        });
      });
    } else if (formattedData && formattedData.length > 0) {
      formattedData.forEach((plank) => {
        if (plank.operations) processPlankOps(plank.operations);
        else planksWithoutOperations++;
      });
    }

    const totalOperations = Object.values(operationCounts).reduce((a, b) => a + b, 0);
    return {
      planksWithOperations, planksWithoutOperations,
      operationCounts, totalOperations,
      hasLevel3Data: totalOperations > 0,
    };
  }, [walls, formattedData]);

  // Redirect if no design and no pipeline result
  const hasPipelineResult = !!pipelineResult;
  useEffect(() => {
    if (summary.totalPlanks === 0 && summary.totalBoxes === 0 && !hasPipelineResult) {
      router.push(dataSource === 'import' ? '/visualiser/import-raw-data' : '/visualiser/designer');
    }
  }, [summary, router, hasPipelineResult, dataSource]);

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

  // Auto-generate G-code from pipelineResult (e.g. after navigating from import-raw-data)
  useEffect(() => {
    if (pipelineResult?.cutlist && !gcodeResults) {
      try {
        const gcode = generateGCodeFiles(pipelineResult.cutlist.header, pipelineResult.cutlist.rows);
        setGcodeResults(gcode);
      } catch (err) {
        console.error('Auto G-code generation failed:', err);
      }
    }
  }, [pipelineResult, gcodeResults]);

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

  // Actual file generation (after dialogs) — uses AppScript-ported pipeline
  const generateFiles = useCallback(async (eb: EBSettings) => {
    setIsGenerating(true);
    setCompletedFiles([]);

    const steps = GENERATION_STEPS.map((s) => ({ ...s, status: 'pending' as const }));
    setGenerationProgress({
      steps,
      currentStepId: null,
      isComplete: false,
      hasError: false,
    });

    const markStep = (stepId: string, status: 'processing' | 'complete' | 'error', error?: string) => {
      updateGenerationStep(stepId, { status, ...(error && { error }) });
      if (status === 'complete' || status === 'error') {
        setCompletedFiles((prev) => [...prev, stepId]);
      }
    };

    try {
      // Step 1: Raw data (from walls or already set by Import Raw Data)
      let rawValues: unknown[][] = [];
      if (walls.length > 0) {
        markStep('raw-data', 'processing');
        const rawDataRows = generateRawData(walls);
        setRawData(rawDataRows as unknown as Record<string, unknown>[]);
        await new Promise((r) => setTimeout(r, 150));
        markStep('raw-data', 'complete');
        rawValues = convertDesignerRawDataTo2D(rawDataRows as Parameters<typeof convertDesignerRawDataTo2D>[0]);
      } else if (rawData && Array.isArray(rawData) && rawData.length > 0) {
        markStep('raw-data', 'complete');
        const storeRaw = rawData as Record<string, unknown>[];
        const headers = Object.keys(storeRaw[0]);
        rawValues = [headers, ...storeRaw.map((r) => headers.map((h) => r[h]))];
      } else {
        markStep('raw-data', 'complete');
      }

      if (rawValues.length < 2) {
        throw new Error('No raw data to process. Add design in designer or import raw data.');
      }

      const customerDetailsForPipeline: Record<string, string> = {
        'customer name': customerDetails.customerName,
        'firm name': customerDetails.firmName,
        'site address': customerDetails.address,
        'contact number': customerDetails.phone,
        'email': customerDetails.email,
        'gst': String(customerDetails.gst),
        'transport amount': String(customerDetails.transportAmount),
      };

      const progressSteps: Record<string, string> = {
        'validate': 'raw-data',
        'formatted-data': 'formatted-data',
        'plank-list': 'plank-list',
        'cutlist': 'cutlist',
        'material-summary': 'material-summary',
        'pressing-list': 'pressing-list',
        'material-estimate': 'material-estimate',
        'input-qa': 'input-qa',
        'output-qa': 'output-qa',
        'complete': 'output-qa',
      };

      const result = await runPipelineAsync(
        {
          rawValues,
          ebSettings: eb,
          customerDetails: customerDetailsForPipeline,
          nestingParams: { algorithm: selectedAlgorithm },
        },
        (step, message) => {
          const stepId = progressSteps[step];
          if (stepId) {
            updateGenerationStep(stepId, { status: 'processing' });
            const prog = useDesignerStore.getState().generationProgress;
            if (prog) setGenerationProgress({ ...prog, currentStepId: stepId });
          }
          if (step === 'cutlist' && message) {
            const prog = useDesignerStore.getState().generationProgress;
            if (prog) {
              const updated = prog.steps.map(s => s.id === 'cutlist' ? { ...s, name: message } : s);
              setGenerationProgress({ ...prog, steps: updated });
            }
          }
        }
      );

      setPipelineResult(result);
      setFormattedData(pipelineFormattedToStore(result.formattedData));
      setPlankList(pipelinePlankListToStore(result.plankList));
      setNestResults(pipelineNestToStore(result.cutlist));
      setMaterialSummary(pipelineMaterialSummaryToStore(result.materialSummary));
      setGcodeResults(generateGCodeFiles(result.cutlist.header, result.cutlist.rows));

      // Mark any steps the pipeline doesn't report
      ['formatted-data', 'plank-list', 'cutlist', 'material-summary', 'pressing-list', 'material-estimate', 'input-qa', 'output-qa'].forEach((id) => {
        if (!useDesignerStore.getState().generationProgress?.steps.find((s) => s.id === id)?.status || useDesignerStore.getState().generationProgress?.steps.find((s) => s.id === id)?.status === 'processing') {
          markStep(id, 'complete');
        }
      });
      markStep('sft-results', 'complete');
      markStep('gcode', 'complete');
      markStep('installation-guide', 'complete');

      const finalProg = useDesignerStore.getState().generationProgress;
      if (finalProg) setGenerationProgress({ ...finalProg, isComplete: true, currentStepId: null });
    } catch (error) {
      console.error('Generation error:', error);
      const errMsg = error instanceof Error ? error.message : String(error);
      const currentProgress = useDesignerStore.getState().generationProgress;
      if (currentProgress?.currentStepId) {
        updateGenerationStep(currentProgress.currentStepId, { status: 'error', error: errMsg });
      }
      const errProg = useDesignerStore.getState().generationProgress;
      if (errProg) setGenerationProgress({ ...errProg, hasError: true });
    } finally {
      setIsGenerating(false);
    }
  }, [
    walls,
    rawData,
    customerDetails,
    selectedAlgorithm,
    setGenerationProgress,
    updateGenerationStep,
    setRawData,
    setPipelineResult,
    setFormattedData,
    setPlankList,
    setNestResults,
    setMaterialSummary,
  ]);

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
    const result = useDesignerStore.getState().pipelineResult;
    const name = useDesignerStore.getState().projectName || 'export';
    if (!result) {
      alert('No generated files to download. Run generation first.');
      return;
    }
    exportAllAsZip(result, name, gcodeResults ?? undefined);
  };

  const handleSyncPlankIdsToRaw = () => {
    const result = useDesignerStore.getState().pipelineResult;
    const raw = useDesignerStore.getState().rawData;
    if (!result?.formattedData?.header?.length) {
      alert('No formatted data. Run generation first.');
      return;
    }
    if (!raw?.length) {
      alert('No raw data to sync into.');
      return;
    }
    const headers = Object.keys(raw[0] as object);
    const rawValues = [headers, ...(raw as Record<string, unknown>[]).map((r) => headers.map((h) => r[h]))];
    const updated = syncPlankIdsToRaw(
      { header: result.formattedData.header, rows: result.formattedData.rows },
      rawValues
    );
    const updatedHeader = updated[0] as string[];
    const updatedRows = updated.slice(1) as unknown[][];
    setRawData(rows2DToObjects(updatedHeader, updatedRows));
    alert('Plank IDs synced to raw data. Download raw data or Download All to export.');
  };

  const handleDownloadStep = (stepId: string) => {
    const result = useDesignerStore.getState().pipelineResult;
    if (!result) return;
    const base = (projectName || 'export').replace(/[^\w\s-]/g, '_').trim() || 'export';
    const date = new Date().toISOString().slice(0, 10);
    switch (stepId) {
      case 'raw-data':
        if (rawData?.length) {
          const headers = rawData.length ? Object.keys(rawData[0] as object) : [];
          const rows = (rawData as Record<string, unknown>[]).map((r) => Object.values(r));
          exportToCSV(headers, rows, `${base}_raw_data_${date}.csv`);
        }
        break;
      case 'formatted-data':
        exportToCSV(result.formattedData.header, result.formattedData.rows, `${base}_formatted_data_${date}.csv`);
        break;
      case 'plank-list':
        exportToCSV(result.plankList.header, result.plankList.rows, `${base}_plank_list_${date}.csv`);
        break;
      case 'cutlist':
        exportToCSV(result.cutlist.header, result.cutlist.rows, `${base}_cutlist_${date}.csv`);
        break;
      case 'material-summary':
        exportToCSV(result.materialSummary.header, result.materialSummary.rows, `${base}_material_summary_${date}.csv`);
        break;
      case 'material-estimate':
        exportToCSV(result.materialEstimate.plywood.header, result.materialEstimate.plywood.rows, `${base}_material_estimate_${date}.csv`);
        break;
      case 'input-qa':
        if (result.inputQA.sections[0]) {
          const s = result.inputQA.sections[0];
          exportToCSV(s.tableHeaders, s.rows, `${base}_input_qa_${date}.csv`);
        }
        break;
      case 'output-qa':
        exportToCSV(result.outputQA.tableHeader, result.outputQA.rows, `${base}_output_qa_${date}.csv`);
        break;
      case 'pressing-list':
        exportToCSV(result.pressingList.tableHeader, result.pressingList.rows, `${base}_pressing_list_${date}.csv`);
        break;
      case 'gcode':
        if (gcodeResults?.length) {
          buildGCodeZip(gcodeResults, projectName || 'export').then((blob) =>
            downloadGCodeZip(blob, projectName || 'export')
          );
        }
        break;
      default:
        break;
    }
  };

  // Handle viewing data - opens modal for data table steps, navigates for others
  const handleViewData = (stepId: string) => {
    const dataTableSteps = [
      'raw-data', 'formatted-data', 'plank-list', 'material-summary',
      'material-estimate', 'input-qa', 'output-qa', 'pressing-list',
      'gcode',
    ];
    if (dataTableSteps.includes(stepId)) {
      setViewingData(stepId);
    } else {
      const link = getReportLink(stepId);
      router.push(link);
    }
  };

  const MODAL_PAGE_SIZE = 100;

  const EditableSheetModal = ({ title, sections, onClose }: {
    title: string;
    sections: { title: string; headers: string[]; rows: (string | number | boolean)[][] }[];
    onClose: () => void;
  }) => {
    const [localSections, setLocalSections] = React.useState(() =>
      sections.map(sec => ({
        ...sec,
        rows: sec.rows.map(r => [...r]),
        checked: sec.rows.map(() => false),
      }))
    );
    const [shownCounts, setShownCounts] = React.useState(() =>
      sections.map(sec => Math.min(MODAL_PAGE_SIZE, sec.rows.length))
    );

    const handleCellEdit = (si: number, ri: number, ci: number, value: string) => {
      setLocalSections(prev => {
        const next = [...prev];
        const sectionCopy = { ...next[si], rows: next[si].rows.map(r => [...r]) };
        sectionCopy.rows[ri][ci] = value;
        next[si] = sectionCopy;
        return next;
      });
    };

    const handleCheck = (si: number, ri: number) => {
      setLocalSections(prev => {
        const next = [...prev];
        const sectionCopy = { ...next[si], checked: [...next[si].checked] };
        sectionCopy.checked[ri] = !sectionCopy.checked[ri];
        next[si] = sectionCopy;
        return next;
      });
    };

    const loadMore = (si: number) => {
      setShownCounts(prev => {
        const next = [...prev];
        next[si] = Math.min(next[si] + MODAL_PAGE_SIZE, localSections[si].rows.length);
        return next;
      });
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="w-full max-w-7xl max-h-[90vh] overflow-auto bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {localSections.map((sec, si) => {
            const shown = shownCounts[si] ?? sec.rows.length;
            const hasMore = shown < sec.rows.length;
            return (
            <div key={si} className="p-4">
              {si > 0 && <h3 className="text-sm font-bold text-gray-700 mb-2">{sec.title}</h3>}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-100 sticky top-12 z-[5]"><tr>
                    <th className="px-3 py-2 border text-center w-10">✓</th>
                    {sec.headers.map((h, hi) => <th key={hi} className="px-3 py-2 border text-left whitespace-nowrap">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {sec.rows.slice(0, shown).map((row, ri) => (
                      <tr key={ri} className={sec.checked[ri] ? 'bg-green-50' : 'hover:bg-blue-50'}>
                        <td className="px-3 py-2 border text-center">
                          <input type="checkbox" className="w-4 h-4" checked={sec.checked[ri] || false} onChange={() => handleCheck(si, ri)} />
                        </td>
                        {sec.headers.map((_h, ci) => {
                          const cellVal = row[ci];
                          if (typeof cellVal === 'boolean') {
                            return (
                              <td key={ci} className="px-3 py-2 border text-center">
                                <input type="checkbox" className="w-4 h-4" checked={!!cellVal} onChange={() => handleCellEdit(si, ri, ci, cellVal ? '' : 'true')} />
                              </td>
                            );
                          }
                          return (
                            <td key={ci} className="px-1 py-1 border">
                              <input
                                type="text"
                                className="w-full px-2 py-1 text-sm border-0 bg-transparent focus:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-300 rounded"
                                value={String(cellVal ?? '')}
                                onChange={(e) => handleCellEdit(si, ri, ci, e.target.value)}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {hasMore && (
                  <button onClick={() => loadMore(si)} className="mt-2 w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors">
                    Show more ({shown} of {sec.rows.length})
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    );
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
              <FormattedDataTable
                data={formattedData}
                onClose={closeModal}
                editable={!!pipelineResult}
                onSave={(updated) => {
                  setFormattedData(updated);
                  handleSyncPlankIdsToRaw();
                }}
                onPlankIdChange={(updated) => {
                  setFormattedData(updated);
                  handleSyncPlankIdsToRaw();
                }}
              />
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
        router.push(getReportLink(viewingData));
        setViewingData(null);
        return null;
      case 'material-estimate': {
        if (!pipelineResult?.materialEstimate) return null;
        const meSections: { title: string; headers: string[]; rows: (string | number | boolean)[][] }[] = [];
        const me = pipelineResult.materialEstimate;
        if (me.plywood.rows.length > 0) meSections.push({ title: 'Plywood / Core Material', headers: me.plywood.header, rows: me.plywood.rows });
        if (me.laminate.rows.length > 0) meSections.push({ title: 'Laminate', headers: me.laminate.header, rows: me.laminate.rows });
        if (me.edgeBanding.rows.length > 0) meSections.push({ title: 'Edge Banding', headers: me.edgeBanding.header, rows: me.edgeBanding.rows });
        if (me.hardware.rows.length > 0) meSections.push({ title: 'Hardware', headers: me.hardware.header, rows: me.hardware.rows });
        return (
          <EditableSheetModal
            title="Material Estimate"
            sections={meSections}
            onClose={closeModal}
          />
        );
      }
      case 'input-qa':
        if (!pipelineResult?.inputQA?.sections?.length) return null;
        return (
          <EditableSheetModal
            title={pipelineResult.inputQA.sections[0].title || 'Input QA'}
            sections={pipelineResult.inputQA.sections.map((sec) => ({
              title: sec.title,
              headers: sec.tableHeaders,
              rows: sec.rows,
            }))}
            onClose={closeModal}
          />
        );
      case 'output-qa':
        if (!pipelineResult?.outputQA) return null;
        return (
          <EditableSheetModal
            title="Output QA"
            sections={[{
              title: 'Output QA',
              headers: pipelineResult.outputQA.tableHeader,
              rows: pipelineResult.outputQA.rows,
            }]}
            onClose={closeModal}
          />
        );
      case 'pressing-list':
        if (!pipelineResult?.pressingList) return null;
        return (
          <EditableSheetModal
            title="Pressing List"
            sections={[{
              title: 'Pressing List',
              headers: pipelineResult.pressingList.tableHeader,
              rows: pipelineResult.pressingList.rows,
            }]}
            onClose={closeModal}
          />
        );
      case 'gcode':
        if (!gcodeResults || gcodeResults.length === 0) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
            <div className="w-full max-w-5xl max-h-[90vh] overflow-auto bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b sticky top-0 z-10">
                <h2 className="text-lg font-semibold text-gray-900">G-Code Files ({gcodeResults.length} files)</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { buildGCodeZip(gcodeResults, projectName || 'export').then(blob => downloadGCodeZip(blob, projectName || 'export')); }}
                    className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
                  >Download All (.zip)</button>
                  <button onClick={closeModal} className="p-1.5 text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {gcodeResults.map((gc, i) => (
                  <details key={i} className="border rounded">
                    <summary className="px-4 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100 font-mono text-sm">
                      {gc.fileName} <span className="text-gray-400 text-xs">({gc.content.length} chars)</span>
                    </summary>
                    <pre className="p-4 text-xs font-mono bg-gray-900 text-green-400 overflow-x-auto max-h-60 whitespace-pre">
                      {gc.content}
                    </pre>
                  </details>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
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
                href={dataSource === 'import' ? '/visualiser/import-raw-data' : '/visualiser/designer'}
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

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8 max-w-4xl">
        
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
              <div className="flex items-center gap-3">
                <select
                  value={selectedAlgorithm}
                  onChange={(e) => setSelectedAlgorithm(e.target.value as typeof selectedAlgorithm)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-orange-300 focus:outline-none"
                >
                  <option value="tournament">Tournament (Best)</option>
                  <option value="bfd">Best Fit Decreasing</option>
                  <option value="ga">Genetic Algorithm</option>
                  <option value="sa">Simulated Annealing</option>
                  <option value="pso">Particle Swarm (PSO)</option>
                </select>
                <button
                  onClick={handleStartGeneration}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all shadow-md shadow-orange-500/25"
                >
                  Start Generation
                </button>
              </div>
            )}
            {generationProgress?.isComplete && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSyncPlankIdsToRaw}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all flex items-center gap-2 border border-gray-300"
                >
                  Sync plank IDs to raw
                </button>
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

                  {/* View / Download (for completed steps) */}
                  {step.status === 'complete' && (
                    <div className="flex gap-2">
                      {['raw-data', 'formatted-data', 'plank-list', 'material-summary', 'material-estimate', 'input-qa', 'output-qa', 'pressing-list'].includes(step.id) && (
                        <>
                          <button
                            onClick={() => handleViewData(step.id)}
                            className="text-xs px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium transition-colors"
                          >
                            View Table
                          </button>
                          <button
                            onClick={() => handleDownloadStep(step.id)}
                            className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium transition-colors"
                          >
                            Download CSV
                          </button>
                        </>
                      )}
                      {['cutlist'].includes(step.id) && (
                        <>
                          <button
                            onClick={() => router.push(getReportLink(step.id))}
                            className="text-xs px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded font-medium transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDownloadStep(step.id)}
                            className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium transition-colors"
                          >
                            Download CSV
                          </button>
                        </>
                      )}
                      {step.id === 'gcode' && gcodeResults && gcodeResults.length > 0 && (
                        <>
                          <button
                            onClick={() => handleViewData('gcode')}
                            className="text-xs px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded font-medium transition-colors"
                          >
                            View G-Code
                          </button>
                          <button
                            onClick={() => handleDownloadStep('gcode')}
                            className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium transition-colors"
                          >
                            Download ZIP
                          </button>
                        </>
                      )}
                      {step.id === 'sft-results' && (
                        <button
                          onClick={() => router.push(getReportLink(step.id))}
                          className="text-xs px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded font-medium transition-colors"
                        >
                          View
                        </button>
                      )}
                      {step.id === 'installation-guide' && (
                        <button
                          onClick={() => router.push(getReportLink(step.id))}
                          className="text-xs px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded font-medium transition-colors"
                        >
                          Generate Installation Guide
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

        {/* Quick Links - Brand Colors */}
        {generationProgress?.isComplete && (
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <Link
              href="/visualiser/reports/cutlist"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-orange-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">View Cutlist</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Visual nesting layout</p>
                </div>
              </div>
            </Link>
            <Link
              href="/visualiser/reports/material-estimate"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Material Estimate</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Complete material breakdown</p>
                </div>
              </div>
            </Link>
            <Link
              href={dataSource === 'import' ? '/visualiser/import-raw-data' : '/visualiser/designer'}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">{dataSource === 'import' ? 'Back to Import' : 'Back to Designer'}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{dataSource === 'import' ? 'Import another file' : 'Continue editing'}</p>
                </div>
              </div>
            </Link>
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
  const links: Record<string, string> = {
    'raw-data': '/visualiser/generate',
    'formatted-data': '/visualiser/generate',
    'plank-list': '/visualiser/generate',
    'cutlist': '/visualiser/reports/cutlist',
    'material-summary': '/visualiser/reports/material-estimate',
    'material-estimate': '/visualiser/reports/material-estimate',
    'sft-results': '/visualiser/reports/sft',
    'input-qa': '/visualiser/reports/qa-input',
    'output-qa': '/visualiser/reports/qa-output',
    'pressing-list': '/visualiser/reports/pressing-list',
    'gcode': '/visualiser/reports/cutlist',
    'installation-guide': '/visualiser/installation-guide',
  };
  return links[stepId] || '/visualiser';
}
