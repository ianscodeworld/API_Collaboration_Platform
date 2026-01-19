# Enterprise API Collaboration Platform - Project Specification Document

## 1. Project Vision

To build a Postman/Apifox-style API life-cycle management platform specifically for corporate intranet environments. By adhering to the "Documentation as Protocol" philosophy, we aim to bridge the collaboration gap between development, testing, and operations. The platform will solve core pain points such as tedious manual token acquisition, discrepancies between documentation and code, and fragmented environment configurations.

## 2. Technology Stack

- **Frontend**: React (Zustand for state management, Ant Design for UI components).
    
- **Backend**: Java (Spring Boot) using a Modular Monolith architecture.
    
- **Database**: MariaDB (Storing API definitions, environment configs, and user data).
    
- **Authentication**: Independent OAuth2 module (same project but logically isolated from core business logic).
    
- **Deployment**: OCP (OpenShift Container Platform).
    

## 3. Core Feature Matrix

### 3.1 Basics & Import/Export

- **API Debugging**: Supports URL, Method, Header, and Body configuration with request execution.
    
- **Multi-format Import**: Supports Swagger (OpenAPI 2.0/3.0), Postman Collection, and JMeter (future support).
    
- **Compliance**: API documentation fully complies with OpenAPI (JSON Schema) specifications.
    

### 3.2 Team Collaboration (Core Competitive Edge)

- **Shared Workspaces**: Team members can collaborate in real-time with cloud-synced data.
    
- **Real-time Synchronization**: Powered by WebSockets to ensure updates made by one user are reflected across all clients almost instantly.
    
- **Multi-environment Sharing & Auto-Auth**:
    
    - Supports switching between "Dev," "Test," and "Prod" environments.
        
    - **Auto-Token Injection**: The backend proxy automatically requests tokens from OAuth2 based on environment configs and injects them into headers, removing manual steps.
        
- **RBAC (Role-Based Access Control)**: Includes Admin (System-level), Editor (Write access), and Viewer (Read-only access).
    

### 3.3 Advanced Collaboration Features

- **Versioning & Diff**: Records every change to an interface, supporting visual comparisons between versions.
    
- **Online Debugging Docs**: Integrated debugging capabilities directly within the documentation page.
    
- **Code Generation**: One-click export for Java (OkHttp/Feign) and Python (Requests) code snippets.
    
- **Comments & Annotations**: Leave comments directly next to specific fields or parameters to enhance asynchronous review efficiency.
    

## 4. MVP Roadmap (Completed: MVP 1-4)

### MVP 1: Identity & Connectivity (Done)
- Auth Module, API Core Schema, Backend Proxy.

### MVP 2: Collaboration & Real-time Sync (Done)
- Workspaces, WebSocket Sync, RBAC.

### MVP 3: Env Governance & Auto-Auth (Done)
- Environment Variables, Auto-Token Injection, Postman/cURL Import.

### MVP 4: Distribution, Versioning & Code Gen (Done)
- Docs View, Version Snapshots, basic copy functionality.

---

## 5. Phase 2: UX Enhancements (Completed)

### 5.1 Smart Environment Import & Conflict Resolution (Done)
- Detects missing variables, allows Environment Cloning.

### 5.2 Docs Revolution: Code Generation (Done)
- Multi-language tabs (Java, JS, Python).

### 5.3 API Tags & Grouping (Done)
- Tag management, Sidebar grouping, Docs badges.

### 5.4 Multi-Tab Interface (Done)
- Tab bar for multiple open APIs, state preservation.

---

## 6. Phase 3: Integration & Advanced UX (Next Steps)

### 6.1 Swagger/OpenAPI Import (High Priority)
**Goal:** Enable importing existing Swagger/OpenAPI specifications to quickly populate workspaces.

*   **Implementation Steps:**
    1.  **Frontend Parsing:** Integrate `swagger-parser` or similar lightweight library.
    2.  **Mapping:** Map OpenAPI paths, verbs, parameters, and bodies to the `ApiDefinition` JSON structure.
    3.  **UI:** Add "Import OpenAPI" option to the sidebar Import menu. Support file upload (`.json`, `.yaml`) and URL import.

### 6.2 Comments System (Team Collaboration)
**Goal:** Allow users to discuss specific APIs or parameters directly within the interface.

*   **Implementation Steps:**
    1.  **Backend:** Create `Comment` entity (`apiId`, `fieldPath`, `content`, `userId`, `resolved`, `createdAt`).
    2.  **API:** Endpoints for `POST /comments`, `GET /comments/{apiId}`, `PUT /comments/{id}/resolve`.
    3.  **Frontend:**
        *   Add a "Comments" side drawer or float button in `ApiDebugger`.
        *   (Advanced) Allow clicking a parameter row to add a comment linked to that field (`fieldPath`).
    4.  **Real-time:** Broadcast new comments via WebSocket.

### 6.3 Advanced UX Suite (The "Polish")

#### 6.3.1 Response Visualizer
*   **Goal:** Better rendering for HTML/Image responses and binary file handling.
*   **Implementation:** 
    *   Add Tabs to Response area: `Preview` (iframe), `Raw` (text), `Image` (img tag).
    *   **Binary Handling:** Detect `Content-Type` (PDF, Excel, Zip). If binary, prevent text rendering and show a "Download File" button with size info. Support PDF preview via `<embed>`.

#### 6.3.2 Global Command Palette (Ctrl+K)
*   **Goal:** Rapid navigation.
*   **Implementation:**
    *   Global key listener for `Ctrl/Cmd + K`.
    *   Modal with fuzzy search (fuse.js) across all APIs and Workspaces.
    *   Selecting an item navigates to it or opens it in a new tab.

#### 6.3.3 Smart Paste (cURL Detection)
*   **Goal:** Seamless import workflow.
*   **Implementation:**
    *   Global `onPaste` listener in `WorkspaceDetail`.
    *   Regex check: If text starts with `curl `, prompt "Import cURL?".
    *   If confirmed, parse and open in new tab.

#### 6.3.4 Path Parameter Extraction
*   **Goal:** Auto-fill parameters from URL.
*   **Implementation:**
    *   Listen to URL Input `onChange`.
    *   Regex match `:variable` or `{variable}`.
    *   Automatically add/update entries in the `Params` table.

#### 6.3.5 Layout Customization
*   **Goal:** Support different screen sizes and workflows.
*   **Implementation:** Add a "Layout" toggle button to switch Request/Response view from "Top/Bottom" (Vertical Split) to "Left/Right" (Horizontal Split).
