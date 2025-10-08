import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('Fetch all covers API called')
    
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        error: 'This API is only available in development mode'
      }, { status: 403 })
    }

    const scriptPath = path.join(process.cwd(), 'scripts', 'fetch-all-api-covers.js')
    
    console.log(`Running script: ${scriptPath}`)
    
    // Run the comprehensive cover fetch script
    const { stdout, stderr } = await execAsync(`node "${scriptPath}"`, {
      cwd: process.cwd(),
      timeout: 300000 // 5 minute timeout
    })

    if (stderr) {
      console.error('Script stderr:', stderr)
    }

    console.log('Script stdout:', stdout)

    return NextResponse.json({
      success: true,
      message: 'Comprehensive cover fetch completed',
      output: stdout,
      errors: stderr || null
    })

  } catch (error) {
    console.error('Fetch all covers error:', error)
    
    // Handle timeout or other execution errors
    if (error.code === 'TIMEOUT') {
      return NextResponse.json({
        error: 'Script execution timed out (5 minutes)',
        details: 'The cover fetch process took too long to complete'
      }, { status: 408 })
    }

    return NextResponse.json({
      error: 'Failed to execute cover fetch script',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        error: 'This API is only available in development mode'
      }, { status: 403 })
    }

    return NextResponse.json({
      message: 'Comprehensive cover fetch API',
      description: 'POST to this endpoint to fetch covers from all external APIs',
      apis: [
        'Google Books API',
        'Open Library API', 
        'StoryGraph (placeholder)',
        'Amazon API (placeholder)'
      ],
      usage: 'POST /api/fetch-all-covers to start the process'
    })

  } catch (error) {
    console.error('Get fetch all covers info error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
