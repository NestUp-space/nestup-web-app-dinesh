import dotenv from 'dotenv';
dotenv.config();

// Mapper for environment variables
export const environment = process.env.NODE_ENV || "development";
export const port = process.env.PORT || 9000;
export const timezone = process.env.TZ;
export const jwtToken = process.env.JWT_SECRET || '';

export const db = {
  url: process.env.DATABASE_URL || "",
  minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || "5"),
  maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || "10"),
};

export const corsUrl = process.env.CORS_URL;

export const tokenInfo = {
  accessTokenValidity: parseInt(process.env.ACCESS_TOKEN_VALIDITY_SEC || "0"),
  refreshTokenValidity: parseInt(process.env.REFRESH_TOKEN_VALIDITY_SEC || "0"),
  issuer: process.env.TOKEN_ISSUER || "",
  audience: process.env.TOKEN_AUDIENCE || "",
};

export const logDirectory = process.env.LOG_DIR;

export const redis = {
  host: process.env.REDIS_HOST || "",
  port: parseInt(process.env.REDIS_PORT || "0"),
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD || "",
  protocol: process.env.REDIS_PROTOCOL || "redis",
};

export const caching = {
  contentCacheDuration: parseInt(
    process.env.CONTENT_CACHE_DURATION_MILLIS || "600000"
  ),
};

export const aws = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  s3Region: process.env.S3_REGION,
  s3Bucket: process.env.S3_BUCKET,
};

export const otp = {
  ttlInSec: process.env.OTP_TTL_IN_SEC,
}