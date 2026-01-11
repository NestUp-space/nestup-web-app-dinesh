"use client";

import React, { useState } from "react";
import type { Invoice, InvoiceItem } from "@/types/visualiser";

const DEMO_INVOICE: Invoice = {
  customerName: "John Smith",
  projectId: "NEST-2026-001",
  date: new Date().toLocaleDateString(),
  items: [
    { description: "White MDF 18mm - 12 sheets", quantity: 12, unitPrice: 4500, totalPrice: 54000 },
    { description: "White MDF 8mm - 4 sheets", quantity: 4, unitPrice: 3200, totalPrice: 12800 },
    { description: "Oak Veneer 18mm - 8 sheets", quantity: 8, unitPrice: 8500, totalPrice: 68000 },
    { description: "Edge Banding - White (145.6m)", quantity: 146, unitPrice: 45, totalPrice: 6570 },
    { description: "Edge Banding - Oak (89.2m)", quantity: 90, unitPrice: 75, totalPrice: 6750 },
    { description: "Hardware Kit - Hinges", quantity: 24, unitPrice: 180, totalPrice: 4320 },
    { description: "Hardware Kit - Drawer Slides", quantity: 12, unitPrice: 450, totalPrice: 5400 },
    { description: "Manufacturing Labor", quantity: 1, unitPrice: 35000, totalPrice: 35000 },
    { description: "Installation", quantity: 1, unitPrice: 15000, totalPrice: 15000 },
  ],
  totalAmount: 207840,
};

export function InvoiceReport() {
  const [invoice, setInvoice] = useState<Invoice>(DEMO_INVOICE);
  const [showGST, setShowGST] = useState(true);

  const subtotal = invoice.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const gstAmount = showGST ? subtotal * 0.18 : 0;
  const grandTotal = subtotal + gstAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-100 print:bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 print:hidden">
        <h1 className="text-xl font-bold">🧾 Invoice Generator</h1>
        <p className="text-sm text-blue-100">Generate and print customer invoices</p>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        {/* Invoice Document */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden print:shadow-none">
          {/* Invoice Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-8 print:bg-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">INVOICE</h2>
                <p className="text-slate-300 mt-1">#{invoice.projectId}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Nestup
                </div>
                <p className="text-sm text-slate-400 mt-1">Cabinet Manufacturing</p>
              </div>
            </div>
          </div>

          {/* Customer & Invoice Info */}
          <div className="grid grid-cols-2 gap-8 p-8 border-b border-gray-200">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Bill To</h3>
              <p className="text-xl font-semibold text-gray-800">{invoice.customerName}</p>
              <p className="text-gray-600">Customer Address Line 1</p>
              <p className="text-gray-600">City, State - 123456</p>
            </div>
            <div className="text-right">
              <div className="mb-4">
                <span className="text-sm text-gray-500">Invoice Date</span>
                <p className="text-lg font-semibold">{invoice.date}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Due Date</span>
                <p className="text-lg font-semibold">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="p-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 text-sm font-semibold text-gray-600">Description</th>
                  <th className="text-center py-3 text-sm font-semibold text-gray-600">Qty</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-600">Unit Price</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-4 text-gray-800">{item.description}</td>
                    <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-4 text-right text-gray-600">₹{item.unitPrice.toLocaleString()}</td>
                    <td className="py-4 text-right font-medium text-gray-800">₹{item.totalPrice.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-8">
            <div className="w-80 ml-auto space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              {showGST && (
                <div className="flex justify-between text-gray-600">
                  <span>GST (18%)</span>
                  <span>₹{gstAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-3 border-t border-gray-300">
                <span>Total Due</span>
                <span className="text-blue-600">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Thank you for your business!</p>
            <p className="mt-1">Payment due within 30 days. Bank details provided separately.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium"
          >
            🖨️ Print Invoice
          </button>
          <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">
            📧 Email Invoice
          </button>
          <label className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border cursor-pointer">
            <input
              type="checkbox"
              checked={showGST}
              onChange={(e) => setShowGST(e.target.checked)}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-700">Include GST (18%)</span>
          </label>
        </div>
      </div>
    </div>
  );
}
