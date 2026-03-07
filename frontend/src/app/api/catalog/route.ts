/**
 * Server-side catalog API route.
 * Fetches cabinet and material catalog from Google Sheets using server env.
 * API key is not exposed to the client.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAllCatalogData,
  getSheetIds,
  type CatalogData,
} from '@/lib/visualiser/googleSheetsService';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cached: { data: CatalogData; at: number } | null = null;

export async function GET(request: NextRequest) {
  const apiKey =
    process.env.GOOGLE_SHEETS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY;

  if (!apiKey || apiKey.length < 10) {
    return NextResponse.json(
      { error: 'Catalog not configured. Set GOOGLE_SHEETS_API_KEY (or NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY) and sheet IDs.' },
      { status: 503 }
    );
  }

  const sheetIds = getSheetIds();
  if (!sheetIds.catalogue || !sheetIds.materialCatalog) {
    return NextResponse.json(
      { error: 'Catalog sheet IDs not configured. Set CATALOGUE_SHEET_ID and MATERIAL_CATALOG_SHEET_ID (or NEXT_PUBLIC_*).' },
      { status: 503 }
    );
  }

  const refresh = request.nextUrl.searchParams.get('refresh') === '1';
  if (!refresh && cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  try {
    const { data, validation } = await fetchAllCatalogData(apiKey, sheetIds);
    if (!data) {
      const message =
        validation.errors?.length > 0
          ? validation.errors.join(' ')
          : 'Failed to load catalog from Google Sheets. Check sheet sharing (anyone with link can view) and API key.';
      return NextResponse.json({ error: message, validation }, { status: 502 });
    }
    cached = { data, at: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    console.error('[API /api/catalog]', err);
    return NextResponse.json(
      { error: 'Unable to load catalog. Check sheet sharing and API key.' },
      { status: 500 }
    );
  }
}
