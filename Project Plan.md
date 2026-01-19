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

## 5. Phase 2: UX Enhancements (Immediate Focus)

### 5.1 Smart Environment Import & Conflict Resolution
**Goal:** Prevent broken APIs when copying them between workspaces by ensuring required environment variables exist in the destination.

*   **Implementation Steps:**
    1.  **Frontend Analysis:** Update `WorkspaceDetail.tsx` -> `handleCopyApis`.
        *   Before sending copy request: Scan selected API content strings for `{{variable_name}}` patterns.
        *   Fetch target workspace environments.
        *   Compare required variables vs. available variables in target.
    2.  **Conflict UI:**
        *   If missing variables found: Show a "Missing Environment Variables" Modal.
        *   Option A: "Copy anyway (will break)."
        *   Option B: "Import Environment Config from Source."
    3.  **Environment Import Feature:**
        *   Add "Export Environment" (JSON) and "Import Environment" buttons in `EnvironmentManager`.
        *   Allow deep-copying an Environment from one workspace to another via a new API endpoint or frontend orchestration.

### 5.2 Docs Revolution: Code Generation
**Goal:** Replace the single "Copy cURL" button with a multi-language code generation tab (JS, Python, Java) to make the Docs more useful for developers.

*   **Implementation Steps:**
    1.  **Frontend Components:** Create `CodeGenerator.tsx` component.
    2.  **Logic:** Implement string template generators for:
        *   **JavaScript:** `fetch` with headers/body.
        *   **Python:** `requests.request` with dictionary payloads.
        *   **Java:** `OkHttp` Request builder.
    3.  **UI Update:** Replace the bottom "Code Generation" card in `Documentation.tsx` with a Tabs component containing the new languages + cURL.

### 5.3 API Tags & Grouping
**Goal:** Implement "Tags" to allow logical grouping of APIs (e.g., "User Management", "Orders") in both the Sidebar and Documentation, improving navigation.

*   **Implementation Steps:**
    1.  **Data Model:**
        *   Update `ApiDefinition` (frontend state & backend DTO) to include a `tags: string[]` field in the JSON content.
    2.  **Debugger UI:**
        *   Add a "Tags" input (Select with mode="tags") in `ApiDebugger.tsx` header (near API Name).
    3.  **Sidebar Update:**
        *   Update `WorkspaceDetail.tsx` -> `treeData` generation logic.
        *   Add a toggle: "View by Folder" (current) vs "View by Tag".
        *   If "View by Tag": Group APIs under Tag nodes. APIs with multiple tags appear under multiple nodes.
    4.  **Docs Update:**
        *   Display Tags as colored badges in `Documentation.tsx`.

---

## 6. Phase 3: Advanced UX Architecture (Backlog)

### 6.1 Multi-Tab Interface
**Goal:** Enable developers to work on multiple APIs simultaneously (Postman-style) instead of constantly switching contexts.

*   **Requirement:** Refactor `WorkspaceDetail.tsx` state from single `selectedApiId` to `activeTabs` array.
*   **State Management:** Persist open tabs in `Zustand` or LocalStorage to survive reloads.
*   **UX:** Add a Tab bar above the `ApiDebugger` view.

### 6.2 Drag-and-Drop Ordering
**Goal:** Allow users to manually reorder APIs and Folders in the sidebar.

*   **Requirement:** Add `orderIndex` field to `ApiDefinition` entity.
*   **Backend:** Endpoint to batch update `orderIndex` for multiple IDs.
*   **Frontend:** Enable `draggable` on Ant Design Tree component and handle drop events.

### 6.3 Global Search (Command Palette)
**Goal:** "Cmd+K" / "Ctrl+K" quick navigation to jump to any API or Workspace.

*   **Requirement:** A global modal invoked by hotkey.
*   **Scope:** Search across API Titles, Workspace Names, and Environment Keys.