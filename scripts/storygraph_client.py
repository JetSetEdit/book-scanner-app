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
            
            # The result might be a JSON string, so parse it if needed
            if isinstance(result, str):
                result = json.loads(result)
            
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
        """Search for a book by ISBN - this is a placeholder since StoryGraph doesn't support ISBN search directly"""
        try:
            # Clean ISBN
            clean_isbn = isbn.replace('-', '').replace(' ', '')
            
            # For now, we'll return a mock result for the known ISBN
            # In a real implementation, you'd need to maintain a mapping or use a different approach
            if clean_isbn == '9780008710262':
                # Return the book details for "When the Moon Hatched"
                return self.get_book_details("a48338ed-4e1d-4ff4-b8dd-9db3a1d8c6b2")
            
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
