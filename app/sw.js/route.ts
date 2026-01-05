import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    const swPath = join(process.cwd(), 'public', 'sw.js')
    const swContent = readFileSync(swPath, 'utf-8')
    
    return new NextResponse(swContent, {
      headers: {
        'Content-Type': 'application/javascript',
        'Service-Worker-Allowed': '/',
      },
    })
  } catch (error) {
    return new NextResponse('Service worker not found', { status: 404 })
  }
}


















