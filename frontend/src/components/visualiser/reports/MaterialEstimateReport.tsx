"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { MaterialEstimate } from "@/types/visualiser";
import { useProcessedDataStore, useReportsStore } from "@/store/visualiserStore";

// Demo data
const DEMO_ESTIMATES: MaterialEstimate[] = [
  {
    materialThickness: "White MDF - 18mm",
    roomNames: "Kitchen, Living Room",
    plankCount: 45,
    totalArea: 28.5,
    sheetsUsed: 12,
    avgAreaPerSheet: 2.375,
    utilization: 79.8,
    totalEdge: 145.6,
  },
  {
    materialThickness: "White MDF - 8mm",
    roomNames: "Kitchen",
    plankCount: 12,
    totalArea: 8.2,
    sheetsUsed: 4,
    avgAreaPerSheet: 2.05,
    utilization: 68.9,
    totalEdge: 32.4,
  },
  {
    materialThickness: "Oak Veneer - 18mm",
    roomNames: "Living Room, Bedroom",
    plankCount: 28,
    totalArea: 18.9,
    sheetsUsed: 8,
    avgAreaPerSheet: 2.3625,
    utilization: 79.4,
    totalEdge: 89.2,
  },
  {
    materialThickness: "Oak Veneer - 12mm",
    roomNames: "Bedroom",
    plankCount: 8,
    totalArea: 4.1,
    sheetsUsed: 2,
    avgAreaPerSheet: 2.05,
    utilization: 68.9,
    totalEdge: 18.4,
  },
];

const SHEET_AREA = 2.9768; // 1220 × 2440 mm² in m²

export function MaterialEstimateReport() {
  const { getMaterialEstimates } = useProcessedDataStore();
  const { materialEstimates } = useReportsStore();
  
  const [sortBy, setSortBy] = useState<keyof MaterialEstimate>("materialThickness");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Use processed data if available, otherwise use demo data
  const storeData = materialEstimates.length > 0 ? materialEstimates : getMaterialEstimates();
  const data = storeData.length > 0 ? storeData : DEMO_ESTIMATES;

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [data, sortBy, sortDir]);

  const totals = useMemo(() => {
    return data.reduce(
      (acc, item) => ({
        plankCount: acc.plankCount + item.plankCount,
        totalArea: acc.totalArea + item.totalArea,
        sheetsUsed: acc.sheetsUsed + item.sheetsUsed,
        totalEdge: acc.totalEdge + item.totalEdge,
      }),
      { plankCount: 0, totalArea: 0, sheetsUsed: 0, totalEdge: 0 }
    );
  }, [data]);

  const avgUtilization = useMemo(() => {
    if (data.length === 0) return 0;
    return data.reduce((sum, item) => sum + item.utilization, 0) / data.length;
  }, [data]);

  const handleSort = (column: keyof MaterialEstimate) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

  const formatArea = (sqm: number) => {
    return sqm.toFixed(2) + " m²";
  };

  const formatEdge = (meters: number) => {
    return meters.toFixed(1) + " m";
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4">
        <h1 className="text-xl font-bold">📦 Material Estimate Report</h1>
        <p className="text-sm text-amber-100">Summary of materials by type and thickness</p>
      </header>

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-amber-600">{totals.plankCount}</div>
            <div className="text-sm text-gray-500">Total Planks</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-blue-600">{totals.sheetsUsed}</div>
            <div className="text-sm text-gray-500">Sheets Required</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-green-600">{avgUtilization.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">Avg Utilization</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-purple-600">{formatEdge(totals.totalEdge)}</div>
            <div className="text-sm text-gray-500">Total Edge Banding</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { key: "materialThickness", label: "Material & Thickness" },
                  { key: "roomNames", label: "Rooms" },
                  { key: "plankCount", label: "Planks" },
                  { key: "totalArea", label: "Total Area" },
                  { key: "sheetsUsed", label: "Sheets" },
                  { key: "utilization", label: "Utilization" },
                  { key: "totalEdge", label: "Edge Banding" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key as keyof MaterialEstimate)}
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortBy === col.key && (
                        <span className="text-amber-500">{sortDir === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{item.materialThickness}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.roomNames}</td>
                  <td className="px-4 py-3 text-sm font-medium">{item.plankCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatArea(item.totalArea)}</td>
                  <td className="px-4 py-3 text-sm font-medium">{item.sheetsUsed}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            item.utilization >= 75
                              ? "bg-green-500"
                              : item.utilization >= 60
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${item.utilization}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{item.utilization.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatEdge(item.totalEdge)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3">{data.length} materials</td>
                <td className="px-4 py-3">{totals.plankCount}</td>
                <td className="px-4 py-3">{formatArea(totals.totalArea)}</td>
                <td className="px-4 py-3">{totals.sheetsUsed}</td>
                <td className="px-4 py-3">{avgUtilization.toFixed(1)}% avg</td>
                <td className="px-4 py-3">{formatEdge(totals.totalEdge)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Export Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🖨️ Print Report
          </button>
          <button 
            onClick={() => {
              const csvContent = [
                ['Material & Thickness', 'Rooms', 'Planks', 'Total Area (m²)', 'Sheets', 'Utilization (%)', 'Edge Banding (m)'].join(','),
                ...data.map(item => [
                  item.materialThickness,
                  `"${item.roomNames}"`,
                  item.plankCount,
                  item.totalArea.toFixed(2),
                  item.sheetsUsed,
                  item.utilization.toFixed(1),
                  item.totalEdge.toFixed(1)
                ].join(','))
              ].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'material_estimate.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
          >
            📥 Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
