# System Testing and Validations

## 6.1 Unit Testing
Unit tests isolate specific functionalities, methods, and API routes to ensure core logical consistency without dependence on external system states.

| Test Case | Description | Expectation | Result |
| :--- | :--- | :--- | :--- |
| **TC_UT_01** | Connect to SQLite DB | Successful engine instantiation | Pass |
| **TC_UT_02** | Create Auth Token | Using valid credentials, generate JWT | Pass |
| **TC_UT_03** | InsightFace Embedding | Supplying face image yields `[1x512]` array | Pass |
| **TC_UT_04** | Global Period Validation | Given `10:15` input, Period 2 `ACTIVE` | Pass |

## 6.2 Integration Testing
Integration testing guarantees that two or more isolated systems pass information correctly. Specifically targeting database, AI, and HTTP REST bridge mechanisms.

| Module | Integration | Result Breakdown |
| :--- | :--- | :--- |
| **Data Service -> SQLite** | Pydantic Schema parsing | Successfully maps incoming UI payloads to table insertions (e.g., Staff Profiles, Class Groups). |
| **Frontend -> WebRTC** | `react-webcam` API | Captures 1080p frames and reliably passes Blobs to the network layer via `FormData`. |
| **FastAPI -> ChromaDB** | InsightFace matching | `recognize` endpoint reliably extracts and pushes vectors to Chroma. Nearest neighbor searching successfully returns ID matches. |

## 6.3 Acceptance Testing
User Acceptance Testing handles whether the system behaves exactly as the final customer expects, ensuring the offline architecture strictly obeys constraints.

| Requirement Label | Verification Method | Status |
| :--- | :--- | :--- |
| **Offline First** | Sever network. Navigate UI and start attendance scan. The UI must cache assets and process AI perfectly on `localhost`. | Verified |
| **Late Entry Warning** | Submit an attendance record marked at `10:05` instead of `10:00`. UI must display amber 'Late Entry' indicator. | Verified |
| **Haptic Feedback** | Device vibrating upon correct detection (`Distance < 0.6`) using mobile native `navigator.vibrate` hooks | Verified |
| **Live Staff View** | Clicking an Admin teacher profile dynamically updates the "Live Class" dashboard panel to show their exact current class schedule state. | Verified |

## 6.4 Validations
Key validation protocols enforce extreme system robustness and data sanitation.

1.  **Form Input**: Pydantic strongly typing completely refuses `null` or missing field submissions when adding Staff members via Admin portals. It refuses duplicate Email and Staff Code tokens.
2.  **Schema Consistency**: If an external AI (via MCP Gateway) submits an invalid JSON object shape to register attendance, the `422 Unprocessable Entity` strictly intercepts that request.
3.  **Conflict Prevention**: Timetable engine intercepts user requests trying to map a single `staff_id` to two unique different `group_id` classes occurring concurrently during the same `period` enum.
