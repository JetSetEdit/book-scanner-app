
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://tawolulyrlnpxjyyxpdw.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhd29sdWx5cmxucHhqeXl4cGR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ5NDM5NywiZXhwIjoyMDc1MDcwMzk3fQ.ige4kgvZav25IO9cINTl6mPgg-ACHDsG8t-hLBiGqSM"

const supabase = createClient(supabaseUrl, supabaseKey)

async function rescanBook(isbn: string) {
    console.log(`🔄 Rescanning ISBN: ${isbn} (force refresh enabled)`)

    // Call the scan API endpoint with forceRefresh to regenerate warnings
    const response = await fetch(`http://localhost:3000/api/scan-isbn`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isbn, stream: true, forceRefresh: true })
    })

    if (!response.ok) {
        console.error(`❌ Failed to rescan: ${response.statusText}`)
        return
    }

    // Read the streaming response
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
        console.error('❌ No response body')
        return
    }

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                    console.log('✅ Rescan complete!')
                    return
                }
                try {
                    const parsed = JSON.parse(data)
                    if (parsed.status) {
                        console.log(`   ${parsed.status}`)
                    }
                    if (parsed.result) {
                        console.log('✅ Rescan complete!')
                        if (parsed.result.contentWarningsGenerated) {
                            console.log(`   Generated ${parsed.result.scan?.warnings?.length || 0} content warnings`)
                        }
                    }
                    if (parsed.error) {
                        console.error(`   ❌ Error: ${parsed.error}`)
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }
        }
    }
}

const isbn = process.argv[2]
if (!isbn) {
    console.log('Usage: npx tsx scripts/rescan-book.ts <ISBN>')
    console.log('Example: npx tsx scripts/rescan-book.ts 9780349441047')
} else {
    rescanBook(isbn)
}
