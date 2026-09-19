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
Write-Host "完成。不要用系统里的 python（Windows 商店别名可能立刻退出且没有输出）。"
Write-Host "启动请执行： .\\start-dev.ps1"
Write-Host "或： .\\.venv\\Scripts\\python.exe start.py"
