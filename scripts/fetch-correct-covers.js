#!/usr/bin/env node

/**
 * Script to fetch correct book covers by searching with actual book titles
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Book data with correct search terms
const books = [
  { 
    isbn: "9780008710262", 
    title: "When the Moon Hatched", 
    author: "Sarah A. Parker",
    searchTerm: "When the Moon Hatched Sarah A. Parker"
  },
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
    isbn: "9781668001236", 
    title: "Wildfire", 
    author: "Hannah Grace",
    searchTerm: "Wildfire Hannah Grace"
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
 * Fetch book data from Google Books API using title search
 */
async function fetchFromGoogleBooks(searchTerm) {
  const encodedSearch = encodeURIComponent(searchTerm);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodedSearch}&maxResults=5`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      // Look for the best match
      for (const item of data.items) {
        const book = item.volumeInfo;
        if (book.imageLinks?.thumbnail) {
          return {
            cover_url: book.imageLinks.thumbnail.replace('http:', 'https:').replace('zoom=1', 'zoom=2'),
            title: book.title,
            author: book.authors?.[0],
            description: book.description
          };
        }
      }
    }
  } catch (error) {
    console.error(`Google Books error for "${searchTerm}":`, error.message);
  }
  
  return null;
}

/**
 * Fetch book data from Open Library API using title search
 */
async function fetchFromOpenLibrary(searchTerm) {
  const encodedSearch = encodeURIComponent(searchTerm);
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
            description: doc.first_sentence?.[0]
          };
        }
      }
    }
  } catch (error) {
    console.error(`Open Library error for "${searchTerm}":`, error.message);
  }
  
  return null;
}

/**
 * Process a single book
 */
async function processBook(book) {
  console.log(`\n📚 Processing: ${book.title} by ${book.author}`);
  console.log(`  🔍 Searching for: "${book.searchTerm}"`);
  
  // Try Google Books first with title search
  let bookData = await fetchFromGoogleBooks(book.searchTerm);
  
  // Fallback to Open Library
  if (!bookData) {
    console.log(`  🔄 Trying Open Library...`);
    bookData = await fetchFromOpenLibrary(book.searchTerm);
  }
  
  if (!bookData || !bookData.cover_url) {
    console.log(`  ❌ No cover found for ${book.title}`);
    return null;
  }
  
  console.log(`  📖 Found cover: ${bookData.cover_url}`);
  console.log(`  📝 Title match: "${bookData.title}"`);
  console.log(`  👤 Author match: "${bookData.author}"`);
  
  // Create filename
  const safeTitle = book.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const extension = bookData.cover_url.includes('.jpg') ? 'jpg' : 'png';
  const filename = `${book.isbn}_${safeTitle}.${extension}`;
  const filepath = path.join(coversDir, filename);
  
  try {
    // Download the image
    await downloadImage(bookData.cover_url, filepath);
    
    // Return the local URL
    return {
      isbn: book.isbn,
      title: book.title,
      local_cover_url: `/book-covers/${filename}`,
      original_cover_url: bookData.cover_url,
      found_title: bookData.title,
      found_author: bookData.author
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
  console.log('🚀 Starting correct book cover fetch process...\n');
  
  const results = [];
  
  for (const book of books) {
    const result = await processBook(book);
    if (result) {
      results.push(result);
    }
    
    // Add delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Successfully downloaded: ${results.length} covers`);
  console.log(`  ❌ Failed: ${books.length - results.length} covers`);
  
  if (results.length > 0) {
    console.log(`\n📁 Covers saved to: ${coversDir}`);
    console.log(`\n📋 Results:`);
    results.forEach(result => {
      console.log(`  ${result.title}: ${result.local_cover_url}`);
      console.log(`    Found as: "${result.found_title}" by ${result.found_author}`);
    });
    
    // Save results to JSON file for reference
    const resultsFile = path.join(__dirname, '..', 'correct-covers-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${resultsFile}`);
  }
  
  console.log('\n🎉 Correct cover fetch process complete!');
}

// Run the script
main().catch(console.error);
