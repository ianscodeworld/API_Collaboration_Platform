param([int]$Port)

if (-not $Port) {
    Write-Error "Please provide a port number."
    exit 1
}

$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

if ($connections) {
    $pidsToKill = $connections.OwningProcess | Select-Object -Unique
    foreach ($procId in $pidsToKill) {
        if ($procId -ne 0) { # Don't try to kill System Idle Process
            try {
                $process = Get-Process -Id $procId -ErrorAction Stop
                Write-Host "Found process '$($process.ProcessName)' (PID: $procId) on port $Port. Killing..."
                Stop-Process -Id $procId -Force -ErrorAction Stop
                Write-Host "Process $procId killed."
            } catch {
                Write-Warning "Could not kill process $procId : $($_.Exception.Message)"
            }
        }
    }
} else {
    Write-Host "No process found on port $Port."
}
