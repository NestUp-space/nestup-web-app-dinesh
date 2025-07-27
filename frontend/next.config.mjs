/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React Strict Mode to prevent double rendering in development
  reactStrictMode: false,
  images: {
    domains: ['img.youtube.com'],
  },
};

export default nextConfig;
