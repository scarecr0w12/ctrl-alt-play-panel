/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
      {
        source: '/health',
        destination: 'http://localhost:3000/health',
      },
    ]
  },
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig
