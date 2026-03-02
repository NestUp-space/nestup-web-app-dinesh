'use client';

import React, { useMemo } from 'react';
import { useDesignerStore } from '@/store/designerStore';
import { formatDesignData, runNesting, generatePlankList } from '@/lib/visualiser';
import { ReportLayout } from '@/components/visualiser/ReportLayout';

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
    <ReportLayout
      title="Pressing List"
      subtitle="Laminate pressing schedule"
      projectName={projectName}
      downloadLabel="Download / Print"
    >
      <div className="bg-orange-50/50 rounded-lg border border-orange-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-orange-200">
          <h2 className="font-semibold text-gray-900">Laminate Pressing Schedule</h2>
          <p className="text-sm text-gray-500 mt-1">
            Track laminate pressing for each material batch
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-orange-100/70">
              <tr>
                <th className="px-4 py-3 text-left w-12 text-gray-900">S.No</th>
                <th className="px-4 py-3 text-left text-gray-900">Material</th>
                <th className="px-4 py-3 text-center text-gray-900">Ply Type</th>
                <th className="px-4 py-3 text-center text-gray-900">Thickness</th>
                <th className="px-4 py-3 text-center text-gray-900">Sheets</th>
                <th className="px-4 py-3 text-center text-gray-900">Completed</th>
                <th className="px-4 py-3 text-left text-gray-900">Comments</th>
              </tr>
            </thead>
            <tbody>
              {pressingItems.map((item) => (
                <tr key={item.sno} className="border-t border-orange-100 hover:bg-orange-50/30">
                  <td className="px-4 py-3 text-gray-500">{item.sno}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.material}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{item.plyType}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{item.thickness}mm</td>
                  <td className="px-4 py-3 text-center font-semibold text-orange-600">{item.sheets}</td>
                  <td className="px-4 py-3 text-center print:border print:border-gray-300">
                    <input type="checkbox" className="w-5 h-5 rounded print:hidden" />
                  </td>
                  <td className="px-4 py-3 print:border print:border-gray-300">
                    <input
                      type="text"
                      placeholder="Notes..."
                      className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm print:border-0 print:p-0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-orange-200 bg-white print:border-t print:border-gray-200">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="text-sm text-gray-600 font-medium">
              Total: {pressingItems.reduce((sum, item) => sum + item.sheets, 0)} sheets
            </div>
            <div className="flex gap-4 print:hidden">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Operator</label>
                <input type="text" className="border border-gray-200 rounded px-2 py-1 text-sm w-32" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date</label>
                <input type="date" className="border border-gray-200 rounded px-2 py-1 text-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ReportLayout>
  );
}
