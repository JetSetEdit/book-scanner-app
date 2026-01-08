import { NextRequest, NextResponse } from 'next/server'

/**
 * Debug endpoint to check if environment variables are accessible
 * Only available in development or with proper auth
 */
export async function GET(request: NextRequest) {
  // Only allow in development - block in production
  const isDev = process.env.NODE_ENV === 'development'
  
  // Check if request is from localhost
  const host = request.headers.get('host') || ''
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
  
  // Block in production or non-localhost
  if (!isDev || !isLocalhost) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    )
  }
  
  // Only show existence, not full value
  const response: any = {
    node_env: process.env.NODE_ENV,
    openai_key_exists: !!process.env.OPENAI_API_KEY,
    openai_key_length: process.env.OPENAI_API_KEY?.length || 0,
    openai_key_starts_with: process.env.OPENAI_API_KEY?.substring(0, 7) || 'not set',
    openai_key_preview: process.env.OPENAI_API_KEY 
      ? `${process.env.OPENAI_API_KEY.substring(0, 7)}...${process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 4)}`
      : 'not set',
  }

  // In dev, show more details
  response.relevant_env_vars = Object.keys(process.env)
    .filter(k => k.includes('OPENAI') || k.includes('API'))
    .reduce((acc, k) => {
      acc[k] = process.env[k] ? `exists (length: ${process.env[k]!.length})` : 'not set'
      return acc
    }, {} as Record<string, string>)

  return NextResponse.json(response)
}















