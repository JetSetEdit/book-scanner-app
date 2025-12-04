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
          cover_url: string | null
          description: string | null
          publisher: string | null
          published_date: string | null
          page_count: number | null
          categories: string[] | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          isbn: string
          title: string
          author?: string | null
          cover_url?: string | null
          description?: string | null
          publisher?: string | null
          published_date?: string | null
          page_count?: number | null
          categories?: string[] | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          isbn?: string
          title?: string
          author?: string | null
          cover_url?: string | null
          description?: string | null
          publisher?: string | null
          published_date?: string | null
          page_count?: number | null
          categories?: string[] | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scans: {
        Row: {
          id: string
          isbn: string
          book_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          isbn: string
          book_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          isbn?: string
          book_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scans_book_id_fkey"
            columns: ["book_id"]
            referencedRelation: "books"
            referencedColumns: ["id"]
          }
        ]
      }
      content_warnings: {
        Row: {
          id: string
          book_id: string
          user_id: string | null
          category: 'violence' | 'sexual_content' | 'substance_abuse' | 'mental_health' | 'death' | 'abuse' | 'discrimination' | 'other'
          description: string
          severity: 'mild' | 'moderate' | 'severe'
          helpful_count: number
          not_helpful_count: number
          is_author_approved: boolean
          source: string
          reasoning: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          book_id: string
          user_id?: string | null
          category: 'violence' | 'sexual_content' | 'substance_abuse' | 'mental_health' | 'death' | 'abuse' | 'discrimination' | 'other'
          description: string
          severity: 'mild' | 'moderate' | 'severe'
          helpful_count?: number
          not_helpful_count?: number
          is_author_approved?: boolean
          source?: string
          reasoning?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          user_id?: string | null
          category?: 'violence' | 'sexual_content' | 'substance_abuse' | 'mental_health' | 'death' | 'abuse' | 'discrimination' | 'other'
          description?: string
          severity?: 'mild' | 'moderate' | 'severe'
          helpful_count?: number
          not_helpful_count?: number
          is_author_approved?: boolean
          source?: string
          reasoning?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_warnings_book_id_fkey"
            columns: ["book_id"]
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_warnings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      warning_validations: {
        Row: {
          id: string
          warning_id: string
          user_id: string
          is_helpful: boolean
          created_at: string
        }
        Insert: {
          id?: string
          warning_id: string
          user_id: string
          is_helpful: boolean
          created_at?: string
        }
        Update: {
          id?: string
          warning_id?: string
          user_id?: string
          is_helpful?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warning_validations_warning_id_fkey"
            columns: ["warning_id"]
            referencedRelation: "content_warnings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warning_validations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
      }
      ai_audit_logs: {
        Row: {
          id: string
          book_id: string
          scan_id: string | null
          isbn: string
          decision_type: 'warnings_generated' | 'no_warnings' | 'search_performed' | 'metadata_thin'
          warnings_count: number
          ai_reasoning: string
          confidence_level: 'low' | 'medium' | 'high' | null
          book_title: string | null
          book_author: string | null
          description_length: number | null
          had_thin_metadata: boolean
          used_web_search: boolean
          raw_ai_response: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          scan_id?: string | null
          isbn: string
          decision_type: 'warnings_generated' | 'no_warnings' | 'search_performed' | 'metadata_thin'
          warnings_count?: number
          ai_reasoning: string
          confidence_level?: 'low' | 'medium' | 'high' | null
          book_title?: string | null
          book_author?: string | null
          description_length?: number | null
          had_thin_metadata?: boolean
          used_web_search?: boolean
          raw_ai_response?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          scan_id?: string | null
          isbn?: string
          decision_type?: 'warnings_generated' | 'no_warnings' | 'search_performed' | 'metadata_thin'
          warnings_count?: number
          ai_reasoning?: string
          confidence_level?: 'low' | 'medium' | 'high' | null
          book_title?: string | null
          book_author?: string | null
          description_length?: number | null
          had_thin_metadata?: boolean
          used_web_search?: boolean
          raw_ai_response?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_audit_logs_book_id_fkey"
            columns: ["book_id"]
            referencedRelation: "books"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
