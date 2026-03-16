# 🛠️ Smart Presence V4 Premium Installation & Setup Guide

This guide provides step-by-step instructions to get the **Smart Presence V4 Premium** ecosystem running on your local machine.

---

## 📋 Prerequisites

Ensure you have the following installed:
1. **Python 3.10 or 3.11** (CPU-only optimizations are tested on these versions).
2. **Node.js v18+** & **npm**.
3. **C++ Build Tools** (Required for some Python packages like `insightface` if pre-built wheels aren't available).

---

## 📂 Project Structure

- `backend_smart_presence/`: The FastAPI AI engine.
- `frontend_smart_presence/frontend_smart_presence/`: The React PWA interface.
- `mcp_smart_presence/`: The Model Context Protocol (MCP) server for AI automation.

---

## ⚡ 1. Backend Setup

### A. Create Virtual Environment
Open your terminal in the `backend_smart_presence` directory:
```powershell
python -m venv .venv
.\.venv\Scripts\activate
```

### B. Install Dependencies
```bash
pip install -r requirements.txt
```

### C. Initialize Database
The backend uses SQLite and ChromaDB. You can initialize the tables using:
```bash
python scripts/create_tables.py
```

### D. Start the Backend Server
You can use the helper batch script or run it directly:
```powershell
# Using the helper
.\run_server.bat

# OR running directly via uvicorn
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend will be available at: `http://localhost:8000`

---

## 📱 2. Frontend Setup

### A. Install Packages
Navigate to `frontend_smart_presence/frontend_smart_presence`:
```bash
npm install
```

### B. Environment Configuration
Create or verify the `.env` file in the same directory:
```env
VITE_API_BASE_URL=/api/v1
VITE_DEV_HTTPS=true
```

### C. Start Development Server
```bash
npm run dev
```
The frontend will be available at: `https://localhost:3000` (Accept the self-signed certificate if using HTTPS).

---

## 🤖 3. MCP Server (Optional)

To connect the system to AI agents (like Claude or ChatGPT):
```powershell
cd mcp_smart_presence
.\.venv\Scripts\activate
python mcp_server.py
```

---

## 🌐 4. All-In-One HTTPS Accessibility

For real-time biometric scanning on mobile devices, **HTTPS is strictly required**. We provide a unified "All-In-One" port strategy where the Backend (8000) serves BOTH the API and the Frontend.

### A. Run Cloudflare Quick Tunnel
Run this command in a separate terminal to get a public `https://...trycloudflare.com` link:
```powershell
# Windows (requires cloudflared.exe in your path or current folder)
cloudflared tunnel --url http://localhost:8000
```
*Note: This single link will provide access to both the UI and the API seamlessly.*

---

## 🔐 5. Default Credentials

| Role | Username | Password |
|---|---|---|
| **Administrator** | `admin` | `admin` |
| **Teacher (Demo)** | `testclass` | `testclass` |

---

## 🔍 5. System Check

You can run the comprehensive system check to verify everything is working:
```bash
python final_system_check.py
```

---

*For more details, refer to the [docs](./docs) directory.*
