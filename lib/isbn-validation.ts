/**
 * ISBN validation utilities
 */

/**
 * Validates if a string is a properly formatted ISBN
 */
export function validateISBN(isbn: string): boolean {
  const clean = isbn.replace(/[-\s]/g, '')
  
  // Check length (10 or 13 digits)
  if (clean.length !== 10 && clean.length !== 13) {
    return false
  }
  
  // Check if all characters are digits (except last character for ISBN-10 which can be X)
  if (clean.length === 10) {
    return /^\d{9}[\dX]$/.test(clean)
  } else {
    return /^\d{13}$/.test(clean)
  }
}

/**
 * Validates ISBN-10 checksum
 */
function validateISBN10Checksum(isbn: string): boolean {
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(isbn[i]) * (10 - i)
  }
  
  const checkDigit = isbn[9] === 'X' ? 10 : parseInt(isbn[9])
  return (sum + checkDigit) % 11 === 0
}

/**
 * Validates ISBN-13 checksum (EAN-13)
 */
function validateISBN13Checksum(isbn: string): boolean {
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(isbn[i])
    sum += digit * (i % 2 === 0 ? 1 : 3)
  }
  
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit === parseInt(isbn[12])
}

/**
 * Comprehensive ISBN validation including checksum
 */
export function validateISBNWithChecksum(isbn: string): boolean {
  const clean = isbn.replace(/[-\s]/g, '')
  
  // Basic format validation
  if (!validateISBN(isbn)) {
    return false
  }
  
  // Checksum validation
  if (clean.length === 10) {
    return validateISBN10Checksum(clean)
  } else {
    return validateISBN13Checksum(clean)
  }
}

/**
 * Normalizes ISBN by removing hyphens and spaces
 */
export function normalizeISBN(isbn: string): string {
  return isbn.replace(/[-\s]/g, '')
}

/**
 * Converts ISBN-10 to ISBN-13
 * ISBN-13 format: 978 + ISBN-10 (without check digit) + new check digit
 */
export function convertISBN10To13(isbn10: string): string | null {
  const clean = normalizeISBN(isbn10)
  
  if (clean.length !== 10 || !validateISBN10Checksum(clean)) {
    return null
  }
  
  // Remove check digit and prepend 978
  const isbn13Base = '978' + clean.substring(0, 9)
  
  // Calculate ISBN-13 check digit
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(isbn13Base[i])
    sum += digit * (i % 2 === 0 ? 1 : 3)
  }
  
  const checkDigit = (10 - (sum % 10)) % 10
  return isbn13Base + checkDigit.toString()
}

/**
 * Converts ISBN-13 to ISBN-10
 * Only works for ISBN-13s that start with 978 (Bookland EAN)
 */
export function convertISBN13To10(isbn13: string): string | null {
  const clean = normalizeISBN(isbn13)
  
  if (clean.length !== 13 || !clean.startsWith('978')) {
    return null
  }
  
  if (!validateISBN13Checksum(clean)) {
    return null
  }
  
  // Remove 978 prefix and last check digit
  const isbn10Base = clean.substring(3, 12)
  
  // Calculate ISBN-10 check digit
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(isbn10Base[i]) * (10 - i)
  }
  
  const checkDigit = sum % 11
  const checkChar = checkDigit === 10 ? 'X' : checkDigit.toString()
  
  return isbn10Base + checkChar
}

/**
 * Gets both ISBN-10 and ISBN-13 formats from a single ISBN
 * Returns an object with both formats, or null if conversion isn't possible
 */
export function getBothISBNFormats(isbn: string): { isbn10: string | null; isbn13: string | null } {
  const clean = normalizeISBN(isbn)
  
  if (clean.length === 10) {
    const isbn13 = convertISBN10To13(clean)
    return { isbn10: clean, isbn13 }
  } else if (clean.length === 13) {
    const isbn10 = convertISBN13To10(clean)
    return { isbn10, isbn13: clean }
  }
  
  return { isbn10: null, isbn13: null }
}

