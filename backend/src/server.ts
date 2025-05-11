import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";

import { openAPIRouter } from "@/api-docs/openAPIRouter";
import { healthCheckRouter } from "@/api/healthCheck/healthCheckRouter";
import { userRouter } from "@/api/user/userRouter";
import authRouter from "@/routes/auth.routes"; // Auth router
import projectRouter from "@/routes/project.routes"; // Project router
import bimRouter from "@/bim/routes/bim.routes"; // BIM router
// Catalogue Router
import catalogueRouter from "./catalogue/routes/model.routes"; // Model management router - CHANGED TO RELATIVE PATH
import materialRouter from "@/routes/material.routes"; // Material router
import siteVisitBoxRouter from "@/routes/siteVisitBox.routes"; // SiteVisitBox router
import errorHandler from "@/common/middleware/errorHandler";
import rateLimiter from "@/common/middleware/rateLimiter";
import requestLogger from "@/common/middleware/requestLogger";
import { env } from "@/common/utils/envConfig";

const logger = pino({ name: "server start" });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set("trust proxy", true);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true, methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.options('*', cors({ origin: env.CORS_ORIGIN, credentials: true, methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] })); // Handle preflight requests
app.use(helmet());
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes
app.use("/health-check", healthCheckRouter);
app.use("/api/users", userRouter); // Standardized under /api
app.use("/api/auth", authRouter); // Auth routes
app.use("/api/projects", projectRouter); // Project routes

// --- BIM Router Mounting ---
console.log('--- [SERVER.TS] Attempting to mount bimRouter ---');
console.log('--- [SERVER.TS] typeof bimRouter:', typeof bimRouter);
console.log('--- [SERVER.TS] bimRouter object:', bimRouter); // Log the router object itself
app.use("/api/bim", bimRouter); // BIM routes, standardized under /api
console.log('--- [SERVER.TS] bimRouter mounted for /api/bim ---');

// Inline test route for catalogue path
app.get("/api/v1/catalogue/ping", (req, res) => {
  console.log("--- /api/v1/catalogue/ping HIT (inline in server.ts) ---");
  res.status(200).send("Catalogue ping from server.ts is OK!");
});

app.use("/api/v1/catalogue", catalogueRouter); // Consolidated Catalogue routes
app.use("/api/materials", materialRouter); // Material routes, specific path
app.use("/api/site-visit-boxes", siteVisitBoxRouter); // SiteVisitBox routes, specific path


// Swagger UI
app.use(openAPIRouter); // Assuming this serves API docs, path might need review if it conflicts

// Error handlers
app.use(errorHandler());

export { app, logger };
