#!/usr/bin/env python3
"""
StoryGraph API client for fetching book data
"""

import sys
import json
import requests
from typing import Dict, Any, Optional

class StoryGraphClient:
    def __init__(self):
        self.base_url = "https://app.thestorygraph.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })

    def search_books(self, query: str) -> Dict[str, Any]:
        """Search for books on StoryGraph"""
        try:
            # StoryGraph search endpoint
            search_url = f"{self.base_url}/api/v1/search"
            params = {
                'q': query,
                'search_term': query,
                'search_type': 'books'
            }
            
            response = self.session.get(search_url, params=params)
            response.raise_for_status()
            
            return {
                'success': True,
                'data': response.json()
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def get_book_details(self, book_id: str) -> Dict[str, Any]:
        """Get detailed book information from StoryGraph"""
        try:
            # StoryGraph book details endpoint
            book_url = f"{self.base_url}/api/v1/books/{book_id}"
            
            response = self.session.get(book_url)
            response.raise_for_status()
            
            return {
                'success': True,
                'data': response.json()
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
                    if book.get('isbn') == clean_isbn or book.get('isbn13') == clean_isbn:
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
