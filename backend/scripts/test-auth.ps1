param(
  [string]$ApiBaseUrl = "http://localhost:5000"
)

# ASCII-only output and assertions: compatible with Windows PowerShell 5.1
# regardless of the script file's character encoding.
$ErrorActionPreference = "Stop"

function Send-Json([string]$Path, [string]$Method, $Data) {
  Invoke-RestMethod -Uri "$ApiBaseUrl$Path" -Method $Method `
    -ContentType "application/json" -Body ($Data | ConvertTo-Json -Depth 5) `
    -ErrorAction Stop
}

try {
  $email = "smoke-$([guid]::NewGuid().ToString('N').Substring(0,12))@example.com"
  $password = "EduMasterTest123!"

  $registered = Send-Json "/api/auth/register" "Post" @{
    fullName = "Test Student"; email = $email; password = $password
  }
  if ($registered.user.email -ne $email) { throw "Register response email mismatch" }
  Write-Host "[OK] Register (STUDENT)" -ForegroundColor Green

  $logged = Send-Json "/api/auth/login" "Post" @{
    email = $email; password = $password
  }
  if (-not $logged.accessToken -or -not $logged.refreshToken) {
    throw "Login did not return both tokens"
  }
  Write-Host "[OK] Login + JWT" -ForegroundColor Green

  $me = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/api/auth/me" `
    -Headers @{ Authorization = "Bearer $($logged.accessToken)" } -ErrorAction Stop
  if ($me.user.email -ne $email) { throw "GET /me returned wrong user" }
  Write-Host "[OK] GET /me" -ForegroundColor Green

  $rotated = Send-Json "/api/auth/refresh" "Post" @{
    refreshToken = $logged.refreshToken
  }
  if (-not $rotated.accessToken -or -not $rotated.refreshToken) {
    throw "Refresh did not return both tokens"
  }
  if ($rotated.refreshToken -eq $logged.refreshToken) {
    throw "Refresh token was not rotated"
  }
  Write-Host "[OK] Refresh token rotation" -ForegroundColor Green

  # Test logout by HTTP status, not a localized message string.
  $logoutResponse = Invoke-WebRequest -UseBasicParsing `
    -Uri "$ApiBaseUrl/api/auth/logout" -Method Post `
    -ContentType "application/json" `
    -Body (@{ refreshToken = $rotated.refreshToken } | ConvertTo-Json) `
    -ErrorAction Stop
  if ([int]$logoutResponse.StatusCode -ne 200) {
    throw "Logout returned HTTP $($logoutResponse.StatusCode), expected 200"
  }
  Write-Host "[OK] Logout (HTTP 200)" -ForegroundColor Green

  # Verify logout actually revoked the refresh token.
  $got401 = $false
  try {
    $null = Send-Json "/api/auth/refresh" "Post" @{
      refreshToken = $rotated.refreshToken
    }
  } catch {
    $response = $_.Exception.Response
    if ($null -eq $response) { throw }
    $status = [int]$response.StatusCode
    if ($status -ne 401) {
      throw "Refresh after logout returned HTTP $status, expected 401"
    }
    $got401 = $true
  }
  if (-not $got401) { throw "Revoked refresh token was still accepted" }
  Write-Host "[OK] Refresh after logout rejected (HTTP 401)" -ForegroundColor Green
  Write-Host "PASS: all authentication smoke tests succeeded." -ForegroundColor Green
} catch {
  $status = $null
  if ($null -ne $_.Exception.Response) {
    try { $status = [int]$_.Exception.Response.StatusCode } catch {}
  }
  if ($null -ne $status) {
    Write-Host "[FAIL] HTTP $status - $($_.Exception.Message)" -ForegroundColor Red
  } else {
    Write-Host "[FAIL] $($_.Exception.Message)" -ForegroundColor Red
  }
  exit 1
}
