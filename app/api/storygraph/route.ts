import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const command = searchParams.get('command')
  const query = searchParams.get('query')

  if (!command || !query) {
    return NextResponse.json(
      { error: 'Missing command or query parameter' },
      { status: 400 }
    )
  }

  if (!['search', 'book', 'isbn'].includes(command)) {
    return NextResponse.json(
      { error: 'Invalid command. Use: search, book, or isbn' },
      { status: 400 }
    )
  }

  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'storygraph_client.py')
    
    const result = await new Promise((resolve, reject) => {
      const python = spawn('python3', [scriptPath, command, query])
      
      let output = ''
      let error = ''
      
      python.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      python.stderr.on('data', (data) => {
        error += data.toString()
      })
      
      python.on('close', (code) => {
        if (code === 0) {
          try {
            const parsed = JSON.parse(output)
            resolve(parsed)
          } catch (e) {
            reject(new Error('Failed to parse Python output'))
          }
        } else {
          reject(new Error(`Python script failed: ${error}`))
        }
      })
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('StoryGraph API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data from StoryGraph' },
      { status: 500 }
    )
  }
}
