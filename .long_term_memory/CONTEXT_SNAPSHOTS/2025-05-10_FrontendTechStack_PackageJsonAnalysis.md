# Frontend Technology Stack Overview (from package.json analysis as of 2025-05-10)

This document summarizes key dependencies for the Nestup Web App frontend, derived from `frontend/package.json`.

## Core Framework & UI
*   **Next.js (`next: ^14.2.13`):** React framework for server-side rendering (SSR), static site generation (SSG), routing, API routes, etc.
*   **React (`react: ^18`, `react-dom: ^18`):** Core library for building user interfaces.
*   **Tailwind CSS (`tailwindcss: ^3.4.9`):** Utility-first CSS framework for styling.
    *   Utilities: `tailwind-merge: ^2.5.2`, `tailwindcss-animate: ^1.0.7`, `clsx: ^2.1.1`.
*   **Radix UI (`@radix-ui/*`):** Collection of unstyled, accessible UI primitives (Dialog, DropdownMenu, Slot, Tabs, Tooltip).
*   **Lucide React (`lucide-react: ^0.400.0`) & Heroicons (`@heroicons/react: ^2.1.5`):** Icon libraries.
*   **Class Variance Authority (`class-variance-authority: ^0.7.0`):** For creating type-safe UI component variants.

## Forms
*   **React Hook Form (`react-hook-form: ^7.52.1`):** For form state management and validation.
*   **`@hookform/resolvers: ^5.0.1`:** To integrate external validation libraries (e.g., Zod) with React Hook Form.

## Data Fetching & State Management
*   **SWR (`swr: ^2.2.5`):** React Hooks library for data fetching using a stale-while-revalidate strategy.

## Date & Time
*   **date-fns (`date-fns: ^3.6.0`):** Modern JavaScript date utility library.
*   **Moment.js (`moment: ^2.30.1`):** Legacy date library (presence alongside `date-fns` might indicate areas for refactoring or specific needs).
*   **React Datepicker (`react-datepicker: ^7.4.0`):** UI component for date selection.

## Content & Markdown
*   **gray-matter (`gray-matter: ^4.0.3`):** Parses front-matter from strings/files.
*   **remark (`remark: ^15.0.1`) & remark-html (`remark-html: ^16.0.1`):** Markdown processing and HTML conversion.

## Animation
*   **Framer Motion (`framer-motion: ^11.3.24`):** Animation library for React.

## Database-related (Frontend Context - for Vercel/Serverless/Edge)
*   **Drizzle ORM (`drizzle-orm: ^0.31.4`, `drizzle-kit: ^0.22.8` dev):** TypeScript ORM.
*   **Drizzle Zod (`drizzle-zod: ^0.5.1`):** Generates Zod schemas from Drizzle schemas.
*   **Neon Serverless Driver (`@neondatabase/serverless: ^0.9.5`):** Driver for Neon serverless Postgres.
    *   *Observation: This indicates a potential data persistence layer managed or accessed from the frontend/edge, separate from the main backend's Prisma setup.*

## Utilities
*   **EmailJS (`@emailjs/browser: ^4.4.1`):** Client-side email sending.
*   **Vercel Analytics (`@vercel/analytics: ^1.3.1`):** Analytics for Vercel-deployed applications.
*   **server-only (`server-only: ^0.0.1`):** Ensures modules are only run on the server (Next.js App Router context).

## Key Development Dependencies
*   **TypeScript (`typescript: ^5`):** Language for static typing.
*   **ESLint (`eslint: ^8`, `eslint-config-next: 14.2.5`):** Linter for code quality.
*   **PostCSS (`postcss: ^8`):** Tool for transforming CSS with JavaScript (used by Tailwind).
