/**
 * Verify cover URLs by actually checking the image content
 */

const booksToCheck = [
  {
    title: 'Jack Ryan 26',
    isbn: '9781408732885',
    url: 'https://covers.openlibrary.org/b/isbn/9781408732885-L.jpg'
  },
  {
    title: 'Spanish Love Deception',
    isbn: '9781398515628',
    url: 'https://covers.openlibrary.org/b/isbn/9781398515628-L.jpg'
  },
  {
    title: 'Haunting Adeline',
    isbn: '9781638932468',
    url: 'https://covers.openlibrary.org/b/isbn/9781638932468-L.jpg'
  },
  {
    title: 'Rainbow Six',
    isbn: '9781408728024',
    url: 'https://covers.openlibrary.org/b/isbn/9781408728024-L.jpg'
  }
]

async function verifyCoverImages() {
  console.log('🔍 Verifying cover images for deleted books...\n')
  console.log('='.repeat(80))

  for (const book of booksToCheck) {
    console.log(`\n📚 ${book.title}`)
    console.log(`   ISBN: ${book.isbn}`)
    console.log(`   URL: ${book.url}`)
    
    try {
      const response = await fetch(book.url, {
        method: 'GET',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      if (!response.ok) {
        console.log(`   ❌ HTTP ${response.status}: ${response.statusText}`)
        continue
      }

      const contentType = response.headers.get('content-type') || ''
      console.log(`   ✅ HTTP ${response.status}`)
      console.log(`   Content-Type: ${contentType || '(not set)'}`)

      // Try to read the response to see what it actually is
      const buffer = await response.arrayBuffer()
      const size = buffer.byteLength
      console.log(`   Actual size: ${(size / 1024).toFixed(2)} KB`)

      // Check if it's HTML (error page) or actual image
      const textDecoder = new TextDecoder()
      const firstBytes = buffer.slice(0, 200)
      const textPreview = textDecoder.decode(firstBytes)
      
      if (textPreview.trim().startsWith('<!DOCTYPE') || textPreview.trim().startsWith('<html') || textPreview.trim().startsWith('<?xml')) {
        console.log(`   ❌ ERROR: Response is HTML/XML, not an image!`)
        console.log(`   Preview: ${textPreview.substring(0, 150).replace(/\n/g, ' ')}...`)
        continue
      }

      if (!contentType || !contentType.startsWith('image/')) {
        console.log(`   ⚠️  WARNING: Content-Type not set or not image/* (${contentType || 'none'})`)
      }

      // Check content length
      const contentLength = response.headers.get('content-length')
      if (contentLength) {
        const sizeKB = parseInt(contentLength) / 1024
        console.log(`   Content-Length header: ${sizeKB.toFixed(2)} KB`)
      }

      // Check if it's a valid image by looking at magic bytes
      const bytes = new Uint8Array(buffer.slice(0, 4))
      const magicBytes = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
      
      // JPEG: FF D8 FF
      // PNG: 89 50 4E 47
      // GIF: 47 49 46 38
      if (magicBytes.startsWith('ffd8ff')) {
        console.log(`   Format: JPEG ✓`)
      } else if (magicBytes.startsWith('89504e47')) {
        console.log(`   Format: PNG ✓`)
      } else if (magicBytes.startsWith('47494638')) {
        console.log(`   Format: GIF ✓`)
      } else {
        console.log(`   ⚠️  Unknown format (magic bytes: ${magicBytes})`)
        // Show first few bytes as text to see what it is
        const preview = textDecoder.decode(buffer.slice(0, 50))
        console.log(`   Preview: ${preview.substring(0, 50)}...`)
      }

      // Check if it might be a placeholder by size
      if (size < 5000) { // Less than 5KB is suspiciously small
        console.log(`   ⚠️  WARNING: Image is very small - might be a placeholder or broken`)
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log(`   ⚠️  Timeout: URL took too long to respond`)
      } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('getaddrinfo')) {
        console.log(`   ❌ DNS Error: Domain not found`)
      } else {
        console.log(`   ❌ Error: ${error.message}`)
      }
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('\n💡 Summary:')
  console.log('   - If image is very small (<5KB), it might be a placeholder')
  console.log('   - If Content-Type is not image/*, it\'s not a valid image')
  console.log('   - If format is unknown, the image might be corrupted')
}

verifyCoverImages().catch(console.error)

