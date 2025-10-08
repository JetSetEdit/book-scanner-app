#!/usr/bin/env node

/**
 * Script to fetch better book covers from Open Library for problematic books
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Books that need better covers (small file sizes)
const problematicBooks = [
  { 
    isbn: "9781668001234", 
    title: "Holiday Ever After", 
    author: "Hannah Grace",
    searchTerm: "Holiday Ever After Hannah Grace"
  },
  { 
    isbn: "9781668001235", 
    title: "Daydream", 
    author: "Hannah Grace",
    searchTerm: "Daydream Hannah Grace"
  },
  { 
    isbn: "9781668001237", 
    title: "Icebreaker", 
    author: "Hannah Grace",
    searchTerm: "Icebreaker Hannah Grace"
  }
];

// Create covers directory if it doesn't exist
const coversDir = path.join(__dirname, '..', 'public', 'book-covers');
if (!fs.existsSync(coversDir)) {
  fs.mkdirSync(coversDir, { recursive: true });
}

/**
 * Download image from URL and save to file
 */
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✅ Downloaded: ${path.basename(filepath)}`);
          resolve(filepath);
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(filepath, () => {}); // Delete partial file
          reject(err);
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
      }
    }).on('error', reject);
  });
}

/**
 * Fetch book data from Open Library API using title search
 */
async function fetchFromOpenLibrary(searchTerm) {
  const encodedSearch = encodeURIComponent(searchTerm);
  const url = `https://openlibrary.org/search.json?q=${encodedSearch}&limit=10`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.docs && data.docs.length > 0) {
      for (const doc of data.docs) {
        // Look for books with cover images
        if (doc.cover_i) {
          // Try different cover sizes
          const coverSizes = ['L', 'M', 'S']; // Large, Medium, Small
          for (const size of coverSizes) {
            const coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-${size}.jpg`;
            try {
              // Test if the cover exists
              const testResponse = await fetch(coverUrl, { method: 'HEAD' });
              if (testResponse.ok) {
                return {
                  cover_url: coverUrl,
                  title: doc.title,
                  author: doc.author_name?.[0],
                  description: doc.first_sentence?.[0],
                  cover_size: size
                };
              }
            } catch (e) {
              continue;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(`Open Library error for "${searchTerm}":`, error.message);
  }
  
  return null;
}

/**
 * Try to find cover from Goodreads via Open Library
 */
async function fetchFromGoodreads(searchTerm) {
  // Goodreads doesn't have a public API, but we can try searching Open Library
  // which sometimes has Goodreads data
  const encodedSearch = encodeURIComponent(`${searchTerm} goodreads`);
  const url = `https://openlibrary.org/search.json?q=${encodedSearch}&limit=5`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.docs && data.docs.length > 0) {
      for (const doc of data.docs) {
        if (doc.cover_i) {
          return {
            cover_url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
            title: doc.title,
            author: doc.author_name?.[0],
            source: 'goodreads_via_openlibrary'
          };
        }
      }
    }
  } catch (error) {
    console.error(`Goodreads search error for "${searchTerm}":`, error.message);
  }
  
  return null;
}

/**
 * Process a single book
 */
async function processBook(book) {
  console.log(`\n📚 Processing: ${book.title} by ${book.author}`);
  console.log(`  🔍 Searching for: "${book.searchTerm}"`);
  
  // Try Open Library first
  let bookData = await fetchFromOpenLibrary(book.searchTerm);
  
  // Fallback to Goodreads search
  if (!bookData) {
    console.log(`  🔄 Trying Goodreads via Open Library...`);
    bookData = await fetchFromGoodreads(book.searchTerm);
  }
  
  if (!bookData || !bookData.cover_url) {
    console.log(`  ❌ No better cover found for ${book.title}`);
    return null;
  }
  
  console.log(`  📖 Found cover: ${bookData.cover_url}`);
  console.log(`  📝 Title match: "${bookData.title}"`);
  console.log(`  👤 Author match: "${bookData.author}"`);
  console.log(`  📏 Cover size: ${bookData.cover_size || 'L'}`);
  
  // Create filename
  const safeTitle = book.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const filename = `${book.isbn}_${safeTitle}_better.jpg`;
  const filepath = path.join(coversDir, filename);
  
  try {
    // Download the image
    await downloadImage(bookData.cover_url, filepath);
    
    // Check file size
    const stats = fs.statSync(filepath);
    const fileSizeKB = Math.round(stats.size / 1024);
    console.log(`  📊 File size: ${fileSizeKB}KB`);
    
    if (fileSizeKB < 10) {
      console.log(`  ⚠️  Warning: File size is very small (${fileSizeKB}KB), might be low quality`);
    }
    
    // Return the local URL
    return {
      isbn: book.isbn,
      title: book.title,
      local_cover_url: `/book-covers/${filename}`,
      original_cover_url: bookData.cover_url,
      found_title: bookData.title,
      found_author: bookData.author,
      file_size_kb: fileSizeKB,
      source: bookData.source || 'openlibrary'
    };
  } catch (error) {
    console.error(`  ❌ Failed to download cover for ${book.title}:`, error.message);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting better book cover fetch process...\n');
  
  const results = [];
  
  for (const book of problematicBooks) {
    const result = await processBook(book);
    if (result) {
      results.push(result);
    }
    
    // Add delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Successfully downloaded: ${results.length} better covers`);
  console.log(`  ❌ Failed: ${problematicBooks.length - results.length} covers`);
  
  if (results.length > 0) {
    console.log(`\n📁 Covers saved to: ${coversDir}`);
    console.log(`\n📋 Results:`);
    results.forEach(result => {
      console.log(`  ${result.title}: ${result.local_cover_url} (${result.file_size_kb}KB)`);
      console.log(`    Found as: "${result.found_title}" by ${result.found_author}`);
    });
    
    // Save results to JSON file for reference
    const resultsFile = path.join(__dirname, '..', 'better-covers-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${resultsFile}`);
  }
  
  console.log('\n🎉 Better cover fetch process complete!');
}

// Run the script
main().catch(console.error);
