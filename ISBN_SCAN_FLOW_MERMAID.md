# ISBN Scan Flow - Mermaid Diagram

## Complete Flow Diagram

```mermaid
flowchart TD
    Start([User Enters ISBN]) --> Validate{Validate ISBN Format}
    Validate -->|Invalid| Error1[Return 400 Error]
    Validate -->|Valid| API[API Route: /api/scan-isbn]
    
    API --> Stream{Stream Mode?}
    Stream -->|Yes| CreateStream[Create ReadableStream]
    Stream -->|No| DirectCall[Direct Call]
    
    CreateStream --> ProcessScan[processIsbnScan]
    DirectCall --> ProcessScan
    
    ProcessScan --> Normalize[Normalize ISBN]
    Normalize --> CheckDB{Book in Local DB?}
    
    CheckDB -->|Found & No Candidate| UseExisting[Use Existing Book]
    CheckDB -->|Not Found OR Has Candidate| FetchExternal[Fetch External Metadata]
    
    UseExisting --> CheckWarnings{Has Content Warnings?}
    
    FetchExternal --> ParallelAPIs[Parallel API Calls]
    ParallelAPIs --> OpenLib[Open Library API]
    ParallelAPIs --> GoogleBooks[Google Books API]
    
    OpenLib --> MergeResults[Merge Results]
    GoogleBooks --> MergeResults
    
    MergeResults --> CandidateCount{How Many Candidates?}
    
    CandidateCount -->|0 Candidates| CreateMinimal[Create Minimal Book Record]
    CandidateCount -->|1 Candidate| UseCandidate[Use Single Candidate]
    CandidateCount -->|2+ Candidates| Ambiguous[Create ambiguous_scans Entry]
    
    Ambiguous --> ReturnAmbiguous[Return status: 'ambiguous']
    ReturnAmbiguous --> FrontendSelect[Frontend: Show Selection UI]
    FrontendSelect --> UserSelects[User Selects Candidate]
    UserSelects --> ProcessScan
    
    CreateMinimal --> CheckMetadata{Is Metadata Thin?}
    UseCandidate --> CheckMetadata
    
    CheckMetadata{Description < 150 chars<br/>OR missing cover?}
    CheckMetadata -->|Yes - Thin| LogThin[Log audit: 'metadata_thin']
    CheckMetadata -->|No - Good| CreateFull[Create Full Book Record]
    
    LogThin --> DeepSearch[Deep AI Web Search]
    DeepSearch --> AIAgent1[AI Agent: findBookAndGenerateWarnings]
    
    AIAgent1 --> WebSearch[Web Search Tool]
    WebSearch --> SearchGoogle[Google Books API]
    WebSearch --> SearchApple[Apple Books API]
    WebSearch --> SearchDDG[DuckDuckGo API]
    WebSearch --> SearchAuthor[Author Site Scraping]
    
    SearchGoogle --> AnalyzeResults[Analyze Search Results]
    SearchApple --> AnalyzeResults
    SearchDDG --> AnalyzeResults
    SearchAuthor --> AnalyzeResults
    
    AnalyzeResults --> ExtractData[Extract: title, author, description, cover]
    ExtractData --> GenerateWarnings1[Generate Content Warnings]
    GenerateWarnings1 --> UpdateBook[Update Book Record]
    UpdateBook --> LogSearch[Log audit: 'search_performed']
    
    LogSearch --> HasWarnings1{Warnings Found?}
    HasWarnings1 -->|Yes| InsertWarnings1[Insert Warnings to DB]
    HasWarnings1 -->|No| LogNoWarnings1[Log audit: 'no_warnings']
    
    InsertWarnings1 --> LogGenerated1[Log audit: 'warnings_generated']
    LogNoWarnings1 --> ReturnResult1[Return Result]
    LogGenerated1 --> ReturnResult1
    
    CreateFull --> CheckWarnings
    
    CheckWarnings{Warnings Exist?}
    CheckWarnings -->|Yes| CheckStale{Are Warnings Stale?}
    CheckWarnings -->|No| GenerateWarnings
    
    CheckStale{Old model_version<br/>OR taxonomy_version?}
    CheckStale -->|Yes| DeleteOld[Delete Old Warnings]
    CheckStale -->|No| ReturnExisting[Return Existing Book + Warnings]
    
    DeleteOld --> GenerateWarnings
    
    GenerateWarnings --> Strategy{Generation Strategy?}
    
    Strategy -->|Existing Book OR<br/>Thin Metadata OR<br/>Force Refresh| UseDeepSearch[Use Deep Web Search]
    Strategy -->|New Book with<br/>Good Metadata| UseMetadata[Use Metadata Analysis]
    
    UseDeepSearch --> CheckCache{Cached Result<br/>Available?}
    CheckCache -->|Yes| UseCache[Use Cached Result]
    CheckCache -->|No| AIAgent2[AI Agent: findBookAndGenerateWarnings]
    
    AIAgent2 --> WebSearch
    
    UseCache --> ProcessCached[Process Cached Warnings]
    ProcessCached --> InsertWarnings2[Insert Warnings to DB]
    
    UseMetadata --> AIAgent3[AI Agent: generateContentWarnings]
    AIAgent3 --> AnalyzeMetadata[Analyze: title, author, description, categories]
    AnalyzeMetadata --> ApplyTaxonomy[Apply Taxonomy & Training Examples]
    ApplyTaxonomy --> GenerateWarnings2[Generate Warnings]
    
    GenerateWarnings2 --> CheckEmpty{Warnings Found?}
    CheckEmpty -->|No| DoubleCheck[Double Check with Web Search]
    CheckEmpty -->|Yes| InsertWarnings3[Insert Warnings to DB]
    
    DoubleCheck --> AIAgent4[AI Agent: findBookAndGenerateWarnings]
    AIAgent4 --> WebSearch
    
    InsertWarnings2 --> LogGenerated2[Log audit: 'warnings_generated']
    InsertWarnings3 --> LogGenerated2
    
    LogGenerated2 --> CreateScan[Create Scan Record]
    CreateScan --> ReturnResult[Return ScanResult]
    
    ReturnResult --> StreamResponse{Stream Mode?}
    StreamResponse -->|Yes| StreamUpdates[Stream Progress Updates]
    StreamResponse -->|No| JSONResponse[Return JSON Response]
    
    StreamUpdates --> Frontend[Frontend Receives Updates]
    JSONResponse --> Frontend
    
    Frontend --> DisplayResult[Display Book + Warnings]
    ReturnExisting --> Frontend
    
    Error1 --> Frontend
    
    style Start fill:#e1f5fe
    style Error1 fill:#ffebee
    style DeepSearch fill:#fff3e0
    style AIAgent1 fill:#f3e5f5
    style AIAgent2 fill:#f3e5f5
    style AIAgent3 fill:#f3e5f5
    style AIAgent4 fill:#f3e5f5
    style GenerateWarnings fill:#e8f5e8
    style ReturnResult fill:#e8f5e8
    style Frontend fill:#e1f5fe
```

