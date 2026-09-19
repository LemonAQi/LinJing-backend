# Start LinJing API on Windows. Run from the repo root:
#   cd D:\java\work\Linjing-backend
#   .\start-dev.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Write-LinJing([string]$Message) {
  Write-Host "[LinJing] $Message"
}

Write-LinJing "working directory: $(Get-Location)"

if (-not (Test-Path ".\app\main.py")) {
  Write-LinJing "FAILED: app\main.py is missing."
  Write-LinJing "This folder is not the login API checkout."
  Write-LinJing "Run: git checkout cursor/uni-login-users-d4b8"
  Write-LinJing "Then: git pull origin cursor/uni-login-users-d4b8"
  exit 1
}

$venvPython = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
  Write-LinJing "FAILED: .venv is missing. Run .\setup.ps1 first."
  exit 1
}

Write-LinJing "using $venvPython"
& $venvPython -c "import uvicorn, fastapi; print('[LinJing] uvicorn', uvicorn.__version__)"
if ($LASTEXITCODE -ne 0) {
  Write-LinJing "FAILED: uvicorn is not installed in .venv. Run .\setup.ps1"
  exit 1
}

Write-LinJing "starting http://127.0.0.1:8000 ..."
& $venvPython (Join-Path $PSScriptRoot "start.py")
$code = $LASTEXITCODE
Write-LinJing "server exited with code $code"
exit $code
