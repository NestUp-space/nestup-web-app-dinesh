'use client';

/**
 * useCatalogLoader
 * Loads catalog data from GET /api/visualiser/catalog and stores it in designerStore.
 *
 * TODO (Phase 5 / Phase 3a): Extract logic from frontend/src/app/visualiser/designer/page.tsx:
 *   - On mount: call GET /api/visualiser/catalog
 *   - Store result via designerStore.setCatalogModels / setCatalogBoxesWithPlanks etc.
 *   - Expose: { isLoading, catalogSource, lastRefresh, refresh }
 *   - Manage the Google Sheets auto-refresh interval (currently inline setInterval in designer/page.tsx)
 *
 * Source: app/visualiser/designer/page.tsx — the loadCatalog callback + initial load + refresh effect
 */

// Placeholder — implementation extracted from app/visualiser/designer/page.tsx in Phase 5
export function useCatalogLoader() {
  // TODO: implement
  return {
    isLoading: false as boolean,
    catalogSource: null as string | null,
    lastRefresh: null as Date | null,
    refresh: () => {},
  };
}
