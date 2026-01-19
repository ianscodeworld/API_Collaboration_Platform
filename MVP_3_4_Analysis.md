# MVP 3 & 4: Analysis & Enhancement Plan

## 1. Scope & Objectives

### MVP 3: Environment Governance & Efficiency
*   **Goal:** Eliminate hardcoded values (URLs, Tokens) and enable rapid switching between contexts (e.g., Local, Dev, Prod).
*   **Key Features:**
    *   **Environment Management:** CRUD for Environments (e.g., "Local", "Production") containing Key-Value variables.
    *   **Variable Substitution:** Support `{{variable}}` syntax in URL, Headers, and Body.
    *   **API Cases:** Ability to save specific request configurations (e.g., "Login Success", "Login 403") separate from the main API definition.

### MVP 4: Documentation & Consumption
*   **Goal:** Provide a consumption-friendly interface for Viewers and developers.
*   **Key Features:**
    *   **Documentation Mode:** A clean, read-only interface rendering the API details (Swagger-UI style).
    *   **Code Generation:** One-click generation of `cURL`, `JavaScript (fetch)`, `Python` snippets.

## 2. User Journey Analysis

### 2.1 Admin / Editor (The Creator)
*   **Current Pain Point:**
    *   Must manually edit the URL every time they switch from testing locally to testing dev.
    *   Changing parameter sets for different test scenarios overwrites the main "Save".
*   **Optimized Journey:**
    1.  **Setup:** Creator defines an Environment "Local" (`baseUrl` = `http://localhost:8080`) and "Dev" (`baseUrl` = `https://api.dev.com`).
    2.  **Design:** In the API URL bar, they type `{{baseUrl}}/users`.
    3.  **Switching:** A dropdown in the top right allows instant switching. The URL previews the resolved value.
    4.  **Testing:** They fill in valid credentials -> Click "Save as Case" -> Name it "Happy Path".
    5.  **Testing Edge:** They fill in invalid credentials -> Click "Save as Case" -> Name it "Error 401".

### 2.2 Viewer (The Consumer)
*   **Current Pain Point:**
    *   Sees a grayed-out, disabled "Edit" form. It looks broken or unfriendly.
    *   Cannot easily copy code to use in their app.
*   **Optimized Journey:**
    1.  **Discovery:** Opens a Workspace. The default view is **Documentation Mode** (clean typography, tables for params).
    2.  **Integration:** Clicks a "Code" tab, selects "Python", copies the snippet.
    3.  **Trial:** Clicks "Run" to open a temporary Debugger session (pre-filled with the docs' example data) to test live.

## 3. Implementation Plan

### Phase 1: Environment Engine (Backend + Frontend)
1.  **Backend:** Create `Environment` entity (`name`, `variables` JSON, `workspace_id`).
2.  **Frontend:**
    *   **Env Manager:** A modal to Create/Edit environments and their variables.
    *   **Selector:** Global dropdown in the header to select active Environment.
    *   **Interpolator:** Utility function to replace `{{key}}` with values in `ApiDebugger` before sending.

### Phase 2: API Cases (Backend + Frontend)
1.  **Backend:** Create `ApiTestCase` entity (`name`, `content` JSON, `api_definition_id`).
2.  **Frontend:**
    *   Sidebar update: Render "Cases" nested under APIs.
    *   Debugger update: "Save as Case" button.

### Phase 3: Documentation & Code Gen (Frontend Focus)
1.  **Documentation Component:** A new React component that takes `apiData` and renders a structured page (Title, Method/URL, Params Table, Response Example).
2.  **Toggle:** Switch in `WorkspaceDetail` between "Edit/Debug" and "Docs".
3.  **Code Generator:** Utility to map `apiData` to code strings.

## 4. Proposed Database Schema Updates

```sql
CREATE TABLE environments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    variables JSON, -- {"baseUrl": "...", "token": "..."}
    workspace_id BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE api_test_cases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    api_definition_id BIGINT,
    content LONGTEXT, -- Stores specific headers/body/params
    created_at TIMESTAMP
);
```

## 5. Security Note
*   Environment variables often contain secrets (API Keys).
*   **MVP Approach:** Store in DB.
*   **Future:** Encrypt values in DB (AES). For this sprint, we will store plain text but restrict access via existing Workspace permissions.
