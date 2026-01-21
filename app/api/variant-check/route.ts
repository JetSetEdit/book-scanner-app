import { NextResponse } from 'next/server'
import { getVariantId, getVariantConfig } from '@/lib/config/variants'

export const runtime = 'nodejs'

/**
 * GET /api/variant-check
 * Returns the active variant and deployment environment for the running instance.
 * Safe to expose in all envs; no secrets. Use to verify Production vs Preview Lite.
 */
export async function GET() {
  const variant = getVariantId()
  const config = getVariantConfig()
  const appName = config?.name ?? 'unknown'

  return NextResponse.json({
    ok: true,
    variant,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    appName,
  })
}
