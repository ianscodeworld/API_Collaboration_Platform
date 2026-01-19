# Configuration
$baseUrl = "http://localhost:8080/api/v1"
$adminUser = "admin"
$adminPass = "password"
$testUser = "suite_tester"
$testPass = "password"
$collabUser = "suite_collab"

function Assert-Success($response, $stepName) {
    Write-Host "[$stepName] ... SUCCESS" -ForegroundColor Green
}

function Assert-Error($stepName, $details) {
    Write-Host "[$stepName] ... FAILED" -ForegroundColor Red
    Write-Host "Error Details: $details" -ForegroundColor Red
    exit 1
}

# --- 1. Setup & Admin Tests ---
Write-Host "`n--- 1. Admin & User Management ---"

# Login as Admin
try {
    $body = @{ username = $adminUser; password = $adminPass } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/authenticate" -Method Post -Body $body -ContentType "application/json"
    $adminToken = $res.token
    Assert-Success $res "Admin Login"
} catch { Assert-Error "Admin Login" $_ }

$adminHeaders = @{ "Authorization" = "Bearer $adminToken"; "Content-Type" = "application/json" }

# Clean up users if they exist
try { Invoke-RestMethod -Uri "$baseUrl/admin/users/$testUser" -Method Delete -Headers $adminHeaders } catch {}
try { Invoke-RestMethod -Uri "$baseUrl/admin/users/$collabUser" -Method Delete -Headers $adminHeaders } catch {}

# Create Test User
try {
    $body = @{ username = $testUser; email = "$testUser@example.com"; password = $testPass; role = "EDITOR" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method Post -Headers $adminHeaders -Body $body
    Assert-Success $null "Create User '$testUser'"
} catch { Assert-Error "Create User" $_ }

# Create Collab User
try {
    $body = @{ username = $collabUser; email = "$collabUser@example.com"; password = $testPass; role = "VIEWER" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method Post -Headers $adminHeaders -Body $body
    Assert-Success $null "Create User '$collabUser'"
} catch { Assert-Error "Create Collab User" $_ }


# --- 2. Core Workspace & API Tests ---
Write-Host "`n--- 2. Core Workspace & API Lifecycle ---"

# Login as Test User
try {
    $body = @{ username = $testUser; password = $testPass } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/authenticate" -Method Post -Body $body -ContentType "application/json"
    $userToken = $res.token
    Assert-Success $res "User Login"
} catch { Assert-Error "User Login" $_ }

$userHeaders = @{ "Authorization" = "Bearer $userToken"; "Content-Type" = "application/json" }

# Create Workspace
try {
    $body = @{ name = "Test Suite WS"; description = "Automated test" } | ConvertTo-Json
    $ws = Invoke-RestMethod -Uri "$baseUrl/workspaces" -Method Post -Headers $userHeaders -Body $body
    $wsId = $ws.id
    Assert-Success $ws "Create Workspace (ID: $wsId)"
} catch { Assert-Error "Create Workspace" $_ }

# Create API (POST)
try {
    # Note: We send minimal workspace object { id: ... } to avoid the serialization issues we fixed
    $body = @{ 
        title = "Create API Test"; 
        workspace = @{ id = $wsId }; 
        content = "{`"url`":`"http://google.com`"}" 
    } | ConvertTo-Json
    $api = Invoke-RestMethod -Uri "$baseUrl/api-definitions" -Method Post -Headers $userHeaders -Body $body
    $apiId = $api.id
    Assert-Success $api "Create API Definition (POST) (ID: $apiId)"
} catch { Assert-Error "Create API Definition" $_ }

# Get API (GET)
try {
    $apiGet = Invoke-RestMethod -Uri "$baseUrl/api-definitions/$apiId" -Method Get -Headers $userHeaders
    if ($apiGet.title -ne "Create API Test") { throw "Title mismatch" }
    Assert-Success $apiGet "Get API Definition (GET)"
} catch { Assert-Error "Get API Definition" $_ }

# Update API (PUT)
try {
    # We send back the object we got, but modify content
    $apiGet.content = "{`"url`":`"http://updated.com`"}"
    $jsonBody = $apiGet | ConvertTo-Json -Depth 5
    $apiUpdate = Invoke-RestMethod -Uri "$baseUrl/api-definitions/$apiId" -Method Put -Headers $userHeaders -Body $jsonBody
    if ($apiUpdate.content -notlike "*updated.com*") { throw "Content not updated" }
    Assert-Success $apiUpdate "Update API Definition (PUT)"
} catch { Assert-Error "Update API Definition" $_ }


# --- 3. Collaboration Tests ---
Write-Host "`n--- 3. Collaboration & Sharing ---"

# Share Workspace (as Admin, simulating override, or Owner? The endpoint is in WorkspaceController)
# Note: The controller logic currently checks simple ownership.
# We will use the 'testUser' (owner) to share it with 'collabUser'
try {
    Invoke-RestMethod -Uri "$baseUrl/workspaces/$wsId/share?username=$collabUser" -Method Post -Headers $userHeaders
    Assert-Success $null "Share Workspace with '$collabUser'"
} catch { Assert-Error "Share Workspace" $_ }

# Login as Collab User
try {
    $body = @{ username = $collabUser; password = $testPass } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/authenticate" -Method Post -Body $body -ContentType "application/json"
    $collabToken = $res.token
} catch { Assert-Error "Collab User Login" $_ }

$collabHeaders = @{ "Authorization" = "Bearer $collabToken"; "Content-Type" = "application/json" }

# Verify Access
try {
    $workspaces = Invoke-RestMethod -Uri "$baseUrl/workspaces" -Method Get -Headers $collabHeaders
    $found = $workspaces | Where-Object { $_.id -eq $wsId }
    if ($found) {
        Assert-Success $null "Collab User can see shared workspace"
    } else {
        throw "Shared workspace not found in list"
    }
} catch { Assert-Error "Verify Shared Access" $_ }

# Unshare (Remove User)
try {
    Invoke-RestMethod -Uri "$baseUrl/workspaces/$wsId/share?username=$collabUser" -Method Delete -Headers $userHeaders
    Assert-Success $null "Unshare Workspace"
} catch { Assert-Error "Unshare Workspace" $_ }

# Verify Removal
try {
    $workspaces = Invoke-RestMethod -Uri "$baseUrl/workspaces" -Method Get -Headers $collabHeaders
    $found = $workspaces | Where-Object { $_.id -eq $wsId }
    if ($found) {
        throw "Workspace still visible after removal"
    } else {
        Assert-Success $null "Collab User lost access (Correct)"
    }
} catch { Assert-Error "Verify Unshare" $_ }


# --- 4. Proxy Test ---
Write-Host "`n--- 4. Proxy Connectivity ---"
try {
    $body = @{
        url = "http://localhost:8080/api/v1/test/ping"
        method = "GET"
    } | ConvertTo-Json
    $proxyRes = Invoke-RestMethod -Uri "$baseUrl/proxy/execute" -Method Post -Headers $userHeaders -Body $body
    if ($proxyRes.body -eq "pong") {
        Assert-Success $null "Proxy Request (Internal Ping)"
    } else {
        throw "Unexpected proxy response: $($proxyRes.body)"
    }
} catch { Assert-Error "Proxy Request" $_ }

Write-Host "`n--- ALL SYSTEMS FUNCTIONAL ---" -ForegroundColor Cyan
