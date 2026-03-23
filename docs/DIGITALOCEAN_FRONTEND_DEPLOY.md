# Deploy the NestUp Web App on DigitalOcean

The repo is set up for **single-component deploy**: one build builds both backend and frontend, and one process runs both (backend on 8080, frontend proxied at /).

## Single-component setup (recommended)

Use **one** Web Service component with the repo root (the folder that contains `backend` and `frontend`):

- **Build command:** `npm run build`  
  (builds backend then frontend; frontend is built with same-origin API so no extra env needed)
- **Run command:** `npm start`  
  (starts Next.js on 3000, then Express on 8080 and proxies non-API traffic to Next.js)
- **HTTP port:** `8080`

**Environment variables** (app-level or component-level):

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Your Postgres connection string (e.g. Supabase pooler URL) |
| `FRONTEND_URL` | Your app's public URL, e.g. `https://nestupapp-xxxxx.ondigitalocean.app` |
| `JWT_SECRET` | Long random string for JWT signing |

After deploy, the **same URL** serves the web app at `/` and API at `/api`, Swagger at `/api-docs`.

### Wall measurements (`/measurements`) + vision service

The **Measurements** flow (`frontend/src/app/measurements/`) is part of the same Next.js build as the rest of the site. No extra component is required for the pages themselves—ensure your deploy branch includes `frontend/src/app/measurements/`.

Photo processing calls a **separate Python FastAPI** service under `frontend/src/app/aruco-measurement-system/vision-service/` (`/measure-wall`, `/health`). Deploy it as a **second** App Platform component (Dockerfile in that directory, HTTP port **8000**). A ready-to-edit spec lives at [`.do/vision-service.app.yaml`](../.do/vision-service.app.yaml); see [`.do/README.md`](../.do/README.md) for `doctl` usage.

On this **web** component, set the vision service’s public origin so the browser can call it (value is baked in at **Next.js build time**—redeploy after changing it):

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_MEASUREMENT_API_URL` | Vision service URL, e.g. `https://vision-xxxxx.ondigitalocean.app` (no trailing slash) |

Optional:

| Key | Purpose |
|-----|--------|
| `NEXT_PUBLIC_SHOW_WALL_MEASURE` | Set to `true` to show wall-measurement entry points on the Visualiser when your app reads this flag. |
| `NEXT_PUBLIC_ARUCO_APP_URL` | Only if the measurement UI is hosted on a different origin than the Visualiser. |

YOLO weights (`models/*/best.pt`) for windows/doors/switchboards are optional for ArUco wall sizing but required for those detections; see `frontend/src/app/aruco-measurement-system/vision-service/models/README.md`.

---

## Alternative: two components (backend + frontend)

If you prefer separate backend and frontend components:

1. **Backend component:** Root directory `backend`, build `npm install && npx prisma generate && npm run build`, run `npm start`, port 8080.
2. **Frontend component:** Root directory `frontend`, build `npm install && npm run build`, run `npm start`, port 3000. Set `NEXT_PUBLIC_API_URL` to the backend URL.
3. Set backend `FRONTEND_URL` to the frontend component URL.
