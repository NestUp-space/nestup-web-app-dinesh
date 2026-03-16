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
    // Ensure path aliases resolve in all environments (CI/build)
    const src = path.resolve(__dirname, "src");
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": src,
      "@components": path.resolve(__dirname, "src/components"),
      "@context": path.resolve(__dirname, "src/context"),
      "@img": path.resolve(__dirname, "public/img"),
      "@lib": path.resolve(__dirname, "lib"),
      "@constants": path.resolve(__dirname, "src/constants"),
    };
    return config;
  },
};

export default nextConfig;
