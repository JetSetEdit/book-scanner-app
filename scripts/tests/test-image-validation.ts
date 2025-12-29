
import { fetchBookByISBN } from '../lib/book-api';

async function testImageValidation() {
    console.log("Testing Image Validation Logic...");

    // Test Case 1: Book with known good cover (Harry Potter)
    console.log("\n--- Test Case 1: Known Good Cover ---");
    const hp = await fetchBookByISBN('9780590353427');
    if (hp?.cover_url) {
        console.log("✅ Success: Found cover for Harry Potter:", hp.cover_url);
    } else {
        console.log("❌ Failed: No cover found for Harry Potter");
    }

    // Test Case 2: Book with potentially missing/tricky cover (older/obscure book)
    // Using a random older ISBN that might rely on OpenLibrary fallback
    console.log("\n--- Test Case 2: Obscure Book ---");
    const obscure = await fetchBookByISBN('9780140449136'); // The Odyssey (Penguin Classics)
    if (obscure?.cover_url) {
        console.log("✅ Success: Found cover for The Odyssey:", obscure.cover_url);
    } else {
        console.log("⚠️ Note: No cover found for The Odyssey (might be expected if API lacks it)");
    }
}

testImageValidation();
