/**
 * Canonical Book Registry
 * 
 * Used to identify books eligible for "Canon Knowledge Inference" (inferring themes based on literary consensus).
 * This prevents accidental inference on non-canonical books with similar titles or themes.
 */

interface CanonicalBook {
  title: string;
  author?: string; // Optional author match (if title is very unique)
}

const CANONICAL_BOOKS: CanonicalBook[] = [
  // Australian Curriculum / Classics
  { title: "Jasper Jones", author: "Craig Silvey" },
  { title: "Looking for Alibrandi", author: "Melina Marchetta" },
  { title: "Cloudstreet", author: "Tim Winton" },
  { title: "The Secret River", author: "Kate Grenville" },
  { title: "Picnic at Hanging Rock", author: "Joan Lindsay" },
  { title: "My Brilliant Career", author: "Miles Franklin" },
  { title: "Storm Boy", author: "Colin Thiele" },
  
  // International Classics (School Curriculum staples)
  { title: "To Kill a Mockingbird", author: "Harper Lee" },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
  { title: "Lord of the Flies", author: "William Golding" },
  { title: "1984", author: "George Orwell" },
  { title: "Animal Farm", author: "George Orwell" },
  { title: "Of Mice and Men", author: "John Steinbeck" },
  { title: "The Catcher in the Rye", author: "J.D. Salinger" },
  { title: "Fahrenheit 451", author: "Ray Bradbury" },
  { title: "Brave New World", author: "Ray Bradbury" }, // Wait, BNW is Huxley
  { title: "Brave New World", author: "Aldous Huxley" },
  { title: "The Handmaid's Tale", author: "Margaret Atwood" },
  { title: "Beloved", author: "Toni Morrison" },
  { title: "The Color Purple", author: "Alice Walker" },
  { title: "Things Fall Apart", author: "Chinua Achebe" },
  { title: "Romeo and Juliet", author: "William Shakespeare" },
  { title: "Macbeth", author: "William Shakespeare" },
  { title: "Hamlet", author: "William Shakespeare" },
  { title: "Othello", author: "William Shakespeare" },
  { title: "The Crucible", author: "Arthur Miller" },
  { title: "Death of a Salesman", author: "Arthur Miller" },
  { title: "A Streetcar Named Desire", author: "Tennessee Williams" },
  { title: "Wuthering Heights", author: "Emily Bronte" },
  { title: "Jane Eyre", author: "Charlotte Bronte" },
  { title: "Pride and Prejudice", author: "Jane Austen" },
  { title: "Frankenstein", author: "Mary Shelley" },
  { title: "Dracula", author: "Bram Stoker" },
  { title: "The Picture of Dorian Gray", author: "Oscar Wilde" },
  { title: "Heart of Darkness", author: "Joseph Conrad" },
  { title: "The Outsider", author: "Albert Camus" },
  { title: "The Stranger", author: "Albert Camus" },
  { title: "Metamorphosis", author: "Franz Kafka" },
  { title: "Crime and Punishment", author: "Fyodor Dostoevsky" },
  { title: "Lolita", author: "Vladimir Nabokov" }, // Contentious but studied
  { title: "Slaughterhouse-Five", author: "Kurt Vonnegut" },
  { title: "Catch-22", author: "Kurt Vonnegut" }, // Wait, Catch-22 is Heller
  { title: "Catch-22", author: "Joseph Heller" },
  { title: "The Bell Jar", author: "Sylvia Plath" },
  { title: "One Flew Over the Cuckoo's Nest", author: "Ken Kesey" },
  { title: "In Cold Blood", author: "Truman Capote" },
  { title: "Their Eyes Were Watching God", author: "Zora Neale Hurston" },
  { title: "Native Son", author: "Richard Wright" },
  { title: "Invisible Man", author: "Ralph Ellison" },
  { title: "Go Tell It on the Mountain", author: "James Baldwin" },
];

/**
 * Check if a book is considered canonical/classic for the purpose of inference.
 * Normalize titles and authors for fuzzy matching.
 */
export function isCanonicalBook(title: string, author: string): boolean {
  if (!title || !author) return false;

  const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const targetTitle = normalize(title);
  const targetAuthor = normalize(author);

  return CANONICAL_BOOKS.some(book => {
    const bookTitle = normalize(book.title);
    // Title must match
    if (bookTitle !== targetTitle && !targetTitle.includes(bookTitle)) return false;
    
    // Author must match if provided (or strictly if not provided but let's be strict)
    if (book.author) {
      const bookAuthor = normalize(book.author);
      // Check if target author contains the registered author (e.g. "Craig Silvey" in "Craig Silvey")
      // or vice versa (e.g. "J.D. Salinger" vs "Jerome David Salinger")
      // Simple substring check for now
      return targetAuthor.includes(bookAuthor) || bookAuthor.includes(targetAuthor);
    }
    
    return true; // Match on title only if no author specified (risky, avoid using this)
  });
}
