import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['161.97.87.16'],
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb',
    },
  },
}

export default nextConfig
