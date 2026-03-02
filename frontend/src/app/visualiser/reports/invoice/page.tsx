'use client';

import React, { useMemo } from 'react';
import { useDesignerStore } from '@/store/designerStore';
import { calculateSFT } from '@/lib/visualiser';
import { ReportLayout } from '@/components/visualiser/ReportLayout';

export default function InvoicePage() {
  const { walls, projectName, customerDetails } = useDesignerStore();

  const { totalSFT, lineItems } = useMemo(() => {
    const sftResult = calculateSFT(walls);
    const total = Math.round(sftResult.totalSquareFeet);
    // Packing (Apps Script Invoice.js tiers)
    const packingRate = total > 400 ? 15 : total >= 300 ? 17 : total >= 200 ? 18 : 20;
    const packingCost = total * packingRate;
    const rows: { name: string; qty: number; rate: number; amount: number }[] = [
      { name: 'Packing', qty: total, rate: packingRate, amount: packingCost },
    ];
    if (customerDetails.transportAmount > 0) {
      rows.push({ name: 'Transport', qty: 1, rate: customerDetails.transportAmount, amount: customerDetails.transportAmount });
    }
    return { totalSFT: total, lineItems: rows };
  }, [walls, customerDetails.transportAmount]);

  return (
    <ReportLayout
      title="Invoice"
      subtitle="Project invoice"
      projectName={projectName}
      downloadLabel="Download / Print"
    >
      <div className="space-y-6">
        {/* Customer */}
        <div className="bg-orange-50/50 rounded-lg border border-orange-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Bill To</h2>
          <p className="font-medium text-gray-900">{customerDetails.customerName || '—'}</p>
          {customerDetails.firmName && <p className="text-gray-600">{customerDetails.firmName}</p>}
          {customerDetails.address && <p className="text-gray-600">{customerDetails.address}</p>}
          {customerDetails.phone && <p className="text-gray-600">{customerDetails.phone}</p>}
          {customerDetails.email && <p className="text-gray-600">{customerDetails.email}</p>}
        </div>

        {/* SFT Summary */}
        <div className="flex gap-6 items-center p-4 bg-white rounded-lg border border-orange-200">
          <span className="text-gray-600">Total Square Feet:</span>
          <span className="text-2xl font-bold text-orange-600">{totalSFT} SFT</span>
        </div>

        {/* Line items */}
        <div className="bg-orange-50/50 rounded-lg border border-orange-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-orange-200">
            <h2 className="font-semibold text-gray-900">Invoice Details</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-orange-100/70">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-900">Item</th>
                  <th className="px-4 py-3 text-right text-gray-900">Qty</th>
                  <th className="px-4 py-3 text-right text-gray-900">Rate</th>
                  <th className="px-4 py-3 text-right text-gray-900">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      Generate Material Estimate first for invoice line items.
                    </td>
                  </tr>
                ) : (
                  lineItems.map((item, i) => (
                    <tr key={i} className="border-t border-orange-100">
                      <td className="px-4 py-3 text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{item.qty}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{item.rate}</td>
                      <td className="px-4 py-3 text-right font-medium text-orange-600">{item.amount.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          This is a summary invoice. For full material and logistics breakdown, generate Material Estimate and use the same customer details.
        </p>
      </div>
    </ReportLayout>
  );
}
