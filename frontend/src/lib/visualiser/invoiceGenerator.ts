/**
 * Invoice Generator
 * EXACT PORT from Apps Script "Invoice.js"
 * 
 * Features:
 * - FFTL Invoice (Logistics): Transport, packing, loading, unloading, hamali, materials
 * - MW Invoice (Production): Based on SFT with flat rate
 * - PDF generation with jsPDF
 * - Material cost calculations
 */

import jsPDF from 'jspdf';
import { CustomerDetails } from '@/store/designerStore';
import { SFTCalculationResult } from './sftCalculation';
import { MaterialEstimate } from '@/types/visualiser';

// ============================================
// TYPES
// ============================================

export interface InvoiceConfig {
  transportCost?: number;
  hasTransport: boolean;
  hasLoading: boolean;
  hasUnloading: boolean;
  hasHamali: boolean;
  projectType: 'home_owner' | 'commercial';
}

interface MaterialCost {
  item: string;
  qty: number;
  rate: number;
  price: number;
}

export interface FFTLInvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  siteAddress: string;
  transportCost: number;
  packingCost: number;
  loadingCost: number;
  unloadingCost: number;
  hamaliCost: number;
  materialCosts: MaterialCost[];
  totalAmount: number;
}

export interface MWInvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  siteAddress: string;
  totalSFT: number;
  productionRate: number;
  productionAmount: number;
}

// ============================================
// CONSTANTS (From Apps Script)
// ============================================

const MATERIAL_RATES = {
  fevicol_d3_home: 236,
  fevicol_d3_commercial: 230,
  fevicol_probond: 472,
  heatx: 696.2,
  vb_fittings: 42,
  abro_tapes: 130,
  laminate_cutter: 30,
};

const LOADING_COST = 2500;
const UNLOADING_COST = 2500;
const HAMALI_PER_SFT = 10;
const MW_PRODUCTION_RATE = 220; // Per SFT

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate packing cost based on SFT tiers
 */
function calculatePackingCost(totalSFT: number): number {
  if (totalSFT > 400) return totalSFT * 15;
  if (totalSFT >= 300) return totalSFT * 17;
  if (totalSFT >= 200) return totalSFT * 18;
  return totalSFT * 20;
}

/**
 * Extract material quantities from Material Estimate
 * Uses fuzzy matching similar to Apps Script
 */
function extractMaterialQuantities(materialEstimate: MaterialEstimate): Record<string, number> {
  const materials: Record<string, number> = {
    fevicol_d3: 0,
    fevicol_probond: 0,
    heatx: 0,
    vb_fittings: 0,
    abro_tapes: 0,
    laminate_cutter: 0,
  };

  // Helper to clean and normalize strings for fuzzy matching
  const cleanStr = (s: string): string => s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // Match material names and extract quantities
  if (materialEstimate.hardware) {
    materialEstimate.hardware.forEach((hw) => {
      const desc = cleanStr(hw.description);
      
      if (desc.includes('fevicold3') || desc.includes('fevicoldd3')) {
        materials.fevicol_d3 += hw.quantity;
      } else if (desc.includes('fevicolprobond') || desc.includes('probond')) {
        materials.fevicol_probond += hw.quantity;
      } else if (desc.includes('heatx')) {
        materials.heatx += hw.quantity;
      } else if (desc.includes('vbfitting') || desc.includes('vbconnector')) {
        materials.vb_fittings += hw.quantity;
      } else if (desc.includes('abrotape') || desc.includes('abro')) {
        materials.abro_tapes += hw.quantity;
      } else if (desc.includes('laminatecutter') || desc.includes('cutter')) {
        materials.laminate_cutter += hw.quantity;
      }
    });
  }

  return materials;
}

/**
 * Generate unique invoice number
 */
