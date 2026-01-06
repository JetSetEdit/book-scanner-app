import { execSync } from 'child_process'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: eslint config moved to separate eslintrc file (Next.js 15+)
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'books.google.com',
        pathname: '/books/content/**',
      },
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
        pathname: '/b/**',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
        pathname: '/images/**',
      },
    ],
  },
  env: {
    // Get git commit hash at build time
    NEXT_PUBLIC_BUILD_ID: (() => {
      try {
        return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
      } catch (error) {
        // Not a git repo or git not available
        return 'dev'
      }
    })(),
  },
}

export default nextConfig
