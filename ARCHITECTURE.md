# Book Scanner App Architecture

## System Overview

```mermaid
graph TB
    %% User Interface Layer
    subgraph "Frontend (Next.js)"
        UI[Scanner Interface]
        Admin[Admin Dashboard]
        Collection[Book Collection]
        DevTool[Cover Selection Tool - DEV ONLY]
    end

    %% API Layer
    subgraph "API Routes"
        ScanAPI[/api/scan-isbn]
        AdminAPI[/api/admin/*]
        CoverAPI[/api/update-covers]
        FetchAPI[/api/fetch-all-covers - DEV]
        ClearAPI[/api/clear-books - DEV]
        RestoreAPI[/api/restore-sample-books - DEV]
    end

    %% External APIs
    subgraph "External APIs"
        GoogleBooks[Google Books API]
        OpenLibrary[Open Library API]
        StoryGraph[StoryGraph API - Future]
        Amazon[Amazon API - Future]
    end

    %% Database
    subgraph "Database (Supabase)"
        BooksTable[(Books Table)]
        WarningsTable[(Content Warnings)]
        SpiceTable[(Spice Ratings)]
        ScansTable[(Scans Table)]
    end

    %% File System
    subgraph "File Storage"
        CoverFiles[public/book-covers/]
        Scripts[scripts/]
    end

    %% Dev Tools
    subgraph "Development Tools"
        FetchScript[fetch-all-api-covers.js]
        BetterScript[fetch-better-covers.js]
        CorrectScript[fetch-correct-covers.js]
    end

    %% User Interactions
    UI --> ScanAPI
    Admin --> AdminAPI
    Collection --> AdminAPI
    DevTool --> CoverAPI
    DevTool --> FetchAPI

    %% API to External Services
    ScanAPI --> GoogleBooks
    ScanAPI --> OpenLibrary
    FetchAPI --> GoogleBooks
    FetchAPI --> OpenLibrary
    FetchAPI --> StoryGraph
    FetchAPI --> Amazon

    %% API to Database
    ScanAPI --> BooksTable
    AdminAPI --> BooksTable
    AdminAPI --> WarningsTable
    AdminAPI --> SpiceTable
    AdminAPI --> ScansTable
    CoverAPI --> BooksTable
    ClearAPI --> BooksTable
    RestoreAPI --> BooksTable

    %% Scripts to External APIs
    FetchScript --> GoogleBooks
    FetchScript --> OpenLibrary
    BetterScript --> OpenLibrary
    CorrectScript --> GoogleBooks

    %% File Operations
    FetchAPI --> FetchScript
    FetchScript --> CoverFiles
    BetterScript --> CoverFiles
    CorrectScript --> CoverFiles
    CoverAPI --> CoverFiles

    %% Database Relationships
    BooksTable --> WarningsTable
    BooksTable --> SpiceTable
    BooksTable --> ScansTable

    %% Styling
    classDef frontend fill:#e1f5fe
    classDef api fill:#f3e5f5
    classDef external fill:#fff3e0
    classDef database fill:#e8f5e8
    classDef files fill:#fce4ec
    classDef dev fill:#ffebee

    class UI,Admin,Collection,DevTool frontend
    class ScanAPI,AdminAPI,CoverAPI,FetchAPI,ClearAPI,RestoreAPI api
    class GoogleBooks,OpenLibrary,StoryGraph,Amazon external
    class BooksTable,WarningsTable,SpiceTable,ScansTable database
    class CoverFiles,Scripts files
    class FetchScript,BetterScript,CorrectScript,DevTool,FetchAPI,ClearAPI,RestoreAPI dev
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Scanner as Scanner Interface
    participant API as /api/scan-isbn
    participant Google as Google Books API
    participant OpenLib as Open Library API
    participant DB as Supabase Database
    participant Files as File System

    User->>Scanner: Scan ISBN barcode
    Scanner->>API: POST /api/scan-isbn
    API->>DB: Check if book exists
    
    alt Book exists
        DB-->>API: Return existing book
        API-->>Scanner: Return book data
    else Book not found
        API->>Google: Search by ISBN
        Google-->>API: Return book metadata
        
        alt Google has cover
            API->>Files: Download cover image
            Files-->>API: Return local path
        end
        
        API->>OpenLib: Fallback search
        OpenLib-->>API: Return metadata
        
        API->>DB: Insert new book
        DB-->>API: Confirm insertion
        API-->>Scanner: Return new book data
    end
    
    Scanner-->>User: Display book with cover
```

