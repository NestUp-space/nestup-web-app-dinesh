# Visualizer Vercel Test Runbook

Use this runbook to publish a visualizer-only build for team testing.

## 1) Branch

1. Work from `visualizer-feedback`.
2. Keep all visualizer testing changes on this branch.

## 2) Visualizer-only routing

This is enforced by `frontend/src/middleware.ts`:
- non-visualizer routes redirect to `/visualiser/designer`
- framework and API paths remain allowed

## 3) Vercel project configuration

In Vercel Dashboard:
1. **Add New Project** -> import repository.
2. Set **Root Directory** to `frontend`.
3. Set **Production Branch** to `visualizer-feedback`.
4. Complete project creation.

## 4) Environment variables (required)

Add these keys in Vercel Project Settings -> Environment Variables:
- `NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY`
- `NEXT_PUBLIC_CATALOGUE_SHEET_ID`
- `NEXT_PUBLIC_MATERIAL_CATALOG_SHEET_ID`
- `NEXT_PUBLIC_MEASUREMENT_API_URL`

Use the same values from local `frontend/.env.local` for testing parity.

## 5) Deploy + smoke test checklist

After each deployment, verify:
- `/` redirects to `/visualiser/designer`
- `/visualiser/designer` loads without build/runtime errors
- Move tool: select -> move -> axis lock -> escape levels
- Tape tool: edge hover, parallel guide flow, double-click edge, axis lock
- API-backed catalog data loads

## 6) Team sharing workflow

For each update:
1. push changes to `visualizer-feedback`
2. wait for auto-deploy
3. share URL + short changelog
4. collect feedback with severity tags: `blocker`, `high`, `medium`, `low`

## 7) Feedback log template

Use this format in your tracker:
- Title:
- Severity:
- Steps to reproduce:
- Expected:
- Actual:
- Browser/OS:
- Screenshot/video:
- Build URL:
