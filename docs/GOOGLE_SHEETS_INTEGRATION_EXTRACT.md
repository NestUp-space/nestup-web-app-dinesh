# Google Sheets Integration – Extract for Reuse

This document describes how Google Sheets is used as a backend/database in **nestup-web-app** and lists files and patterns to reuse when integrating the same concept into another app.

**Note:** The repo `https://github.com/NestupSpace/Nestup_Prasuk` returned 404; this extract is from the current **nestup-web-app** codebase.

---

## 1. How Google Sheets is used (API, auth, library)

### 1.1 Frontend (read-only catalog data)

| Aspect | Details |
|--------|--------|
| **API** | Google Sheets API v4 (REST) |
| **Auth** | **API Key only** – no OAuth. Sheets must be **“Anyone with the link can view”**. |
| **Library** | None – plain `fetch()` to `https://sheets.googleapis.com/v4/spreadsheets/...`. |
| **Where** | All calls are from the **frontend** (Next.js). No backend proxy for Sheets. |

Pattern: base URL + spreadsheet ID + range + `?key=<API_KEY>`:

```text
GET https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}?key={apiKey}
GET https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values:batchGet?ranges=...&key={apiKey}
```

### 1.2 Backend (Google APIs)

- **Sheets:** Backend does **not** call Google Sheets API.
- **Calendar:** Backend uses `googleapis` (service account) for Google Calendar only.
- **Apps Script:** Runs **inside** Google Sheets/Drive (SpreadsheetApp, DriveApp) – not in this Node app.

---

## 2. Where sheet data is fetched and how it’s structured

### 2.1 Entry points

- **Load on app init:** Designer page loads catalog via `loadCatalogFromSampleData()` (Google Sheets first, then CSV fallback).
- **Refresh:** `refreshCatalogFromGoogleSheets()` for manual/periodic refresh; designer also runs a 5‑minute auto-refresh when Sheets is configured.

### 2.2 Data flow

```text
Designer page (page.tsx)
  → getCatalogLoader() → catalogParser.loadCatalogFromSampleData()
    → googleSheetsService.fetchAllCatalogData(apiKey)
      → fetchSheetData() per range (catalogue, plywood, laminate, edgeband, hardware)
    → parseCatalogueData(), parsePlywoodLibrary(), parseLaminateLibrary()
  → Store: setCatalogModels, setCatalogBoxesWithPlanks, setPlywoodLibrary, setLaminateLibrary
```

### 2.3 Sheet layout and entities

- **Central Catalogue** (one sheet, e.g. `Sheet1!A:AZ`): rows are **entities** with a **level** column:
  - **Level 0/1** = **box** (cabinet unit): entity_name, level, material, room_name, unit_location, box_model, box_type, lenX/Y/Z, box_width/depth/height, skirting, thicknesses, etc.
  - **Level 2** = **plank** (component of the previous box): entity_name, level, material, lenX/Y/Z, x/y/z, etc.
- **Material catalog** (multi-tab spreadsheet):
  - **Plywood Library**: sno, brand, gradeType, material, thickness, price, remarks.
  - **Laminate Library**: sno, brand, code, colour, thickness, photoUrl (Drive URL), price, comments.
  - **Edgeband Library** / **Hardware Library**: fetched but not yet parsed into domain models.

Parsing is **header-based** (case-insensitive, normalize spaces/underscores) so column order can vary.

### 2.4 Structures (boxes, entities)

- **CatalogModel:** one row per box (level 0/1): id, entityName, level, boxModel, boxType, material, roomName, unitLocation, dimensions, thicknesses, etc.
- **CatalogBoxWithPlanks:** box + `planks[]` (level 2 rows under that box).
- **PlywoodOption / LaminateOption:** from Plywood/Laminate Library sheets.

Defined in `frontend/src/types/visualiser/index.ts` and used by `googleSheetsService` and `catalogParser`.

---

## 3. Env vars, config, and API routes

### 3.1 Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY` | Frontend (.env.local) | API key for Sheets API (read-only). Must be set for live Sheets; optional for CSV fallback. |

Optional overrides (commented in `.env.local.example`):

- `NEXT_PUBLIC_CATALOGUE_SHEET_ID`
- `NEXT_PUBLIC_MATERIAL_CATALOG_SHEET_ID`

Currently the app uses **hardcoded** sheet IDs in code; env overrides are prepared but not wired in the service.

### 3.2 Config in code

- **Sheet IDs:** `frontend/src/lib/visualiser/googleSheetsService.ts` – `SHEET_IDS` (catalogue, materialCatalog).
- **Ranges:** `SHEET_RANGES` – e.g. `Sheet1!A:AZ`, `Plywood Library!A:Z`, `Laminate Library!A:Z`, etc.
- **Column mapping:** `frontend/src/lib/visualiser/catalogParser.ts` – `DESIGNER_CONFIG.catalogueColumns`, `plywoodColumns`, `laminateColumns` (and header-based lookup in the service).

### 3.3 API routes

- **No backend routes for Google Sheets.** All Sheets access is from the browser using the public API key.
- Backend only uses Google APIs for Calendar (and GCS); no `/api/sheets` or similar.

---

## 4. Files and code patterns to reuse

### 4.1 Minimal set for “read Sheets as database” in another app

| File | Purpose |
|------|--------|
| `frontend/src/lib/visualiser/googleSheetsService.ts` | Sheets API client: `fetchSheetData`, `fetchMultipleRanges`, config (SHEET_IDS, SHEET_RANGES), `fetchAllCatalogData` (or your own “fetch all”),
| `frontend/.env.local.example` | Env template: `NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY` and instructions. |

