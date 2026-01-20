# Enterprise API Collaboration Platform - Gemini Context

## Project Overview
This project is an **Enterprise API Collaboration Platform** (Postman/Apifox alternative) for corporate intranet environments. It bridges the gap between development, testing, and operations with a "Documentation as Protocol" philosophy.

**Git Repository:** `git@github.com:ianscodeworld/API_Collaboration_Platform.git`

### Core Value Proposition
- **Real-time Collaboration:** WebSocket-powered synchronization for workspaces and API definitions.
- **Backend Proxy:** Frontend requests route through the backend to bypass CORS and inject secure credentials.
- **Auto-Auth (OAuth2):** The backend automatically fetches, caches, and injects OAuth2 tokens based on environment presets.
- **Role-Based Access:** Granular control (Admin, Editor, Viewer) over workspaces and system management.

## Technology Stack & Architecture

### Frontend
- **Framework:** React + TypeScript (Vite)
- **State Management:** Zustand (Persisted)
- **UI Library:** Ant Design (Tabs, Tree, Forms) + Re-resizable
- **Real-time:** `sockjs-client` + `@stomp/stompjs`
- **Key Features:**
    - **Multi-Tab Interface:** Postman-style tab management for working on multiple APIs simultaneously.
    - **Environment Manager:** Manage variables and OAuth2 providers.
    - **Smart Docs:** Read-only view with multi-language code generation (Java, JS, Python).
    - **Live Debugger:** Request runner with variable interpolation and tag management.

### Backend
- **Framework:** Spring Boot 3.2.2 (Java 21)
- **Architecture:** Modular Monolith
    - **Auth Module:** JWT Authentication, RBAC.
    - **Core Module:** Workspaces, APIs, Environments, History, Proxy Logic.
- **Security:** Spring Security 6 (Stateless JWT, Global CORS).
- **Database:** MariaDB (Auto-schema update enabled).

## Implemented Features (MVP 1-4 + Phase 2 + Phase 3 Complete)

### 1. Identity & Access Management
- **JWT Auth:** Secure Login/Register flow.
- **Roles:** ADMIN, EDITOR, VIEWER.
- **Temporary Password Flow:** Admin creates user -> Backend generates "Phrase Password" -> User forced to change on first login.
- **Copy Credentials:** Admin can one-click copy professionally formatted credentials for new users.

### 2. Workspace & Collaboration
- **Workspaces:** CRUD operations and ownership model.
- **Real-time Sync:** API changes broadcast via WebSocket.
- **Comments System (New):** Inline discussions on APIs with resolve functionality and real-time alerts.
- **Multi-Tab Interface:** Open multiple APIs/Cases in tabs, preserving state while switching.
- **Smart Copy:** When copying APIs between workspaces, the system detects missing environment variables and offers to clone the source environment.

### 3. API Lifecycle & Organization
- **API CRUD:** Full lifecycle for definitions.
- **API Tags:** Group APIs by custom tags in the sidebar and view them as badges in documentation.
- **Sidebar Modes:** Switch between "Folder View" (List) and "Tag View".
- **Path Parameter Extraction (New):** Auto-detects `:param` or `{param}` in URL and populates a dedicated variables table.
- **Auto-Versioning:** Snapshots created automatically on every Save.

### 4. Documentation & Code Gen
- **Docs Revolution:** Multi-language code generation tabs (cURL, JavaScript/Fetch, Python/Requests, Java/OkHttp).
- **Swagger/OpenAPI Import (New):** One-click import for OpenAPI 2.0/3.0 JSON specifications.
- **Response Visualizer (New):** "Preview" tab for HTML/Image responses with binary proxy support.

### 5. Environment Engine & Auto-Auth
- **Context Switching:** Multi-environment support (Local, Dev, Prod).
- **Variables:** `{{baseUrl}}` substitution in URL/Headers/Body.
- **OAuth2 Automation:** Backend fetches, caches, and injects Bearer tokens.

### 6. UX Suite
- **Global Command Palette (New):** `Ctrl+K` shortcut for rapid fuzzy searching of workspaces.
- **Smart Paste (New):** Automatically detects cURL commands in clipboard and prompts for import.
- **Layout Customization (New):** Toggle between Vertical and Horizontal split views in the debugger.
- **Responsive Layout:** Optimized for 1080p, 2K, 4K monitors.

## Development & Testing Strategy (The MATE Rule)
1.  **Mandatory Full Testing:** Comprehensive E2E tests before completion.
2.  **Active Service Environment:** Monitor logs (`backend.log`, `frontend.log`) for hidden exceptions.
3.  **Traceable Data Flow:** Raw input (dirty cURL/JSON) -> DB.
4.  **End-to-End Verification:** DB -> UI check.
5.  **Parser Isolation:** Verify complex parsing via standalone unit tests.

## Key Fixes & Resolutions (Today's Session)

### 1. Critical Bug Fixes
- **500 on Duplicate User:** Implemented `DuplicateResourceException` to return 409 Conflict instead of generic 500 when creating users/emails that exist.
- **Password Change Crash:** Fixed a critical NPE caused by Spring Security configuration incorrectly bypassing the filter chain for `/change-password`.
- **Frontend Layout:** Fixed responsiveness issues on 2K/4K screens where buttons squeezed the URL bar. Implemented a flex-wrap layout with minimum widths.

### 2. UX Enhancements
- **Professional Copy:** Updated the "User Created" modal to copy a structured credential block.
- **Tab Management:** Replaced the single-view debugger with a robust Tab system.

## Setup & Running

### Automated (Recommended)
```powershell
powershell -ExecutionPolicy Bypass -File run_services.ps1
```

### Manual
- **Backend:** `cd backend && mvn clean package -DskipTests && java -jar target/platform-0.0.1-SNAPSHOT.jar`
- **Frontend:** `cd frontend && npm run dev`

## Test Credentials
| Username | Password | Role |
| :--- | :--- | :--- |
| **admin** | `password` | `ADMIN` |
| **editor** | `password` | `EDITOR` |
| **viewer** | `password` | `VIEWER` |
