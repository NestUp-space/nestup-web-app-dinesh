'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDesignerStore } from '@/stores/designerStore';
import { formatDesignData } from '@/lib/visualiser';
import type { PipelineResult } from '@/lib/visualiser/appscript-port';

function hasInputQASections(result: PipelineResult | null | undefined): boolean {
  return (result?.inputQA?.sections?.length ?? 0) > 0;
}

function formatPipelineCell(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') {
    return (
      <input
        type="checkbox"
        className="w-5 h-5 rounded pointer-events-none opacity-80"
        checked={value}
        readOnly
        tabIndex={-1}
        aria-label={value ? 'Yes' : 'No'}
      />
    );
  }
  return String(value);
}

export default function QAInputPage() {
  const projectName = useDesignerStore((s) => s.projectName);
  const walls = useDesignerStore((s) => s.walls);
  const pipelineResult = useDesignerStore((state) => state.pipelineResult);

  const pipelineSections = pipelineResult?.inputQA?.sections;
  const usePipelineQA = hasInputQASections(pipelineResult);

  const qaItems = useMemo(() => {
    if (walls.length === 0) return [];

    const { data } = formatDesignData(walls);

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
    }));
  }, [walls]);

  const pipelineFingerprint = useMemo(() => {
    if (!pipelineSections?.length) return '';
    return pipelineSections
      .map((s) => `${s.title}:${s.rows.length}:${s.tableHeaders.join(',')}`)
      .join('|');
  }, [pipelineSections]);

  const [pipelineVerified, setPipelineVerified] = useState<Record<string, boolean>>({});
  const [pipelineComments, setPipelineComments] = useState<Record<string, string>>({});

  useEffect(() => {
    setPipelineVerified({});
    setPipelineComments({});
  }, [pipelineFingerprint]);

  const wallQaFingerprint = useMemo(
    () => qaItems.map((i) => `${i.id}-${i.material}-${i.thickness}-${i.count}`).join('|'),
    [qaItems],
  );

  const [wallVerified, setWallVerified] = useState<Record<number, boolean>>({});
  const [wallComments, setWallComments] = useState<Record<number, string>>({});

  useEffect(() => {
    setWallVerified({});
    setWallComments({});
  }, [wallQaFingerprint]);

  const setPipelineRowVerified = useCallback((key: string, checked: boolean) => {
    setPipelineVerified((prev) => ({ ...prev, [key]: checked }));
  }, []);

  const setPipelineRowComment = useCallback((key: string, text: string) => {
    setPipelineComments((prev) => ({ ...prev, [key]: text }));
  }, []);

  const setWallRowVerified = useCallback((id: number, checked: boolean) => {
    setWallVerified((prev) => ({ ...prev, [id]: checked }));
  }, []);

  const setWallRowComment = useCallback((id: number, text: string) => {
    setWallComments((prev) => ({ ...prev, [id]: text }));
  }, []);

  const pipelineRowKey = (si: number, ri: number) => `${si}-${ri}`;

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

          {usePipelineQA && pipelineSections ? (
            <div className="divide-y divide-gray-700/50">
              {pipelineSections.map((sec, si) => (
                <div key={`${sec.title}-${si}`} className="px-6 py-6">
                  <h3 className="text-sm font-semibold text-gray-200 mb-3">{sec.title}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left w-12">#</th>
                          {sec.tableHeaders.map((h, hi) => (
                            <th key={hi} className="px-4 py-3 text-left">
                              {h}
                            </th>
                          ))}
                          <th className="px-4 py-3 text-center w-28">Verified</th>
                          <th className="px-4 py-3 text-left min-w-[10rem]">Comments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sec.rows.map((row, ri) => {
                          const rk = pipelineRowKey(si, ri);
                          return (
                            <tr key={rk} className="border-t border-gray-700/50">
                              <td className="px-4 py-3 text-gray-500">{ri + 1}</td>
                              {sec.tableHeaders.map((_, hi) => (
                                <td key={hi} className="px-4 py-3 align-middle">
                                  {formatPipelineCell(row[hi])}
                                </td>
                              ))}
                              <td className="px-4 py-3 text-center align-middle">
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 rounded cursor-pointer accent-blue-500"
                                  checked={!!pipelineVerified[rk]}
                                  onChange={(e) => setPipelineRowVerified(rk, e.target.checked)}
                                  aria-label={`Verified row ${ri + 1} in ${sec.title}`}
                                />
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <input
                                  type="text"
                                  placeholder="Add notes..."
                                  value={pipelineComments[rk] ?? ''}
                                  onChange={(e) => setPipelineRowComment(rk, e.target.value)}
                                  className="w-full bg-gray-700/50 border border-gray-600 rounded px-2 py-1 text-sm"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded cursor-pointer accent-blue-500"
                          checked={!!wallVerified[item.id]}
                          onChange={(e) => setWallRowVerified(item.id, e.target.checked)}
                          aria-label={`Verified ${item.material}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Add notes..."
                          value={wallComments[item.id] ?? ''}
                          onChange={(e) => setWallRowComment(item.id, e.target.value)}
                          className="w-full bg-gray-700/50 border border-gray-600 rounded px-2 py-1 text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
