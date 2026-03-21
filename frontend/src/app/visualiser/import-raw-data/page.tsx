'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDesignerStore } from '@/stores/designerStore';
import { EdgeBindingDialog, EBSettings } from '@/components/visualiser/designer/dialogs/EdgeBindingDialog';
import { ClientDetailsDialog } from '@/components/visualiser/designer/dialogs/ClientDetailsDialog';
import { CustomerDetails } from '@/stores/designerStore';
import {
  runPipelineAsync,
  pipelineFormattedToStore,
  pipelinePlankListToStore,
  pipelineNestToStore,
  pipelineMaterialSummaryToStore,
} from '@/lib/visualiser/appscript-port';
import * as XLSX from 'xlsx';

const REQUIRED_HEADERS = [
  'entity_name',
  'Level',
  'material',
  'Room_name',
  'Unit_location',
  'box_model',
  'box_type',
  'LenX',
  'LenY',
  'LenZ',
  'X',
  'Y',
  'Z',
];

function parseCSV(text: string): unknown[][] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === '\n' || c === '\r') && !inQuotes) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      lines.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  if (current) lines.push(current);

  return lines.map((line) => {
    const row: string[] = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        row.push(cell.trim());
        cell = '';
      } else {
        cell += c;
      }
    }
    row.push(cell.trim());
    return row;
  });
}

function parseExcelFile(buffer: ArrayBuffer): unknown[][] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstSheet = wb.SheetNames[0];
  if (!firstSheet) return [];
  const ws = wb.Sheets[firstSheet];
  const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' });
  return data as unknown[][];
}

function normalizeHeader(h: unknown): string {
  return String(h ?? '').trim();
}

const CSV_HEADER_TO_CAMEL: Record<string, string> = {
  entity_name: 'entityName',
  level: 'level',
  material: 'material',
  room_name: 'roomName',
  unit_location: 'unitLocation',
  box_model: 'boxModel',
  box_type: 'boxType',
  lenx: 'lenX',
  leny: 'lenY',
  lenz: 'lenZ',
  x: 'x',
  y: 'y',
  z: 'z',
  plank_id: 'plankId',
};

function headerToCamelKey(header: string): string {
  const lower = header.toLowerCase().replace(/\s+/g, '_');
  return CSV_HEADER_TO_CAMEL[lower] ?? header;
}

function validateHeaders(header: string[]): { ok: boolean; missing: string[] } {
  const normalized = header.map((h) => normalizeHeader(h).toLowerCase().replace(/\s+/g, '_'));
  const missing = REQUIRED_HEADERS.filter((req) => {
    const r = req.toLowerCase();
    return !normalized.some((n) => n === r || n === req);
  });
  return { ok: missing.length === 0, missing };
}

const PREVIEW_ROWS = 20;

