import { defineConfig } from 'vitest/config'
import path from 'node:path'
import dotenv from 'dotenv'

// Load .env then .env.local so integration tests have SUPABASE_* and API keys when running locally
dotenv.config()
dotenv.config({ path: '.env.local' })

export default defineConfig({
  test: {
    include: ['**/*.test.ts', '**/__tests__/**/*.ts'],
    testTimeout: 60_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
