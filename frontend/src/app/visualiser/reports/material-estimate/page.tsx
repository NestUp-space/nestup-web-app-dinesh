'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useDesignerStore, useDesignSummary } from '@/stores/designerStore';
import { formatDesignData, generatePlankList, runNesting } from '@/lib/visualiser';
import { SHEET_CONSTANTS } from '@/types/visualiser';
import type { PipelineResult } from '@/lib/visualiser/appscript-port';

export default function MaterialEstimatePage() {
  const summary = useDesignSummary();
  const { walls, projectName } = useDesignerStore();
  const pipelineResult = useDesignerStore((state) => state.pipelineResult);

  const wallDerivedEstimate = useMemo(() => {
    if (walls.length === 0) {
      return null;
    }

    const { data: formattedData } = formatDesignData(walls);
    const { plankList, summary: plankSummary } = generatePlankList(formattedData);
    const { sheetLayouts, summary: nestingSummary } = runNesting(plankList);

    const plywoodMap = new Map<string, PlywoodEstimate>();
    sheetLayouts.forEach((layout) => {
      const key = layout.materialThickness;
      const existing = plywoodMap.get(key) || {
        description: key,
        thickness: parseInt(key.split('_')[1]) || 18,
        sheets: 0,
        area: 0,
        utilization: 0,
      };
      existing.sheets += 1;
      existing.area += (SHEET_CONSTANTS.SHEET_WIDTH * SHEET_CONSTANTS.SHEET_HEIGHT) / 1_000_000;
      existing.utilization = (existing.utilization * (existing.sheets - 1) + layout.utilization) / existing.sheets;
      plywoodMap.set(key, existing);
    });

    const laminateMap = new Map<string, LaminateEstimate>();
    formattedData.forEach((item) => {
      const material = item.plankMaterial.toLowerCase();
      if (material.includes('laminate') || material.includes('sl') || material.includes('sf')) {
        const key = item.plankMaterial;
        const existing = laminateMap.get(key) || {
          description: key,
          area: 0,
          sheets: 0,
        };
        existing.area += (item.plankLength * item.plankWidth) / 1_000_000;
        laminateMap.set(key, existing);
      }
    });

    const ebTotal = plankSummary.edgeBinding;

    const hardwareEstimate = {
      screws: summary.totalPlanks * 8,
      hinges: Math.floor(summary.totalBoxes * 2),
      vbFittings: summary.totalPlanks,
      handles: summary.totalBoxes,
    };

    return {
      plywood: Array.from(plywoodMap.values()),
      laminate: Array.from(laminateMap.values()),
      edgeBanding: ebTotal,
      hardware: hardwareEstimate,
      totals: {
        totalSheets: nestingSummary.totalSheets,
        totalArea:
          (nestingSummary.totalSheets * (SHEET_CONSTANTS.SHEET_WIDTH * SHEET_CONSTANTS.SHEET_HEIGHT)) / 1_000_000,
        avgUtilization: nestingSummary.averageUtilization,
        totalPlanks: plankSummary.totalPlanks,
      },
    };
  }, [walls, summary]);

  if (!pipelineResult?.materialEstimate && !wallDerivedEstimate) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-lg mb-4">No design data available</p>
          <Link
            href="/visualiser/designer"
            className="px-4 py-2 bg-orange-500 rounded-lg hover:bg-orange-600"
          >
            Go to Designer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/visualiser/generate"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Material Estimate</h1>
                <p className="text-sm text-gray-400">{projectName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print / PDF
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {pipelineResult?.materialEstimate ? (
          <PipelineMaterialEstimateBody materialEstimate={pipelineResult.materialEstimate} />
        ) : wallDerivedEstimate ? (
          <WallDerivedMaterialEstimateBody estimate={wallDerivedEstimate} />
        ) : null}

        <div className="bg-gray-800/30 rounded-lg border border-gray-700/50 p-6">
          <h3 className="font-semibold mb-3">Notes</h3>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• Material quantities include recommended wastage factors</li>
            <li>• Edge banding quantities include 10-15% wastage</li>
            <li>• Hardware quantities are estimates based on box count</li>
            <li>• Actual requirements may vary based on specific designs</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

type MaterialEstimateTables = PipelineResult['materialEstimate'];

function PipelineMaterialEstimateBody({ materialEstimate }: { materialEstimate: MaterialEstimateTables }) {
  const { plywood, laminate, edgeBanding, hardware } = materialEstimate;

  return (
    <>
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          title="Plywood lines"
          value={plywood.rows.length}
          subtitle="Rows in estimate"
          color="orange"
        />
        <SummaryCard
          title="Laminate lines"
          value={laminate.rows.length}
          subtitle="Rows in estimate"
          color="blue"
        />
        <SummaryCard
          title="Edge banding lines"
          value={edgeBanding.rows.length}
          subtitle="Rows in estimate"
          color="green"
        />
        <SummaryCard
          title="Hardware lines"
          value={hardware.rows.length}
          subtitle="Rows in estimate"
          color="purple"
        />
      </div>

      <PipelineSectionTable title="Plywood / Core Material" section={plywood} />
      <PipelineSectionTable title="Laminate" section={laminate} />
      <PipelineSectionTable title="Edge Banding" section={edgeBanding} />
      <PipelineSectionTable title="Hardware" section={hardware} />
    </>
  );
}

function PipelineSectionTable({
  title,
  section,
}: {
  title: string;
  section: { header: string[]; rows: (string | number)[][] };
}) {
  const { header, rows } = section;
  const colCount = Math.max(header.length, 1);

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700 mb-6">
      <div className="px-6 py-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-700/50">
            <tr>
              {header.map((h, i) => (
                <th key={i} className="px-6 py-3 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="border-t border-gray-700/50">
                <td colSpan={colCount} className="px-6 py-4 text-center text-gray-400">
                  No data
                </td>
              </tr>
            ) : (
              rows.map((row, ri) => (
                <tr key={ri} className="border-t border-gray-700/50 hover:bg-gray-700/30">
                  {header.map((_, ci) => (
                    <td key={ci} className="px-6 py-3">
                      {formatPipelineCell(row[ci])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatPipelineCell(value: string | number | undefined): React.ReactNode {
  if (value === undefined || value === null) {
    return '—';
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : value.toFixed(2);
  }
  return String(value);
}

interface WallDerivedEstimate {
  plywood: PlywoodEstimate[];
  laminate: LaminateEstimate[];
  edgeBanding: { inner: number; color: number; total: number };
  hardware: { screws: number; hinges: number; vbFittings: number; handles: number };
  totals: {
    totalSheets: number;
    totalArea: number;
    avgUtilization: number;
    totalPlanks: number;
  };
}

function WallDerivedMaterialEstimateBody({ estimate }: { estimate: WallDerivedEstimate }) {
  return (
    <>
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          title="Total Sheets"
          value={estimate.totals.totalSheets}
          subtitle="Plywood sheets required"
          color="orange"
        />
        <SummaryCard
          title="Total Area"
          value={`${estimate.totals.totalArea.toFixed(1)} m²`}
          subtitle="Material area"
          color="blue"
        />
        <SummaryCard
          title="Avg Utilization"
          value={`${estimate.totals.avgUtilization.toFixed(1)}%`}
          subtitle="Sheet efficiency"
          color="green"
        />
        <SummaryCard
          title="Total Planks"
          value={estimate.totals.totalPlanks}
          subtitle="Cut pieces"
          color="purple"
        />
      </div>

      <div className="bg-gray-800/50 rounded-lg border border-gray-700 mb-6">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Plywood / Core Material</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left">Material</th>
                <th className="px-6 py-3 text-right">Thickness</th>
                <th className="px-6 py-3 text-right">Sheets</th>
                <th className="px-6 py-3 text-right">Area (m²)</th>
                <th className="px-6 py-3 text-right">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {estimate.plywood.map((item, index) => (
                <tr key={index} className="border-t border-gray-700/50 hover:bg-gray-700/30">
                  <td className="px-6 py-3 font-medium">{item.description}</td>
                  <td className="px-6 py-3 text-right">{item.thickness} mm</td>
                  <td className="px-6 py-3 text-right font-semibold">{item.sheets}</td>
                  <td className="px-6 py-3 text-right">{item.area.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        item.utilization >= 75
                          ? 'bg-green-500/20 text-green-400'
                          : item.utilization >= 50
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {item.utilization.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg border border-gray-700 mb-6">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Edge Banding</h2>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">{estimate.edgeBanding.inner} m</div>
              <p className="text-sm text-gray-400 mt-1">Inner / Plain EB</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{estimate.edgeBanding.color} m</div>
              <p className="text-sm text-gray-400 mt-1">Color / Matching EB</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{estimate.edgeBanding.total} m</div>
              <p className="text-sm text-gray-400 mt-1">Total EB Required</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg border border-gray-700 mb-6">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Hardware (Estimated)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left">Item</th>
                <th className="px-6 py-3 text-right">Quantity</th>
                <th className="px-6 py-3 text-left">Unit</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-700/50 hover:bg-gray-700/30">
                <td className="px-6 py-3">Screws (35mm)</td>
                <td className="px-6 py-3 text-right font-medium">{estimate.hardware.screws}</td>
                <td className="px-6 py-3 text-gray-400">pcs</td>
              </tr>
              <tr className="border-t border-gray-700/50 hover:bg-gray-700/30">
                <td className="px-6 py-3">Hinges (Soft Close)</td>
                <td className="px-6 py-3 text-right font-medium">{estimate.hardware.hinges}</td>
                <td className="px-6 py-3 text-gray-400">pairs</td>
              </tr>
              <tr className="border-t border-gray-700/50 hover:bg-gray-700/30">
                <td className="px-6 py-3">VB Fittings</td>
                <td className="px-6 py-3 text-right font-medium">{estimate.hardware.vbFittings}</td>
                <td className="px-6 py-3 text-gray-400">pcs</td>
              </tr>
              <tr className="border-t border-gray-700/50 hover:bg-gray-700/30">
                <td className="px-6 py-3">Handles</td>
                <td className="px-6 py-3 text-right font-medium">{estimate.hardware.handles}</td>
                <td className="px-6 py-3 text-gray-400">pcs</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

interface PlywoodEstimate {
  description: string;
  thickness: number;
  sheets: number;
  area: number;
  utilization: number;
}

interface LaminateEstimate {
  description: string;
  area: number;
  sheets: number;
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  color: 'orange' | 'blue' | 'green' | 'purple';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, subtitle, color }) => {
  const colorClasses = {
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <p className="text-xs uppercase tracking-wide opacity-80">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
};
