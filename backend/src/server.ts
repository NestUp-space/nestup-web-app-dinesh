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
import { env } from "@/config/env"; // Updated path

const logger = pino({ name: "server start" });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set("trust proxy", true);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
const allowedOrigins = env.CORS_ORIGIN 
  ? env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [env.FRONTEND_URL];

console.log('--- [CORS DEBUG] Allowed origins:', allowedOrigins);
console.log('--- [CORS DEBUG] CORS_ORIGIN env var:', env.CORS_ORIGIN);
console.log('--- [CORS DEBUG] FRONTEND_URL env var:', env.FRONTEND_URL);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    console.log('--- [CORS DEBUG] Incoming origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('--- [CORS DEBUG] No origin provided, allowing request');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list using includes() instead of indexOf()
    const isAllowed = allowedOrigins.includes(origin);
    console.log('--- [CORS DEBUG] Origin allowed:', isAllowed);
    console.log('--- [CORS DEBUG] Checking origin:', origin, 'against allowed origins:', allowedOrigins);
    
    if (!isAllowed) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`;
      console.log('--- [CORS DEBUG] CORS blocked:', msg);
      return callback(new Error(msg), false);
    }
    
    console.log('--- [CORS DEBUG] CORS allowed for origin:', origin);
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers"
  ],
  exposedHeaders: ["Content-Length", "X-Foo", "X-Bar"],
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

// Additional CORS debugging middleware
app.use((req, res, next) => {
  console.log('--- [REQUEST DEBUG] Method:', req.method);
  console.log('--- [REQUEST DEBUG] URL:', req.url);
  console.log('--- [REQUEST DEBUG] Origin:', req.headers.origin);
  console.log('--- [REQUEST DEBUG] Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

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
app.get("/api/v1/catalogue/ping", (_req, res) => { // req prefixed with _
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

// Start the server
const PORT = env.PORT || 8080;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});

export { app, logger };
