# Smart Presence System Mermaid Diagrams

## 1. Global Architectural Diagram
```mermaid
flowchart TB
    subgraph Client_Layer [Client Layer]
        FE[📱 Premium React PWA]
        AG[🤖 AI Agents / LLMs]
    end

    subgraph Service_Layer [Service Layer]
        BE[⚡ FastAPI Backend]
        MCP[🧠 MCP Server]
    end

    subgraph Core_Engine [AI & Storage Engine]
        IF[🤖 InsightFace AI]
        SQLite[(💾 SQLite Relational)]
        Chroma[(🧠 ChromaDB Vector)]
    end

    FE <-->|REST API| BE
    AG <-->|JSON-RPC| MCP
    MCP <-->|Internal Tools| BE
    BE <-->|Face Recognition| IF
    BE <-->|SQL Queries| SQLite
    BE <-->|Vector Math| Chroma
    
    CF[🌐 Cloudflare Tunnel] -.->|Secure Entry| BE
```

## 2. Database ER Diagram
```mermaid
erDiagram
    Organization ||--o{ Staff : manages
    Organization ||--o{ Student : contains
    Staff ||--o{ AttendanceRecord : signs
    Student ||--o{ AttendanceRecord : recorded_in
    Group ||--o{ Student : groups
    Group ||--o{ AttendanceSession : has
    AttendanceSession ||--o{ AttendanceRecord : tracks
    Timetable ||--o{ AttendanceSession : schedules
    Staff ||--o{ Group : assigned_to
```

## 3. Integrated Data Flow
```mermaid
graph LR
    User((User)) --> FE[Frontend]
    FE --> BE[Backend]
    BE --> AI[InsightFace]
    AI --> BE
    BE --> DB[(Databases)]
    DB --> BE
    BE --> FE
    
    Agent((AI Agent)) --> MCP[MCP Server]
    MCP --> BE
```

## 4. Face Recognition Sequence
```mermaid
sequenceDiagram
    participant U as Staff
    participant F as PWA Frontend
    participant B as Backend
    participant A as InsightFace AI
    participant V as ChromaDB (Vectors)

    U->>F: Capture Frame
    F->>B: POST /recognition/recognize
    B->>A: Extract Embedding (512-dim)
    A-->>B: Embedding Vector
    B->>V: Search Closest Match (Cosine Similarity)
    V-->>B: Student ID + Confidence
    B-->>F: Match Result (e.g., "John Doe - 92%")
    F-->>U: Tactical Haptic Feedback & UI Update
```

---
*Updated for V4 Premium with full MCP and AI-Native support.*