## Cover Management System

```mermaid
graph LR
    subgraph "Cover Sources"
        A[Google Books API]
        B[Open Library API]
        C[StoryGraph API]
        D[Amazon API]
        E[Manual Upload]
    end

    subgraph "Processing"
        F[fetch-all-api-covers.js]
        G[Cover Selection Tool]
        H[Quality Assessment]
    end

    subgraph "Storage"
        I[public/book-covers/]
        J[Database cover_url]
    end

    subgraph "Display"
        K[Book Collection]
        L[Admin Dashboard]
        M[Scanner Interface]
    end

    A --> F
    B --> F
    C --> F
    D --> F
    E --> I
    
    F --> I
    F --> G
    G --> H
    H --> J
    J --> K
    J --> L
    J --> M

    classDef source fill:#e3f2fd
    classDef process fill:#f1f8e9
    classDef storage fill:#fff8e1
    classDef display fill:#fce4ec

    class A,B,C,D,E source
    class F,G,H process
    class I,J storage
    class K,L,M display
```

## Development Workflow

```mermaid
graph TD
    A[Add New Book] --> B[Scan ISBN]
    B --> C[Auto-fetch from APIs]
    C --> D[Multiple Cover Options]
    D --> E[Dev Tool Review]
    E --> F[Select Best Cover]
    F --> G[Update Database]
    G --> H[Display in App]

    subgraph "Dev Tools"
        I[Cover Selection Page]
        J[Fetch All API Covers]
        K[Auto-Select Best Quality]
        L[Manual Override]
    end

    E --> I
    I --> J
    I --> K
    I --> L

    classDef dev fill:#ffebee
    class A,B,C,D,E,F,G,H dev
```

## Database Schema

```mermaid
erDiagram
    BOOKS {
        uuid id PK
        string isbn UK
        string title
        string author
        string cover_url
        text description
        string publisher
        date published_date
        int page_count
        text[] categories
        string spice_level
        string age_rating
        timestamp created_at
        timestamp updated_at
    }

    CONTENT_WARNINGS {
        uuid id PK
        uuid book_id FK
        string category
        text description
        string severity
        timestamp created_at
    }

    SPICE_RATINGS {
        uuid id PK
        uuid book_id FK
        string spice_level
        timestamp created_at
    }

    SCANS {
        uuid id PK
        uuid book_id FK
        string isbn
        timestamp scanned_at
        json metadata
    }

    BOOKS ||--o{ CONTENT_WARNINGS : has
    BOOKS ||--o{ SPICE_RATINGS : has
    BOOKS ||--o{ SCANS : has
```

## Key Features

### Production Features
- **ISBN/Barcode Scanning** - Camera-based scanning with ZXing
- **Book Metadata Fetching** - Google Books and Open Library APIs
- **Content Warning System** - Categorized warnings with severity levels
- **Spice Rating System** - Age-appropriate content ratings
- **Admin Dashboard** - Book management and review workflow
- **Book Collection** - Browse and search books

### Development Tools (DEV ONLY)
- **Cover Selection Tool** - Visual interface for choosing covers
- **API Cover Fetching** - Comprehensive multi-API cover search
- **Database Management** - Clear and restore sample data
- **Quality Assessment** - File size and source-based quality indicators

### Security & Environment
- **Development Mode Protection** - Dev tools only work in development
- **Environment Variables** - Secure API key management
- **Row Level Security** - Supabase RLS policies
- **Input Validation** - ISBN validation and sanitization
