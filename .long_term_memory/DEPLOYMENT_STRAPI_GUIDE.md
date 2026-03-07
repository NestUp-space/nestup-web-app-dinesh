# Nestup Web App + Strapi Deployment Guide

This guide will help you deploy the Nestup Web App, including the Strapi CMS, using Railway for all backend services and Vercel for the frontend.

## Prerequisites

- [Railway Account](https://railway.app)
- [Vercel Account](https://vercel.com)
- [GitHub Account](https://github.com)

## Backend Deployment (Railway)

You will create three services in your Railway project:

1. **PostgreSQL Database**
2. **Backend API**
3. **Strapi CMS**

### Step 1: Deploy PostgreSQL Database

1. In your Railway project, click "New" -> "Database" -> "Add PostgreSQL".
2. Railway will provide a `DATABASE_URL`. You will use this for both the backend and Strapi services.

### Step 2: Deploy Backend API

1. Create a new service and connect it to your GitHub repository.
2. **Service Settings**:
    - **Root Directory**: `backend`
    - **Build Command**: `npm run build`
    - **Start Command**: `npm run start`
3. **Environment Variables**:
    - `NODE_ENV=production`
    - `PORT=8080`
    - `DATABASE_URL`: (from Railway PostgreSQL service)
    - `JWT_SECRET`: (generate a secure secret)
    - `CORS_ORIGIN`: (your Vercel frontend URL)

### Step 3: Deploy Strapi CMS

1. Create another new service connected to the same GitHub repository.
2. **Service Settings**:
    - **Root Directory**: `backend/cms`
    - **Build Command**: `npm run build`
    - **Start Command**: `npm run start`
3. **Environment Variables**:
    - `NODE_ENV=production`
    - `HOST=0.0.0.0`
    - `PORT=1338`
    - `DATABASE_CLIENT=postgres`
    - `DATABASE_URL`: (use the same `DATABASE_URL` from the PostgreSQL service, but you might want to use a different database name, e.g., by appending `?database=strapi_db`)
    - `APP_KEYS`: (generate two secure comma-separated keys)
    - `API_TOKEN_SALT`: (generate a secure salt)
    - `ADMIN_JWT_SECRET`: (generate a secure secret)

## Frontend Deployment (Vercel)

1. Deploy the `frontend` directory to Vercel as per the existing `DEPLOYMENT_GUIDE.md`.
2. **Environment Variables**:
    - `NEXT_PUBLIC_API_URL`: (your Railway backend service URL)
    - `NEXT_PUBLIC_STRAPI_URL`: (your Railway Strapi service URL)

## Post-Deployment

1. **Strapi Admin User**: Access your Strapi URL and create the first administrator user.
2. **CORS Configuration**:
    - Ensure the backend `CORS_ORIGIN` is set to your Vercel URL.
    - In Strapi's settings, configure CORS to allow your Vercel URL.
3. **Database Migrations**:
    - The backend service should run migrations automatically.
    - Strapi will handle its own schema migration on startup.

You have now successfully deployed the entire stack.
