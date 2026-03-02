'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useDesignerStore } from '@/store/designerStore';
import { formatDesignData, generatePlankList } from '@/lib/visualiser';
import { ReportLayout } from '@/components/visualiser/ReportLayout';

export default function QAOutputPage() {
  const { walls, projectName, nestResults } = useDesignerStore();

  const qaItems = useMemo(() => {
    if (walls.length > 0) {
      const { data } = formatDesignData(walls);
      const { plankList } = generatePlankList(data);
      if (plankList.length > 0) {
        return plankList.map((plank, index) => ({
          id: index + 1,
          plankId: plank.plankId,
          name: plank.plankName,
          material: plank.material,
          dimensions: `${plank.width} × ${plank.height} × ${plank.thickness}`,
          eb: plank.edgeBinding,
        }));
      }
    }
    // Fallback: use nest results (cut pieces after nesting) when available
    if (nestResults && nestResults.length > 0) {
      return nestResults.map((plank, index) => ({
        id: index + 1,
        plankId: plank.id,
        name: plank.name,
        material: plank.material,
        dimensions: `${Math.round(plank.width)} × ${Math.round(plank.height)} × ${plank.thickness}`,
        eb: plank.ebValue ?? 0,
      }));
    }
    return [];
  }, [walls, nestResults]);

  return (
    <ReportLayout
      title="Output QA Sheet"
      subtitle="Cut pieces quality check"
      projectName={projectName}
      downloadLabel="Download / Print"
    >
      <div className="bg-orange-50/50 rounded-lg border border-orange-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-orange-200">
          <h2 className="font-semibold text-gray-900">Cut Pieces Quality Check</h2>
          <p className="text-sm text-gray-500 mt-1">
            Verify all cut planks after processing ({qaItems.length} items)
          </p>
        </div>

        <div className="overflow-x-auto max-h-[600px]">
          {qaItems.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-2">No cut pieces to show.</p>
              <p className="text-sm text-gray-500 mb-4">
                Create a design in the Designer, then run Generate to populate this list. If you already generated files, go to Generate and run the cutlist step so nest results are available.
              </p>
              <Link
                href="/visualiser/designer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium"
              >
                Open Designer
              </Link>
              <span className="mx-2" />
              <Link
                href="/visualiser/generate"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium"
              >
                Open Generate
              </Link>
            </div>
          ) : (
          <table className="w-full text-sm">
            <thead className="bg-orange-100/70 sticky top-0">
              <tr>
                <th className="px-3 py-3 text-left w-10 text-gray-900">#</th>
                <th className="px-3 py-3 text-left text-gray-900">Plank ID</th>
                <th className="px-3 py-3 text-left text-gray-900">Name</th>
                <th className="px-3 py-3 text-left text-gray-900">Material</th>
                <th className="px-3 py-3 text-center text-gray-900">Dimensions</th>
                <th className="px-3 py-3 text-center w-12 text-gray-900">EB</th>
                <th className="px-3 py-3 text-center w-16 text-gray-900">OK</th>
              </tr>
            </thead>
            <tbody>
              {qaItems.map((item) => (
                <tr key={item.id} className="border-t border-orange-100 hover:bg-orange-50/30">
                  <td className="px-3 py-2 text-gray-500">{item.id}</td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-900">{item.plankId}</td>
                  <td className="px-3 py-2 text-gray-900">{item.name}</td>
                  <td className="px-3 py-2 text-gray-600">{item.material}</td>
                  <td className="px-3 py-2 text-center font-mono text-xs text-gray-700">{item.dimensions}</td>
                  <td className="px-3 py-2 text-center text-orange-600">{item.eb}</td>
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" className="w-4 h-4 rounded print:hidden" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        <div className="p-6 border-t border-orange-200 bg-white print:border-t print:border-gray-200">
          <div className="grid md:grid-cols-3 gap-4 print:hidden">
            <div>
              <label className="block text-sm text-gray-500 mb-2">Checked By</label>
              <input type="text" className="w-full border border-gray-200 rounded px-3 py-2 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-2">Date</label>
              <input type="date" className="w-full border border-gray-200 rounded px-3 py-2 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-2">Remarks</label>
              <input type="text" className="w-full border border-gray-200 rounded px-3 py-2 text-gray-900" />
            </div>
          </div>
        </div>
      </div>
    </ReportLayout>
  );
}
