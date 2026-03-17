# Smart Presence V4 Premium: System Architecture & Data Flow Diagrams

This document outlines the technical architecture and data flow processes of the Smart Presence system.

---

## 1. System Architecture Diagram
The architecture follows a **Unified Serving Paradigm** where a FastAPI backend serves both the AI logic and the React frontend static files, exposed securely via a Cloudflare Tunnel.

```mermaid
graph TD
    subgraph "External Access"
        Internet((Internet))
        CF[Cloudflare Tunnel]
    end

    subgraph "Local Institution Edge Node"
        subgraph "Client Layer (React)"
            PWA[React V4 Premium UI]
        end

        subgraph "Application Layer (FastAPI)"
            API[FastAPI Gateway]
            Auth[JWT Auth Service]
            AI_Engine[InsightFace / ONNX]
        end

        subgraph "Storage Layer"
            SQLite[(SQLite - Relational DB)]
            Chroma[(ChromaDB - Vector Embeddings)]
        end
    end

    Internet <--> CF
    CF <--> API
    API --> PWA
    API <--> Auth
    API <--> AI_Engine
    API <--> SQLite
    AI_Engine <--> Chroma
```

---

## 2. Level 0 Data Flow Diagram (Context)
Visualizes the external entities and their primary interactions with the Smart Presence System.

```mermaid
graph TD
    Admin((System Admin)) -- "Manage Staff/Classes" --> System[Smart Presence V4]
    Staff((Faculty/Staff)) -- "Take Attendance" --> System
    Camera((Camera Device)) -- "Video Stream" --> System
    System -- "Attendance Reports" --> Staff
    System -- "System Status/Stats" --> Admin
```

---

## 3. Level 1 Data Flow Diagram (Processes)
Decomposes the system into its core functional processes and data stores.

```mermaid
graph TD
    subgraph "Smart Presence Core"
        P1[1.0 Authentication]
        P2[2.0 Facial Recognition]
        P3[3.0 Attendance Processing]
        P4[4.0 Reporting & Analytics]
    end

    User((User)) -- "Credentials" --> P1
    P1 -- "Auth Token" --> User
    
    Camera((Camera)) -- "Frame Data" --> P2
    P2 -- "Face Vector" --> Chroma[(Vector DB)]
    Chroma -- "Match ID" --> P2
    
    P2 -- "Student Match" --> P3
    P3 -- "Persist Record" --> SQLite[(Attendance DB)]
    
    SQLite -- "Raw Data" --> P4
    P4 -- "Visual Reports" --> User
```

---

## 4. Summary of Tech Stack
- **Frontend**: React 19, Tailwind CSS, Lucide Icons.
- **Backend**: FastAPI, Uvicorn.
- **AI**: InsightFace (AntelopeV2), ONNXRuntime.
- **Data**: SQLite (SQLAlchemy), ChromaDB (Vector Search).
- **Network**: Cloudflare Tunnel (HTTPS Bypass).
