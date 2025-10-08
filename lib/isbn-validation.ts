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

