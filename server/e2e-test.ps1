# E2E smoke test for Mente-Corpo backend
# Usage: in PowerShell (server folder):
#   powershell -ExecutionPolicy Bypass -File .\e2e-test.ps1

$base = 'http://localhost:4000'

Write-Host "Starting E2E test against $base`n"

# unique email
$ts = [int][double]::Parse((Get-Date -UFormat %s))
$email = "e2e+$ts@example.com"
$password = 'SenhaE2e!123'
$name = 'E2E Tester'

function Try-Do([scriptblock]$b) {
    try {
        & $b
    } catch {
        Write-Host "ERROR: $_" -ForegroundColor Red
        exit 1
    }
}

# Register
Write-Host "Registering user $email"
$body = @{ name = $name; email = $email; password = $password } | ConvertTo-Json
Try-Do { $reg = Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop }
Write-Host "Registered:"; $reg | Format-List

# Login
Write-Host "Logging in"
$body = @{ email = $email; password = $password } | ConvertTo-Json
Try-Do { $login = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop }
$token = $login.token
Write-Host "Token: $($token.Substring(0,20))..."

$headers = @{ Authorization = "Bearer $token" }

# Get profile
Write-Host "Fetching /api/users/me"
Try-Do { $me = Invoke-RestMethod -Uri "$base/api/users/me" -Method Get -Headers $headers -ErrorAction Stop }
$me | Format-List

# Create agenda event
Write-Host "Creating agenda event"
$event = @{ title = "E2E Appointment $ts"; details = 'Detalhes de teste'; start = '2025-11-10 09:00'; end = $null } | ConvertTo-Json
Try-Do { $createdEvent = Invoke-RestMethod -Uri "$base/api/agenda" -Method Post -Headers $headers -Body $event -ContentType 'application/json' -ErrorAction Stop }
Write-Host "Created event:"; $createdEvent | Format-List

# List agenda
Write-Host "Listing /api/agenda"
Try-Do { $events = Invoke-RestMethod -Uri "$base/api/agenda" -Method Get -Headers $headers -ErrorAction Stop }
Write-Host "Events count: $($events.Count)"

# Post chat message
Write-Host "Posting chat message"
$msg = @{ content = "E2E test message $ts" } | ConvertTo-Json
Try-Do { $createdMsg = Invoke-RestMethod -Uri "$base/api/chat" -Method Post -Headers $headers -Body $msg -ContentType 'application/json' -ErrorAction Stop }
Write-Host "Created message:"; $createdMsg | Format-List

# List chat messages
Write-Host "Listing /api/chat"
Try-Do { $msgs = Invoke-RestMethod -Uri "$base/api/chat" -Method Get -Headers $headers -ErrorAction Stop }
Write-Host "Messages count: $($msgs.Count)"

# Create habit (simple)
Write-Host "Creating habit definition"
$notes = @{ meta = @{ localId = 999 }; data = @{ name = 'E2E Habit' } } | ConvertTo-Json
$habit = @{ title = "E2E Habit $ts"; notes = $notes } | ConvertTo-Json
Try-Do { $createdHabit = Invoke-RestMethod -Uri "$base/api/habits" -Method Post -Headers $headers -Body $habit -ContentType 'application/json' -ErrorAction Stop }
Write-Host "Created habit:"; $createdHabit | Format-List

# List habits
Write-Host "Listing /api/habits"
Try-Do { $habits = Invoke-RestMethod -Uri "$base/api/habits" -Method Get -Headers $headers -ErrorAction Stop }
Write-Host "Habits count: $($habits.Count)"

Write-Host "`nE2E test completed successfully." -ForegroundColor Green
exit 0
