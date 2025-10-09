# AI Agent Architecture - Book Scanner App

## 🤖 AI Agent Integration Flow

```mermaid
graph TD
    A[User Scans ISBN] --> B[Scan ISBN API]
    B --> C{Book Exists in DB?}
    C -->|No| D[Fetch from Open Library/Google Books]
    C -->|Yes| E[Check Content Warnings]
    D --> F[Save Book to DB]
    F --> E
    E --> G{Has Content Warnings?}
    G -->|Yes| H[Return Book with Warnings]
    G -->|No| I[🤖 Trigger AI Agent]
    
    I --> J[OpenAI Agent Builder]
    J --> K[GPT-4o Model]
    K --> L[Analyze Book Metadata]
    L --> M[Generate Content Warnings]
    M --> N[Parse JSON Response]
    N --> O[Validate Warnings]
    O --> P[Save to content_warnings Table]
    P --> Q[Mark as ai_generated]
    Q --> H
    
    H --> R[Display Book with AI Badge]
    
    style I fill:#ff6b6b
    style J fill:#4ecdc4
    style K fill:#45b7d1
    style M fill:#96ceb4
    style Q fill:#feca57
```

## 🏗️ Technical Architecture

```mermaid
graph LR
    subgraph "Frontend"
        A[Scanner Interface]
        B[AI Warning Badge]
        C[Book Display]
    end
    
    subgraph "API Layer"
        D[scan-isbn API]
        E[generate-content-warnings API]
    end
    
    subgraph "AI Agent Layer"
        F[content-warning-agent.ts]
        G[OpenAI Agent]
        H[GPT-4o Model]
    end
    
    subgraph "Database"
        I[books table]
        J[content_warnings table]
        K[scans table]
    end
    
    subgraph "External APIs"
        L[Open Library API]
        M[Google Books API]
    end
    
    A --> D
    D --> F
    F --> G
    G --> H
    H --> F
    F --> J
    D --> I
    D --> L
    D --> M
    B --> C
    C --> J
    
    style F fill:#ff6b6b
    style G fill:#4ecdc4
    style H fill:#45b7d1
```

## 🔄 Data Flow Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant S as Scanner Interface
    participant API as scan-isbn API
    participant DB as Supabase DB
    participant AI as AI Agent
    participant OAI as OpenAI API
    
    U->>S: Scan ISBN
    S->>API: POST /api/scan-isbn
    API->>DB: Check if book exists
    DB-->>API: Book data
    
    alt Book doesn't exist
        API->>API: Fetch from Open Library/Google Books
        API->>DB: Insert new book
    end
    
    API->>DB: Check content_warnings table
    DB-->>API: Warning count = 0
    
    API->>AI: generateContentWarnings()
    AI->>OAI: Send book metadata
    OAI-->>AI: JSON response with warnings
    AI->>AI: Parse and validate warnings
    AI->>DB: Insert warnings (source: ai_generated)
    AI-->>API: Return warnings array
    
    API-->>S: Book data + AI warnings
    S->>U: Display book with AI badge
```

## 🎯 Agent Configuration

```mermaid
graph TD
    A[Agent Definition] --> B[Name: Content Warning Generator]
    A --> C[Model: GPT-4o]
    A --> D[Instructions: Specialized for book analysis]
    
    D --> E[Categories: 8 predefined types]
    D --> F[Severity: mild/moderate/severe]
    D --> G[Output: JSON array format]
    
    E --> H[violence, sexual_content, substance_abuse]
    E --> I[mental_health, death, abuse, discrimination, other]
    
    G --> J[Validation Rules]
    J --> K[Category must be valid]
    J --> L[Severity must be valid]
    J --> M[Description must exist]
    
    style A fill:#ff6b6b
    style C fill:#4ecdc4
    style D fill:#45b7d1
```

## 📊 Database Schema Integration

```mermaid
erDiagram
    BOOKS {
        int id PK
        string isbn UK
        string title
        string author
        string description
        string cover_url
        string categories
        timestamp created_at
    }
    
    CONTENT_WARNINGS {
        int id PK
        int book_id FK
        string category
        string description
        string severity
        boolean is_author_approved
        string source
        int user_id FK
        timestamp created_at
    }
    
    SCANS {
        int id PK
        int book_id FK
        string isbn
        timestamp scanned_at
        string scan_type
    }
    
    BOOKS ||--o{ CONTENT_WARNINGS : "has many"
    BOOKS ||--o{ SCANS : "has many"
    
    CONTENT_WARNINGS }o--|| BOOKS : "belongs to"
    SCANS }o--|| BOOKS : "belongs to"
```

## 🚀 Key Components Used

### **1. OpenAI Agent Builder Nodes:**
- **Agent**: Main agent definition with instructions
- **Runner**: Executes the agent with conversation history
- **user()**: Helper function for user input formatting
- **GPT-4o**: The language model for content analysis

### **2. Integration Points:**
- **scan-isbn API**: Triggers agent when no warnings exist
- **content-warning-agent.ts**: Agent implementation
- **AI Warning Badge**: UI component for displaying AI-generated warnings
- **Database**: Stores generated warnings with `ai_generated` source

### **3. Data Flow:**
1. **Input**: Book metadata (title, author, description, categories)
2. **Processing**: AI analyzes and generates warnings
3. **Output**: Validated JSON array of content warnings
4. **Storage**: Saved to database with confidence and reasoning
5. **Display**: Shown to user with AI badge indicator

This architecture ensures that every scanned book gets intelligent content warnings automatically generated by the AI agent when none exist in the database!

