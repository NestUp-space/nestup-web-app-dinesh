# Login Issue Fix - Deployment Guide

## Issues Fixed

### 1. **Server Entry Point Mismatch** ✅
- **Problem**: Railway was trying to run `dist/server.js` but package.json pointed to `index.ts`
- **Fix**: Updated package.json to use `server.ts` as main entry point
- **Files Changed**: 
  - `backend/package.json` - Updated main entry and scripts
  - `backend/src/server.ts` - Added server startup code
  - `backend/src/index.ts` - Renamed to `index.ts.old`

### 2. **Frontend API Configuration** ✅
- **Problem**: Frontend was hardcoded to use `localhost:5001`
- **Fix**: Created proper API configuration system
- **Files Changed**:
  - `frontend/src/config/api.js` - New API configuration
  - `frontend/src/lib/api/auth.ts` - Updated to use new config
  - `frontend/.env.local` - Local development environment
  - `frontend/.env.example` - Environment template

## Required Railway Environment Variables

Set these in your Railway dashboard:

```bash
NODE_ENV=production
PORT=8080
FRONTEND_URL=https://nestup.space
CORS_ORIGIN=https://nestup.space,https://your-vercel-app.vercel.app
JWT_SECRET=your-secure-jwt-secret-key
JWT_EXPIRES_IN=24h
DATABASE_URL=your-railway-postgres-url
```

## Required Vercel Environment Variables

Set these in your Vercel dashboard:

```bash
NEXT_PUBLIC_API_URL=https://nestup-web-app-production.up.railway.app
NODE_ENV=production
```

## Deployment Steps

### 1. **Deploy Backend to Railway**
1. Push the updated code to your repository
2. Railway will automatically redeploy
3. Verify environment variables are set correctly
4. Check logs to ensure server starts on port 8080

### 2. **Deploy Frontend to Vercel**
1. Set the environment variable `NEXT_PUBLIC_API_URL` in Vercel
2. Redeploy the frontend
3. Test login functionality

### 3. **Update Railway URL (if needed)**
If your Railway URL is different from `nestup-web-app-production.up.railway.app`, update:
- Vercel environment variable `NEXT_PUBLIC_API_URL`
- Railway environment variable `CORS_ORIGIN` to include your frontend domain

## Testing the Fix

### Local Development
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Test login at `http://localhost:3000/login`

### Production Testing
1. Visit `https://nestup.space/login`
2. Try logging in with admin credentials
3. Check browser console for any errors
4. Verify API calls go to Railway backend

## Key Changes Summary

1. **Backend**: Fixed server entry point and added proper startup
2. **Frontend**: Centralized API configuration and environment handling
3. **Environment**: Proper separation of dev/prod configurations
4. **CORS**: Configured to allow your Vercel domain

## Troubleshooting

### If Railway still crashes:
- Check Railway logs for specific error messages
- Verify all environment variables are set
- Ensure DATABASE_URL is correct

### If frontend can't connect:
- Check browser console for CORS errors
- Verify NEXT_PUBLIC_API_URL is set in Vercel
- Ensure Railway CORS_ORIGIN includes your frontend domain

### If login still fails:
- Check Railway logs for authentication errors
- Verify JWT_SECRET is set
- Test API endpoints directly with curl/Postman

## Next Steps After Deployment

1. Test all authentication flows (login, register, logout)
2. Verify dashboard access works
3. Check all API endpoints are accessible
4. Monitor Railway logs for any issues
5. Set up proper monitoring and alerts

## Railway URL Update

**Important**: Replace `nestup-web-app-production.up.railway.app` with your actual Railway deployment URL in:
- Vercel environment variables
- Railway CORS_ORIGIN setting
- Frontend API configuration (if hardcoded)