Copy and adapt:

1. **Constants:** base URL `https://sheets.googleapis.com/v4/spreadsheets`, sheet IDs, ranges.
2. **fetchSheetData(sheetId, range, apiKey)** – single range → `string[][]`.
3. **fetchMultipleRanges(sheetId, ranges, apiKey)** – batch get → `Map<sheetName, string[][]>`.
4. **Header-based column index:** `findColumnIndex(headers, name)` (normalize header name, match to row 0).
5. **Env:** `getApiKey()`, `isGoogleSheetsConfigured()` from `process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY`.

### 4.2 Parsing and “entities/boxes” structure

| File | Purpose |
|------|--------|
| `frontend/src/lib/visualiser/googleSheetsService.ts` | `parseCatalogueData`, `parsePlywoodLibrary`, `parseLaminateLibrary` – turn raw rows into models/boxes/options. |
| `frontend/src/lib/visualiser/catalogParser.ts` | `DESIGNER_CONFIG` (column indices/names), `loadCatalogFromSampleData` (Sheets vs CSV), `refreshCatalogFromGoogleSheets`. |
| `frontend/src/types/visualiser/index.ts` | Types: CatalogModel, CatalogBoxWithPlanks, PlywoodOption, LaminateOption, Plank, etc. |

Reuse patterns:

- One config object for column names/indices per sheet.
- Parse row-by-row; use **level** (or similar) to group child rows (e.g. planks) under parent (e.g. box).
- Optional: **Drive image URLs** – `convertDriveUrl()` in googleSheetsService for laminate photos.

### 4.3 Where it’s consumed (reference only)

| File | Purpose |
|------|--------|
| `frontend/src/app/visualiser/designer/page.tsx` | Calls `loadCatalogFromSampleData()`, `refreshCatalogFromGoogleSheets()`, 5‑min refresh when Sheets configured. |
| `frontend/src/lib/visualiser/catalogParser.ts` | Exposes `loadCatalogFromSampleData`, `refreshCatalogFromGoogleSheets`, `isGoogleSheetsConfigured`, `getApiKey`. |
| `frontend/src/lib/visualiser/index.ts` | Re-exports from googleSheetsService. |

### 4.4 Apps Script “linked sheets” (export/sync) – optional

If you need **“each tab as a separate Sheet file”** and **sync back** into a master sheet:

| File | Purpose |
|------|--------|
| `backend/appscript/project_storage.js` | `exportSheetAsLinkedSpreadsheet`, `exportAllSheetsAsLinkedSpreadsheets`, `syncFromExportedSheet`, `syncAllSheetsFromExports`, diff/preview (`getDiffDataForActiveSheet`, `performSyncForActiveSheet`). |
| `backend/appscript/Menu.js` | Menu items: “Export All to Project Folder”, “Sync Sheets (Import Changes)”. |

Patterns: Document Properties for sheet-name → exported file ID; copy values/formatting both ways; optional diff UI before sync.

### 4.5 Other Apps Script (in-sheet only)

These run inside Google Sheets (SpreadsheetApp), not in your Node/frontend app:

- `backend/appscript/Phase2Validation.js`, `Cutlist.js`, `installationguide.js`, `formatting code.js`, `Menu.js`, `project_storage.js`, etc.

Reuse only if you embed or deploy the same Apps Script in your own Sheets.

---

## 5. Checklist to integrate into another app

1. **Env:** Add `NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY` (and optional sheet ID overrides).
2. **Enable API:** In Google Cloud Console, enable “Google Sheets API” for the project that owns the API key.
3. **Sharing:** Set the spreadsheet(s) to “Anyone with the link can view” (or use a service account and share the sheet with that account; then you’d need a backend proxy).
4. **Copy and trim:**  
   - From `googleSheetsService.ts`: base URL, `fetchSheetData`, `fetchMultipleRanges`, `findColumnIndex`, config (sheet IDs, ranges), `getApiKey`, `isGoogleSheetsConfigured`.  
   - From `catalogParser.ts`: column config and parsing logic for your entities (boxes/rows).  
   - From `types/visualiser/index.ts`: only the types you need (e.g. CatalogModel, CatalogBoxWithPlanks).
5. **Optional:** If you want “linked sheets” and sync, copy the relevant parts of `project_storage.js` into your Apps Script project.

---

## 6. Summary

| Question | Answer |
|----------|--------|
| **API** | Google Sheets API v4 (REST), `fetch()` from frontend. |
| **Auth** | API key; sheets are public “anyone with link can view”. |
| **Library** | None for Sheets in frontend; backend uses `googleapis` for Calendar only. |
| **Where data is fetched** | `googleSheetsService.fetchAllCatalogData` → `catalogParser.loadCatalogFromSampleData` / `refreshCatalogFromGoogleSheets`; consumed in designer page. |
| **Structure** | Rows = entities; `level` column: 0/1 = box, 2 = plank; header-based column mapping; separate sheets for catalogue vs material libraries. |
| **Env** | `NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY`; optional sheet ID overrides. |
| **Backend routes** | None for Sheets. |

The “Google Sheet linking concept” for **read-only catalog** is: **config (sheet IDs + ranges) → fetch by range → header-based parse → domain models (boxes/entities)**. For **write/sync**, the concept is in Apps Script: **export tabs as separate files, store IDs in Document Properties, sync ranges and formatting both ways**.
