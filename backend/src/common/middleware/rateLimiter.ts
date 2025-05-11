import type { Request } from "express";
import rateLimit from "express-rate-limit"; // Try as default import

import { env } from "@/common/utils/envConfig";

const rateLimiter = rateLimit({
  // legacyHeaders: true, // Not available in v5.x.x
  max: env.COMMON_RATE_LIMIT_MAX_REQUESTS, // Changed 'limit' to 'max'
  message: "Too many requests, please try again later.",
  // standardHeaders: true, // Not available in v5.x.x
  windowMs: 15 * 60 * env.COMMON_RATE_LIMIT_WINDOW_MS,
  keyGenerator: (req: Request) => req.ip as string,
});

export default rateLimiter;
