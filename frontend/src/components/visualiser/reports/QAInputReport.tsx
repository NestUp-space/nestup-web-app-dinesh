"use client";

import React, { useState, useMemo } from "react";
import type { QASheetData } from "@/types/visualiser";

const DEMO_QA_INPUT: QASheetData[] = [
  { plankId: "P001", plankName: "Left Side", material: "White MDF 18mm", dimensions: "720 × 560", status: "passed" },
  { plankId: "P002", plankName: "Right Side", material: "White MDF 18mm", dimensions: "720 × 560", status: "passed" },
  { plankId: "P003", plankName: "Bottom Panel", material: "White MDF 18mm", dimensions: "564 × 560", status: "pending" },
  { plankId: "P004", plankName: "Top Panel", material: "White MDF 18mm", dimensions: "564 × 560", status: "pending" },
  { plankId: "P005", plankName: "Back Panel", material: "White MDF 8mm", dimensions: "684 × 564", status: "pending" },
  { plankId: "P006", plankName: "Shelf 1", material: "Oak Veneer 18mm", dimensions: "500 × 400", status: "failed", notes: "Chipped corner" },
  { plankId: "P007", plankName: "Shelf 2", material: "Oak Veneer 18mm", dimensions: "500 × 400", status: "pending" },
  { plankId: "P008", plankName: "Door Left", material: "Oak Veneer 18mm", dimensions: "700 × 350", status: "passed" },
];

export function QAInputReport() {
  const [data, setData] = useState<QASheetData[]>(DEMO_QA_INPUT);
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

  const handleNotesChange = (plankId: string, notes: string) => {
    setData((prev) =>
      prev.map((item) => (item.plankId === plankId ? { ...item, notes } : item))
    );
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4">
        <h1 className="text-xl font-bold">✅ Input QA Sheet</h1>
        <p className="text-sm text-green-100">Quality assurance checklist for incoming materials</p>
      </header>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`p-4 rounded-xl text-left transition-all ${
              filter === "all" ? "bg-gray-800 text-white" : "bg-white shadow-sm hover:shadow-md"
            }`}
          >
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm opacity-70">Total Items</div>
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`p-4 rounded-xl text-left transition-all ${
              filter === "pending" ? "bg-amber-500 text-white" : "bg-white shadow-sm hover:shadow-md"
            }`}
          >
            <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </button>
          <button
            onClick={() => setFilter("passed")}
            className={`p-4 rounded-xl text-left transition-all ${
              filter === "passed" ? "bg-green-500 text-white" : "bg-white shadow-sm hover:shadow-md"
            }`}
          >
            <div className="text-3xl font-bold text-green-600">{stats.passed}</div>
            <div className="text-sm text-gray-500">Passed</div>
          </button>
          <button
            onClick={() => setFilter("failed")}
            className={`p-4 rounded-xl text-left transition-all ${
              filter === "failed" ? "bg-red-500 text-white" : "bg-white shadow-sm hover:shadow-md"
            }`}
          >
            <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-500">Failed</div>
          </button>
        </div>

        {/* QA Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Plank ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Material</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Dimensions</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((item) => (
                <tr key={item.plankId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-gray-800">{item.plankId}</td>
                  <td className="px-4 py-3 text-gray-700">{item.plankName}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{item.material}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm font-mono">{item.dimensions}</td>
                  <td className="px-4 py-3">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.plankId, e.target.value as any)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border-0 ${
                        item.status === "passed"
                          ? "bg-green-100 text-green-700"
                          : item.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="passed">✅ Passed</option>
                      <option value="failed">❌ Failed</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={item.notes || ""}
                      onChange={(e) => handleNotesChange(item.plankId, e.target.value)}
                      placeholder="Add notes..."
                      className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-green-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🖨️ Print Checklist
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors">
            💾 Save Progress
          </button>
        </div>
      </div>
    </div>
  );
}
