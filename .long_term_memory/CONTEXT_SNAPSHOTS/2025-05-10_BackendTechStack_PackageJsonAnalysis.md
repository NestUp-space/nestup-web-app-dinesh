# Backend Technology Stack Overview (from package.json analysis as of 2025-05-10)

This document summarizes key dependencies for the Nestup Web App backend, derived from `backend/package.json`.

## Core Framework & ORM

* **Express.js (`express: ^4.21.0`):** Primary web framework for Node.js, used for building the API.
* **Prisma (`@prisma/client: ^5.20.0`, `prisma: ^5.20.0` dev):** ORM for PostgreSQL database interaction, including client and CLI for migrations/generation.
* **PostgreSQL (`pg: ^8.12.0`):** Node.js client for PostgreSQL.
* *Observation: Sequelize (`sequelize: ^6.37.3`) is also present, suggesting potential legacy use or a specific niche application.*

## Validation

* **Zod (`zod: ^3.24.4`):** Used for schema declaration and validation, ensuring data integrity.
* **`@asteasolutions/zod-to-openapi: ^7.0.0`:** Utility for generating OpenAPI (Swagger) documentation from Zod schemas.

## Authentication & Security

* **bcrypt (`bcrypt: ^5.1.1`):** For secure password hashing.
* **jsonwebtoken (`jsonwebtoken: ^9.0.2`):** For creating and verifying JSON Web Tokens (JWTs).
* **Helmet (`helmet: ^7.1.0`):** Secures Express apps by setting various HTTP headers.
* **CORS (`cors: ^2.8.5`):** Enables Cross-Origin Resource Sharing.
* **Express Rate Limit (`express-rate-limit: ^5.5.1`):** Middleware for basic API rate limiting.

## API Documentation

* **Swagger UI Express (`swagger-ui-express: ^4.1.2`):** Serves Swagger UI for API documentation.

## AWS Integration

* **AWS SDK S3 Client (`@aws-sdk/client-s3: ^3.651.0`):** AWS SDK v3 specifically for S3 interactions (likely for file storage).
* **AWS SDK v2 (`aws-sdk: ^2.1691.0`):** Full AWS SDK v2, potentially for other AWS services or legacy S3 interactions.

## Utilities

* **dotenv (`dotenv: ^16.4.5`):** Loads environment variables from `.env` files.
* **envalid (`envalid: ^8.0.0`):** Validates environment variables.
* **http-status-codes (`http-status-codes: ^2.3.0`):** Provides constants for HTTP status codes.
* **Multer (`multer: ^1.4.5-lts.1`):** Middleware for handling `multipart/form-data`, primarily for file uploads.
* **Pino HTTP (`pino-http: ^10.0.0`):** HTTP request logger.

## Key Development Dependencies

* **TypeScript (`typescript: ^5.4.4`):** Superset of JavaScript that adds static typing.
* **tsx (`tsx: ^4.7.2`):** TypeScript execution and REPL, used in `dev` script.
* **tsup (`tsup: ^8.0.2`):** TypeScript bundler.
* **Vitest (`vitest: ^2.0.0`):** Testing framework.
* **BiomeJS (`@biomejs/biome: 1.8.3`):** Linter and formatter.
* **Husky (`husky: ^9.0.11`) & Lint-staged (`lint-staged: ^15.2.2`):** For Git pre-commit hooks to enforce code quality.
* **Pino Pretty (`pino-pretty: ^11.0.0`):** Pretty-prints Pino logs, used in `dev` script.
