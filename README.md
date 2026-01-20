# Enterprise API Collaboration Platform

## 1. Overview
This project is a self-hosted **Enterprise API Collaboration Platform** designed to replace fragmented tools like Postman, Swagger UI, and loose JSON files in corporate intranet environments. Built on the philosophy of **"Documentation as Protocol"**, it serves as the single source of truth for Development, Testing, and Operations teams.

Unlike generic tools, this platform is tailored for internal networks, handling complex authentication flows automatically and ensuring data never leaves your secure environment.

## 2. User Benefits & Efficiency
We solve the specific friction points that slow down engineering teams:

*   **🚫 Stop Manually Copying Tokens:** The "Auto-Auth" engine automatically fetches, caches, and injects OAuth2 tokens into your requests. Define the environment once, and never paste a Bearer token again.
*   **⚡ Real-Time Collaboration:** Changes to API definitions are broadcast instantly via WebSockets. If a colleague updates a payload, you see it immediately—no more "pulling latest" or emailing JSON files.
*   **🔒 Secure by Design:** A built-in Backend Proxy handles CORS issues and keeps sensitive credentials server-side. Your frontend browser never sees or stores sensitive client secrets.
*   **🌐 Infrastructure Accessibility:** Test APIs in **DBS UAT and SIT environments** without infrastructure roadblocks. Since requests are proxied via the backend, you can interact with APIs that are restricted to internal LANs or usually require a VDI, all from a standard browser session.
*   **📚 Documentation that writes itself:** Every request you save automatically updates the documentation. Developers can grab ready-to-run code snippets in Java (OkHttp), Python (Requests), and JavaScript (Fetch) instantly.
*   **💬 Contextual Communication:** Discuss specific API behaviors right next to the definition using the built-in Comments system, keeping communication context-aware and resolving issues faster.

## 3. User Guide & Feature Highlights

### 🚀 Rapid Navigation
*   **Global Command Palette:** Press **`Ctrl + K`** (or `Cmd + K`) anywhere in the app to open the fuzzy search. Instantly jump to any Workspace or API without clicking through menus.

### 📥 Smart Import
*   **Magic Paste:** Just copy a `curl` command from your terminal or logs and **paste (Ctrl+V)** it anywhere in the dashboard. The system detects the command and offers to import it as a fully structured API request.
*   **OpenAPI/Swagger:** Use the Import menu to upload `openapi.json` files and bulk-populate your workspace.

### 🧪 Test Cases
*   **Save as Case:** Don't overwrite your main API definition when testing edge cases. Click **"Save as Case"** (e.g., "Create User - Duplicate Email") to save a specific combination of parameters and body for future regression testing.

### 📝 Collaboration
*   **Comments:** Open the **Comment Drawer** (speech bubble icon) on any API to leave notes for your team. Mark threads as "Resolved" when the implementation is fixed.
*   **Copy to Workspace:** Need to move APIs between projects? Select them in the sidebar and use the **Copy** button to clone them into another workspace, including intelligent environment variable detection.

### 🎨 Custom Layout
*   **Visualizer:** The response pane now supports **HTML Preview** and **Image Rendering**.
*   **Split View:** Toggle between **Vertical** (standard) and **Horizontal** (widescreen) layouts using the layout switch in the debugger header.

## 4. Technical Specifications

### Frontend
*   **Framework:** React 19 + TypeScript (Vite)
*   **UI Library:** Ant Design 6.0
*   **State Management:** Zustand (Persisted)
*   **Real-time:** `sockjs-client` + `@stomp/stompjs`
*   **Key Libs:** `re-resizable` (Layouts), `monaco-editor` (Code View)

### Backend
*   **Framework:** Spring Boot 3.2.2 (Java 21)
*   **Security:** Spring Security 6 (Stateless JWT, RBAC)
*   **Database:** MariaDB (JPA/Hibernate)
*   **Architecture:** Modular Monolith (Auth, Core, History, Proxy modules)

### Architecture Highlights
*   **Backend Proxy:** All actual HTTP requests are made by the Spring Boot backend, not the browser. This bypasses CORS limits and enables secure credential injection.
*   **WebSocket Sync:** Full-duplex communication for instant UI updates.

## 5. Setup & Running

### Prerequisites
*   **Java:** JDK 21+
*   **Node.js:** v18+
*   **Database:** MariaDB (or MySQL) running on port 3306

### Quick Start (Windows)
We provide automated scripts to handle the build and launch process.

1.  **Start All Services:**
    ```powershell
    powershell -ExecutionPolicy Bypass -File run_services.ps1
    ```
    *This script kills conflicting processes, builds the backend/mock-server using Maven, and starts the Frontend.*

2.  **Access the Platform:**
    *   Frontend: `http://localhost:5174`
    *   Default Admin User: `admin` / `password`

3.  **Stopping Services:**
    ```powershell
    powershell -ExecutionPolicy Bypass -File safe_kill.ps1 <port>
    ```
