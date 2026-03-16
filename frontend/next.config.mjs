/** @type {import('next').NextConfig} */

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Strapi production URL (set in DigitalOcean for blog/CMS images)
const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
const strapiOrigin = strapiUrl ? new URL(strapiUrl).origin : null;

const nextConfig = {
  // Disable React Strict Mode to prevent double rendering in development
  reactStrictMode: false,
  // ArUco wall measurement is now integrated in the Next.js app at /measurements/* (no proxy).
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1338',
        pathname: '/uploads/**',
      },
      ...(strapiOrigin
        ? [
            {
              protocol: strapiOrigin.startsWith('https') ? 'https' : 'http',
              hostname: new URL(strapiOrigin).hostname,
              pathname: '/uploads/**',
            },
          ]
        : []),
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Reduce chunk load timeouts in dev (helps on slow filesystems e.g. OneDrive)
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    // Ensure @ alias resolves in all environments (CI/build)
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
    };
    return config;
  },
};

export default nextConfig;
