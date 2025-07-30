/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Temporarily enable to test build
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    typedRoutes: false, // Disable to avoid route type conflicts
  },
  // Headers function completely removed for unrestricted testing
  // async headers() {
  //   return [];
  // },
  // Rewrites removed - Nginx handles all proxying to avoid redirect loops
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: 'http://localhost:3000/api/:path*',
  //     },
  //     {
  //       source: '/health',
  //       destination: 'http://localhost:3000/health',
  //     },
  //   ]
  // },
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig
