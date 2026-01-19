# WireMock Integration Brainstorming - Phase 4

## 1. Integration Models (Architecture)

### Option A: External Control Plane
- **Concept:** The platform acts as a UI for existing standalone/Docker WireMock instances.
- **Mechanism:** Communication via WireMock Admin API (`/__admin/mappings`).
- **Pros:** Leverages existing infrastructure; separate resource scaling.
- **Cons:** Tricky state management if instances restart.

### Option B: Embedded Engine (Recommended)
- **Concept:** Embed `wiremock-jre8` directly into the Spring Boot backend.
- **Mechanism:** Start an internal instance on a specific port (e.g., 8082).
- **Pros:** Zero-configuration for users; seamless workspace experience.
- **Cons:** Higher backend memory footprint.

---

## 2. User Experience (UX)

### A. Smart Mock (Auto-Gen)
- Automatically generate Mock responses based on the API's defined JSON Schema.
- Support for dynamic random data (e.g., `{{randomName}}`, `{{randomInt}}`).
- **UI:** A "Mock" button next to "Send" that points the request to the internal Mock URL.

### B. Mock Scenario Editor
- A dedicated tab in the `ApiDebugger` to define custom matching rules.
- **Match Criteria:** Query Params, Header values, or JSONPath matching on Request Body.
- **Response Definition:** Define status codes, response headers, and delay (latency simulation).

### C. Workspace Mock URLs
- Unique endpoint per workspace: `http://platform.local/mock/ws-{id}/api/v1/...`
- Allows frontend developers to start coding before the backend exists.

---

## 3. Technical Aspects

### A. Translation Layer
- Develop a `WireMockService` to convert `ApiDefinition` + `MockRule` entities into WireMock `StubMapping` JSON.

### B. Persistence & Synchronization
- Store all Mock configurations in the MariaDB database.
- **Lifecycle:**
    1. **Startup:** Load all active mocks from DB into the WireMock engine.
    2. **Runtime:** Real-time push to WireMock instance when a user saves a mock rule.

### C. Advanced Matching
- **MVP:** Support exact URL and Method matching.
- **Future:** Support Regex, JSONPath, and Stateful Scenarios (e.g., "Post-Redirect-Get" flows).
