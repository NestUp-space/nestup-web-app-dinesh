"use client";

import React, { useState, useMemo } from "react";
import type { SFTResult } from "@/types/visualiser";

const DEMO_SFT_RESULTS: SFTResult[] = [
  { boxModel: "BC-600", boxType: "Base Cabinet", orientation: "Wall", lengthMm: 600, widthMm: 560, squareFeet: 3.62, originalRow: 2 },
  { boxModel: "BC-900", boxType: "Base Cabinet", orientation: "Wall", lengthMm: 900, widthMm: 560, squareFeet: 5.43, originalRow: 3 },
  { boxModel: "WC-600", boxType: "Wall Cabinet", orientation: "Wall", lengthMm: 600, widthMm: 350, squareFeet: 2.26, originalRow: 4 },
  { boxModel: "WC-900", boxType: "Wall Cabinet", orientation: "Wall", lengthMm: 900, widthMm: 350, squareFeet: 3.39, originalRow: 5 },
  { boxModel: "TC-600", boxType: "Tall Cabinet", orientation: "Floor", lengthMm: 600, widthMm: 560, squareFeet: 3.62, originalRow: 6 },
  { boxModel: "DR-450", boxType: "Drawer Unit", orientation: "Wall", lengthMm: 450, widthMm: 560, squareFeet: 2.71, originalRow: 7 },
  { boxModel: "CN-900", boxType: "Corner Unit", orientation: "Wall", lengthMm: 900, widthMm: 900, squareFeet: 8.72, originalRow: 8 },
];

export function SFTResultsReport() {
  const [data, setData] = useState<SFTResult[]>(DEMO_SFT_RESULTS);
  const [sortBy, setSortBy] = useState<keyof SFTResult>("boxModel");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterType, setFilterType] = useState<string>("all");

  const boxTypes = useMemo(() => {
    const types = new Set(data.map((d) => d.boxType));
    return ["all", ...Array.from(types)];
  }, [data]);

  const filteredData = useMemo(() => {
    let result = filterType === "all" ? data : data.filter((d) => d.boxType === filterType);
    return result.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [data, filterType, sortBy, sortDir]);

  const totals = useMemo(() => {
    const filtered = filterType === "all" ? data : data.filter((d) => d.boxType === filterType);
    return {
      count: filtered.length,
      totalSFT: filtered.reduce((sum, d) => sum + d.squareFeet, 0),
    };
  }, [data, filterType]);

  const handleSort = (column: keyof SFTResult) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-4">
        <h1 className="text-xl font-bold">📏 SFT Results</h1>
        <p className="text-sm text-teal-100">Square footage calculations by box model</p>
      </header>

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-teal-600">{totals.count}</div>
            <div className="text-sm text-gray-500">Total Boxes</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-blue-600">{totals.totalSFT.toFixed(2)}</div>
            <div className="text-sm text-gray-500">Total SFT</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-purple-600">
              {totals.count > 0 ? (totals.totalSFT / totals.count).toFixed(2) : 0}
            </div>
            <div className="text-sm text-gray-500">Avg SFT/Box</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-emerald-600">
              {(totals.totalSFT * 0.0929).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Total m²</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {boxTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === type
                  ? "bg-teal-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {type === "all" ? "All Types" : type}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { key: "boxModel", label: "Model" },
                  { key: "boxType", label: "Type" },
                  { key: "orientation", label: "Orientation" },
                  { key: "lengthMm", label: "Length (mm)" },
                  { key: "widthMm", label: "Width (mm)" },
                  { key: "squareFeet", label: "SFT" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key as keyof SFTResult)}
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortBy === col.key && (
                        <span className="text-teal-500">{sortDir === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-teal-600">{item.boxModel}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.boxType === "Base Cabinet"
                        ? "bg-blue-100 text-blue-700"
                        : item.boxType === "Wall Cabinet"
                        ? "bg-green-100 text-green-700"
                        : item.boxType === "Tall Cabinet"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {item.boxType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.orientation}</td>
                  <td className="px-4 py-3 text-right font-mono">{item.lengthMm}</td>
                  <td className="px-4 py-3 text-right font-mono">{item.widthMm}</td>
                  <td className="px-4 py-3 text-right font-bold text-lg">{item.squareFeet.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-4 py-3">Total</td>
                <td colSpan={4} className="px-4 py-3 text-gray-500">{totals.count} boxes</td>
                <td className="px-4 py-3 text-right text-xl text-teal-600">{totals.totalSFT.toFixed(2)} SFT</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Chart Visualization */}
        <div className="mt-6 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">SFT Distribution by Box Type</h3>
          <div className="space-y-3">
            {Array.from(new Set(data.map((d) => d.boxType))).map((type) => {
              const typeData = data.filter((d) => d.boxType === type);
              const typeSFT = typeData.reduce((sum, d) => sum + d.squareFeet, 0);
              const percentage = (typeSFT / totals.totalSFT) * 100;
              return (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{type}</span>
                    <span className="text-gray-500">{typeSFT.toFixed(2)} SFT ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🖨️ Print Report
          </button>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors">
            📥 Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
