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

---

## Alternative: two components (backend + frontend)

If you prefer separate backend and frontend components:

1. **Backend component:** Root directory `backend`, build `npm install && npx prisma generate && npm run build`, run `npm start`, port 8080.
2. **Frontend component:** Root directory `frontend`, build `npm install && npm run build`, run `npm start`, port 3000. Set `NEXT_PUBLIC_API_URL` to the backend URL.
3. Set backend `FRONTEND_URL` to the frontend component URL.
