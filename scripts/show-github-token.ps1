<#
.SYNOPSIS
    读取 Windows 凭据管理器里保存的 GitHub 令牌。

.DESCRIPTION
    git push 时由 Git Credential Manager 保存，target 为 git:https://github.com。
    默认只显示掩码并把明文复制到剪贴板；加 -Show 才在终端打印明文；
    加 -Check 会调 GitHub API 验证令牌是否还有效。

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\show-github-token.ps1
    powershell -ExecutionPolicy Bypass -File .\scripts\show-github-token.ps1 -Show
    powershell -ExecutionPolicy Bypass -File .\scripts\show-github-token.ps1 -Check
#>
[CmdletBinding()]
param(
    [switch]$Show,
    [switch]$Check,
    [string]$Target = 'git:https://github.com'
)

$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;

public static class CredReader
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL
    {
        public int Flags;
        public int Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }

    [DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredRead(string target, int type, int flags, out IntPtr credential);

    [DllImport("advapi32.dll", SetLastError = true)]
    public static extern void CredFree(IntPtr cred);

    public static string Read(string target, out string user)
    {
        IntPtr ptr;
        user = null;
        if (!CredRead(target, 1, 0, out ptr)) return null;   // 1 = CRED_TYPE_GENERIC
        try
        {
            CREDENTIAL c = (CREDENTIAL)Marshal.PtrToStructure(ptr, typeof(CREDENTIAL));
            user = c.UserName;
            if (c.CredentialBlobSize <= 0) return "";
            byte[] bytes = new byte[c.CredentialBlobSize];
            Marshal.Copy(c.CredentialBlob, bytes, 0, bytes.Length);
            return System.Text.Encoding.Unicode.GetString(bytes).TrimEnd('\0');
        }
        finally { CredFree(ptr); }
    }
}
'@

$user = $null
$token = [CredReader]::Read($Target, [ref]$user)

if ([string]::IsNullOrEmpty($token)) {
    Write-Host "[FAIL] 没找到凭据：$Target" -ForegroundColor Red
    Write-Host '可能还没登录过，或已被删除。下次 git push 会重新弹窗登录。' -ForegroundColor Yellow
    exit 1
}

$mask = if ($token.Length -gt 14) { $token.Substring(0, 7) + '…' + $token.Substring($token.Length - 4) } else { '…' }

Write-Host "凭据目标 : $Target"
Write-Host "账号     : $user"
Write-Host "长度     : $($token.Length) 字符"
Write-Host "掩码     : $mask"

try {
    Set-Clipboard -Value $token
    Write-Host '已复制到剪贴板，可直接 Ctrl+V 粘贴。' -ForegroundColor Green
} catch {
    Write-Host '[!] 复制到剪贴板失败，用 -Show 查看明文。' -ForegroundColor Yellow
}

if ($Check) {
    try {
        $me = Invoke-RestMethod -Uri 'https://api.github.com/user' -Headers @{
            Authorization = "token $token"
            'User-Agent'  = 'show-github-token'
        } -TimeoutSec 20
        Write-Host "API 校验 : 有效，登录身份 $($me.login)" -ForegroundColor Green
    } catch {
        Write-Host "API 校验 : 失败（$($_.Exception.Message)）" -ForegroundColor Yellow
    }
}

if ($Show) {
    Write-Host ''
    Write-Host '明文：' -ForegroundColor Cyan
    Write-Host $token
}
