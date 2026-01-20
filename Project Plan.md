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

## 6. Phase 3: Integration & Advanced UX (Done)

### 6.1 Swagger/OpenAPI Import (Done)
**Goal:** Enable importing existing Swagger/OpenAPI specifications to quickly populate workspaces.

*   **Implementation Steps:**
    1.  **Frontend Parsing:** Integrated a lightweight custom mapper for JSON/YAML.
    2.  **Mapping:** Maps OpenAPI paths, verbs, parameters, and bodies to the `ApiDefinition` structure.
    3.  **UI:** Added "Import OpenAPI" option to the sidebar Import menu.

### 6.2 Comments System (Done)
**Goal:** Allow users to discuss specific APIs or parameters directly within the interface.

*   **Implementation Steps:**
    1.  **Backend:** Created `Comment` entity and associated service/controller.
    2.  **API:** Endpoints for `POST /comments`, `GET /comments/{apiId}`, `PUT /comments/{id}/resolve`.
    3.  **Frontend:** Added a "Comments" side drawer in `ApiDebugger`.
    4.  **Real-time:** Broadcast new comments via WebSocket.

### 6.3 Advanced UX Suite (Done)

#### 6.3.1 Response Visualizer (Done)
*   **Goal:** Better rendering for HTML/Image responses and binary file handling.
*   **Implementation:** 
    *   Added a "Preview" tab for HTML/Image responses.
    *   **Binary Handling:** Upgraded proxy to handle binary data via Base64 encoding.

#### 6.3.2 Global Command Palette (Ctrl+K) (Done)
*   **Goal:** Rapid navigation.
*   **Implementation:**
    *   Global key listener for `Ctrl/Cmd + K`.
    *   Modal with fuzzy search across workspaces.

#### 6.3.3 Smart Paste (cURL Detection) (Done)
*   **Goal:** Seamless import workflow.
*   **Implementation:**
    *   Global `onPaste` listener detects `curl` commands and prompts for import.

#### 6.3.4 Path Parameter Extraction (Done)
*   **Goal:** Auto-fill parameters from URL.
*   **Implementation:**
    *   Listens to URL input and auto-populates a "Path Variables" table.

#### 6.3.5 Layout Customization (Done)
*   **Goal:** Support different screen sizes and workflows.
*   **Implementation:** Added a layout toggle to switch Request/Response view from "Top/Bottom" to "Left/Right".

