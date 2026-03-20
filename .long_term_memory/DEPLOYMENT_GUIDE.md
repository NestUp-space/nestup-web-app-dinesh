# Nestup Web App Deployment Guide

## 🚀 Railway + Vercel Deployment

This guide will help you deploy the Nestup Web App using Railway for the backend and Vercel for the frontend.

## 📋 Prerequisites

- [Railway Account](https://railway.app) (free tier available)
- [Vercel Account](https://vercel.com) (free tier available)
- [GitHub Account](https://github.com) (for code repository)
- Custom domain (optional but recommended)

## 🔧 Phase 1: Security Fixes Completed

✅ **Security Issues Fixed:**

- Replaced unsafe `new Function()` calls with safe expression evaluator
- Added input validation and sanitization
- Implemented error boundaries
- Added proper CORS configuration

## 🚂 Phase 2: Backend Deployment (Railway)

### Step 1: Prepare Your Repository

1. **Push your code to GitHub:**

   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

### Step 2: Deploy to Railway

1. **Go to [Railway.app](https://railway.app) and sign in**

2. **Create a new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select the root directory (not backend subdirectory)

3. **Configure the service:**
   - Railway will auto-detect it's a Node.js project
   - Set the **Root Directory** to `backend`
   - Set **Build Command** to `npm run build`
   - Set **Start Command** to `npm run start`

4. **Add PostgreSQL Database:**
   - In your Railway project dashboard
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will automatically provide `DATABASE_URL`

5. **Configure Environment Variables:**

   ```
   NODE_ENV=production
   PORT=8080
   FRONTEND_URL=https://your-domain.vercel.app
   CORS_ORIGIN=https://your-domain.vercel.app
   JWT_SECRET=your-super-secure-jwt-secret-here
   JWT_EXPIRES_IN=24h
   COMMON_RATE_LIMIT_MAX_REQUESTS=1000
   COMMON_RATE_LIMIT_WINDOW_MS=900000
   ```

6. **Deploy:**
   - Railway will automatically deploy
   - Note your Railway app URL (e.g., `https://your-app.railway.app`)

### Step 3: Database Setup

1. **Run migrations:**
   - Railway will automatically run `npm run migrate:prod` after build
   - Check the deployment logs to ensure migrations completed

2. **Seed initial data (optional):**
   - You can run the seed script manually if needed
   - Or set up admin user via environment variables

## 🌐 Phase 3: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

1. **Update API configuration:**
   - Create `frontend/.env.production` with your Railway backend URL:

   ```
   NEXT_PUBLIC_API_URL=https://your-app.railway.app
   ```

### Step 2: Deploy to Vercel

1. **Go to [Vercel.com](https://vercel.com) and sign in**

2. **Import your project:**
   - Click "New Project"
   - Import from GitHub
   - Select your repository

3. **Configure build settings:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

4. **Add Environment Variables:**

   ```
   NEXT_PUBLIC_API_URL=https://your-app.railway.app
   NODE_ENV=production
   ```

5. **Deploy:**
   - Vercel will automatically deploy
   - Note your Vercel app URL

### Step 3: Update Backend CORS

1. **Update Railway environment variables:**

   ```
   FRONTEND_URL=https://your-app.vercel.app
   CORS_ORIGIN=https://your-app.vercel.app
   ```

2. **Redeploy backend** (Railway will auto-redeploy on env var changes)

## 🌍 Phase 4: Custom Domain Setup

### Backend Domain (Optional)

1. **In Railway:**
   - Go to your service settings
   - Add custom domain
   - Update DNS records as instructed

### Frontend Domain

1. **In Vercel:**
   - Go to project settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

2. **Update environment variables:**
   - Update `CORS_ORIGIN` in Railway
   - Update `NEXT_PUBLIC_API_URL` in Vercel if using custom backend domain

## 🧪 Phase 5: Testing & Verification

### Health Checks

1. **Backend health check:**

   ```
   GET https://your-app.railway.app/health-check
   ```

2. **Frontend accessibility:**

   ```
   https://your-app.vercel.app
   ```

### Functionality Tests

1. **User authentication**
2. **Project creation**
3. **Model management**
4. **Plank generation**

## 📊 Monitoring & Maintenance

### Railway Monitoring

- Check deployment logs in Railway dashboard
- Monitor database performance
- Set up alerts for downtime

### Vercel Monitoring

- Check build logs in Vercel dashboard
- Monitor Core Web Vitals
- Set up alerts for failed deployments

## 💰 Cost Breakdown

### Railway (Backend + Database)

- **Hobby Plan:** $5/month
- Includes PostgreSQL database
- 500 hours of runtime (enough for 24/7)

### Vercel (Frontend)

- **Free Tier:** $0/month
- 100GB bandwidth
- Unlimited personal projects

### Total Monthly Cost: ~$5

## 🔧 Environment Variables Reference

### Railway (Backend)

```env
NODE_ENV=production
PORT=8080
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=24h
DATABASE_URL=postgresql://... (auto-provided)
COMMON_RATE_LIMIT_MAX_REQUESTS=1000
COMMON_RATE_LIMIT_WINDOW_MS=900000
```

### Vercel (Frontend)

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NODE_ENV=production
```

## 🌊 DigitalOcean App Platform (single-component)

When the app is deployed as one component (frontend + backend via `start-all.js`), set these on the **nestup-web-app** component so `/api/catalog` works and CORS allows the app origin.

### Required for /api/catalog and CORS

| Variable | Value |
|----------|--------|
| `FRONTEND_URL` | Your app URL, e.g. `https://sea-lion-app-p9uw8.ondigitalocean.app` (no trailing slash) |
| `ENABLE_FRONTEND_PROXY` | `1` or `true` |

### Catalog data (avoid 503 from `/api/catalog`)

Add these so the Next.js API route can load from Google Sheets:

| Variable | Purpose |
|----------|---------|
| `GOOGLE_SHEETS_API_KEY` or `NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY` | API key for Google Sheets |
| `NEXT_PUBLIC_CATALOGUE_SHEET_ID` or `CATALOGUE_SHEET_ID` | Cabinet catalog sheet ID |
| `NEXT_PUBLIC_MATERIAL_CATALOG_SHEET_ID` or `MATERIAL_CATALOG_SHEET_ID` | Material catalog sheet ID |

### After changing env or code

1. Save env vars in the component settings.
2. Trigger a **new deployment** so the runtime uses the latest build and env. The startup log should show: `Frontend proxy enabled: / and /api/catalog -> Next.js, other /api -> Express`.

---

## 🌐 Full website deployment (core + visualiser + measurements + vision service)

Use this section when the **frontend + backend are already half-deployed** (e.g. on DigitalOcean at `sea-lion-app-p9uw8.ondigitalocean.app`) and you want the **whole site** live: core pages, visualiser/designer, **Measurements** (including the vision service for wall/object detection).

### What’s in the full site

| Part | Where it lives | How it’s deployed |
|------|----------------|-------------------|
| Core site (Home, About, Contact, Login, Get a Quote) | `frontend/` (Next.js) | Same frontend build |
| Visualiser (designer, generate, reports, installation-guide) | `frontend/src/app/visualiser/` | Same frontend build |
| Measurements (landing, preset, capture, processing, history) | `frontend/src/app/measurements/` | Same frontend build — **must be in the deployed branch** |
| Vision service (ArUco + YOLO: windows, doors, switchboards) | `frontend/src/app/aruco-measurement-system/vision-service/` | **Separate** Docker service (see below) |

### Step 1: Ensure the frontend build includes Measurements

If `/measurements` returns “Page not found” on the live URL:

1. The deployed **branch/commit** must contain the `frontend/src/app/measurements/` folder (and its sub-routes).
2. **Redeploy** the frontend from that branch (e.g. trigger a new deployment on DigitalOcean or Vercel from the repo/branch that has Measurements). No separate “measurements app” deploy — it’s part of the same Next.js app.
3. After redeploy, the same app URL should serve `/`, `/visualiser`, `/visualiser/designer`, `/measurements`, `/measurements/history`, etc.

### Step 2: Deploy the vision service (for Measurements to work end-to-end)

The Measurements flow (upload photo → get wall dimensions and detected windows/doors/switchboards) calls a **Python FastAPI** service. Deploy it as a **separate** service and point the frontend at it.

**Location in repo:** `frontend/src/app/aruco-measurement-system/vision-service/`

- **main.py** — ArUco detection, scale calibration, wall dimensions, `/measure-wall` API.
- **feature_detection.py** — YOLO-based detection of windows, doors, switchboards.
- **models/** — Place **best.pt** (YOLO weights) in:
  - `models/windows/best.pt`
  - `models/doors/best.pt`
  - `models/switchboards/best.pt`  
  (Copy from training output, e.g. nestup_wallai or `runs/detect/.../weights/best.pt`.) See `vision-service/models/README.md`. There is no “best.py” — the model files are **best.pt**.

**Deploy options:**

- **DigitalOcean App Platform:** Add a second component: type **Container** (or Dockerfile). Build context = `frontend/src/app/aruco-measurement-system/vision-service/`. Ensure the Docker image includes the **best.pt** files (e.g. copy them into the image or use a build step that pulls them). Expose **port 8000**. Note the public URL (e.g. `https://vision-xxxx.ondigitalocean.app`).
- **Railway / other host:** Build from the vision-service directory using the existing **Dockerfile**, run the container on port 8000, set the public URL.

**Connect the frontend to the vision service:**

In the **frontend** deployment (DigitalOcean component, or Vercel env vars), set:

| Variable | Value |
|---------|--------|
| `NEXT_PUBLIC_MEASUREMENT_API_URL` | Public URL of the vision service, e.g. `https://vision-xxxx.ondigitalocean.app` (no trailing slash) |

The Measurements UI (`frontend/src/lib/measurements/measurementApi.ts`) uses this to call `/measure-wall`. Without it, the Measurements **pages** load but photo processing will fail or show “backend not reachable”.

### Step 3: Full deployment checklist

- [ ] Frontend (and backend if separate) deployed from a branch that contains `app/measurements/`.
- [ ] Live URL serves `/measurements` (no 404).
- [ ] Vision service deployed (Docker, port 8000) with **best.pt** in `models/windows/`, `models/doors/`, `models/switchboards/`.
- [ ] `NEXT_PUBLIC_MEASUREMENT_API_URL` set on the frontend to the vision service URL.
- [ ] (DigitalOcean single-component) `FRONTEND_URL` and `ENABLE_FRONTEND_PROXY=1` set; catalog env vars set if using Google Sheets.

---

## 🚨 Troubleshooting

### Common Issues

1. **GET /api/catalog returns 404 (DigitalOcean single-component):**
   - The running build may be old. Ensure the branch has the commit that proxies `/api/catalog` to Next.js (log: `Frontend proxy enabled: / and /api/catalog -> Next.js`).
   - Set `ENABLE_FRONTEND_PROXY=1` and `FRONTEND_URL` to your app URL, then trigger a new deployment.

2. **CORS policy does not allow origin (DigitalOcean):**
   - Set `FRONTEND_URL` to your app URL (e.g. `https://sea-lion-app-p9uw8.ondigitalocean.app`) so the backend allows that origin when the proxy is enabled.
   - Redeploy after changing env vars.

3. **CORS Errors (Railway/Vercel):**
   - Ensure `CORS_ORIGIN` matches your frontend domain exactly
   - Include protocol (https://)

4. **Database Connection Issues:**
   - Check `DATABASE_URL` is set correctly
   - Ensure migrations ran successfully

5. **Build Failures:**
   - Check build logs in Railway/Vercel
   - Ensure all dependencies are in `package.json`

6. **API Not Responding:**
   - Check Railway service is running
   - Verify health check endpoint

### Support

- Railway: [docs.railway.app](https://docs.railway.app)
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Project Issues: Create GitHub issue

## 🎉 Success Criteria

✅ Backend deployed on Railway with PostgreSQL  
✅ Frontend deployed on Vercel  
✅ Custom domain configured (optional)  
✅ All security fixes implemented  
✅ Health checks passing  
✅ Full application functionality working  
✅ Total cost under $10/month  

## 📝 Next Steps

After successful deployment:

1. **Set up monitoring and alerts**
2. **Configure backup strategies**
3. **Implement CI/CD pipelines**
4. **Add performance monitoring**
5. **Set up error tracking (e.g., Sentry)**

---

**Estimated Total Deployment Time:** 2-3 hours  
**Monthly Operating Cost:** ~$5  
**Scalability:** Supports 100+ concurrent users