## Simplified High-Level Flow

```mermaid
flowchart LR
    A[User Enters ISBN] --> B[Validate ISBN]
    B --> C{In Local DB?}
    C -->|Yes| D[Check Warnings]
    C -->|No| E[Fetch External APIs]
    E --> F{Candidates?}
    F -->|Multiple| G[Show Selection UI]
    F -->|One| H[Create Book Record]
    F -->|None| I[Create Minimal Record]
    G --> J[User Selects]
    J --> E
    H --> K{Metadata Thin?}
    I --> K
    K -->|Yes| L[Deep AI Search]
    K -->|No| D
    D --> M{Warnings Exist?}
    M -->|No| N[Generate Warnings]
    M -->|Yes| O[Return Result]
    L --> N
    N --> O
    O --> P[Display to User]
    
    style A fill:#e1f5fe
    style L fill:#fff3e0
    style N fill:#e8f5e8
    style O fill:#e8f5e8
    style P fill:#e1f5fe
```

## Decision Tree for Content Warning Generation

```mermaid
flowchart TD
    Start[Need to Generate Warnings] --> CheckType{Book Type?}
    
    CheckType -->|Existing Book| UseDeep[Use Deep Web Search]
    CheckType -->|New Book| CheckMeta{Metadata Quality?}
    
    CheckMeta -->|Thin < 150 chars| UseDeep
    CheckMeta -->|Good| UseFast[Use Metadata Analysis]
    
    UseFast --> Analyze[Analyze Description/Categories]
    Analyze --> Found{Warnings Found?}
    
    Found -->|Yes| Save[Save Warnings]
    Found -->|No| Verify[Double Check: Web Search]
    
    Verify --> VerifyFound{Found in Search?}
    VerifyFound -->|Yes| Save
    VerifyFound -->|No| SaveSafe[Save as Safe]
    
    UseDeep --> Search[Web Search Multiple Sources]
    Search --> Extract[Extract Book Info]
    Extract --> Generate[Generate Warnings]
    Generate --> Save
    
    Save --> Log[Log Audit Decision]
    SaveSafe --> Log
    Log --> Done[Complete]
    
    style UseDeep fill:#fff3e0
    style UseFast fill:#e8f5e8
    style Search fill:#f3e5f5
    style Generate fill:#e8f5e9
    style Done fill:#e1f5fe
```

