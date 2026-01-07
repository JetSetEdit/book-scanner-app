import { execSync } from 'child_process'
import { existsSync } from 'fs'

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
    // Build ID (short git sha) exposed to the client.
    // IMPORTANT: Vercel build environments often do NOT include a .git directory.
    // Prefer Vercel-provided env vars; only fall back to git if .git exists locally.
    NEXT_PUBLIC_BUILD_ID: (() => {
      // Vercel provides the full SHA; use it if present.
      if (process.env.VERCEL_GIT_COMMIT_SHA) {
        return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
      }
      // Some environments may provide a short sha already.
      if (process.env.NEXT_PUBLIC_BUILD_ID) {
        return process.env.NEXT_PUBLIC_BUILD_ID
      }
      // Only try git if this is a real git working tree (avoids noisy fatal errors in CI/build sandboxes).
      if (!existsSync('.git')) {
        return process.env.NODE_ENV === 'development' ? 'dev' : 'unknown'
      }
      try {
        return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
      } catch (error) {
        // Not a git repo or git not available
        return process.env.NODE_ENV === 'development' ? 'dev' : 'unknown'
      }
    })(),
  },
}

export default nextConfig
