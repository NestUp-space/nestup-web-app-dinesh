'use client';

import React, { useMemo } from 'react';
import { useDesignerStore, useDesignSummary } from '@/store/designerStore';
import { formatDesignData, generatePlankList, runNesting } from '@/lib/visualiser';
import { SHEET_CONSTANTS } from '@/types/visualiser';
import { ReportLayout } from '@/components/visualiser/ReportLayout';

export default function MaterialEstimatePage() {
  const summary = useDesignSummary();
  const { walls, projectName, plywoodLibrary } = useDesignerStore();

  // Calculate material estimate
  const estimate = useMemo(() => {
    if (walls.length === 0) {
      return null;
    }

    // Format and process data
    const { data: formattedData } = formatDesignData(walls);
    const { plankList, summary: plankSummary } = generatePlankList(formattedData);
    const { sheetLayouts, summary: nestingSummary } = runNesting(plankList);

    // Calculate plywood requirements
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

    // Calculate laminate requirements (based on plank areas)
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

    // Calculate edge banding
    const ebTotal = plankSummary.edgeBinding;

    // Calculate hardware (basic estimate)
    const hardwareEstimate = {
      screws: summary.totalPlanks * 8, // ~8 screws per plank
      hinges: Math.floor(summary.totalBoxes * 2), // ~2 hinges per box
      vbFittings: summary.totalPlanks, // 1 VB per plank
      handles: summary.totalBoxes,
    };

    return {
      plywood: Array.from(plywoodMap.values()),
      laminate: Array.from(laminateMap.values()),
      edgeBanding: ebTotal,
      hardware: hardwareEstimate,
      totals: {
        totalSheets: nestingSummary.totalSheets,
        totalArea: nestingSummary.totalSheets * (SHEET_CONSTANTS.SHEET_WIDTH * SHEET_CONSTANTS.SHEET_HEIGHT) / 1_000_000,
        avgUtilization: nestingSummary.averageUtilization,
        totalPlanks: plankSummary.totalPlanks,
      },
    };
  }, [walls, summary]);

  if (!estimate) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-900">
        <div className="text-center">
          <p className="text-lg mb-4">No design data available</p>
          <a
            href="/visualiser/designer"
            className="inline-block px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Go to Designer
          </a>
        </div>
      </div>
    );
  }

  return (
    <ReportLayout
      title="Material Estimate"
      subtitle="Complete material breakdown"
      projectName={projectName}
      downloadLabel="Download / Print"
    >
      {/* Summary Cards */}
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

      {/* Plywood Section */}
      <div className="bg-orange-50/50 rounded-lg border border-orange-200 mb-6">
        <div className="px-6 py-4 border-b border-orange-200">
          <h2 className="text-lg font-semibold text-gray-900">Plywood / Core Material</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-orange-100/70">
              <tr>
                <th className="px-6 py-3 text-left text-gray-900">Material</th>
                <th className="px-6 py-3 text-right text-gray-900">Thickness</th>
                <th className="px-6 py-3 text-right text-gray-900">Sheets</th>
                <th className="px-6 py-3 text-right text-gray-900">Area (m²)</th>
                <th className="px-6 py-3 text-right text-gray-900">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {estimate.plywood.map((item, index) => (
                <tr key={index} className="border-t border-orange-100 hover:bg-orange-50/50">
                  <td className="px-6 py-3 font-medium text-gray-900">{item.description}</td>
                  <td className="px-6 py-3 text-right text-gray-700">{item.thickness} mm</td>
                  <td className="px-6 py-3 text-right font-semibold text-orange-600">{item.sheets}</td>
                  <td className="px-6 py-3 text-right text-gray-700">{item.area.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      item.utilization >= 75 ? 'bg-green-100 text-green-700' :
                      item.utilization >= 50 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.utilization.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edge Banding Section */}
      <div className="bg-orange-50/50 rounded-lg border border-orange-200 mb-6">
        <div className="px-6 py-4 border-b border-orange-200">
          <h2 className="text-lg font-semibold text-gray-900">Edge Banding</h2>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white rounded-lg border border-orange-100">
              <div className="text-3xl font-bold text-orange-600">
                {estimate.edgeBanding.inner} m
              </div>
              <p className="text-sm text-gray-500 mt-1">Inner / Plain EB</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-orange-100">
              <div className="text-3xl font-bold text-orange-600">
                {estimate.edgeBanding.color} m
              </div>
              <p className="text-sm text-gray-500 mt-1">Color / Matching EB</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-orange-100">
              <div className="text-3xl font-bold text-orange-600">
                {estimate.edgeBanding.total} m
              </div>
              <p className="text-sm text-gray-500 mt-1">Total EB Required</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Section */}
      <div className="bg-orange-50/50 rounded-lg border border-orange-200 mb-6">
        <div className="px-6 py-4 border-b border-orange-200">
          <h2 className="text-lg font-semibold text-gray-900">Hardware (Estimated)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-orange-100/70">
              <tr>
                <th className="px-6 py-3 text-left text-gray-900">Item</th>
                <th className="px-6 py-3 text-right text-gray-900">Quantity</th>
                <th className="px-6 py-3 text-left text-gray-900">Unit</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-orange-100 hover:bg-orange-50/50">
                <td className="px-6 py-3 text-gray-900">Screws (35mm)</td>
                <td className="px-6 py-3 text-right font-medium text-orange-600">{estimate.hardware.screws}</td>
                <td className="px-6 py-3 text-gray-500">pcs</td>
              </tr>
              <tr className="border-t border-orange-100 hover:bg-orange-50/50">
                <td className="px-6 py-3 text-gray-900">Hinges (Soft Close)</td>
                <td className="px-6 py-3 text-right font-medium text-orange-600">{estimate.hardware.hinges}</td>
                <td className="px-6 py-3 text-gray-500">pairs</td>
              </tr>
              <tr className="border-t border-orange-100 hover:bg-orange-50/50">
                <td className="px-6 py-3 text-gray-900">VB Fittings</td>
                <td className="px-6 py-3 text-right font-medium text-orange-600">{estimate.hardware.vbFittings}</td>
                <td className="px-6 py-3 text-gray-500">pcs</td>
              </tr>
              <tr className="border-t border-orange-100 hover:bg-orange-50/50">
                <td className="px-6 py-3 text-gray-900">Handles</td>
                <td className="px-6 py-3 text-right font-medium text-orange-600">{estimate.hardware.handles}</td>
                <td className="px-6 py-3 text-gray-500">pcs</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• Material quantities include recommended wastage factors</li>
          <li>• Edge banding quantities include 10-15% wastage</li>
          <li>• Hardware quantities are estimates based on box count</li>
          <li>• Actual requirements may vary based on specific designs</li>
        </ul>
      </div>
    </ReportLayout>
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
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    blue: 'bg-orange-50 border-orange-200 text-orange-700',
    green: 'bg-orange-50 border-orange-200 text-orange-700',
    purple: 'bg-orange-50 border-orange-200 text-orange-700',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
      <p className="text-2xl font-bold mt-1 text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
};
