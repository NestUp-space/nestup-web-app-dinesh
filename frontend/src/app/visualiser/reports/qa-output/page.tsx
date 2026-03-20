'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDesignerStore } from '@/stores/designerStore';
import { formatDesignData, generatePlankList } from '@/lib/visualiser';
import type { PipelineResult } from '@/lib/visualiser/appscript-port';

function formatQACell(cell: unknown): string {
  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'object') {
    try {
      return JSON.stringify(cell);
    } catch {
      return String(cell);
    }
  }
  return String(cell);
}

export default function QAOutputPage() {
  const pipelineResult = useDesignerStore((state) => state.pipelineResult);
  const walls = useDesignerStore((state) => state.walls);
  const projectName = useDesignerStore((state) => state.projectName);

  const [checkedByRow, setCheckedByRow] = useState<Record<number, boolean>>({});

  const outputQA: PipelineResult['outputQA'] | undefined = pipelineResult?.outputQA;
  const usePipelineQA = Boolean(outputQA?.rows && outputQA.rows.length > 0);

  const qaItems = useMemo(() => {
    if (walls.length === 0) return [];

    const { data } = formatDesignData(walls);
    const { plankList } = generatePlankList(data);

    return plankList.map((plank, index) => ({
      id: index + 1,
      plankId: plank.plankId,
      name: plank.plankName,
      material: plank.material,
      dimensions: `${plank.width} × ${plank.height} × ${plank.thickness}`,
      eb: plank.edgeBinding,
    }));
  }, [walls]);

  const rowCount = usePipelineQA ? outputQA!.rows.length : qaItems.length;

  useEffect(() => {
    setCheckedByRow({});
  }, [usePipelineQA, rowCount]);

  const toggleRow = (rowIndex: number, checked: boolean) => {
    setCheckedByRow((prev) => ({ ...prev, [rowIndex]: checked }));
  };

  const itemCount = usePipelineQA ? outputQA!.rows.length : qaItems.length;

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
                <h1 className="text-xl font-bold">Output QA Sheet</h1>
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

      <main className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="font-semibold">Cut Pieces Quality Check</h2>
            <p className="text-sm text-gray-400 mt-1">
              Verify all cut planks after processing ({itemCount} items)
            </p>
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            {usePipelineQA ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-700/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-3 text-center w-16">OK</th>
                    {outputQA!.tableHeader.map((h, hi) => (
                      <th key={hi} className="px-3 py-3 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {outputQA!.rows.map((row, ri) => (
                    <tr key={ri} className="border-t border-gray-700/50 hover:bg-gray-700/30">
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={!!checkedByRow[ri]}
                          onChange={(e) => toggleRow(ri, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-500 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                        />
                      </td>
                      {outputQA!.tableHeader.map((_, ci) => (
                        <td key={ci} className="px-3 py-2 text-gray-200">
                          {formatQACell(row[ci])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-700/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-3 text-left w-10">#</th>
                    <th className="px-3 py-3 text-left">Plank ID</th>
                    <th className="px-3 py-3 text-left">Name</th>
                    <th className="px-3 py-3 text-left">Material</th>
                    <th className="px-3 py-3 text-center">Dimensions</th>
                    <th className="px-3 py-3 text-center w-12">EB</th>
                    <th className="px-3 py-3 text-center w-16">OK</th>
                  </tr>
                </thead>
                <tbody>
                  {qaItems.map((item) => (
                    <tr key={item.id} className="border-t border-gray-700/50 hover:bg-gray-700/30">
                      <td className="px-3 py-2 text-gray-500">{item.id}</td>
                      <td className="px-3 py-2 font-mono text-xs">{item.plankId}</td>
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2 text-gray-400">{item.material}</td>
                      <td className="px-3 py-2 text-center font-mono text-xs">{item.dimensions}</td>
                      <td className="px-3 py-2 text-center">{item.eb}</td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={!!checkedByRow[item.id]}
                          onChange={(e) => toggleRow(item.id, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-500 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-6 border-t border-gray-700">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Checked By</label>
                <input type="text" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Date</label>
                <input type="date" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Remarks</label>
                <input type="text" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
