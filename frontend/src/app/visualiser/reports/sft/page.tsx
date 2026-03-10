'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useDesignerStore, useDesignSummary } from '@/stores/designerStore';

export default function SFTResultsPage() {
  const summary = useDesignSummary();
  const { walls, projectName } = useDesignerStore();

  // Calculate SFT for each box
  const sftResults = useMemo(() => {
    if (walls.length === 0) return [];

    const results: {
      sno: number;
      boxModel: string;
      boxType: string;
      roomName: string;
      lengthMM: number;
      widthMM: number;
      heightMM: number;
      squareFeet: number;
    }[] = [];

    let sno = 1;
    walls.forEach((wall) => {
      wall.boxes.forEach((box) => {
        // Calculate SFT based on front face area
        const lengthMM = box.dimensions.lenX;
        const heightMM = box.dimensions.lenZ;
        
        // Convert mm² to sq ft (1 sq ft = 92903.04 mm²)
        const areaMM2 = lengthMM * heightMM;
        const squareFeet = areaMM2 / 92903.04;

        results.push({
          sno: sno++,
          boxModel: box.boxModel || box.entityName,
          boxType: box.boxType || 'Custom',
          roomName: box.roomName || wall.roomName,
          lengthMM,
          widthMM: box.dimensions.lenY,
          heightMM,
          squareFeet: Math.round(squareFeet * 100) / 100,
        });
      });
    });

    return results;
  }, [walls]);

  const totalSFT = sftResults.reduce((sum, item) => sum + item.squareFeet, 0);

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
                <h1 className="text-xl font-bold">SFT Calculation</h1>
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
        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <p className="text-xs uppercase text-orange-400/80">Total SFT</p>
            <p className="text-3xl font-bold text-orange-400">{totalSFT.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">Square Feet</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-xs uppercase text-blue-400/80">Total Boxes</p>
            <p className="text-3xl font-bold text-blue-400">{sftResults.length}</p>
            <p className="text-xs text-gray-400 mt-1">Cabinet units</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-xs uppercase text-green-400/80">Avg SFT/Box</p>
            <p className="text-3xl font-bold text-green-400">
              {sftResults.length > 0 ? (totalSFT / sftResults.length).toFixed(2) : '0'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Square Feet</p>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="font-semibold">Box-wise SFT Breakdown</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left w-12">S.No</th>
                  <th className="px-4 py-3 text-left">Box Model</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Room</th>
                  <th className="px-4 py-3 text-right">L (mm)</th>
                  <th className="px-4 py-3 text-right">W (mm)</th>
                  <th className="px-4 py-3 text-right">H (mm)</th>
                  <th className="px-4 py-3 text-right">SFT</th>
                </tr>
              </thead>
              <tbody>
                {sftResults.map((item) => (
                  <tr key={item.sno} className="border-t border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-4 py-2 text-gray-500">{item.sno}</td>
                    <td className="px-4 py-2 font-medium">{item.boxModel}</td>
                    <td className="px-4 py-2 text-gray-400">{item.boxType}</td>
                    <td className="px-4 py-2 text-gray-400">{item.roomName}</td>
                    <td className="px-4 py-2 text-right">{item.lengthMM}</td>
                    <td className="px-4 py-2 text-right">{item.widthMM}</td>
                    <td className="px-4 py-2 text-right">{item.heightMM}</td>
                    <td className="px-4 py-2 text-right font-semibold text-orange-400">
                      {item.squareFeet.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-700/30">
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-right font-semibold">
                    Total:
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-orange-400 text-lg">
                    {totalSFT.toFixed(2)} SFT
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Calculation Note */}
        <div className="mt-6 bg-gray-800/30 rounded-lg border border-gray-700/50 p-4">
          <h3 className="font-semibold mb-2 text-sm">Calculation Method</h3>
          <p className="text-xs text-gray-400">
            SFT is calculated based on the front face area of each box (Length × Height).
            1 Square Foot = 92,903.04 mm²
          </p>
        </div>
      </main>
    </div>
  );
}
