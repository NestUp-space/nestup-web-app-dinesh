'use client';

import React, { useMemo } from 'react';
import { useDesignerStore } from '@/store/designerStore';
import { calculateSFT } from '@/lib/visualiser';
import { ReportLayout } from '@/components/visualiser/ReportLayout';

/** Hardware list same as Apps Script hardware.js */
const HARDWARE_LIST = [
  'Hinges Soft Close- 0 Crank',
  'Hinges Soft Close- 16 Crank',
  'Hinges Soft Close- 180 Crank',
  '12 inches / 300mm - Channel',
  '14 inches / 350mm - Channel',
  '16 inches / 400mm - Channel',
  '18 inches / 450mm - Channel',
  '20 inches / 500mm - Channel',
  '22 inches / 550 mm - Channel',
  '*Fevicol - Probond',
  '*Fevicol - D3',
  '*HeatX',
  'VB Fittings',
  '*Abro Tapes',
  '*Laminate cutter',
  'Tandem Baskets',
  'Tandem Baskets-4"',
  'Tandem Baskets-6"',
  'Tandem Baskets-8"',
  '22 inches / 550mm - Tandem Channel',
  'Bottle Pullout 21x20x8 inches',
  'Bottle Pullout 21x20x10 inches',
  'Bottle Pullout 20 inches Channel',
  'Sliding Channel 2 Door Fitting',
  'Removable Shelf Buttons',
  'Magic Corner',
  'Oval Rod',
  'Oval Bracket',
  'Draw Locks',
  'Cupboard Locks',
  'L Tower Bolt',
  'Gola Profile - (L)',
  'Gola Profile - (C)',
  'G Profile',
  'PVC Gitty (38/6)',
  'Hydraulics',
  'PVC Legs',
  'SS Legs',
  'Single Screw L Clamps - EBCO',
  'PTA Screws 3 inches',
  'PTA Screws (4mm x 16mm)',
  'PTA Screws (4mm x 20mm)',
  'PTA Screws (4mm x 30mm)',
  'PTA Screws (4mm x 45mm)',
];

function scaleQty(sft: number, sftMin: number, sftMax: number, qtyMin: number, qtyMax: number): number {
  if (sft <= sftMin) return qtyMin;
  if (sft >= sftMax) return qtyMax;
  const ratio = (sft - sftMin) / (sftMax - sftMin);
  return Math.round(qtyMin + ratio * (qtyMax - qtyMin));
}

/** Same concept as Apps Script getStandardQty: quantity from SFT/formatted data. Simplified for web (no Formatted_Plank_Data). */
function getQuantity(item: string, sft: number): string {
  if (item === 'PVC Gitty (38/6)') {
    if (sft <= 400) return '1 Boxes';
    if (sft <= 1200) return '2 Boxes';
    return '3 Boxes';
  }
  if (item === 'PTA Screws 3 inches') {
    if (sft <= 250) return `${scaleQty(sft, 150, 250, 30, 50)} pieces`;
    if (sft <= 500) return `${scaleQty(sft, 250, 500, 50, 100)} pieces`;
    if (sft <= 750) return `${scaleQty(sft, 500, 750, 150, 250)} pieces`;
    if (sft <= 1200) return `${scaleQty(sft, 750, 1200, 250, 350)} pieces`;
    return '250 pieces';
  }
  if (item === 'PTA Screws (4mm x 16mm)') {
    if (sft <= 250) return `${scaleQty(sft, 150, 250, 250, 350)} Boxes`;
    if (sft <= 500) return `${scaleQty(sft, 250, 500, 350, 500)} Boxes`;
    if (sft <= 750) return `${scaleQty(sft, 500, 750, 500, 750)} Boxes`;
    if (sft <= 1200) return '1000 Boxes';
    return '1500 Boxes';
  }
  if (item === 'PTA Screws (4mm x 20mm)') {
    if (sft <= 250) return `${scaleQty(sft, 150, 250, 150, 250)} Boxes`;
    if (sft <= 500) return `${scaleQty(sft, 250, 500, 250, 500)} Boxes`;
    if (sft <= 750) return `${scaleQty(sft, 500, 750, 500, 750)} Boxes`;
    if (sft <= 1200) return '1000 Boxes';
    return '1500 Boxes';
  }
  if (item === 'PTA Screws (4mm x 30mm)') {
    if (sft <= 250) return `${scaleQty(sft, 150, 250, 250, 500)} Boxes`;
    if (sft <= 500) return `${scaleQty(sft, 250, 500, 500, 750)} Boxes`;
    if (sft <= 750) return `${scaleQty(sft, 500, 750, 750, 1000)} Boxes`;
    if (sft <= 1200) return '1300 Boxes';
    return '1500 Boxes';
  }
  if (item === 'PTA Screws (4mm x 45mm)') {
    if (sft <= 250) return `${scaleQty(sft, 150, 250, 250, 500)} Boxes`;
    if (sft <= 500) return `${scaleQty(sft, 250, 500, 500, 750)} Boxes`;
    if (sft <= 750) return `${scaleQty(sft, 500, 750, 750, 1000)} Boxes`;
    if (sft <= 1200) return '1300 Boxes';
    return '1500 Boxes';
  }
  return '—';
}

export default function HardwarePage() {
  const { walls, projectName } = useDesignerStore();

  const { sft, rows } = useMemo(() => {
    const result = calculateSFT(walls);
    const totalSft = Math.round(result.totalSquareFeet);
    const rows = HARDWARE_LIST.map((desc) => ({
      description: desc,
      quantity: getQuantity(desc, totalSft),
    }));
    return { sft: totalSft, rows };
  }, [walls]);

  return (
    <ReportLayout
      title="Hardware"
      subtitle="Hardware list (same concept as Apps Script)"
      projectName={projectName}
      downloadLabel="Download / Print"
    >
      <div className="space-y-6">
        <div className="flex gap-6 items-center p-4 bg-white rounded-lg border border-orange-200">
          <span className="text-gray-600">Total SFT:</span>
          <span className="text-xl font-bold text-orange-600">{sft} SFT</span>
        </div>
        <div className="bg-orange-50/50 rounded-lg border border-orange-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-orange-100/70">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-900 font-semibold">Description</th>
                  <th className="px-4 py-3 text-left text-gray-900 font-semibold">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-t border-orange-100">
                    <td className="px-4 py-2 text-gray-900">{row.description}</td>
                    <td className="px-4 py-2 text-gray-700">{row.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Quantities for selected items are derived from total SFT (same logic as Apps Script). Hinges/VB counts require formatted plank data and may show — here.
        </p>
      </div>
    </ReportLayout>
  );
}
