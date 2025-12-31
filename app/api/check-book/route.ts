import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normalizeISBN } from '@/lib/isbn-validation'
import { fetchCandidatesByISBN } from '@/lib/book-api'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Helper to send progress update
function sendProgress(controller: ReadableStreamDefaultController, data: any) {
  const encoder = new TextEncoder()
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
}

export async function POST(request: NextRequest) {
  const { isbn } = await request.json()
  
  if (!isbn) {
    return new Response(JSON.stringify({ error: 'ISBN is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const cleanIsbn = normalizeISBN(isbn)
  
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      
      try {
        // Send initial status
        sendProgress(controller, { type: 'start', isbn: cleanIsbn })
        
        // Check 1: Database
        sendProgress(controller, { type: 'check', step: 1, name: 'Database Check', status: 'checking' })
        
        const { data: dbBook, error: dbError } = await supabase
          .from('books')
          .select('id, title, author, cover_url, description')
          .eq('isbn', cleanIsbn)
          .maybeSingle()
        
        if (dbError) {
          sendProgress(controller, {
            type: 'result',
            step: 1,
            name: 'Database Check',
            data: { found: false, error: dbError.message }
          })
        } else if (dbBook) {
          sendProgress(controller, {
            type: 'result',
            step: 1,
            name: 'Database Check',
            data: {
              found: true,
              title: dbBook.title,
              author: dbBook.author,
              cover_url: dbBook.cover_url,
              description: dbBook.description
            }
          })
        } else {
          sendProgress(controller, {
            type: 'result',
            step: 1,
            name: 'Database Check',
            data: { found: false }
          })
        }

        // Check 2: Cover
        sendProgress(controller, { type: 'check', step: 2, name: 'Cover Check', status: 'checking' })
        
        if (dbBook?.cover_url) {
          try {
            const response = await fetch(dbBook.cover_url, { method: 'HEAD' })
            if (response.ok) {
              const contentLength = response.headers.get('content-length')
              const size = contentLength ? parseInt(contentLength) : 0
              
              if (size > 1000 && size !== 15567) {
                sendProgress(controller, {
                  type: 'result',
                  step: 2,
                  name: 'Cover Check',
                  data: { found: true, size, valid: true }
                })
              } else {
                sendProgress(controller, {
                  type: 'result',
                  step: 2,
                  name: 'Cover Check',
                  data: { found: false, size, valid: false }
                })
              }
            } else {
              sendProgress(controller, {
                type: 'result',
                step: 2,
                name: 'Cover Check',
                data: { found: false, valid: false }
              })
            }
          } catch (error) {
            sendProgress(controller, {
              type: 'result',
              step: 2,
              name: 'Cover Check',
              data: { found: false, valid: false }
            })
          }
        } else {
          sendProgress(controller, {
            type: 'result',
            step: 2,
            name: 'Cover Check',
            data: { found: false }
          })
        }

        // Check 3: Description
        sendProgress(controller, { type: 'check', step: 3, name: 'Description Check', status: 'checking' })
        
        if (dbBook?.description) {
          const descLength = dbBook.description.length
          sendProgress(controller, {
            type: 'result',
            step: 3,
            name: 'Description Check',
            data: {
              found: true,
              length: descLength,
              isThin: descLength < 150
            }
          })
        } else {
          sendProgress(controller, {
            type: 'result',
            step: 3,
            name: 'Description Check',
            data: { found: false }
          })
        }

        // Check 4: External APIs
        sendProgress(controller, { type: 'check', step: 4, name: 'External API Check', status: 'checking' })
        
        try {
          const candidates = await fetchCandidatesByISBN(cleanIsbn)
          if (candidates.length > 0) {
            sendProgress(controller, {
              type: 'result',
              step: 4,
              name: 'External API Check',
              data: {
                found: true,
                candidates: candidates.length,
                candidateList: candidates.slice(0, 3).map(c => ({
                  title: c.title,
                  author: c.author,
                  source: c.source
                }))
              }
            })
          } else {
            sendProgress(controller, {
              type: 'result',
              step: 4,
              name: 'External API Check',
              data: { found: false }
            })
          }
        } catch (error) {
          sendProgress(controller, {
            type: 'result',
            step: 4,
            name: 'External API Check',
            data: {
              found: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          })
        }

        // Check 5: Content Warnings
        sendProgress(controller, { type: 'check', step: 5, name: 'Content Warnings Check', status: 'checking' })
        
        if (dbBook) {
          const { data: warnings, error: warningsError } = await supabase
            .from('content_warnings')
            .select('id, severity')
            .eq('book_id', dbBook.id)
          
          if (warningsError) {
            sendProgress(controller, {
              type: 'result',
              step: 5,
              name: 'Content Warnings Check',
              data: { found: false, error: warningsError.message }
            })
          } else if (warnings && warnings.length > 0) {
            const severityCounts = warnings.reduce((acc, w) => {
              acc[w.severity] = (acc[w.severity] || 0) + 1
              return acc
            }, {} as Record<string, number>)
            
            sendProgress(controller, {
              type: 'result',
              step: 5,
              name: 'Content Warnings Check',
              data: {
                found: true,
                count: warnings.length,
                severityCounts
              }
            })
          } else {
            sendProgress(controller, {
              type: 'result',
              step: 5,
              name: 'Content Warnings Check',
              data: { found: false }
            })
          }
        } else {
          sendProgress(controller, {
            type: 'result',
            step: 5,
            name: 'Content Warnings Check',
            data: { found: false }
          })
        }

        // Send completion
        sendProgress(controller, { type: 'complete' })
        controller.close()
      } catch (error) {
        sendProgress(controller, {
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

