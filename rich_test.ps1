# Rich Data Import Test with Log Monitoring
$baseUrl = "http://localhost:8080/api/v1"
$logFilesToMonitor = @("backend.log", "frontend.log")
$errorKeywords = @("ERROR", "Exception", "ReferenceError", "NullPointerException", "fail")
$logMonitorTimeoutSeconds = 15 # Monitor logs for this duration after API calls

# Function to monitor log files for error keywords
function Monitor-ServiceLogs {
    param (
        [string[]]$LogFilePaths,
        [string[]]$ErrorKeywords,
        [int]$TimeoutSeconds
    )

    Write-Host "Starting log monitoring for $TimeoutSeconds seconds..." -ForegroundColor DarkYellow
    $errorFound = $false
    $monitorStartTime = Get-Date

    # Store initial file positions (lengths) to read only new content
    $fileOffsets = @{}
    foreach ($path in $LogFilePaths) {
        if (Test-Path $path) {
            $fileOffsets[$path] = (Get-Item $path).Length
        } else {
            $fileOffsets[$path] = 0
            Write-Warning "Log file not found, will monitor if created: $path"
        }
    }

    while ((Get-Date) -lt ($monitorStartTime).AddSeconds($TimeoutSeconds)) {
        foreach ($path in $LogFilePaths) {
            if (Test-Path $path) {
                $currentLength = (Get-Item $path).Length
                if ($currentLength -gt $fileOffsets[$path]) {
                    # Read only new content
                    $newContent = (Get-Content $path -Raw).Substring($fileOffsets[$path])
                    foreach ($keyword in $ErrorKeywords) {
                        if ($newContent -match $keyword) {
                            Write-Host "ERROR: '$keyword' found in $path" -ForegroundColor Red
                            Write-Host "Snippet: $($newContent | Select-String $keyword -Context 2,2 | Out-String)" -ForegroundColor Red
                            $errorFound = $true
                            break # Exit keyword loop
                        }
                    }
                    $fileOffsets[$path] = $currentLength # Update offset after reading
                }
            }
            if ($errorFound) { break } # Exit path loop
        }
        if ($errorFound) { break } # Exit while loop
        Start-Sleep -Milliseconds 500 # Check every 0.5 seconds
    }

    if ($errorFound) {
        Write-Host "Log monitoring FAILED: Errors detected." -ForegroundColor Red
        return $true # Indicate error
    } else {
        Write-Host "Log monitoring PASSED: No errors found." -ForegroundColor Green
        return $false # Indicate no error
    }
}

$overallTestPassed = $true

try {
    # 1. Login
    Write-Host "1. Logging in as admin..."
    $auth = Invoke-RestMethod -Uri "$baseUrl/auth/authenticate" -Method Post -Body (@{username="admin"; password="password"} | ConvertTo-Json) -ContentType "application/json"
    $token = $auth.token
    $headers = @{Authorization="Bearer $token"}
    Write-Host "Login SUCCESS" -ForegroundColor Green

    # 2. Process Rich Collection
    Write-Host "2. Processing rich collection..."
    $json = Get-Content "postman_sample/rich_collection.json" | ConvertFrom-Json
    $item = $json.item[0]
    $request = $item.request

    # URL Reconstruction
    $urlStr = ""
    if ($request.url -is [string]) {
        $urlStr = $request.url
    } elseif ($request.url) {
        $urlStr = $request.url.raw
    }

    # Headers
    $hdrs = @()
    foreach ($h in $request.header) {
        $hdrs += @{
            id = [Math]::Floor((Get-Random -Double) * 1000000000)
            key = if ($h.key) { $h.key } else { "" }
            value = if ($h.value) { $h.value } else { "" }
            type = "string"
            description = if ($h.description) { $h.description } else { "" }
            enabled = if ($h.disabled) { $false } else { $true }
        }
    }

    # Query Params
    $qparams = @()
    if ($request.url.query) {
        foreach ($q in $request.url.query) {
            $qparams += @{
                id = [Math]::Floor((Get-Random -Double) * 1000000000)
                key = if ($q.key) { $q.key } else { "" }
                value = if ($q.value) { $q.value } else { "" }
                type = "string"
                description = if ($q.description) { $q.description } else { "" }
                enabled = if ($q.disabled) { $false } else { $true }
            }
        }
    }

    # Body
    $bodyType = "none"
    $bodyContent = ""
    if ($request.body) {
        if ($request.body.mode -eq "raw") {
            $bodyType = "json"
            $bodyContent = $request.body.raw
        }
    }

    $content = @{
        method = $request.method
        url = $urlStr
        headers = $hdrs
        queryParams = $qparams
        bodyType = $bodyType
        bodyContent = $bodyContent
    }

    $payload = @{
        title = $item.name
        workspace = @{ id = 1 }
        content = ($content | ConvertTo-Json -Compress)
    }

    Write-Host "3. Saving API..."
    $resp = Invoke-RestMethod -Uri "$baseUrl/api-definitions" -Method Post -Headers $headers -Body ($payload | ConvertTo-Json) -ContentType "application/json"
    $newId = $resp.id
    Write-Host "API Saved with ID: $newId" -ForegroundColor Green

    Write-Host "4. Verifying API with ID $newId..."
    $check = Invoke-RestMethod -Uri "$baseUrl/api-definitions/$newId" -Headers $headers
    $parsedContent = $check.content | ConvertFrom-Json

    Write-Host "HEADERS COUNT: $($parsedContent.headers.Count)"
    Write-Host "PARAMS COUNT:  $($parsedContent.queryParams.Count)"
    Write-Host "BODY:          $($parsedContent.bodyContent)"

    $apiLogicPassed = $false
    if ($parsedContent.headers.Count -eq 2 -and $parsedContent.queryParams.Count -eq 2) {
        Write-Host "API LOGIC VERIFIED: DATA PRESERVED" -ForegroundColor Green
        $apiLogicPassed = $true
    } else {
        Write-Host "API LOGIC FAILED: DATA LOST" -ForegroundColor Red
        Write-Host "DEBUG CONTENT: $($check.content)"
    }

    # 5. Monitor logs for errors after API calls
    $logErrorDetected = Monitor-ServiceLogs -LogFilePaths $logFilesToMonitor -ErrorKeywords $errorKeywords -TimeoutSeconds $logMonitorTimeoutSeconds

    if (-not $apiLogicPassed -or $logErrorDetected) {
        $overallTestPassed = $false
    }

} catch {
    Write-Host "TEST ERROR: $($_.Exception.Message)" -ForegroundColor Red
    $overallTestPassed = $false
} finally {
    if ($overallTestPassed) {
        Write-Host "`n--- RICH DATA IMPORT TEST PASSED ---" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "`n--- RICH DATA IMPORT TEST FAILED ---" -ForegroundColor Red
        exit 1
    }
}
