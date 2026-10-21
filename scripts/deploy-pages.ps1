<#
.SYNOPSIS
    把 知识点讲解/ 打包并发布到 gh-pages（GitHub Pages / Gitee Pages 共用同一分支）。

.DESCRIPTION
    流程：build-deploy.py 生成 deploy-site/ → 用 git worktree 检出 gh-pages →
    覆盖文件 → commit → 推送到 origin（Gitee）与 github。
    没有变化时不会产生空提交。

.PARAMETER SkipBuild
    跳过重新打包，直接推送现有 deploy-site/。

.PARAMETER Message
    自定义提交信息。

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\deploy-pages.ps1
#>
[CmdletBinding()]
param(
    [switch]$SkipBuild,
    [string]$Message = ''
)

$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

$root = Split-Path -Parent $PSScriptRoot
$site = Join-Path $root 'deploy-site'

if (-not $SkipBuild) {
    Write-Host '=== 1/3 打包 deploy-site/ ===' -ForegroundColor Cyan
    Push-Location $root
    & python 'scripts\build-deploy.py'
    $code = $LASTEXITCODE
    Pop-Location
    if ($code -ne 0) { Write-Host '[FAIL] 打包失败' -ForegroundColor Red; exit 1 }
}
if (-not (Test-Path $site)) { Write-Host '[FAIL] 没有 deploy-site/，先不带 -SkipBuild 跑一次' -ForegroundColor Red; exit 2 }

Write-Host '=== 2/3 检出 gh-pages 工作树 ===' -ForegroundColor Cyan
$tmp = Join-Path $env:TEMP ('gh-pages-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
Push-Location $root
& git worktree add --detach $tmp gh-pages 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host '[FAIL] 本地没有 gh-pages 分支。先手动建一次：' -ForegroundColor Red
    Write-Host '  git fetch origin gh-pages:gh-pages' -ForegroundColor Yellow
    exit 3
}
Pop-Location

Get-ChildItem $tmp -Force | Where-Object { $_.Name -ne '.git' } | Remove-Item -Recurse -Force
Copy-Item (Join-Path $site '*') $tmp -Recurse -Force

Write-Host '=== 3/3 提交并推送 ===' -ForegroundColor Cyan
& git -C $tmp add -A
$msg = if ($Message) { $Message } else { 'deploy: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') }
& git -C $tmp -c user.name='course-notes' -c user.email='notes@local' commit -q -m $msg 2>&1 | Out-Null
$changed = ($LASTEXITCODE -eq 0)

if ($changed) {
    & git -C $tmp push origin HEAD:gh-pages 2>&1 | Select-Object -Last 1
    if ($LASTEXITCODE -eq 0) { Write-Host '  [OK] 已推送 Gitee' -ForegroundColor Green } else { Write-Host '  [!] Gitee 推送失败（网络或权限）' -ForegroundColor Yellow }
    & git -C $tmp push github HEAD:gh-pages 2>&1 | Select-Object -Last 1
    if ($LASTEXITCODE -eq 0) { Write-Host '  [OK] 已推送 GitHub' -ForegroundColor Green } else { Write-Host '  [!] GitHub 推送失败（网络）' -ForegroundColor Yellow }
} else {
    Write-Host '  内容没有变化，跳过推送' -ForegroundColor DarkGray
}

& git worktree remove $tmp --force 2>&1 | Out-Null
Write-Host ''
Write-Host '线上地址：https://conceal123456.github.io/learn_javaweb/' -ForegroundColor Cyan
Write-Host '（推送后 30–90 秒生效，Ctrl+F5 强制刷新）' -ForegroundColor DarkGray
