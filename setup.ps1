# 在项目根目录创建并安装虚拟环境（Windows PowerShell）
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$python = $null
if (Get-Command py -ErrorAction SilentlyContinue) {
  $python = "py"
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
  $python = "python"
} else {
  Write-Error "未找到 Python。请先安装 https://www.python.org/downloads/windows/ 并勾选 Add python.exe to PATH，然后重开终端。"
}

if (-not (Test-Path ".\.venv\Scripts\python.exe")) {
  Write-Host "正在创建虚拟环境 .venv ..."
  & $python -m venv .venv
}

$venvPython = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
Write-Host "正在安装依赖 ..."
& $venvPython -m pip install -U pip
& $venvPython -m pip install -r (Join-Path $PSScriptRoot "requirements.txt")
Write-Host "完成。请执行： .\.venv\Scripts\Activate.ps1"
Write-Host "然后启动： python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
