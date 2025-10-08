#!/usr/bin/env node

/**
 * Comprehensive script to fetch book covers from all available external APIs
 * This is a dev tool to find the best possible covers for books
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
          const stats = fs.statSync(filepath);
          const sizeKB = Math.round(stats.size / 1024);
          console.log(`✅ Downloaded: ${path.basename(filepath)} (${sizeKB}KB)`);
          resolve({ filepath, sizeKB });
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
 * Fetch from Google Books API
 */
async function fetchFromGoogleBooks(isbn, title, author) {
  try {
    const searchQueries = [
      `isbn:${isbn}`,
      `"${title}" "${author}"`,
      `"${title}"`,
      `"${author}"`
    ];

    for (const query of searchQueries) {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=5`;
      
      const response = await fetch(url);
      if (!response.ok) continue;
      
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          const book = item.volumeInfo;
          if (book.imageLinks?.large || book.imageLinks?.medium || book.imageLinks?.small || book.imageLinks?.thumbnail) {
            const coverUrl = (book.imageLinks.large || book.imageLinks.medium || book.imageLinks.small || book.imageLinks.thumbnail || book.imageLinks.smallThumbnail)
              .replace("http:", "https:")
              .replace("&edge=curl", "")
              .replace("zoom=1", "zoom=2")
              .replace("zoom=5", "zoom=2");
            return {
              cover_url: coverUrl,
              title: book.title,
              author: book.authors?.[0],
              source: 'Google Books',
              variant: 'Google Books API',
              confidence: query.includes('isbn:') ? 'high' : 'medium'
            };
          }
        }
      }
    }
  } catch (error) {
    console.error(`Google Books error for ${title}:`, error.message);
  }
  return null;
}

/**
 * Fetch from Open Library API
 */
async function fetchFromOpenLibrary(isbn, title, author) {
  try {
    // Try ISBN search first
    const isbnUrl = `https://openlibrary.org/isbn/${isbn}.json`;
    const isbnResponse = await fetch(isbnUrl);
    
    if (isbnResponse.ok) {
      const isbnData = await isbnResponse.json();
      if (isbnData.covers && isbnData.covers.length > 0) {
        const coverId = isbnData.covers[0];
        const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
        return {
          cover_url: coverUrl,
          title: isbnData.title,
          author: isbnData.authors?.[0]?.author?.key ? 'Unknown' : 'Unknown',
          source: 'Open Library',
          variant: 'Open Library ISBN',
          confidence: 'high'
        };
      }
    }

    // Try direct ISBN-based cover first
    const directCoverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    try {
      const testResponse = await fetch(directCoverUrl, { method: 'HEAD' });
      if (testResponse.ok) {
        return {
          cover_url: directCoverUrl,
          title: title,
          author: author,
          source: 'Open Library',
          variant: 'Open Library ISBN Direct',
          confidence: 'high'
        };
      }
    } catch (error) {
      // Continue to search method
    }

    // Fallback to title search
    const searchQueries = [
      `"${title}" "${author}"`,
      `"${title}"`,
      `"${author}"`
    ];

    for (const query of searchQueries) {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://openlibrary.org/search.json?q=${encodedQuery}&limit=5`;
      
      const response = await fetch(url);
      if (!response.ok) continue;
      
      const data = await response.json();
      if (data.docs && data.docs.length > 0) {
        for (const doc of data.docs) {
          if (doc.cover_i) {
            const coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
            return {
              cover_url: coverUrl,
              title: doc.title,
              author: doc.author_name?.[0],
              source: 'Open Library',
              variant: 'Open Library Search',
              confidence: 'medium'
            };
          }
        }
      }
    }
  } catch (error) {
    console.error(`Open Library error for ${title}:`, error.message);
  }
  return null;
}

/**
 * Fetch from StoryGraph API (if available)
 */
async function fetchFromStoryGraph(title, author) {
  try {
    // StoryGraph doesn't have a public API, but we can try searching their website
    // This is a placeholder for future implementation
    console.log(`StoryGraph search not implemented yet for ${title}`);
  } catch (error) {
    console.error(`StoryGraph error for ${title}:`, error.message);
  }
  return null;
}

/**
 * Fetch from Amazon Product Advertising API (if available)
 */
async function fetchFromAmazon(isbn, title) {
  try {
    // Amazon requires API credentials and has strict terms
    // This is a placeholder for future implementation
    console.log(`Amazon API search not implemented yet for ${title}`);
  } catch (error) {
    console.error(`Amazon error for ${title}:`, error.message);
  }
  return null;
}

/**
 * Process a single book through all APIs
 */
async function processBook(book) {
  console.log(`\n📚 Processing: ${book.title} by ${book.author}`);
  console.log(`  📖 ISBN: ${book.isbn}`);
  
  const results = [];
  const apis = [
    { name: 'Google Books', fn: () => fetchFromGoogleBooks(book.isbn, book.title, book.author) },
    { name: 'Open Library', fn: () => fetchFromOpenLibrary(book.isbn, book.title, book.author) },
    { name: 'StoryGraph', fn: () => fetchFromStoryGraph(book.title, book.author) },
    { name: 'Amazon', fn: () => fetchFromAmazon(book.isbn, book.title) }
  ];

  for (const api of apis) {
    try {
      console.log(`  🔄 Trying ${api.name}...`);
      const result = await api.fn();
      
      if (result && result.cover_url) {
        console.log(`  📖 Found cover: ${result.cover_url}`);
        console.log(`  📝 Title match: "${result.title}"`);
        console.log(`  👤 Author match: "${result.author}"`);
        console.log(`  🎯 Confidence: ${result.confidence}`);
        
        // Create filename with source suffix
        const safeTitle = book.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const sourceSuffix = result.source.toLowerCase().replace(/\s+/g, '_');
        const filename = `${book.isbn}_${safeTitle}_${sourceSuffix}.jpg`;
        const filepath = path.join(coversDir, filename);
        
        try {
          const downloadResult = await downloadImage(result.cover_url, filepath);
          
          results.push({
            isbn: book.isbn,
            title: book.title,
            local_cover_url: `/book-covers/${filename}`,
            original_cover_url: result.cover_url,
            found_title: result.title,
            found_author: result.author,
            source: result.source,
            variant: result.variant,
            confidence: result.confidence,
            file_size_kb: downloadResult.sizeKB,
            api_name: api.name
          });
        } catch (downloadError) {
          console.error(`  ❌ Failed to download from ${api.name}:`, downloadError.message);
        }
      } else {
        console.log(`  ❌ No cover found from ${api.name}`);
      }
    } catch (error) {
      console.error(`  ❌ ${api.name} error:`, error.message);
    }
    
    // Add delay between API calls to be respectful
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting comprehensive API cover fetch process...\n');
  
  // Get all books from database
  const { data: books, error } = await supabase
    .from('books')
    .select('isbn, title, author')
    .order('title');

  if (error) {
    console.error('Error fetching books from Supabase:', error.message);
    return;
  }

  if (!books || books.length === 0) {
    console.log('No books found in database.');
    return;
  }

  console.log(`Found ${books.length} books to process\n`);

  const allResults = [];
  let totalCovers = 0;
  let totalBooks = 0;

  for (const book of books) {
    const bookResults = await processBook(book);
    allResults.push(...bookResults);
    
    if (bookResults.length > 0) {
      totalCovers += bookResults.length;
      totalBooks++;
    }
    
    // Add delay between books
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n📊 Summary:`);
  console.log(`  📚 Books processed: ${books.length}`);
  console.log(`  📖 Books with covers found: ${totalBooks}`);
  console.log(`  🖼️  Total covers downloaded: ${totalCovers}`);
  console.log(`  📁 Covers saved to: ${coversDir}`);

  if (allResults.length > 0) {
    console.log(`\n📋 Results by API:`);
    const apiStats = {};
    allResults.forEach(result => {
      if (!apiStats[result.api_name]) {
        apiStats[result.api_name] = { count: 0, totalSize: 0 };
      }
      apiStats[result.api_name].count++;
      apiStats[result.api_name].totalSize += result.file_size_kb;
    });
    
    Object.entries(apiStats).forEach(([api, stats]) => {
      console.log(`  ${api}: ${stats.count} covers (${stats.totalSize}KB total)`);
    });

    // Save results to JSON file for reference
    const resultsFile = path.join(__dirname, '..', 'all-api-covers-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(allResults, null, 2));
    console.log(`\n💾 Results saved to: ${resultsFile}`);
  }

  console.log('\n🎉 Comprehensive API cover fetch process complete!');
  console.log('\n💡 Next steps:');
  console.log('  1. Go to http://localhost:3000/select-covers');
  console.log('  2. Review all the new cover options');
  console.log('  3. Select the best covers for each book');
  console.log('  4. Save your selections to update the database');
}

// Run the script
main().catch(console.error);
