export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            books: {
                Row: {
                    id: string
                    isbn: string
                    title: string
                    author: string | null
                    description: string | null
                    categories: string[] | null
                    cover_url: string | null
                    publisher: string | null
                    published_date: string | null
                    page_count: number | null
                    review_status: string
                    classification_rating: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    isbn: string
                    title: string
                    author?: string | null
                    description?: string | null
                    categories?: string[] | null
                    cover_url?: string | null
                    publisher?: string | null
                    published_date?: string | null
                    page_count?: number | null
                    review_status?: string
                    classification_rating?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    isbn?: string
                    title?: string
                    author?: string | null
                    description?: string | null
                    categories?: string[] | null
                    cover_url?: string | null
                    publisher?: string | null
                    published_date?: string | null
                    page_count?: number | null
                    review_status?: string
                    classification_rating?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            content_warnings: {
                Row: {
                    id: string
                    book_id: string
                    category: string
                    description: string
                    severity: string
                    user_id: string | null
                    reasoning: string | null
                    is_author_verified: boolean
                    source_url: string | null
                    helpful_count: number
                    not_helpful_count: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    book_id: string
                    category: string
                    description: string
                    severity: string
                    user_id?: string | null
                    reasoning?: string | null
                    is_author_verified?: boolean
                    source_url?: string | null
                    helpful_count?: number
                    not_helpful_count?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    book_id?: string
                    category?: string
                    description?: string
                    severity?: string
                    user_id?: string | null
                    reasoning?: string | null
                    is_author_verified?: boolean
                    source_url?: string | null
                    helpful_count?: number
                    not_helpful_count?: number
                    created_at?: string
                }
            }
            author_context: {
                Row: {
                    id: string
                    author_name: string
                    status: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    author_name: string
                    status: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    author_name?: string
                    status?: string
                    created_at?: string
                }
            }
        }
    }
}
