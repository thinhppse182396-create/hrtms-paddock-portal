param(
    [string]$BaseUrl = "http://localhost:5199"
)

$ErrorActionPreference = "Stop"

function Invoke-HrtmsGet([string]$Path) {
    Invoke-RestMethod -Uri "$BaseUrl$Path" -Method Get
}

function Get-ItemCount([object]$Items) {
    if ($null -eq $Items) {
        return 0
    }

    return ($Items | Measure-Object).Count
}

Write-Host "Checking HRTMS API at $BaseUrl"

$health = Invoke-HrtmsGet "/api/health"
if ($health.status -ne "ok") {
    throw "Health check failed."
}

$users = Invoke-HrtmsGet "/api/users"
$tracks = Invoke-HrtmsGet "/api/tracks"
$tournaments = Invoke-HrtmsGet "/api/tournaments"
$races = Invoke-HrtmsGet "/api/races"
$registrations = Invoke-HrtmsGet "/api/registrations"
$results = Invoke-HrtmsGet "/api/race-results/RACE-DEMO-003"

if ((Get-ItemCount $users) -eq 0 -or
    (Get-ItemCount $tracks) -eq 0 -or
    (Get-ItemCount $tournaments) -eq 0 -or
    (Get-ItemCount $races) -eq 0 -or
    (Get-ItemCount $registrations) -eq 0 -or
    (Get-ItemCount $results) -eq 0) {
    throw "Demo seed verification failed."
}

if ($null -eq ($races | Select-Object -First 1).scheduledAt) {
    throw "Race schedule verification failed."
}

$loginBody = @{
    username = "admin_super"
    password = "admin123"
} | ConvertTo-Json

$login = Invoke-RestMethod `
    -Uri "$BaseUrl/api/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $loginBody

if ($login.roleCode -ne "ADMIN") {
    throw "Demo admin login failed."
}

Write-Host "Health: OK"
Write-Host "Users: $(Get-ItemCount $users)"
Write-Host "Tracks: $(Get-ItemCount $tracks)"
Write-Host "Tournaments: $(Get-ItemCount $tournaments)"
Write-Host "Races: $(Get-ItemCount $races)"
Write-Host "Race schedules: OK"
Write-Host "Registrations: $(Get-ItemCount $registrations)"
Write-Host "Results for RACE-DEMO-003: $(Get-ItemCount $results)"
Write-Host "Admin login: OK"
