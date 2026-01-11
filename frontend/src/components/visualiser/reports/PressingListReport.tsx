"use client";

import React, { useState, useMemo } from "react";
import type { PressingListItem } from "@/types/visualiser";

const DEMO_PRESSING_LIST: PressingListItem[] = [
  {
    sheetNum: 1,
    material: "White MDF",
    thickness: 18,
    plankCount: 4,
    planks: [
      { id: "P001", name: "Left Side", width: 720, height: 560 },
      { id: "P002", name: "Right Side", width: 720, height: 560 },
      { id: "P003", name: "Bottom Panel", width: 564, height: 560 },
      { id: "P004", name: "Top Panel", width: 564, height: 560 },
    ],
  },
  {
    sheetNum: 2,
    material: "White MDF",
    thickness: 8,
    plankCount: 2,
    planks: [
      { id: "P005", name: "Back Panel 1", width: 684, height: 564 },
      { id: "P006", name: "Back Panel 2", width: 684, height: 564 },
    ],
  },
  {
    sheetNum: 3,
    material: "Oak Veneer",
    thickness: 18,
    plankCount: 3,
    planks: [
      { id: "P007", name: "Door Left", width: 700, height: 350 },
      { id: "P008", name: "Door Right", width: 700, height: 350 },
      { id: "P009", name: "Shelf", width: 500, height: 400 },
    ],
  },
];

export function PressingListReport() {
  const [data, setData] = useState<PressingListItem[]>(DEMO_PRESSING_LIST);
  const [checkedSheets, setCheckedSheets] = useState<Set<number>>(new Set());
  const [expandedSheets, setExpandedSheets] = useState<Set<number>>(new Set([1]));

  const toggleSheet = (sheetNum: number) => {
    setExpandedSheets((prev) => {
      const next = new Set(prev);
      if (next.has(sheetNum)) next.delete(sheetNum);
      else next.add(sheetNum);
      return next;
    });
  };

  const toggleChecked = (sheetNum: number) => {
    setCheckedSheets((prev) => {
      const next = new Set(prev);
      if (next.has(sheetNum)) next.delete(sheetNum);
      else next.add(sheetNum);
      return next;
    });
  };

  const stats = useMemo(() => ({
    totalSheets: data.length,
    completedSheets: checkedSheets.size,
    totalPlanks: data.reduce((sum, s) => sum + s.plankCount, 0),
  }), [data, checkedSheets]);

  const materialGroups = useMemo(() => {
    const groups: Record<string, PressingListItem[]> = {};
    data.forEach((item) => {
      const key = `${item.material} ${item.thickness}mm`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [data]);

  return (
    <div className="flex-1 overflow-auto bg-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-4">
        <h1 className="text-xl font-bold">🔨 Pressing List</h1>
        <p className="text-sm text-purple-100">Manufacturing sheet-by-sheet pressing checklist</p>
      </header>

      <div className="p-6">
        {/* Progress Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-purple-600">{stats.totalSheets}</div>
            <div className="text-sm text-gray-500">Total Sheets</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-green-600">{stats.completedSheets}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-blue-600">{stats.totalPlanks}</div>
            <div className="text-sm text-gray-500">Total Planks</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Pressing Progress</span>
            <span className="text-gray-500">{stats.completedSheets} / {stats.totalSheets} sheets</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
              style={{ width: `${(stats.completedSheets / stats.totalSheets) * 100}%` }}
            />
          </div>
        </div>

        {/* Sheet List by Material */}
        {Object.entries(materialGroups).map(([materialKey, sheets]) => (
          <div key={materialKey} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-purple-500" />
              {materialKey}
            </h3>

            <div className="space-y-3">
              {sheets.map((sheet) => (
                <div
                  key={sheet.sheetNum}
                  className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all ${
                    checkedSheets.has(sheet.sheetNum) ? "opacity-60" : ""
                  }`}
                >
                  {/* Sheet Header */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSheet(sheet.sheetNum)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleChecked(sheet.sheetNum);
                      }}
                      className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-colors ${
                        checkedSheets.has(sheet.sheetNum)
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300 hover:border-purple-500"
                      }`}
                    >
                      {checkedSheets.has(sheet.sheetNum) && "✓"}
                    </button>
                    
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">Sheet #{sheet.sheetNum}</div>
                      <div className="text-sm text-gray-500">{sheet.plankCount} planks</div>
                    </div>

                    <span className="text-gray-400">
                      {expandedSheets.has(sheet.sheetNum) ? "▼" : "▶"}
                    </span>
                  </div>

                  {/* Planks List */}
                  {expandedSheets.has(sheet.sheetNum) && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-500">
                            <th className="text-left py-2">ID</th>
                            <th className="text-left py-2">Name</th>
                            <th className="text-right py-2">Width</th>
                            <th className="text-right py-2">Height</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {sheet.planks.map((plank) => (
                            <tr key={plank.id}>
                              <td className="py-2 font-mono font-bold text-purple-600">{plank.id}</td>
                              <td className="py-2 text-gray-700">{plank.name}</td>
                              <td className="py-2 text-right text-gray-600">{plank.width}</td>
                              <td className="py-2 text-right text-gray-600">{plank.height}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🖨️ Print List
          </button>
          <button
            onClick={() => setCheckedSheets(new Set())}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            🔄 Reset All
          </button>
        </div>
      </div>
    </div>
  );
}
