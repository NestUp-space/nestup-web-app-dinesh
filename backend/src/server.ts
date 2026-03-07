import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";

import { openAPIRouter } from "@/api-docs/openAPIRouter";
import { healthCheckRouter } from "@/api/healthCheck/healthCheckRouter";
import userRouter from "@/routes/user.routes"; // Corrected user router
import authRouter from "@/routes/auth.routes"; // Auth router
import roleRouter from "@/routes/role.routes"; // Role router
import projectRouter from "@/routes/project.routes"; // Project router
import bimRouter from "@/bim/routes/bim.routes"; // BIM router
// Catalogue Router
import catalogueRouter from "./catalogue/routes/model.routes"; // Model management router - CHANGED TO RELATIVE PATH
import materialRouter from "@/routes/material.routes"; // Material router
import siteVisitBoxRouter from "@/routes/siteVisitBox.routes"; // SiteVisitBox router
import lidarRouter from "./lidar/routes/lidar.routes"; // LiDAR router
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

const isDev = env.NODE_ENV === 'development';
if (isDev) {
  console.log('[CORS] Allowed origins:', allowedOrigins);
}

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      return callback(null, true);
    }
    
    const isAllowed = allowedOrigins.includes(origin);
    
    if (!isAllowed) {
      const msg = `CORS policy does not allow origin: ${origin}`;
      if (isDev) console.log('[CORS] Blocked:', origin);
      return callback(new Error(msg), false);
    }
    
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

app.use(helmet());
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes
app.use("/health-check", healthCheckRouter);
app.use("/api/users", userRouter); // Standardized under /api
app.use("/api/auth", authRouter); // Auth routes
app.use("/api/roles", roleRouter); // Role routes
app.use("/api/projects", projectRouter); // Project routes

app.use("/api/bim", bimRouter);
app.use("/api/v1/catalogue", catalogueRouter);
app.use("/api/materials", materialRouter); // Material routes, specific path
app.use("/api/site-visit-boxes", siteVisitBoxRouter); // SiteVisitBox routes, specific path
app.use("/api/lidar", lidarRouter); // LiDAR routes for session management


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
