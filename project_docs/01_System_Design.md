# System Design

## 3.1 Architectural Design
The architecture follows a Zero-Cloud paradigm where the edge node handles both user inferfacing and ML processing locally, ensuring no biometric data leaves the premise.

```mermaid
graph TD
    Client[React Premium PWA] -->|HTTPS Requests| Server(FastAPI + Uvicorn)
    Server <-->|ORM Transactions| SQLite[(Relational DB)]
    Server <-->|512-dim Vector Math| ChromaDB[(Vector DB)]
    Server <-->|Image Arrays| InsightFace Engine
    
    Agents[AI Agents / Claude] <-->|JSON-RPC| MCP[MCP Gateway]
    MCP <--> Server

    Network[Cloudflare Tunnel] -. Secure Over_The_Air .-> Server
```

## Data Flow Diagrams (DFD)

### Level 0 DFD (Context Diagram)
Visualizes system scope at a high level. All external entities interacting with the Smart Presence Application.

```mermaid
graph TD
    User((Staff / Admin)) -->|Login Credentials| SYS[Smart Presence System]
    SYS -->|Success / Auth Token| User
    
    User -->|Student Face Image| SYS
    SYS -->|Attendance Feedback| User

    Camera((Camera Device)) -->|Video Frames| SYS
    SYS -->|Recognized Student Context| Database[(Local DB)]
```

### Level 1 DFD
Breaks down the core system into independent processes and the data they exchange.

```mermaid
graph TD
    User((User)) -->|Auth Request| P1(1.0 Authentication)
    P1 -->|Read/Write| DB[(User DB)]
    P1 -->|Token| User
    
    User -->|Capture Frame| P2(2.0 Face Recognition)
    P2 -->|Feature Extraction| AI[InsightFace Engine]
    AI -->|Face Embedding| P2
    P2 -->|Search Vector| VDB[(ChromaDB)]
    VDB -->|Matched ID| P2
    
    P2 -->|Match Data| P3(3.0 Attendance Manager)
    P3 -->|Write Record| DB2[(Attendance DB)]
    P3 -->|Status/Stats| User

    Admin((Admin)) -->|Class/Teacher Info| P4(4.0 Timetable & Entity Management)
    P4 -->|Write| DB3[(Timetable/Staff DB)]
```

### Level 2 DFD (Face Recognition & Attendance Process)
A deep dive into the complex sub-process representing matching a face to an ID and storing an attendance slot with correct validation.

```mermaid
graph TD
    F[Incoming Frame] --> P2_1(2.1 Face Detection)
    P2_1 -->|Bounding Box| P2_2(2.2 Embedding Generation)
    P2_2 -->|512-dim Vector| P2_3(2.3 Vector Matching)
    P2_3 -->|Read| VDB[(ChromaDB)]
    P2_3 -->|Matched Student UUID| P3_1(3.1 Verify Schedule)
    P3_1 -->|Check Time & Group| DB[(Timetable DB)]
    P3_1 -->|Verified Period| P3_2(3.2 Compute Late Entry Badge)
    P3_2 -->|Check Global Timings| DB2[(System Constants)]
    P3_2 -->|Compile Status| P3_3(3.3 Finalize Session)
    P3_3 -->|Insert| DB3[(Attendance Records)]
```
