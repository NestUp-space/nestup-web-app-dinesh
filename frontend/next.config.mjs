/** @type {import('next').NextConfig} */
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
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
