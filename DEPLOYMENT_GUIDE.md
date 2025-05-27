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
   NEXT_PUBLIC_API_BASE_URL=https://your-app.railway.app
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
   NEXT_PUBLIC_API_BASE_URL=https://your-app.railway.app
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
   - Update `NEXT_PUBLIC_API_BASE_URL` in Vercel if using custom backend domain

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
NEXT_PUBLIC_API_BASE_URL=https://your-backend.railway.app
NODE_ENV=production
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Ensure `CORS_ORIGIN` matches your frontend domain exactly
   - Include protocol (https://)

2. **Database Connection Issues:**
   - Check `DATABASE_URL` is set correctly
   - Ensure migrations ran successfully

3. **Build Failures:**
   - Check build logs in Railway/Vercel
   - Ensure all dependencies are in `package.json`

4. **API Not Responding:**
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
