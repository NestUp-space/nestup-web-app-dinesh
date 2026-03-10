'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useDesignerStore } from '@/stores/designerStore';
import { formatDesignData, runNesting, generatePlankList } from '@/lib/visualiser';

export default function PressingListPage() {
  const { walls, projectName } = useDesignerStore();

  const pressingItems = useMemo(() => {
    if (walls.length === 0) return [];

    const { data } = formatDesignData(walls);
    const { plankList } = generatePlankList(data);
    const { sheetLayouts } = runNesting(plankList);

    // Group by material
    const materialMap = new Map<string, { material: string; plyType: string; thickness: number; sheets: number }>();
    
    sheetLayouts.forEach((layout) => {
      const key = layout.materialThickness;
      const existing = materialMap.get(key) || {
        material: key.split('_')[0],
        plyType: 'MR', // Default
        thickness: parseInt(key.split('_')[1]) || 18,
        sheets: 0,
      };
      existing.sheets += 1;
      materialMap.set(key, existing);
    });

    return Array.from(materialMap.values()).map((item, index) => ({
      sno: index + 1,
      ...item,
      completed: false,
      comments: '',
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
                <h1 className="text-xl font-bold">Pressing List</h1>
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
            <h2 className="font-semibold">Laminate Pressing Schedule</h2>
            <p className="text-sm text-gray-400 mt-1">
              Track laminate pressing for each material batch
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left w-12">S.No</th>
                  <th className="px-4 py-3 text-left">Material</th>
                  <th className="px-4 py-3 text-center">Ply Type</th>
                  <th className="px-4 py-3 text-center">Thickness</th>
                  <th className="px-4 py-3 text-center">Sheets</th>
                  <th className="px-4 py-3 text-center">Completed</th>
                  <th className="px-4 py-3 text-left">Comments</th>
                </tr>
              </thead>
              <tbody>
                {pressingItems.map((item) => (
                  <tr key={item.sno} className="border-t border-gray-700/50">
                    <td className="px-4 py-3 text-gray-500">{item.sno}</td>
                    <td className="px-4 py-3 font-medium">{item.material}</td>
                    <td className="px-4 py-3 text-center">{item.plyType}</td>
                    <td className="px-4 py-3 text-center">{item.thickness}mm</td>
                    <td className="px-4 py-3 text-center font-semibold">{item.sheets}</td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" className="w-5 h-5 rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="Notes..."
                        className="w-full bg-gray-700/50 border border-gray-600 rounded px-2 py-1 text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-gray-700 bg-gray-800/30">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Total: {pressingItems.reduce((sum, item) => sum + item.sheets, 0)} sheets
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Operator</label>
                  <input type="text" className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-32" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date</label>
                  <input type="date" className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