export default function ImportRawDataPage() {
  const router = useRouter();
  const setPipelineResult = useDesignerStore((s) => s.setPipelineResult);
  const setFormattedData = useDesignerStore((s) => s.setFormattedData);
  const setPlankList = useDesignerStore((s) => s.setPlankList);
  const setNestResults = useDesignerStore((s) => s.setNestResults);
  const setMaterialSummary = useDesignerStore((s) => s.setMaterialSummary);
  const setRawData = useDesignerStore((s) => s.setRawData);
  const setCustomerDetails = useDesignerStore((s) => s.setCustomerDetails);
  const setGenerationProgress = useDesignerStore((s) => s.setGenerationProgress);
  const setDataSource = useDesignerStore((s) => s.setDataSource);
  const clearWalls = useDesignerStore((s) => s.clearWalls);

  const [rawValues, setRawValues] = useState<unknown[][] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showEBDialog, setShowEBDialog] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [ebSettings, setEbSettings] = useState<EBSettings>({});
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<'bfd' | 'ga' | 'sa' | 'pso' | 'tournament'>('tournament');

  const header = rawValues && rawValues.length > 0 ? (rawValues[0] as string[]).map(normalizeHeader) : [];
  const validation = rawValues && rawValues.length > 1 ? validateHeaders(rawValues[0] as string[]) : { ok: false, missing: REQUIRED_HEADERS };
  const uniqueMaterials = React.useMemo(() => {
    if (!rawValues || rawValues.length < 2 || !header.length) return [];
    const col = header.map((h) => h.toLowerCase()).indexOf('material');
    if (col === -1) return [];
    const set = new Set<string>();
    for (let i = 1; i < rawValues.length; i++) {
      const row = rawValues[i] as unknown[];
      const v = row[col];
      if (v != null && String(v).trim()) set.add(String(v).trim());
    }
    return Array.from(set).sort();
  }, [rawValues, header]);

  const handleFile = useCallback(
    (file: File) => {
      setValidationError(null);
      setRawValues(null);
      setFileName(file.name);
      const ext = file.name.split('.').pop()?.toLowerCase();
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const result = reader.result;
          let data: unknown[][];
          if (ext === 'csv' || file.type === 'text/csv') {
            data = parseCSV(typeof result === 'string' ? result : new TextDecoder().decode(result as ArrayBuffer));
          } else if (ext === 'xlsx' || ext === 'xls') {
            data = parseExcelFile(result as ArrayBuffer);
          } else {
            setValidationError('Unsupported format. Use .csv, .xlsx, or .xls');
            return;
          }
          if (!data.length) {
            setValidationError('File is empty');
            return;
          }
          setRawValues(data);
          if (data.length > 1) {
            const v = validateHeaders((data[0] as string[]).map(normalizeHeader));
            if (!v.ok) setValidationError('Missing columns: ' + v.missing.join(', '));
          }
        } catch (e) {
          setValidationError(e instanceof Error ? e.message : 'Parse error');
        }
      };
      if (ext === 'csv' || file.type === 'text/csv') {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    },
    []
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const startGeneration = () => {
    if (!rawValues || rawValues.length < 2) {
      alert('Upload and parse a file first.');
      return;
    }
    if (!validation.ok) {
      alert('Fix missing columns: ' + validation.missing.join(', '));
      return;
    }
    setShowEBDialog(true);
  };

  const handleEBSubmit = (settings: EBSettings) => {
    setEbSettings(settings);
    setShowEBDialog(false);
    setShowClientDialog(true);
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const handleClientSubmit = async (details: CustomerDetails) => {
    setCustomerDetails(details);
    setShowClientDialog(false);
    if (!rawValues || rawValues.length < 2) return;
    setIsGenerating(true);
    const customerDetailsForPipeline: Record<string, string> = {
      'customer name': details.customerName,
      'firm name': details.firmName,
      'site address': details.address,
      'contact number': details.phone,
      email: details.email,
      gst: String(details.gst),
      'transport amount': String(details.transportAmount),
    };
    try {
      const result = await runPipelineAsync({
        rawValues,
        ebSettings,
        customerDetails: customerDetailsForPipeline,
        nestingParams: { algorithm: selectedAlgorithm },
      });
      clearWalls();
      setDataSource('import');
      setPipelineResult(result);
      setFormattedData(pipelineFormattedToStore(result.formattedData));
      setPlankList(pipelinePlankListToStore(result.plankList));
      setNestResults(pipelineNestToStore(result.cutlist));
      setMaterialSummary(pipelineMaterialSummaryToStore(result.materialSummary));
      const steps = [
        { id: 'raw-data', name: 'Raw Data Export', status: 'complete' as const },
        { id: 'formatted-data', name: 'Formatted Data', status: 'complete' as const },
        { id: 'plank-list', name: 'Plank List', status: 'complete' as const },
        { id: 'cutlist', name: 'Cutlist', status: 'complete' as const },
        { id: 'material-summary', name: 'Material Summary', status: 'complete' as const },
        { id: 'material-estimate', name: 'Material Estimate', status: 'complete' as const },
        { id: 'sft-results', name: 'SFT Results', status: 'complete' as const },
        { id: 'input-qa', name: 'Input QA Sheet', status: 'complete' as const },
        { id: 'output-qa', name: 'Output QA Sheet', status: 'complete' as const },
        { id: 'pressing-list', name: 'Pressing List', status: 'complete' as const },
        { id: 'gcode', name: 'G-Code Files', status: 'complete' as const },
        { id: 'installation-guide', name: 'Installation Guide', status: 'complete' as const },
      ];
      setGenerationProgress({
        steps,
        currentStepId: null,
        isComplete: true,
        hasError: false,
      });
      setRawData(
        rawValues.slice(1).map((row) => {
          const obj: Record<string, unknown> = {};
          (rawValues[0] as string[]).forEach((h, i) => {
            obj[headerToCamelKey(normalizeHeader(h))] = (row as unknown[])[i];
          });
          return obj;
        })
      );
      router.push('/visualiser/generate');
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const previewRows = rawValues && rawValues.length > 1 ? rawValues.slice(1, 1 + PREVIEW_ROWS) : [];

  return (
    <div className="min-h-screen bg-white pb-16">
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Generating Files...</h3>
            <p className="text-sm text-gray-500">
              {selectedAlgorithm === 'tournament'
                ? 'Running nesting tournament — testing multiple configurations'
                : 'Running nesting algorithm'}
            </p>
            <p className="text-xs text-gray-400 mt-2">This may take a moment</p>
          </div>
        </div>
      )}
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

      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/visualiser"
                className="text-gray-500 hover:text-orange-500 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-blue-900">Import Raw Data</h1>
                <p className="text-sm text-gray-500">Upload SketchUp raw data (CSV or Excel) and generate all files</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-orange-400 transition-colors"
        >
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            id="import-file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
          <label htmlFor="import-file" className="cursor-pointer">
            <p className="text-gray-600 mb-2">Drop a file here or click to browse</p>
            <p className="text-sm text-gray-500">CSV, .xlsx, or .xls</p>
          </label>
        </div>

        {validationError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {validationError}
          </div>
        )}

        {rawValues && rawValues.length > 1 && (
          <>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{fileName}</span> — {rawValues.length - 1} rows, {header.length} columns
              </p>
              <div className="flex items-center gap-4">
                {validation.ok ? (
                  <span className="text-sm text-green-600 font-medium">All required columns present</span>
                ) : (
                  <span className="text-sm text-amber-600">Missing: {validation.missing.join(', ')}</span>
                )}
                <select
                  value={selectedAlgorithm}
                  onChange={(e) => setSelectedAlgorithm(e.target.value as typeof selectedAlgorithm)}
                  className="px-3 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-orange-300 focus:outline-none"
                >
                  <option value="tournament">Tournament (Best)</option>
                  <option value="bfd">Best Fit Decreasing</option>
                  <option value="ga">Genetic Algorithm</option>
                  <option value="sa">Simulated Annealing</option>
                  <option value="pso">Particle Swarm (PSO)</option>
                </select>
                <button
                  onClick={startGeneration}
                  disabled={!validation.ok}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  Generate Files
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-auto rounded-lg border border-gray-200 max-h-[60vh]">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    {header.map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, ri) => (
                    <tr key={ri} className="border-t border-gray-100 hover:bg-gray-50">
                      {(row as unknown[]).map((cell, ci) => (
                        <td key={ci} className="px-3 py-1.5 text-gray-800">
                          {String(cell ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rawValues.length - 1 > PREVIEW_ROWS && (
              <p className="text-xs text-gray-500 mt-2">Showing first {PREVIEW_ROWS} of {rawValues.length - 1} rows</p>
            )}

            <p className="text-xs text-gray-500 mt-4">
              Click <strong>Generate Files</strong> above to set edge binding and customer details, then all files will be generated and you can view or download them.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
