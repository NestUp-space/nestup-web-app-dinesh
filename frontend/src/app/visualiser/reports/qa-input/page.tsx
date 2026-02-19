'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useDesignerStore, useDesignSummary } from '@/store/designerStore';
import { formatDesignData } from '@/lib/visualiser';

export default function QAInputPage() {
  const summary = useDesignSummary();
  const { walls, projectName, plywoodLibrary } = useDesignerStore();

  const qaItems = useMemo(() => {
    if (walls.length === 0) return [];

    const { data } = formatDesignData(walls);
    
    // Group by material
    const materialGroups = new Map<string, { count: number; thickness: number }>();
    data.forEach((item) => {
      const key = `${item.plankMaterial}_${item.plankThickness}`;
      const existing = materialGroups.get(key) || { count: 0, thickness: item.plankThickness };
      existing.count += 1;
      materialGroups.set(key, existing);
    });

    return Array.from(materialGroups.entries()).map(([key, value], index) => ({
      id: index + 1,
      material: key.split('_')[0],
      thickness: value.thickness,
      count: value.count,
      checked: false,
    }));
  }, [walls]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/visualiser/generate" className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Input QA Sheet</h1>
                <p className="text-sm text-gray-400">{projectName}</p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
            >
              Print / PDF
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="font-semibold">Material Quality Check</h2>
            <p className="text-sm text-gray-400 mt-1">
              Verify all input materials before processing
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left w-12">#</th>
                  <th className="px-4 py-3 text-left">Material Description</th>
                  <th className="px-4 py-3 text-center">Thickness</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-center">Verified</th>
                  <th className="px-4 py-3 text-left">Comments</th>
                </tr>
              </thead>
              <tbody>
                {qaItems.map((item) => (
                  <tr key={item.id} className="border-t border-gray-700/50">
                    <td className="px-4 py-3 text-gray-500">{item.id}</td>
                    <td className="px-4 py-3 font-medium">{item.material}</td>
                    <td className="px-4 py-3 text-center">{item.thickness}mm</td>
                    <td className="px-4 py-3 text-center">{item.count}</td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" className="w-5 h-5 rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="Add notes..."
                        className="w-full bg-gray-700/50 border border-gray-600 rounded px-2 py-1 text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-gray-700">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Verified By</label>
                <input
                  type="text"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="Name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Date</label>
                <input
                  type="date"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
