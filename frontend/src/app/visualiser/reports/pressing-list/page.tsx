'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDesignerStore } from '@/stores/designerStore';
import { formatDesignData, runNesting, generatePlankList } from '@/lib/visualiser';
import type { PipelineResult } from '@/lib/visualiser/appscript-port';

export default function PressingListPage() {
  const pipelineResult: PipelineResult | null = useDesignerStore((state) => state.pipelineResult);
  const { walls, projectName } = useDesignerStore();

  const usePipelinePressing = Boolean(
    pipelineResult?.pressingList?.rows && pipelineResult.pressingList.rows.length > 0
  );

  const [pipelineBoolState, setPipelineBoolState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!usePipelinePressing || !pipelineResult?.pressingList) return;
    const next: Record<string, boolean> = {};
    pipelineResult.pressingList.rows.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        if (typeof cell === 'boolean') {
          next[`${ri}-${ci}`] = cell;
        }
      });
    });
    setPipelineBoolState(next);
  }, [usePipelinePressing, pipelineResult?.pressingList]);

  const pressingItems = useMemo(() => {
    if (walls.length === 0) return [];

    const { data } = formatDesignData(walls);
    const { plankList } = generatePlankList(data);
    const { sheetLayouts } = runNesting(plankList);

    const materialMap = new Map<string, { material: string; plyType: string; thickness: number; sheets: number }>();

    sheetLayouts.forEach((layout) => {
      const key = layout.materialThickness;
      const existing = materialMap.get(key) || {
        material: key.split('_')[0],
        plyType: 'MR',
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

  const [wallCompleted, setWallCompleted] = useState<Record<number, boolean>>({});

  const totalSheets = usePipelinePressing
    ? pipelineResult!.pressingList.headerBlock.totalQuantity
    : pressingItems.reduce((sum, item) => sum + item.sheets, 0);

  const pipelineSubtitle = usePipelinePressing
    ? [
        pipelineResult!.pressingList.headerBlock.title,
        pipelineResult!.pressingList.headerBlock.customerName,
        pipelineResult!.pressingList.headerBlock.siteAddress,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

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
                {usePipelinePressing && pipelineSubtitle ? (
                  <p className="text-xs text-gray-500 mt-1 max-w-xl">{pipelineSubtitle}</p>
                ) : null}
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
                  {usePipelinePressing ? (
                    pipelineResult!.pressingList.tableHeader.map((h, hi) => (
                      <th
                        key={hi}
                        className={`px-4 py-3 ${/completed|done|✓/i.test(h) ? 'text-center' : 'text-left'}`}
                      >
                        {h}
                      </th>
                    ))
                  ) : (
                    <>
                      <th className="px-4 py-3 text-left w-12">S.No</th>
                      <th className="px-4 py-3 text-left">Material</th>
                      <th className="px-4 py-3 text-center">Ply Type</th>
                      <th className="px-4 py-3 text-center">Thickness</th>
                      <th className="px-4 py-3 text-center">Sheets</th>
                      <th className="px-4 py-3 text-center">Completed</th>
                      <th className="px-4 py-3 text-left">Comments</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {usePipelinePressing
                  ? pipelineResult!.pressingList.rows.map((row, ri) => (
                      <tr key={ri} className="border-t border-gray-700/50">
                        {row.map((cell, ci) => {
                          const key = `${ri}-${ci}`;
                          if (typeof cell === 'boolean') {
                            return (
                              <td key={ci} className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 rounded accent-blue-600"
                                  checked={pipelineBoolState[key] ?? cell}
                                  onChange={(e) =>
                                    setPipelineBoolState((prev) => ({
                                      ...prev,
                                      [key]: e.target.checked,
                                    }))
                                  }
                                />
                              </td>
                            );
                          }
                          const header = pipelineResult!.pressingList.tableHeader[ci] ?? '';
                          const isComments = /comment/i.test(header);
                          if (isComments) {
                            return (
                              <td key={ci} className="px-4 py-3">
                                <input
                                  type="text"
                                  defaultValue={cell === null || cell === undefined ? '' : String(cell)}
                                  placeholder="Notes..."
                                  className="w-full bg-gray-700/50 border border-gray-600 rounded px-2 py-1 text-sm text-white placeholder:text-gray-500"
                                />
                              </td>
                            );
                          }
                          return (
                            <td key={ci} className="px-4 py-3 text-left">
                              {cell === null || cell === undefined ? '' : String(cell)}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  : pressingItems.map((item) => (
                      <tr key={item.sno} className="border-t border-gray-700/50">
                        <td className="px-4 py-3 text-gray-500">{item.sno}</td>
                        <td className="px-4 py-3 font-medium">{item.material}</td>
                        <td className="px-4 py-3 text-center">{item.plyType}</td>
                        <td className="px-4 py-3 text-center">{item.thickness}mm</td>
                        <td className="px-4 py-3 text-center font-semibold">{item.sheets}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded accent-blue-600"
                            checked={wallCompleted[item.sno] ?? false}
                            onChange={(e) =>
                              setWallCompleted((prev) => ({
                                ...prev,
                                [item.sno]: e.target.checked,
                              }))
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            placeholder="Notes..."
                            className="w-full bg-gray-700/50 border border-gray-600 rounded px-2 py-1 text-sm text-white placeholder:text-gray-500"
                          />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {usePipelinePressing && pipelineResult?.pressingList && 'footerNote' in pipelineResult.pressingList && pipelineResult.pressingList.footerNote ? (
            <div className="px-6 py-3 border-t border-gray-700/50 text-xs text-gray-500">
              {String(pipelineResult.pressingList.footerNote)}
            </div>
          ) : null}

          <div className="p-6 border-t border-gray-700 bg-gray-800/30">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">Total: {totalSheets} sheets</div>
              <div className="flex gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Operator</label>
                  <input
                    type="text"
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-32 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date</label>
                  <input
                    type="date"
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
