"use client";

import React, { useState, useMemo } from "react";
import type { QASheetData } from "@/types/visualiser";

const DEMO_QA_OUTPUT: QASheetData[] = [
  { plankId: "P001", plankName: "Left Side", material: "White MDF 18mm", dimensions: "720 × 560", status: "passed", notes: "Clean edges" },
  { plankId: "P002", plankName: "Right Side", material: "White MDF 18mm", dimensions: "720 × 560", status: "passed" },
  { plankId: "P003", plankName: "Bottom Panel", material: "White MDF 18mm", dimensions: "564 × 560", status: "passed" },
  { plankId: "P004", plankName: "Top Panel", material: "White MDF 18mm", dimensions: "564 × 560", status: "pending" },
  { plankId: "P005", plankName: "Back Panel", material: "White MDF 8mm", dimensions: "684 × 564", status: "pending" },
  { plankId: "P006", plankName: "Shelf 1", material: "Oak Veneer 18mm", dimensions: "500 × 400", status: "pending" },
];

export function QAOutputReport() {
  const [data, setData] = useState<QASheetData[]>(DEMO_QA_OUTPUT);
  const [filter, setFilter] = useState<"all" | "pending" | "passed" | "failed">("all");

  const filteredData = useMemo(() => {
    if (filter === "all") return data;
    return data.filter((item) => item.status === filter);
  }, [data, filter]);

  const stats = useMemo(() => ({
    total: data.length,
    pending: data.filter((d) => d.status === "pending").length,
    passed: data.filter((d) => d.status === "passed").length,
    failed: data.filter((d) => d.status === "failed").length,
  }), [data]);

  const handleStatusChange = (plankId: string, status: "pending" | "passed" | "failed") => {
    setData((prev) =>
      prev.map((item) => (item.plankId === plankId ? { ...item, status } : item))
    );
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-4">
        <h1 className="text-xl font-bold">☑️ Output QA Sheet</h1>
        <p className="text-sm text-cyan-100">Quality assurance for finished products</p>
      </header>

      <div className="p-6">
        {/* Progress Bar */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Inspection Progress</span>
            <span className="text-gray-500">{stats.passed + stats.failed} / {stats.total} checked</span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${(stats.passed / stats.total) * 100}%` }}
            />
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${(stats.failed / stats.total) * 100}%` }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              Passed ({stats.passed})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              Failed ({stats.failed})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gray-300" />
              Pending ({stats.pending})
            </span>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-4">
          {(["all", "pending", "passed", "failed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* QA Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map((item) => (
            <div
              key={item.plankId}
              className={`p-4 rounded-xl border-2 transition-all ${
                item.status === "passed"
                  ? "bg-green-50 border-green-200"
                  : item.status === "failed"
                  ? "bg-red-50 border-red-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="font-mono font-bold text-lg">{item.plankId}</span>
                  <p className="text-sm text-gray-600">{item.plankName}</p>
                </div>
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                    item.status === "passed"
                      ? "bg-green-500 text-white"
                      : item.status === "failed"
                      ? "bg-red-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {item.status === "passed" ? "✓" : item.status === "failed" ? "✗" : "?"}
                </span>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1 mb-3">
                <p>{item.material}</p>
                <p className="font-mono">{item.dimensions}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange(item.plankId, "passed")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.status === "passed"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-green-100"
                  }`}
                >
                  ✓ Pass
                </button>
                <button
                  onClick={() => handleStatusChange(item.plankId, "failed")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.status === "failed"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-red-100"
                  }`}
                >
                  ✗ Fail
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🖨️ Print Report
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">
            💾 Save & Submit
          </button>
        </div>
      </div>
    </div>
  );
}
