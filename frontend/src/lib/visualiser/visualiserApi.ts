/**
 * Authenticated calls to Express `/api/visualiser/*`.
 * Falls back to local `lib/visualiser` when there is no auth token (see callers).
 */

import { apiClient } from '@/lib/api/client';
import type { PipelineResult } from '@/lib/visualiser/appscript-port/pipeline';
import type { CustomerDetails } from '@/stores/designerStore';
import type { EBSettings } from '@/lib/visualiser/appscript-port/formattedData';
import type { CatalogModel, PlywoodOption, LaminateOption } from '@/types/visualiser';
import type { CatalogBoxWithPlanks } from '@/lib/visualiser/catalogParser';

export function isVisualiserBackendAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
}

export interface VisualiserCatalogPayload {
  models: CatalogModel[];
  plywoodOptions: PlywoodOption[];
  laminateOptions: LaminateOption[];
  catalogBoxesWithPlanks?: CatalogBoxWithPlanks[];
  source: 'google-sheets' | 'csv';
}

export async function fetchVisualiserCatalog(fresh = false): Promise<VisualiserCatalogPayload> {
  const q = fresh ? '?fresh=true' : '';
  const res = await apiClient.get<{
    success: boolean;
    data: VisualiserCatalogPayload;
  }>(`/visualiser/catalog${q}`);
  if (!res.success || !res.data) {
    throw new Error((res as { message?: string }).message || 'Catalog request failed');
  }
  return res.data;
}

export interface ImportApiResponse {
  success: boolean;
  data: {
    rawValues: unknown[][];
    headers: string[];
    rowCount: number;
    validationErrors: string[];
    preview: unknown[][];
  };
}

export async function postVisualiserImport(file: File): Promise<ImportApiResponse['data']> {
  const fd = new FormData();
  fd.append('rawData', file);
  const res = await apiClient.postFormData<ImportApiResponse>('/visualiser/import', fd);
  if (!res.success || !res.data) {
    throw new Error((res as { message?: string }).message || 'Import failed');
  }
  return res.data;
}

/** Omit empty strings so Zod `.email().optional()` is not fed `""`. */
export function customerDetailsForApi(c: CustomerDetails): CustomerDetails {
  const email =
    c.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim()) ? c.email.trim() : '';
  return {
    customerName: c.customerName,
    firmName: c.firmName || '',
    address: c.address || '',
    phone: c.phone || '',
    email,
    gst: c.gst || '',
    transportAmount: c.transportAmount ?? 0,
  };
}

/** Subset aligned with backend `generateSchema` (Zod). */
export interface GenerateApiCustomerDetails {
  customerName: string;
  firmName?: string;
  address?: string;
  phone?: string;
  email?: string;
  gst?: string;
  transportAmount?: number;
}

export interface GenerateApiBody {
  rawValues: unknown[][];
  ebSettings: EBSettings;
  customerDetails?: GenerateApiCustomerDetails;
  hardwareData?: (string | number)[][];
  sftData?: (string | number)[][] | null;
  nestingParams?: {
    algorithm: 'bfd' | 'ga' | 'sa' | 'pso' | 'tournament';
    populationSize?: number;
    generations?: number;
    mutationRate?: number;
    temperature?: number;
    coolingRate?: number;
    swarmSize?: number;
    iterations?: number;
  };
}

export async function postVisualiserGenerate(body: GenerateApiBody): Promise<PipelineResult> {
  const payload = { ...body };
  if (payload.customerDetails) {
    const c = customerDetailsForApi(payload.customerDetails as CustomerDetails);
    const slim: GenerateApiCustomerDetails = { customerName: c.customerName };
    if (c.firmName) slim.firmName = c.firmName;
    if (c.address) slim.address = c.address;
    if (c.phone) slim.phone = c.phone;
    if (c.email) slim.email = c.email;
    if (c.gst) slim.gst = c.gst;
    if (c.transportAmount != null) slim.transportAmount = c.transportAmount;
    payload.customerDetails = slim;
  }
  const res = await apiClient.post<{ success: boolean; data: PipelineResult }>(
    '/visualiser/generate',
    payload
  );
  if (!res.success || !res.data) {
    throw new Error((res as { message?: string }).message || 'Generation failed');
  }
  return res.data;
}
