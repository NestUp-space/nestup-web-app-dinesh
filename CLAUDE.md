# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nestup Web App** (internally "Project Sauron") is a full-stack modular interior design platform for furniture manufacturing. It supports LiDAR-driven room scanning, floor plan generation, modular furniture placement, BIM workflows, and automated manufacturing outputs (cut lists, BOM, G-code).

**Stack:** Express.js + TypeScript backend, Next.js 14 frontend, PostgreSQL via Prisma, Docker Compose for local dev.

---

## Commands

### Root (orchestration)
```bash
npm start                   # Start backend + frontend
npm run start:backend-only  # Backend only
npm run build               # Build backend + frontend
npm run dev                 # Dev backend only
```

### Backend (`cd backend`)
```bash
npm run dev                 # Nodemon watch mode
npm run build               # tsc + Prisma generate
npm start                   # Run compiled dist/
npm run test                # Vitest
npm run test:watch          # Vitest watch
npm run test:coverage       # Vitest coverage
npm run migrate             # Prisma migrate dev
npm run migrate:prod        # Prisma migrate deploy (production)
npm run setup:admin         # Seed admin role + user
```

### Frontend (`cd frontend`)
```bash
npm run dev                 # Next.js dev with Turbo
npm run build               # Production build
npm run lint                # ESLint
```

### Docker (full stack)
```bash
docker-compose up           # postgres (5432), backend (5000), frontend (3000), strapi (1338)
```

---

## Architecture

### Backend: `backend/src/`

Follows **Route → Controller → Service → Repository** layering.

- `server.ts` — Express app entry, registers all routes and middleware stack (CORS, Helmet, rate limiting, auth, error handling)
- `routes/` — Express routers (auth, user, project, task, files, materials, roles)
- `controllers/` + `services/` + `repositories/` — Domain logic per feature
- `bim/` — BIM design system (controllers, services, generators, templates, rules engine)
- `catalogue/` — Furniture catalog with DTOs
- `lidar/` — LiDAR feature module (6 controllers, 7 services — see below)
- `common/` — Shared middleware (auth, errors, logging, rate limiting), S3/GCS file services, utils
- `config/env.ts` — Zod-validated environment config (fail-fast on startup)
- `prisma/schema.prisma` — All database models; `prisma/seed.ts` for seeding

**API response format** (always use `ServiceResponse` wrapper):
```typescript
{ success: boolean; data?: T; message?: string; error?: string; }
```

**File uploads:** Multer + S3/GCS. Max chunk size 1 MB for resumable uploads.

**Dependency injection:** tsyringe.

### Frontend: `frontend/src/`

- `app/` — Next.js App Router. Protected routes under `app/dashboard/`
- `components/ui/` — shadcn/ui (Radix-based). Use exclusively for UI primitives.
- `components/visualiser/` — 3D furniture design. `CabinetDesigner.tsx` is the reference implementation for any 3D component.
- `components/lidar/` — LiDAR UI: `FloorPlanViewer`, `PointCloudViewer`, `Room3DViewer`, `SessionDashboard`
- `stores/` — Zustand: `designerStore.ts` (designer canvas), `visualiserStore.ts` (3D viewer)
- `hooks/` — All SWR data fetching and business logic hooks; `hooks/lidar/useLidarSession.ts` for LiDAR
- `context/UserContext.tsx` — Auth context, wraps the app in `layout.tsx`
- `lib/api.ts` — Axios-based `apiClient` used by all hooks

**State:** Zustand for 3D state; SWR + `apiClient` for server state. No Redux.

### LiDAR Feature (Project Sauron)

Session status flow: `CREATED → UPLOADING → PROCESSING → PROCESSED → DESIGNING → COMPLETED`

- 2D scans (CSV): processed in TypeScript — polar coords (angle, range) → Cartesian → RANSAC wall detection → walls stored as start/end points
- 3D scans (PLY/PCD): future Python service
- Raw scan data → S3; processed data → PostgreSQL JSON fields
- Module placement: snaps to walls, collision detection, real-time 3D preview
- Exports: JSON, Excel (xlsx), PDF (jsPDF)

---

## Code Conventions

### TypeScript
- Strict mode on both backend and frontend
- Prefer `interface` over `type` for objects
- Export types from dedicated `*.types.ts` files
- Zod schemas for all runtime validation at API boundaries

### React / Next.js
- `"use client"` directive required for client components
- Functional components only; `useCallback` for handlers passed to children; `useMemo` for expensive computations
- Separate state management from rendering logic

### 3D (Three.js / R3F)
- Use `@react-three/fiber` + `@react-three/drei` (OrbitControls, Grid, Html)
- **Coordinate system:** X=width, Y=depth (into screen), Z=height — Three.js Y-up needs conversion
- **Units:** Always millimeters internally; convert only for display

### File Naming
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Services: `feature-name.service.ts`
- Types: `feature-name.types.ts`

### Common Gotchas
- Prisma `BigInt` requires special JSON serialization handling
- Always check `LidarSession.status` before performing operations on a session
- shadcn/ui components are in `frontend/src/components/ui/` — do not create custom UI primitives that duplicate these

---

## Key Documentation
- `.long_term_memory/lidar-implementation.md` — Full BRD/PRD for the LiDAR feature
- `.long_term_memory/DECISION_LOG.md` — Architecture decisions log
- `.long_term_memory/GUARDRAILS.md` — Coding standards
- `.long_term_memory/DEPLOYMENT_GUIDE.md` — Deployment instructions
