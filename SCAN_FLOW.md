graph TD
    A[User Enters ISBN] -->|Click Scan| B(Frontend: handleScan)
    B -->|POST /api/scan-isbn| C{API Route}
    C -->|Validate ISBN| D[scan-service.ts: processIsbnScan]
    
    D --> E{Check Local DB}
    E -->|Found| F[Use Existing Book]
    E -->|Not Found| G[Fetch External Metadata]
    
    G --> H{Candidates Found?}
    H -->|Multiple| I[Return Ambiguous Status]
    I -->|User Selects| D
    H -->|None| J[Create Minimal Record]
    H -->|One| K[Create Book Record]
    
    F --> L{Check Description}
    K --> L
    J --> L
    
    L -->|Thin < 150 chars| M[Trigger Deep Web Search]
    L -->|Good Description| N[Standard AI Analysis]
    
    M --> O[AI Agent: Web Search Tool]
    O -->|Google Books/DDG| P[Analyze Search Results]
    P --> Q[Generate Warnings]
    
    N --> R{Warnings Found?}
    R -->|Yes| Q
    R -->|No| S[Double Check: Force Web Search]
    S -->|New Warnings Found| Q
    S -->|Still Safe| T[Mark as Safe/G]
    
    Q --> U[Save to DB: content_warnings]
    T --> U
    
    U --> V[Log Audit Decision]
    V --> W[Return Result to Frontend]
