import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8080),
  FRONTEND_URL: z.string().url(),

  // Rate Limiting
  COMMON_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
  COMMON_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),

  // CORS
  CORS_ORIGIN: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().min(1).default('1h'),

  // Database
  DATABASE_URL: z.string().min(1),

  // GCP Configuration
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GCP_BUCKET_NAME: z.string().optional(),

  // Zoho CRM Configuration
  ZOHO_CLIENT_ID: z.string().optional(),
  ZOHO_CLIENT_SECRET: z.string().optional(),
  ZOHO_REFRESH_TOKEN: z.string().optional(),

  // Google Calendar Configuration
  GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
  GOOGLE_CALENDAR_PRIVATE_KEY: z.string().optional(),
  GOOGLE_CALENDAR_ID: z.string().optional(),
  GOOGLE_CALENDAR_DEFAULT_ATTENDEE: z.string().optional(),

  // Admin User Setup
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    '❌ Invalid environment variables:',
    JSON.stringify(parsedEnv.error.format(), null, 4),
  );
  process.exit(1);
}

export const env = parsedEnv.data;

// Validate GCP variables if GCP_BUCKET_NAME is provided
if (env.GCP_BUCKET_NAME) {
  if (!env.GOOGLE_CLOUD_PROJECT) {
    console.error('❌ Missing GOOGLE_CLOUD_PROJECT for GCS configuration.');
    process.exit(1);
  }
  if (!env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('❌ Missing GOOGLE_APPLICATION_CREDENTIALS for GCS configuration.');
    process.exit(1);
  }
}

// Validate Zoho CRM variables if any Zoho variable is provided
if (env.ZOHO_CLIENT_ID || env.ZOHO_CLIENT_SECRET || env.ZOHO_REFRESH_TOKEN) {
  if (!env.ZOHO_CLIENT_ID || !env.ZOHO_CLIENT_SECRET || !env.ZOHO_REFRESH_TOKEN) {
    console.error('❌ Missing required Zoho CRM configuration variables.');
    process.exit(1);
  }
}

// Validate Google Calendar variables if any Calendar variable is provided
if (env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL || env.GOOGLE_CALENDAR_PRIVATE_KEY || env.GOOGLE_CALENDAR_ID) {
  if (!env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_CALENDAR_PRIVATE_KEY || !env.GOOGLE_CALENDAR_ID) {
    console.error('❌ Missing required Google Calendar configuration variables.');
    process.exit(1);
  }
}
