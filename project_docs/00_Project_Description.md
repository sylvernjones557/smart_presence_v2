# Project Description & System Development

## 4. Project Description
Smart Presence is a highly secure, offline-first attendance management system powered by AI facial recognition. This zero-cloud system runs completely locally to ensure maximum data privacy for institutions like schools and corporate offices. By using pre-trained computer vision models, Smart Presence can recognize students in a live camera feed and mark them present in real-time. It completely replaces inefficient roll-calling and legacy RFID systems. The system also includes complete Timetable management, a Live Dashboard for staff availability, and built-in Agentic workflows utilizing the Model Context Protocol (MCP).

## 5. System Development 

### 5.1 Languages and Tools Used

**Frontend (Client Layer)**
* **Languages**: TypeScript, HTML5, CSS3
* **Framework**: React 19 (via Vite)
* **Styling**: Tailwind CSS
* **Camera API**: WebRTC (react-webcam)
* **Data Visualization**: Recharts (Animated SVG charts)

**Backend (Service Layer)**
* **Language**: Python 3.10+
* **Framework**: FastAPI
* **Web Server**: Uvicorn
* **Authentication**: PyJWT (JSON Web Tokens), Passlib (Bcrypt password hashing)

**Artificial Intelligence (Machine Learning Layer)**
* **Engine**: InsightFace (AntelopeV2 model pipeline)
* **Backend Runtime**: ONNXRuntime (Optimized for CPU via OpenMP/MKL)
* **Integration**: Model Context Protocol (MCP) Server for LLM-based intelligent automation

**Database (Storage Layer)**
* **Relational Database**: SQLite (via SQLAlchemy ORM & Pydantic validation)
* **Vector Database**: ChromaDB (Stores computationally intensive 512-dimensional facial embeddings locally)

**Deployment & Tooling**
* **Version Control**: Git / GitHub
* **Networking**: Cloudflare Tunnels (Zero Trust remote network access)
* **Package Management**: npm (Node.js), pip (Python venv)