function generateInvoiceNumber(prefix: string): string {
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${random}`;
}

/**
 * Format date as DD/MM/YYYY
 */
function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// ============================================
// INVOICE DATA CALCULATION
// ============================================

/**
 * Calculate FFTL Invoice Data
 */
export function calculateFFTLInvoice(
  customerDetails: CustomerDetails,
  sftResult: SFTCalculationResult,
  materialEstimate: MaterialEstimate,
  config: InvoiceConfig
): FFTLInvoiceData {
  const totalSFT = Math.round(sftResult.totalSquareFeet);
  
  // Calculate logistics costs
  const transportCost = config.hasTransport ? (config.transportCost || 0) : 0;
  const packingCost = calculatePackingCost(totalSFT);
  const loadingCost = config.hasLoading ? LOADING_COST : 0;
  const unloadingCost = config.hasUnloading ? UNLOADING_COST : 0;
  const hamaliCost = config.hasHamali ? totalSFT * HAMALI_PER_SFT : 0;

  // Calculate material costs
  const materials = extractMaterialQuantities(materialEstimate);
  const d3Rate = config.projectType === 'home_owner' 
    ? MATERIAL_RATES.fevicol_d3_home 
    : MATERIAL_RATES.fevicol_d3_commercial;

  const materialCosts: MaterialCost[] = [];

  if (materials.fevicol_d3 > 0) {
    materialCosts.push({
      item: 'Fevicol - D3',
      qty: materials.fevicol_d3,
      rate: d3Rate,
      price: materials.fevicol_d3 * d3Rate,
    });
  }

  if (materials.fevicol_probond > 0) {
    materialCosts.push({
      item: 'Fevicol - Probond',
      qty: materials.fevicol_probond,
      rate: MATERIAL_RATES.fevicol_probond,
      price: materials.fevicol_probond * MATERIAL_RATES.fevicol_probond,
    });
  }

  if (materials.heatx > 0) {
    materialCosts.push({
      item: 'HeatX',
      qty: materials.heatx,
      rate: MATERIAL_RATES.heatx,
      price: materials.heatx * MATERIAL_RATES.heatx,
    });
  }

  if (materials.vb_fittings > 0) {
    materialCosts.push({
      item: 'VB Fittings',
      qty: materials.vb_fittings,
      rate: MATERIAL_RATES.vb_fittings,
      price: materials.vb_fittings * MATERIAL_RATES.vb_fittings,
    });
  }

  if (materials.abro_tapes > 0) {
    materialCosts.push({
      item: 'Abro Tapes',
      qty: materials.abro_tapes,
      rate: MATERIAL_RATES.abro_tapes,
      price: materials.abro_tapes * MATERIAL_RATES.abro_tapes,
    });
  }

  if (materials.laminate_cutter > 0) {
    materialCosts.push({
      item: 'Laminate Cutter',
      qty: materials.laminate_cutter,
      rate: MATERIAL_RATES.laminate_cutter,
      price: materials.laminate_cutter * MATERIAL_RATES.laminate_cutter,
    });
  }

  // Calculate totals
  const totalMaterialCost = materialCosts.reduce((sum, m) => sum + m.price, 0);
  const totalAmount = transportCost + packingCost + loadingCost + unloadingCost + hamaliCost + totalMaterialCost;

  return {
    invoiceNumber: generateInvoiceNumber('FFTL'),
    date: formatDate(new Date()),
    customerName: customerDetails.customerName || 'Unknown',
    siteAddress: customerDetails.address || 'N/A',
    transportCost,
    packingCost,
    loadingCost,
    unloadingCost,
    hamaliCost,
    materialCosts,
    totalAmount,
  };
}

/**
 * Calculate MW Invoice Data
 */
export function calculateMWInvoice(
  customerDetails: CustomerDetails,
  sftResult: SFTCalculationResult
): MWInvoiceData {
  const totalSFT = Math.round(sftResult.totalSquareFeet);
  const productionAmount = totalSFT * MW_PRODUCTION_RATE;

  return {
    invoiceNumber: generateInvoiceNumber('MW'),
    date: formatDate(new Date()),
    customerName: customerDetails.customerName || 'Unknown',
    siteAddress: customerDetails.address || 'N/A',
    totalSFT,
    productionRate: MW_PRODUCTION_RATE,
    productionAmount,
  };
}

// ============================================
// PDF GENERATION
// ============================================

/**
 * Generate FFTL Invoice PDF
 */
export function generateFFTLPDF(data: FFTLInvoiceData, projectName: string): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 15;
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FFTL PROFORMA INVOICE', pageWidth / 2, y, { align: 'center' });
  y += 12;

  // Invoice details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No: ${data.invoiceNumber}`, margin, y);
  doc.text(`Date: ${data.date}`, pageWidth - margin, y, { align: 'right' });
  y += 10;

  // Customer details
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Customer: ${data.customerName}`, margin + 5, y);
  y += 5;
  doc.text(`Site Address: ${data.siteAddress}`, margin + 5, y);
  y += 15;

  // Logistics Section
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 3, pageWidth - 2 * margin, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('LOGISTICS', margin + 3, y + 2);
  y += 12;

  const drawRow = (label: string, value: number) => {
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin + 5, y);
    doc.text(`₹ ${value.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });
    y += 6;
  };

  if (data.transportCost > 0) drawRow('Transport', data.transportCost);
  drawRow('Packing', data.packingCost);
  if (data.loadingCost > 0) drawRow('Loading Vehicle', data.loadingCost);
  if (data.unloadingCost > 0) drawRow('Unloading Vehicle', data.unloadingCost);
  if (data.hamaliCost > 0) drawRow('Lifting/Hamali', data.hamaliCost);

  y += 5;

  // Materials Section
  if (data.materialCosts.length > 0) {
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 3, pageWidth - 2 * margin, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('MATERIALS', margin + 3, y + 2);
    y += 12;

    data.materialCosts.forEach((mat) => {
      doc.setFont('helvetica', 'normal');
      doc.text(`${mat.item} (Qty: ${mat.qty})`, margin + 5, y);
      doc.text(`₹ ${mat.price.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });
      y += 6;
    });
    y += 5;
  }

  // Total
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL AMOUNT:', margin + 5, y);
  doc.text(`₹ ${data.totalAmount.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });

  // Footer
  y += 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a computer-generated proforma invoice.', pageWidth / 2, y, { align: 'center' });

  // Save
  doc.save(`${projectName}_FFTL_Invoice.pdf`);
}

/**
 * Generate MW Invoice PDF
 */
export function generateMWPDF(data: MWInvoiceData, projectName: string): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 15;
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MW PROFORMA INVOICE', pageWidth / 2, y, { align: 'center' });
  y += 12;

  // Invoice details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No: ${data.invoiceNumber}`, margin, y);
  doc.text(`Date: ${data.date}`, pageWidth - margin, y, { align: 'right' });
  y += 10;

  // Customer details
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Customer: ${data.customerName}`, margin + 5, y);
  y += 5;
  doc.text(`Site Address: ${data.siteAddress}`, margin + 5, y);
  y += 15;

  // Production Section
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 3, pageWidth - 2 * margin, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('PRODUCTION DETAILS', margin + 3, y + 2);
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.text('Description', margin + 5, y);
  doc.text('Value', pageWidth - margin - 5, y, { align: 'right' });
  y += 8;

  doc.text(`Total Square Feet (SFT)`, margin + 5, y);
  doc.text(`${data.totalSFT} SFT`, pageWidth - margin - 5, y, { align: 'right' });
  y += 6;

  doc.text(`Production Rate`, margin + 5, y);
  doc.text(`₹ ${data.productionRate} / SFT`, pageWidth - margin - 5, y, { align: 'right' });
  y += 10;

  // Total
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PRODUCTION AMOUNT:', margin + 5, y);
  doc.text(`₹ ${data.productionAmount.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });

  // Footer
  y += 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a computer-generated proforma invoice.', pageWidth / 2, y, { align: 'center' });

  // Save
  doc.save(`${projectName}_MW_Invoice.pdf`);
}

// ============================================
// MAIN EXPORT FUNCTION
// ============================================

/**
 * Generate both FFTL and MW invoices
 */
export function generateInvoices(
  customerDetails: CustomerDetails,
  sftResult: SFTCalculationResult,
  materialEstimate: MaterialEstimate,
  config: InvoiceConfig,
  projectName: string = 'Project'
): { fftl: FFTLInvoiceData; mw: MWInvoiceData } {
  const fftl = calculateFFTLInvoice(customerDetails, sftResult, materialEstimate, config);
  const mw = calculateMWInvoice(customerDetails, sftResult);

  // Generate PDFs
  generateFFTLPDF(fftl, projectName);
  generateMWPDF(mw, projectName);

  return { fftl, mw };
}

export default generateInvoices;
