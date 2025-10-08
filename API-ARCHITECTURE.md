# Book Scanner API Architecture

## 🎯 **Primary API Strategy**

Since starting fresh, we've implemented a **TOS-friendly, reliable API hierarchy** that prioritizes open-source, free APIs.

---

## 📊 **API Hierarchy**

### **1. Primary Source: Open Library API**
- **URL**: `https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data`
- **Auth Required**: ❌ None
- **Data Quality**: ⭐⭐⭐⭐
- **Cover URL**: `https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg`
- **Why First**: 
  - ✅ Free and open source
  - ✅ No API keys required
  - ✅ Reliable and stable
  - ✅ Cacheable results
  - ✅ No usage limits
  - ✅ Public domain data

### **2. Fallback Source: Google Books API**
- **URL**: `https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}`
- **Auth Required**: ✅ API key required (but not implemented yet)
- **Data Quality**: ⭐⭐⭐⭐⭐
- **Why Second**: 
  - ✅ Excellent metadata quality
  - ✅ High-quality cover images
  - ⚠️ Subject to quota limits
  - ⚠️ Requires API key management
  - ⚠️ Not redistributable beyond derived metadata

---

## 🔄 **Implementation Flow**

```typescript
// 1. Try Open Library API first (primary source)
const openLibResult = await fetchFromOpenLibrary(cleanIsbn)
if (openLibResult) {
  console.log(`✅ Found book via Open Library: ${openLibResult.title}`)
  return openLibResult
}

// 2. Fallback to Google Books API
console.log(`Open Library failed, trying Google Books...`)
const googleResult = await fetchFromGoogleBooks(cleanIsbn)
if (googleResult) {
  console.log(`✅ Found book via Google Books: ${googleResult.title}`)
  return googleResult
}

// 3. Both APIs failed
console.log(`❌ Book not found in any API for ISBN: ${cleanIsbn}`)
return null
```

---

## 📁 **File Structure**

### **Main API Logic**
- **`lib/book-api.ts`** - Primary book fetching with API hierarchy
- **`app/api/scan-isbn/route.ts`** - API endpoint that uses the book API

### **Cover Management**
- Covers are automatically fetched via the main API hierarchy
- No additional cover management tools needed

---

## 🛡️ **TOS Compliance**

### **Open Library**
- ✅ **Public domain data** - safe to cache and store
- ✅ **Open license** - no redistribution restrictions
- ✅ **No usage limits** - can be called frequently
- ✅ **Cacheable** - results can be stored in Supabase

### **Google Books**
- ⚠️ **Limited redistribution** - can store derived metadata (title, author, cover)
- ⚠️ **Quota limits** - subject to API rate limits
- ⚠️ **Key management** - requires API key setup

---

## 🚀 **Benefits of This Architecture**

1. **Reliability**: Open Library is stable and doesn't require API keys
2. **Performance**: Primary API is fast and cacheable
3. **Cost**: No API costs for primary source
4. **Compliance**: TOS-friendly with proper attribution
5. **Fallback**: Google Books provides high-quality backup
6. **Consistency**: Same API endpoints used across all tools

---

## 🔧 **Usage Examples**

### **Basic Book Lookup**
```typescript
import { fetchBookByISBN } from '@/lib/book-api'

const book = await fetchBookByISBN('9780008710262')
if (book) {
  console.log(`Found: ${book.title} by ${book.author}`)
  console.log(`Cover: ${book.cover_url}`)
}
```

### **API Endpoint**
```bash
curl -X POST http://localhost:3000/api/scan-isbn \
  -H "Content-Type: application/json" \
  -d '{"isbn": "9780008710262"}'
```

### **Cover Management**
Covers are automatically fetched and managed through the main API hierarchy. No additional tools needed.

---

## 📈 **Future Enhancements**

1. **Google Books API Key**: Add optional API key for better fallback
2. **Caching Layer**: Implement Redis for API response caching
3. **Rate Limiting**: Add proper rate limiting for API calls
4. **Error Monitoring**: Add logging and monitoring for API failures
5. **Additional Sources**: Consider adding ISBNdb or other sources

---

## 🧪 **Testing**

The API hierarchy is tested automatically when scanning books. The system will:
1. Try Open Library API first
2. Fallback to Google Books if needed
3. Log the results for debugging
