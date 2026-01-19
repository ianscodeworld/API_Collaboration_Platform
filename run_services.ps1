$backendJar = "backend/target/platform-0.0.1-SNAPSHOT.jar"
$mockJar = "mock-oauth2-server/target/mock-oauth2-server-0.0.1-SNAPSHOT.jar"
$logDir = "."
$mvnPath = "C:\Program Files\JetBrains\IntelliJ IDEA 2024.3.5\plugins\maven\lib\maven3\bin\mvn.cmd"

Write-Host "--- Service Launcher ---"

# 1. Cleanup Ports (Do this FIRST to release file locks)
Write-Host "Cleaning up ports..."
powershell -ExecutionPolicy Bypass -File ./safe_kill.ps1 8080
powershell -ExecutionPolicy Bypass -File ./safe_kill.ps1 8081
powershell -ExecutionPolicy Bypass -File ./safe_kill.ps1 5174

# 2. Build Projects using IntelliJ Maven
Write-Host "Building Backend..."
$buildBackend = Start-Process -FilePath $mvnPath -ArgumentList "clean", "package", "-DskipTests", "-f", "backend/pom.xml" -Wait -PassThru -NoNewWindow
if ($buildBackend.ExitCode -ne 0) {
    Write-Error "Backend build failed!"
    exit 1
}

Write-Host "Building Mock Server..."
$buildMock = Start-Process -FilePath $mvnPath -ArgumentList "clean", "package", "-DskipTests", "-f", "mock-oauth2-server/pom.xml" -Wait -PassThru -NoNewWindow
if ($buildMock.ExitCode -ne 0) {
    Write-Error "Mock Server build failed!"
    exit 1
}

# 3. Start Backend
Write-Host "Starting Backend (Port 8080)..."
$backendProc = Start-Process -FilePath "java" -ArgumentList "-jar", $backendJar -RedirectStandardOutput "$logDir/backend.log" -RedirectStandardError "$logDir/backend.err" -PassThru -NoNewWindow
Write-Host "Backend PID: $($backendProc.Id)"

# 4. Start Mock Server
if (Test-Path $mockJar) {
    Write-Host "Starting Mock Server (Port 8081)..."
    $mockProc = Start-Process -FilePath "java" -ArgumentList "-jar", $mockJar -RedirectStandardOutput "$logDir/mock-server.log" -RedirectStandardError "$logDir/mock-server.err" -PassThru -NoNewWindow
    Write-Host "Mock Server PID: $($mockProc.Id)"
}

# 5. Start Frontend
Write-Host "Starting Frontend (Port 5174)..."
Set-Location frontend
# Use 'cmd /c' to run npm so we can detach or just Start-Process npm
# 'npm' is a batch file on Windows (npm.cmd). Start-Process needs the full name or shell execution.
# Best for Windows: Use 'npm.cmd' or 'cmd /c npm run dev'
$frontendProc = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -RedirectStandardOutput "../frontend.log" -RedirectStandardError "../frontend.err" -PassThru -NoNewWindow
Set-Location ..
Write-Host "Frontend PID: $($frontendProc.Id)"

Write-Host "All services launch commands issued. Monitoring logs..."
