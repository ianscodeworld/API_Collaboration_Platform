# Enterprise API Collaboration Platform - Gemini Context

## Project Overview
This project is an **Enterprise API Collaboration Platform** (Postman/Apifox alternative) for corporate intranet environments. It bridges the gap between development, testing, and operations with a "Documentation as Protocol" philosophy.

### Core Value Proposition
- **Real-time Collaboration:** WebSocket-powered synchronization for workspaces and API definitions.
- **Backend Proxy:** Frontend requests route through the backend to bypass CORS and inject secure credentials.
- **Auto-Auth (OAuth2):** The backend automatically fetches, caches, and injects OAuth2 tokens based on environment presets.
- **Role-Based Access:** Granular control (Admin, Editor, Viewer) over workspaces and system management.

## Technology Stack & Architecture

### Frontend
- **Framework:** React + TypeScript (Vite)
- **State Management:** Zustand (Persisted)
- **UI Library:** Ant Design
- **Real-time:** `sockjs-client` + `@stomp/stompjs`
- **Key Features:**
    - **Environment Manager:** Manage variables and OAuth2 providers.
    - **Documentation Mode:** Read-only Swagger-like view with cURL generation.
    - **Live Debugger:** Postman-style request runner with variable interpolation.
    - **Request History:** Sidebar list of recent executions.

### Backend
- **Framework:** Spring Boot 3.2.2 (Java 21)
- **Architecture:** Modular Monolith
    - **Auth Module:** JWT Authentication, RBAC.
    - **Core Module:** Workspaces, APIs, Environments, History, Proxy Logic.
- **Security:** Spring Security 6 (Stateless JWT, Global CORS, Nuclear-option bypass for public paths).
- **Database:** MariaDB (Auto-schema update enabled).

## Implemented Features (MVP 1-4 Complete)

### 1. Identity & Access Management
- **JWT Auth:** Secure Login/Register flow.
- **Roles:** ADMIN, EDITOR, VIEWER.
- **Temporary Password Flow (New):**
    - Admin creates user -> Backend generates a human-readable "Phrase Password" (e.g., `coolstar`) via `PhraseGenerator`.
    - User is forced to change password upon first login via a non-closable modal.
- **User Settings:** Integrated password change functionality in the dashboard header.

### 2. Workspace & Collaboration
- **Workspaces:** CRUD operations and ownership model.
- **Sharing:** Add/Remove users from workspaces.
- **Real-time Sync:** API changes broadcast via WebSocket.
- **Portability (New):** "Copy to Workspace" allows cloning selected APIs/Cases to another workspace.

### 3. API Lifecycle & History
- **API CRUD:** Full lifecycle for definitions including Title renaming.
- **Auto-Versioning:** Snapshots created automatically on every Save if content changes.
- **Selective Export (New):** Tree-view checkboxes allow exporting specific APIs as a Postman Collection.

### 4. Environment Engine & Auto-Auth
- **Context Switching:** Multi-environment support (Local, Dev, Prod).
- **Variables:** `{{baseUrl}}` substitution in URL/Headers/Body.
- **OAuth2 Automation:** Backend fetches, caches, and injects Bearer tokens.

## Development & Testing Strategy (The MATE Rule)
1.  **Mandatory Full Testing:** Comprehensive E2E tests before completion.
2.  **Active Service Environment:** Monitor logs (`backend.log`, `frontend.log`).
3.  **Traceable Data Flow:** Raw input (dirty cURL/JSON) -> DB.
4.  **End-to-End Verification:** DB -> UI check.
5.  **Parser Isolation:** Verify complex parsing via standalone unit tests.

## Key Learnings & Resolutions (Recent)

### 1. Process Stability & Environment
- **Port Management:** Created `safe_kill.ps1` to terminate processes by port number, avoiding accidental CLI/Agent termination.
- **Automation:** Implemented `run_services.ps1` to orchestrate clean builds (using IntelliJ's Maven path) and service launches.
- **Dependency Integrity:** Resolved Vite import errors caused by corrupted `node_modules` (e.g., missing `@ant-design/icons-svg` files) via targeted reinstallation.

### 2. Modernized UI & Responsiveness
- **High-Res Optimization:** Removed fixed-width constraints in `App.css` and `MainLayout` to support 1080p, 2K, and 4K monitors.
- **Adjustable Workspaces:** Integrated `re-resizable` for both the collection sidebar and the vertical split between request/response panels.

### 3. Security & UX Improvements
- **Phrase Passwords:** Replaced UUIDs with a `PhraseGenerator` utility (adjective + noun) for temporary passwords, making them easy to read/share while remaining secure for one-time use.
- **Forced Password Change:** Implemented a backend `mustChangePassword` flag and corresponding frontend modal logic to ensure temporary credentials are immediately replaced.

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