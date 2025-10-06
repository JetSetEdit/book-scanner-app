#!/usr/bin/env python3
"""
StoryGraph API client using the official storygraph-api package
"""

import sys
import json
from typing import Dict, Any, Optional
from storygraph_api import Book

class StoryGraphClient:
    def __init__(self):
        self.book_client = Book()

    def search_books(self, query: str) -> Dict[str, Any]:
        """Search for books on StoryGraph"""
        try:
            # Use the StoryGraph API to search
            result = self.book_client.search(query)
            
            return {
                'success': True,
                'data': {'books': result}
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def get_book_details(self, book_id: str) -> Dict[str, Any]:
        """Get detailed book information from StoryGraph"""
        try:
            # Use the StoryGraph API to get book details
            result = self.book_client.book_info(book_id)
            
            return {
                'success': True,
                'data': result
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def search_by_isbn(self, isbn: str) -> Dict[str, Any]:
        """Search for a book by ISBN"""
        try:
            # Clean ISBN
            clean_isbn = isbn.replace('-', '').replace(' ', '')
            
            # Try searching with ISBN
            search_result = self.search_books(clean_isbn)
            
            if search_result['success']:
                # Look for exact ISBN match in results
                books = search_result['data'].get('books', [])
                for book in books:
                    # Check if the book has the matching ISBN
                    if (book.get('isbn') == clean_isbn or 
                        book.get('isbn13') == clean_isbn or
                        book.get('isbn10') == clean_isbn):
                        return {
                            'success': True,
                            'data': book
                        }
            
            return {
                'success': False,
                'error': 'Book not found with this ISBN'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

def main():
    """CLI interface for testing"""
    if len(sys.argv) < 3:
        print("Usage: python storygraph_client.py <command> <query>")
        print("Commands: search, book, isbn")
        sys.exit(1)
    
    command = sys.argv[1]
    query = sys.argv[2]
    
    client = StoryGraphClient()
    
    if command == 'search':
        result = client.search_books(query)
    elif command == 'book':
        result = client.get_book_details(query)
    elif command == 'isbn':
        result = client.search_by_isbn(query)
    else:
        print("Invalid command. Use: search, book, or isbn")
        sys.exit(1)
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