## Sequence Diagram: Complete Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Service
    participant DB
    participant ExternalAPIs
    participant AIAgent
    
    User->>Frontend: Enter ISBN
    Frontend->>API: POST /api/scan-isbn (stream: true)
    API->>API: Validate ISBN
    
    API->>Service: processIsbnScan(isbn, sendUpdate)
    Service->>Service: Normalize ISBN
    Service->>DB: Check if book exists
    
    alt Book Found
        DB-->>Service: Return existing book
        Service->>DB: Check for warnings
        alt Warnings Exist
            DB-->>Service: Return warnings
            Service-->>API: Return book + warnings
        else No Warnings
            Service->>AIAgent: generateContentWarnings()
            AIAgent-->>Service: Return warnings
            Service->>DB: Insert warnings
            Service-->>API: Return book + warnings
        end
    else Book Not Found
        Service->>ExternalAPIs: Fetch candidates (parallel)
        ExternalAPIs-->>Service: Return candidates
        
        alt Multiple Candidates
            Service->>DB: Create ambiguous_scans entry
            Service-->>API: Return ambiguous status
            API-->>Frontend: Stream: ambiguous
            Frontend->>User: Show selection UI
            User->>Frontend: Select candidate
            Frontend->>API: POST with selectedCandidate
            Note over Service: Restart flow with candidate
        else Single Candidate
            Service->>Service: Check metadata quality
            
            alt Thin Metadata
                Service->>DB: Create minimal book record
                Service->>DB: Log audit: metadata_thin
                Service->>AIAgent: findBookAndGenerateWarnings()
                AIAgent->>ExternalAPIs: Web search
                ExternalAPIs-->>AIAgent: Search results
                AIAgent->>AIAgent: Analyze & generate warnings
                AIAgent-->>Service: Return book + warnings
                Service->>DB: Update book record
                Service->>DB: Insert warnings
                Service->>DB: Log audit: search_performed
            else Good Metadata
                Service->>DB: Create full book record
                Service->>AIAgent: generateContentWarnings()
                AIAgent->>AIAgent: Analyze metadata
                AIAgent-->>Service: Return warnings
                
                alt No Warnings Found
                    Service->>AIAgent: Double check: findBookAndGenerateWarnings()
                    AIAgent->>ExternalAPIs: Web search
                    ExternalAPIs-->>AIAgent: Search results
                    AIAgent-->>Service: Return warnings (or confirm safe)
                end
                
                Service->>DB: Insert warnings
                Service->>DB: Log audit: warnings_generated
            end
        end
    end
    
    Service->>DB: Create scan record
    Service-->>API: Return ScanResult
    API-->>Frontend: Stream updates + final result
    Frontend->>User: Display book + warnings
```

## Database Operations Flow

```mermaid
flowchart TD
    Start[Scan Request] --> Books{Query books table}
    Books -->|Found| GetBook[Get book record]
    Books -->|Not Found| CreateBook[Create book record]
    
    GetBook --> Warnings{Query content_warnings}
    CreateBook --> Warnings
    
    Warnings -->|Found| CheckStale{Check ai_audit_logs<br/>for version}
    Warnings -->|Not Found| Generate[Generate Warnings]
    
    CheckStale -->|Stale| DeleteWarnings[Delete old warnings]
    CheckStale -->|Fresh| Return[Return existing]
    
    DeleteWarnings --> Generate
    Generate --> InsertWarnings[Insert into content_warnings]
    InsertWarnings --> LogAudit[Insert into ai_audit_logs]
    
    LogAudit --> CreateScan[Insert into scans]
    CreateScan --> Return
    
    Return --> Done[Complete]
    
    style Generate fill:#e8f5e8
    style InsertWarnings fill:#e8f5e9
    style LogAudit fill:#fff3e0
    style Done fill:#e1f5fe
```

## AI Agent Decision Flow

```mermaid
flowchart TD
    Start[AI Agent Called] --> CheckType{Agent Type?}
    
    CheckType -->|findBookAndGenerateWarnings| SearchFlow[Web Search Flow]
    CheckType -->|generateContentWarnings| MetadataFlow[Metadata Analysis Flow]
    
    SearchFlow --> WebSearch[Use webSearchTool]
    WebSearch --> SearchSources[Search Multiple Sources]
    SearchSources --> Google[Google Books]
    SearchSources --> Apple[Apple Books]
    SearchSources --> DDG[DuckDuckGo]
    SearchSources --> Author[Author Sites]
    
    Google --> Analyze[Analyze Results]
    Apple --> Analyze
    DDG --> Analyze
    Author --> Analyze
    
    Analyze --> Extract[Extract Metadata]
    Extract --> Generate1[Generate Warnings]
    Generate1 --> Submit1[Submit Findings]
    
    MetadataFlow --> ReadMeta[Read Metadata]
    ReadMeta --> ApplyTraining[Apply Training Examples]
    ApplyTraining --> CheckThin{Description Thin?}
    
    CheckThin -->|Yes| ForceSearch[Force Web Search]
    CheckThin -->|No| AnalyzeMeta[Analyze Metadata]
    
    ForceSearch --> WebSearch
    AnalyzeMeta --> Generate2[Generate Warnings]
    Generate2 --> Submit2[Submit Warnings]
    
    Submit1 --> Return[Return Result]
    Submit2 --> Return
    
    style SearchFlow fill:#fff3e0
    style MetadataFlow fill:#e8f5e8
    style WebSearch fill:#f3e5f5
    style Generate1 fill:#e8f5e9
    style Generate2 fill:#e8f5e9
    style Return fill:#e1f5fe
```






