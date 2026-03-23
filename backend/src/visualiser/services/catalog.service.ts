/**
 * Catalog Service — fetches designer catalog (models, plywood, laminates, box templates).
 */

import { fetchAllCatalogData, getSheetIds, getApiKey } from '../catalog/googleSheetsService';
import type { CatalogData } from '../types/visualiser.types';

interface CacheEntry {
  data: CatalogData;
  fetchedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

export class CatalogService {
  static async getCatalog(fresh = false): Promise<CatalogData> {
    const cacheKey = 'default';

    if (!fresh) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.data;
      }
    }

    const data = await CatalogService.fetchFromSource();
    cache.set(cacheKey, { data, fetchedAt: Date.now() });
    return data;
  }

  private static async fetchFromSource(): Promise<CatalogData> {
    const apiKey =
      process.env.GOOGLE_SHEETS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY ||
      getApiKey();

    if (!apiKey || apiKey.length < 10) {
      throw new Error(
        'Catalog not configured. Set GOOGLE_SHEETS_API_KEY (or NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY) and sheet IDs.'
      );
    }

    const sheetIds = getSheetIds();
    if (!sheetIds.catalogue || !sheetIds.materialCatalog) {
      throw new Error(
        'Catalog sheet IDs missing. Set CATALOGUE_SHEET_ID and MATERIAL_CATALOG_SHEET_ID (or NEXT_PUBLIC_*).'
      );
    }

    const { data, validation } = await fetchAllCatalogData(apiKey, sheetIds);

    if (!validation.valid) {
      const msg =
        validation.errors?.length > 0
          ? validation.errors.join(' ')
          : 'Catalog validation failed.';
      throw new Error(msg);
    }

    if (!data) {
      throw new Error(
        'Unable to load catalog from Google Sheets. Check sheet sharing (anyone with link can view) and API key.'
      );
    }

    return {
      models: data.models,
      plywoodOptions: data.plywoodOptions,
      laminateOptions: data.laminateOptions,
      catalogBoxesWithPlanks: data.catalogBoxesWithPlanks,
      source: 'google-sheets',
    };
  }
}
