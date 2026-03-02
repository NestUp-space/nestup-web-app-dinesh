'use client';

import React, { useMemo } from 'react';
import { useDesignerStore } from '@/store/designerStore';
import { formatDesignData } from '@/lib/visualiser';
import { ReportLayout } from '@/components/visualiser/ReportLayout';

export default function QAInputPage() {
  const { walls, projectName } = useDesignerStore();

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
    <ReportLayout
      title="Input QA Sheet"
      subtitle="Material quality check"
      projectName={projectName}
      downloadLabel="Download / Print"
    >
      <div className="bg-orange-50/50 rounded-lg border border-orange-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-orange-200">
          <h2 className="font-semibold text-gray-900">Material Quality Check</h2>
          <p className="text-sm text-gray-500 mt-1">
            Verify all input materials before processing
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-orange-100/70">
              <tr>
                <th className="px-4 py-3 text-left w-12 text-gray-900">#</th>
                <th className="px-4 py-3 text-left text-gray-900">Material Description</th>
                <th className="px-4 py-3 text-center text-gray-900">Thickness</th>
                <th className="px-4 py-3 text-center text-gray-900">Qty</th>
                <th className="px-4 py-3 text-center text-gray-900">Verified</th>
                <th className="px-4 py-3 text-left text-gray-900">Comments</th>
              </tr>
            </thead>
            <tbody>
              {qaItems.map((item) => (
                <tr key={item.id} className="border-t border-orange-100 hover:bg-orange-50/30">
                  <td className="px-4 py-3 text-gray-500">{item.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.material}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{item.thickness}mm</td>
                  <td className="px-4 py-3 text-center text-orange-600 font-medium">{item.count}</td>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" className="w-5 h-5 rounded print:hidden" />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      placeholder="Add notes..."
                      className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm print:border-0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-orange-200 bg-white print:border-t print:border-gray-200">
          <div className="grid md:grid-cols-2 gap-6 print:hidden">
            <div>
              <label className="block text-sm text-gray-500 mb-2">Verified By</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded px-3 py-2 text-gray-900"
                placeholder="Name"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-2">Date</label>
              <input type="date" className="w-full border border-gray-200 rounded px-3 py-2 text-gray-900" />
            </div>
          </div>
        </div>
      </div>
    </ReportLayout>
  );
}
