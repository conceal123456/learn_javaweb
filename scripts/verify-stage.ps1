#requires -Version 5.1
<#
.SYNOPSIS
    第 N 讲工程自检：判断这一讲的代码在当前机器上能不能起来。

.DESCRIPTION
    本脚本只做"能不能跑"的冒烟验证，不改任何工程代码：
      * 前端阶段（1-7 都有前端）：检查 Node 版本 -> npm ci（缺 node_modules 时）
        -> npm run build -> 起 dev server -> 轮询 200 -> 打印人工验收清单 -> 默认收工杀进程。
      * 第 7 讲额外验证后端：检查 JDK/Maven -> mvn clean package -> java -jar
        -> 轮询 /hello -> 逐个断言 5 个接口 -> 杀进程。

    前端是 Vite SPA，HTTP 返回的 HTML 只是空壳（<div id="app"></div>），
    所以脚本只能证明"服务起来了 + 构建成功"，页面文案要看"人工验收清单"。

.PARAMETER Stage
    讲次，1..7。默认端口：1=5171 ... 7=5177（第 7 讲该端口给前端）。

.PARAMETER Port
    自定义端口。1-6 讲 = 前端 dev server 端口；第 7 讲 = 后端 HTTP 端口（默认 8080）。
    例：-Port 5191 / -Port 8090（8080 被占用时）。

.PARAMETER FrontendPort
    仅第 7 讲使用：前端 dev server 端口，默认 5177。

.PARAMETER SkipInstall
    跳过 npm ci。用于 node_modules 已装好的目录（干净克隆里不要加）。

.PARAMETER KeepRunning
    检测完不杀进程，打印 PID / 地址，方便自己打开浏览器看。用完记得 taskkill /PID <pid> /T /F。

.PARAMETER SkipFrontend
    仅第 7 讲：只验后端。

.PARAMETER SkipBackend
    仅第 7 讲：只验前端。

.PARAMETER TimeoutSec
    等待 dev server / 后端就绪的超时秒数，默认 60。

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\verify-stage.ps1 -Stage 1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\verify-stage.ps1 -Stage 7 -Port 8090
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateRange(1, 7)]
    [int]$Stage,

    [int]$Port = 0,

    [int]$FrontendPort = 0,

    [switch]$SkipInstall,

    [switch]$KeepRunning,

    [switch]$SkipFrontend,

    [switch]$SkipBackend,

    [int]$TimeoutSec = 60
)

$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
$OutputEncoding = [System.Text.Encoding]::UTF8

$RepoRoot = Split-Path -Parent $PSScriptRoot
$Script:Results = New-Object System.Collections.ArrayList
$Script:ExitCode = 0
$Script:TotalWatch = [System.Diagnostics.Stopwatch]::StartNew()

function Add-Check {
    param([string]$Name, [bool]$Ok, [string]$Detail)
    $mark = 'FAIL'
    if ($Ok) { $mark = 'PASS' }
    [void]$Script:Results.Add([pscustomobject]@{ 检查项 = $Name; 结果 = $mark; 说明 = $Detail })
    if ($Ok) {
        Write-Host ("  [PASS] {0}  {1}" -f $Name, $Detail) -ForegroundColor Green
    } else {
        Write-Host ("  [FAIL] {0}  {1}" -f $Name, $Detail) -ForegroundColor Red
    }
}

function Set-FailCode {
    param([int]$Code)
    if ($Script:ExitCode -eq 0) { $Script:ExitCode = $Code }
}

function Say-Head {
    param([string]$Text)
    Write-Host ''
    Write-Host ('=' * 70) -ForegroundColor Cyan
    Write-Host $Text -ForegroundColor Cyan
    Write-Host ('=' * 70) -ForegroundColor Cyan
}

function Get-NodeVersion {
    $raw = $null
    try { $raw = & node -v 2>$null } catch { return $null }
    if (-not $raw) { return $null }
    $text = "$raw".Trim()
    if ($text -match '^v(\d+)\.(\d+)\.(\d+)') {
        return [pscustomobject]@{
            Major = [int]$Matches[1]
            Minor = [int]$Matches[2]
            Patch = [int]$Matches[3]
            Text  = $text
        }
    }
    return $null
}

function Test-NodeSatisfies {
    param($NodeVer, [string]$Rule)
    if ($null -eq $NodeVer) { return $false }
    if ($Rule -eq 'vite7') {
        # Vite 7 / create-vue 3.21：^20.19.0 || >=22.12.0
        if ($NodeVer.Major -eq 20 -and $NodeVer.Minor -ge 19) { return $true }
        if ($NodeVer.Major -ge 22 -and ($NodeVer.Major -gt 22 -or $NodeVer.Minor -ge 12)) { return $true }
        return $false
    }
    # Vite 8 / create-vue 3.24：^22.18.0 || >=24.12.0
    if ($NodeVer.Major -eq 22 -and $NodeVer.Minor -ge 18) { return $true }
    if ($NodeVer.Major -ge 24 -and ($NodeVer.Major -gt 24 -or $NodeVer.Minor -ge 12)) { return $true }
    return $false
}

function Get-JavaMajor {
    $out = $null
    try { $out = & java -version 2>&1 } catch { return $null }
    $text = ($out | Out-String)
    if ($text -match 'version "(\d+)') { return [int]$Matches[1] }
    return $null
}

function Get-MavenVersion {
    $out = $null
    try { $out = & mvn -v 2>&1 } catch { return $null }
    $text = ($out | Out-String)
    if ($text -match 'Apache Maven (\d+)\.(\d+)\.(\d+)') {
        return [pscustomobject]@{
            Major = [int]$Matches[1]
            Minor = [int]$Matches[2]
            Patch = [int]$Matches[3]
            Text  = ("{0}.{1}.{2}" -f $Matches[1], $Matches[2], $Matches[3])
        }
    }
    return $null
}

function Test-PortFree {
    param([int]$P)
    if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
        $conn = $null
        try { $conn = Get-NetTCPConnection -LocalPort $P -State Listen -ErrorAction Stop } catch { }
        if ($conn) { return $false }
        return $true
    }
    # 兜底：直接尝试连接（老系统没有 Get-NetTCPConnection）
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $client.Connect('127.0.0.1', $P)
        $client.Close()
        return $false
    } catch {
        return $true
    }
}

function Get-PortOwnerPid {
    param([int]$P)
    if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
        try {
            $conn = Get-NetTCPConnection -LocalPort $P -State Listen -ErrorAction Stop
            if ($conn) { return [int]$conn[0].OwningProcess }
        } catch { }
    }
    return 0
}

function Stop-ProcessTree {
    param($Proc)
    if ($null -eq $Proc) { return }
    try {
        if (-not $Proc.HasExited) {
            & taskkill /PID $Proc.Id /T /F 2>&1 | Out-Null
        }
    } catch { }
}

function Wait-PortReleased {
    param([int]$P, [int]$Seconds = 10)
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $Seconds) {
        if (Test-PortFree $P) { return $true }
        Start-Sleep -Milliseconds 500
    }
    return (Test-PortFree $P)
}

function Wait-HttpOk {
    param([string]$Url, [int]$TimeoutSec, $Proc)
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $TimeoutSec) {
        if ($null -ne $Proc) {
            try { if ($Proc.HasExited) { return $false } } catch { }
        }
        try {
            $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
            if ([int]$r.StatusCode -eq 200) { return $true }
        } catch { }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

function Wait-AnyHttpOk {
    param([string[]]$Urls, [int]$TimeoutSec, $Proc, [ref]$UsedUrl)
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $TimeoutSec) {
        if ($null -ne $Proc) {
            try { if ($Proc.HasExited) { return $false } } catch { }
        }
        foreach ($u in $Urls) {
            try {
                $r = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 2
                if ([int]$r.StatusCode -eq 200) {
                    $UsedUrl.Value = $u
                    return $true
                }
            } catch { }
        }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

function Show-LogTail {
    param([string]$Path, [int]$Lines = 25)
    if (Test-Path $Path) {
        Write-Host ("  ---- {0}（最后 {1} 行）----" -f (Split-Path -Leaf $Path), $Lines) -ForegroundColor Yellow
        Get-Content $Path -Tail $Lines -ErrorAction SilentlyContinue | ForEach-Object { Write-Host ("    " + $_) }
    }
}

function Invoke-NpmStep {
    param([string]$WorkDir, [string[]]$NpmArgs, [string]$LogPath)
    Push-Location $WorkDir
    try {
        & npm @NpmArgs *>&1 | Tee-Object -FilePath $LogPath | Out-Null
        return $LASTEXITCODE
    } finally {
        Pop-Location
    }
}

# =====================================================================
# 阶段定义
# =====================================================================
$StageMap = @{
    1 = @{
        Title       = '实训1 软件安装及创建 Vue 项目'
        Project     = '实训1_软件安装及创建Vue项目\工程\hello-vue'
        DefaultPort = 5171
        NodeRule    = 'vite7'
        Routes      = @('/')
        Checklist   = @(
            '页面应显示一行字：欢迎来到安徽中医药大学信工院JavaWeb课堂！',
            'F12 Console 不应出现红色报错',
            '地址栏为 http://localhost:5171/（脚本探测成功的地址会打印出来）'
        )
    }
    2 = @{
        Title       = '实训2 Vue 基本语法'
        Project     = '实训2_Vue基本语法\工程\vue-syntax'
        DefaultPort = 5172
        NodeRule    = 'vite8'
        Routes      = @('/')
        Checklist   = @(
            '首页应能看到 9 个语法点：插值、v-model、v-if、v-for、@click、v-bind(:style/:src)、onMounted',
            '点"点赞 +1"数字会变；点"切换方块颜色"红蓝互换；点"换一张图片"图片切换',
            '刷新页面应弹出 onMounted 的 alert（URL 带 ?noalert=1 可跳过）'
        )
    }
    3 = @{
        Title       = '实训3 前端 Element Plus 框架'
        Project     = '实训3_前端ElementPlus框架\工程\element-plus'
        DefaultPort = 5173
        NodeRule    = 'vite8'
        Routes      = @('/home', '/comp')
        Checklist   = @(
            '/home：能看到 6 种 type 的 el-button（默认/主要/成功/警告/危险/信息）',
            '/home：能看到 60px 的 School 图标 + "安中医"文字（左浅右深两版对比）',
            '/comp：实训4 的组件全览页（输入框、下拉、单选、多选、图片、轮播、日期、表格分页、弹窗）'
        )
    }
    4 = @{
        Title       = '实训4 Element-Plus 组件的使用'
        Project     = '实训3_前端ElementPlus框架\工程\element-plus'
        DefaultPort = 5174
        NodeRule    = 'vite8'
        Routes      = @('/comp', '/comp-orig')
        Checklist   = @(
            '/comp：修正版组件页——分页翻页表格会变、页码有底色、轮播 2 秒一换',
            '/comp-orig：讲义原版——控制台应有 interval 类型告警、background 未定义告警（这是"故意保留"的对照页）',
            '/comp：新增/查看/删除弹窗可打开（el-dialog / ElMessageBox）'
        )
    }
    5 = @{
        Title       = '实训5 Vue-Router 实现路由跳转'
        Project     = '实训5_Vue-Router实现路由跳转\工程\vue-router'
        DefaultPort = 5175
        NodeRule    = 'vite8'
        Routes      = @('/home', '/test', '/manage/user', '/manage/goods', '/manage/orders')
        Checklist   = @(
            '/：应重定向到 /home',
            '/test：测试页；/manage/user|goods|orders：后台管理子页面能显示',
            '切换路由时浏览器标签页标题跟着变（meta.title 守卫）'
        )
    }
    6 = @{
        Title       = '实训6 后台管理页面'
        Project     = '实训6_后台管理页面\工程\admin-layout'
        DefaultPort = 5176
        NodeRule    = 'vite8'
        Routes      = @('/home', '/manage/detail', '/manage/user', '/manage/orders')
        Checklist   = @(
            '/manage/detail：左侧 el-menu + 右侧内容区（后台布局）',
            '/manage/user、/manage/orders：点左侧菜单能切换，右侧内容跟着换',
            '访问 /manage 应自动跳到 /manage/detail（不然右侧空白）'
        )
    }
    7 = @{
        Title       = '实训7 新建 SpringBoot 项目（前端 + 后端）'
        Project     = '实训7_新建SpringBoot项目\工程\xm-pro\vue'
        DefaultPort = 5177
        NodeRule    = 'vite7'
        Backend     = '实训7_新建SpringBoot项目\工程\xm-pro\springboot'
        BackendPort = 8080
        Routes      = @('/home', '/manage', '/manage/detail')
        Checklist   = @(
            '/home：首页；/manage：后台管理首页；/manage/detail：内容展示',
            '后端 5 个接口应全部返回 HTTP 200，code 依次为 200 / 500 / (Map 无 code) / 200 / 400',
            '后端中文不能乱码（"Hello 安徽中医药大学！"）'
        )
    }
}

function Show-StageHeader {
    param($Def, [string]$PortText)
    Say-Head ("阶段 {0} / 7：{1}" -f $Stage, $Def.Title)
    Write-Host ("  工程目录：{0}" -f $Def.Project)
    Write-Host ("  端口    ：{0}" -f $PortText)
    Write-Host ("  PS 版本 ：{0}（脚本要求 Windows PowerShell 5.1+）" -f $PSVersionTable.PSVersion.ToString())
}

function Show-Checklist {
    param($Def, [string]$BaseUrl)
    Write-Host ''
    Write-Host '  人工验收清单（自动断言只能证明"服务起来了"，页面内容请人工确认）：' -ForegroundColor Cyan
    $i = 1
    foreach ($item in $Def.Checklist) {
        Write-Host ("    {0}. {1}" -f $i, $item)
        $i++
    }
    Write-Host ''
    Write-Host '  可直接打开的地址：' -ForegroundColor Cyan
    foreach ($route in $Def.Routes) {
        if ($route -eq '/') {
            Write-Host ("    {0}" -f $BaseUrl)
        } else {
            Write-Host ("    {0}{1}" -f $BaseUrl.TrimEnd('/'), $route)
        }
    }
}

function Invoke-FrontendStage {
    param($Def, [int]$DevPort)

    Show-StageHeader $Def ("前端 http://localhost:{0}" -f $DevPort)

    # ---------- 1. 环境检查 ----------
    Say-Head '1/5 环境检查（Node / npm）'
    $node = Get-NodeVersion
    if ($null -eq $node) {
        Add-Check 'Node 可用' $false '找不到 node 命令；请安装 Node 并确认已加入 PATH（重开终端）'
        Set-FailCode 2
        return $false
    }
    Write-Host ("  node -v : {0}" -f $node.Text)
    $npmVer = $null
    try { $npmVer = (& npm -v 2>$null) } catch { }
    Write-Host ("  npm -v  : {0}" -f $npmVer)
    $nodeOk = Test-NodeSatisfies $node $Def.NodeRule
    if ($Def.NodeRule -eq 'vite7') {
        $need = '^20.19.0 || >=22.12.0（推荐 Node 22 LTS / 24）'
    } else {
        $need = '^22.18.0 || >=24.12.0（推荐 Node 22.18+ / 24.12+）'
    }
    Add-Check 'Node 版本满足要求' $nodeOk ("当前 {0}，要求 {1}" -f $node.Text, $need)
    if (-not $nodeOk) {
        Set-FailCode 2
        Write-Host '  处理建议：装 Node 22 LTS（>=22.18）或 24（>=24.12），或用 nvm 切换版本后重开终端。' -ForegroundColor Yellow
        return $false
    }

    $proj = Join-Path $RepoRoot $Def.Project
    if (-not (Test-Path $proj)) {
        Add-Check '工程目录存在' $false ("找不到 {0}；确认克隆完整（git status 应为空）" -f $proj)
        Set-FailCode 2
        return $false
    }
    Add-Check '工程目录存在' $true $Def.Project

    if (-not (Test-PortFree $DevPort)) {
        $owner = Get-PortOwnerPid $DevPort
        Add-Check '端口空闲' $false ("{0} 已被 PID {1} 占用" -f $DevPort, $owner)
        Set-FailCode 2
        Write-Host ("  处理建议：换端口重跑，例如 -Port {0}" -f ($DevPort + 100)) -ForegroundColor Yellow
        return $false
    }
    Add-Check '端口空闲' $true ("{0} 可用" -f $DevPort)

    # ---------- 2. 安装依赖 ----------
    Say-Head '2/5 安装依赖'
    $nm = Join-Path $proj 'node_modules'
    $installSec = 0.0
    if (Test-Path $nm) {
        Write-Host '  node_modules 已存在，跳过安装（加 -SkipInstall 可显式跳过）'
        Add-Check '依赖就绪' $true 'node_modules 已存在'
    } elseif ($SkipInstall) {
        Add-Check '依赖就绪' $false 'node_modules 不存在，但指定了 -SkipInstall'
        Set-FailCode 3
        Write-Host '  处理建议：去掉 -SkipInstall 重跑；或先手动 cd 到工程目录执行 npm ci --no-audit --no-fund' -ForegroundColor Yellow
        return $false
    } else {
        $installLog = Join-Path $env:TEMP ("verify-stage{0}-install.log" -f $Stage)
        Remove-Item $installLog -ErrorAction SilentlyContinue
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        if (Test-Path (Join-Path $proj 'package-lock.json')) {
            Write-Host '  npm ci --no-audit --no-fund ...（首次装依赖可能要 1-3 分钟）'
            $code = Invoke-NpmStep $proj @('ci', '--no-audit', '--no-fund') $installLog
        } else {
            Write-Host '  没有 package-lock.json，退回 npm install ...'
            $code = Invoke-NpmStep $proj @('install', '--no-audit', '--no-fund') $installLog
        }
        $installSec = [math]::Round($sw.Elapsed.TotalSeconds, 1)
        if ($code -ne 0) {
            Show-LogTail $installLog 30
            Add-Check 'npm ci' $false ("退出码 {0}，见 {1}" -f $code, $installLog)
            Set-FailCode 3
            Write-Host '  处理建议：检查网络/镜像（npm config get registry 建议 https://registry.npmmirror.com）；删掉 node_modules 后重跑。' -ForegroundColor Yellow
            return $false
        }
        Add-Check 'npm ci' $true ("耗时 {0}s" -f $installSec)
    }

    # ---------- 3. 构建 ----------
    Say-Head '3/5 生产构建（npm run build）'
    $buildLog = Join-Path $env:TEMP ("verify-stage{0}-build.log" -f $Stage)
    Remove-Item $buildLog -ErrorAction SilentlyContinue
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $buildCode = Invoke-NpmStep $proj @('run', 'build') $buildLog
    $buildSec = [math]::Round($sw.Elapsed.TotalSeconds, 1)
    if ($buildCode -ne 0) {
        Show-LogTail $buildLog 30
        Add-Check 'npm run build' $false ("退出码 {0}，耗时 {1}s，日志 {2}" -f $buildCode, $buildSec, $buildLog)
        Set-FailCode 4
        Write-Host '  处理建议：往上翻构建报错；常见是依赖没装全（删 node_modules 重新 npm ci）或 Node 版本不符。' -ForegroundColor Yellow
        return $false
    }
    Add-Check 'npm run build' $true ("耗时 {0}s" -f $buildSec)
    $distIndex = Join-Path $proj 'dist\index.html'
    if (Test-Path $distIndex) {
        $sizeKb = [math]::Round(((Get-Item $distIndex).Length / 1024.0), 1)
        Add-Check '构建产物 dist/index.html' $true ("存在，{0} KB" -f $sizeKb)
    } else {
        Add-Check '构建产物 dist/index.html' $false '构建退出码 0 但没有 dist/index.html'
        Set-FailCode 4
    }

    # ---------- 4. 起 dev server ----------
    Say-Head '4/5 启动 dev server 并等待 HTTP 200'
    $devOut = Join-Path $env:TEMP ("verify-stage{0}-dev.out.log" -f $Stage)
    $devErr = Join-Path $env:TEMP ("verify-stage{0}-dev.err.log" -f $Stage)
    Remove-Item $devOut, $devErr -ErrorAction SilentlyContinue
    $devArgs = 'npm run dev -- --port ' + $DevPort + ' --strictPort'
    $proc = $null
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $proc = Start-Process -FilePath $env:ComSpec -ArgumentList ('/c "' + $devArgs + '"') `
            -WorkingDirectory $proj -RedirectStandardOutput $devOut -RedirectStandardError $devErr `
            -PassThru -WindowStyle Hidden
        Write-Host ("  已启动：npm run dev -- --port {0} --strictPort（PID {1}）" -f $DevPort, $proc.Id)
        $usedUrl = ''
        $ready = Wait-AnyHttpOk -Urls @("http://localhost:$DevPort/", "http://127.0.0.1:$DevPort/") `
            -TimeoutSec $TimeoutSec -Proc $proc -UsedUrl ([ref]$usedUrl)
        $devSec = [math]::Round($sw.Elapsed.TotalSeconds, 1)
        if (-not $ready) {
            Show-LogTail $devOut 30
            Show-LogTail $devErr 20
            Add-Check 'dev server 就绪' $false ("等待 {0}s 未拿到 HTTP 200（耗时 {1}s）" -f $TimeoutSec, $devSec)
            Set-FailCode 5
            Write-Host '  处理建议：' -ForegroundColor Yellow
            Write-Host ("    * 端口被占用 / 想换端口：-Port {0}" -f ($DevPort + 100))
            Write-Host '    * 依赖或 node 版本问题：删 node_modules 重跑，或 node -v 检查版本'
            Write-Host '    * 想看完整日志：见上面两个日志文件路径'
            return $false
        }
        Add-Check 'dev server 就绪' $true ("{0} 返回 200，耗时 {1}s" -f $usedUrl, $devSec)
        Show-Checklist $Def $usedUrl

        if ($KeepRunning) {
            Write-Host ''
            Write-Host ("  -KeepRunning 已生效：dev server 保留运行，PID {0}，地址 {1}" -f $proc.Id, $usedUrl) -ForegroundColor Yellow
            Write-Host ("  停止：taskkill /PID {0} /T /F" -f $proc.Id) -ForegroundColor Yellow
            $proc = $null
        }
        return $true
    } finally {
        if ($null -ne $proc) {
            Stop-ProcessTree $proc
            $released = Wait-PortReleased $DevPort 10
            if ($released) {
                Write-Host ("  已停止 dev server（PID {0}），端口 {1} 已释放" -f $proc.Id, $DevPort)
            } else {
                Write-Host ("  警告：dev server 进程已杀，但端口 {0} 仍被占用，请手动检查" -f $DevPort) -ForegroundColor Yellow
            }
        }
    }
}

function Invoke-ApiProbe {
    param([string]$BaseUrl, [string]$Path)
    $url = $BaseUrl.TrimEnd('/') + $Path
    $req = [System.Net.WebRequest]::Create($url)
    $req.Timeout = 10000
    $resp = $null
    try {
        $resp = $req.GetResponse()
    } catch [System.Net.WebException] {
        if ($_.Exception.Response) {
            $resp = $_.Exception.Response
        } else {
            return [pscustomobject]@{ Status = 0; Body = ''; Error = $_.Exception.Message }
        }
    }
    $stream = $resp.GetResponseStream()
    $ms = New-Object System.IO.MemoryStream
    $stream.CopyTo($ms)
    $stream.Close()
    $bytes = $ms.ToArray()
    $body = [System.Text.Encoding]::UTF8.GetString($bytes)
    $status = [int]$resp.StatusCode
    $resp.Close()
    return [pscustomobject]@{ Status = $status; Body = $body; Error = '' }
}

function Invoke-BackendStage {
    param($Def, [int]$BackendPort)

    Show-StageHeader $Def ("后端 http://localhost:{0}" -f $BackendPort)

    # ---------- 1. 环境检查 ----------
    Say-Head '1/5 环境检查（JDK / Maven）'
    $javaMajor = Get-JavaMajor
    if ($null -eq $javaMajor) {
        Add-Check 'JDK 可用' $false '找不到 java；请安装 JDK 21 并把 JAVA_HOME/bin 加入 PATH'
        Set-FailCode 2
    } else {
        $javaOk = ($javaMajor -ge 21)
        Add-Check 'JDK 版本 >= 21' $javaOk ("当前 Java {0}；项目 pom 的 <java.version>21</java.version>" -f $javaMajor)
        if (-not $javaOk) { Set-FailCode 2 }
    }
    $mvnVer = Get-MavenVersion
    if ($null -eq $mvnVer) {
        Add-Check 'Maven 可用' $false '找不到 mvn；请安装 Maven 3.8.1+ 并加入 PATH'
        Set-FailCode 2
    } else {
        $mvnOk = ($mvnVer.Major -gt 3) -or ($mvnVer.Major -eq 3 -and $mvnVer.Minor -gt 8) -or ($mvnVer.Major -eq 3 -and $mvnVer.Minor -eq 8 -and $mvnVer.Patch -ge 1)
        Add-Check 'Maven 版本 >= 3.8.1' $mvnOk ("当前 {0}" -f $mvnVer.Text)
        if (-not $mvnOk) { Set-FailCode 2 }
    }
    if ($Script:ExitCode -ne 0) {
        Write-Host '  处理建议：JDK 21 + Maven 3.8.1 是实训7 的前提；装好后重开终端再跑。' -ForegroundColor Yellow
        return $false
    }

    $be = Join-Path $RepoRoot $Def.Backend
    if (-not (Test-Path $be)) {
        Add-Check '后端目录存在' $false ("找不到 {0}" -f $be)
        Set-FailCode 2
        return $false
    }
    Add-Check '后端目录存在' $true $Def.Backend

    if (-not (Test-PortFree $BackendPort)) {
        $owner = Get-PortOwnerPid $BackendPort
        Add-Check '后端端口空闲' $false ("{0} 已被 PID {1} 占用" -f $BackendPort, $owner)
        Set-FailCode 2
        Write-Host ("  处理建议：换端口重跑，例如 -Port {0}" -f ($BackendPort + 90)) -ForegroundColor Yellow
        return $false
    }
    Add-Check '后端端口空闲' $true ("{0} 可用" -f $BackendPort)

    # ---------- 2. Maven 打包 ----------
    Say-Head '2/5 Maven 打包（mvn -B -DskipTests clean package）'
    $mvnLog = Join-Path $env:TEMP ("verify-stage7-mvn.log" -f $Stage)
    Remove-Item $mvnLog -ErrorAction SilentlyContinue
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    Push-Location $be
    try {
        & mvn -B -DskipTests clean package *>&1 | Tee-Object -FilePath $mvnLog | Out-Null
        $mvnCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }
    $mvnSec = [math]::Round($sw.Elapsed.TotalSeconds, 1)
    if ($mvnCode -ne 0) {
        Show-LogTail $mvnLog 40
        Add-Check 'mvn clean package' $false ("退出码 {0}，耗时 {1}s，日志 {2}" -f $mvnCode, $mvnSec, $mvnLog)
        Set-FailCode 6
        Write-Host '  处理建议：看上面日志第一条 ERROR；常见是 JDK 版本不对、依赖下载失败（检查 ~/.m2/settings.xml 镜像）。' -ForegroundColor Yellow
        return $false
    }
    $jar = Get-ChildItem (Join-Path $be 'target\*.jar') -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notmatch 'sources|javadoc|original' } |
        Select-Object -First 1
    if ($null -eq $jar) {
        Add-Check '打包产物 jar' $false 'BUILD SUCCESS 但 target 下没有可执行 jar'
        Set-FailCode 6
        return $false
    }
    Add-Check 'mvn clean package' $true ("耗时 {0}s，产物 {1}（{2} MB）" -f $mvnSec, $jar.Name, [math]::Round($jar.Length / 1MB, 1))

    # ---------- 3. 启动 ----------
    Say-Head '3/5 启动后端（java -jar）并等待 /hello'
    $appOut = Join-Path $env:TEMP ("verify-stage7-app.out.log" -f $Stage)
    $appErr = Join-Path $env:TEMP ("verify-stage7-app.err.log" -f $Stage)
    Remove-Item $appOut, $appErr -ErrorAction SilentlyContinue
    $proc = $null
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $javaArgs = @('-jar', $jar.FullName, ('--server.port={0}' -f $BackendPort))
        $proc = Start-Process -FilePath 'java' -ArgumentList $javaArgs -WorkingDirectory $be `
            -RedirectStandardOutput $appOut -RedirectStandardError $appErr -PassThru -WindowStyle Hidden
        Write-Host ("  已启动：java -jar {0} --server.port={1}（PID {2}）" -f $jar.Name, $BackendPort, $proc.Id)
        $usedUrl = ''
        $ready = Wait-AnyHttpOk -Urls @("http://localhost:$BackendPort/hello", "http://127.0.0.1:$BackendPort/hello") `
            -TimeoutSec $TimeoutSec -Proc $proc -UsedUrl ([ref]$usedUrl)
        $startSec = [math]::Round($sw.Elapsed.TotalSeconds, 1)
        if (-not $ready) {
            Show-LogTail $appOut 40
            Show-LogTail $appErr 30
            Add-Check '后端启动' $false ("等待 {0}s 未就绪（耗时 {1}s）" -f $TimeoutSec, $startSec)
            Set-FailCode 7
            Write-Host '  处理建议：' -ForegroundColor Yellow
            Write-Host ("    * 端口被占用：-Port {0}" -f ($BackendPort + 90))
            Write-Host '    * 看上面日志：常见是 3306/数据库没起、端口冲突、JDK 版本不对'
            return $false
        }
        Add-Check '后端启动' $true ("{0} 返回 200，耗时 {1}s" -f $usedUrl, $startSec)

        # ---------- 4. 5 个接口断言 ----------
        Say-Head '4/5 接口断言（5 个）'
        $base = "http://localhost:$BackendPort"
        $checks = @(
            [pscustomobject]@{ Path = '/hello';    ExpectCode = '200'; MustContain = 'Hello 安徽中医药大学'; Desc = '统一返回包装类 + 中文问候' },
            [pscustomobject]@{ Path = '/number';   ExpectCode = '500'; MustContain = '系统错误'; Desc = '除零异常被全局异常处理（code=500）' },
            [pscustomobject]@{ Path = '/map';      ExpectCode = '';    MustContain = '安徽中医药大学'; Desc = 'Map 直出，无 code 字段' },
            [pscustomobject]@{ Path = '/result';   ExpectCode = '200'; MustContain = '测试统一返回包装类成功'; Desc = '统一包装类 success（code=200）' },
            [pscustomobject]@{ Path = '/business'; ExpectCode = '400'; MustContain = '已存在'; Desc = '自定义业务异常（code=400）' }
        )
        Write-Host ("  {0,-12} {1,-6} {2,-6} {3,-6} {4}" -f '接口', 'HTTP', 'code', '结果', '说明')
        Write-Host ('  ' + ('-' * 74))
        $apiFail = 0
        foreach ($c in $checks) {
            $probe = Invoke-ApiProbe $base $c.Path
            $codeText = '(无)'
            $json = $null
            if ($probe.Body) {
                try { $json = $probe.Body | ConvertFrom-Json } catch { }
            }
            if ($null -ne $json -and $null -ne $json.code) { $codeText = [string]$json.code }
            $ok = $true
            $why = @()
            if ($probe.Status -ne 200) { $ok = $false; $why += ("HTTP {0}" -f $probe.Status) }
            if ($c.ExpectCode -ne '' -and $codeText -ne $c.ExpectCode) { $ok = $false; $why += ("code={0}，期望 {1}" -f $codeText, $c.ExpectCode) }
            if ($c.MustContain -ne '' -and $probe.Body -notlike ('*' + $c.MustContain + '*')) { $ok = $false; $why += '返回内容不含预期中文（可能乱码）' }
            $mark = 'PASS'
            if (-not $ok) { $mark = 'FAIL'; $apiFail++ }
            if ($ok) {
                Write-Host ("  {0,-12} {1,-6} {2,-6} {3,-6} {4}" -f $c.Path, $probe.Status, $codeText, $mark, $c.Desc) -ForegroundColor Green
            } else {
                Write-Host ("  {0,-12} {1,-6} {2,-6} {3,-6} {4}" -f $c.Path, $probe.Status, $codeText, $mark, ($c.Desc + '；' + ($why -join '；'))) -ForegroundColor Red
            }
        }
        Add-Check '5 个接口断言' ($apiFail -eq 0) ("失败 {0} 个" -f $apiFail)
        if ($apiFail -gt 0) {
            Set-FailCode 8
            Write-Host '  处理建议：检查后端是否连了数据库（3306）、日志见上面；重新打包后再试。' -ForegroundColor Yellow
        }

        if ($KeepRunning) {
            Write-Host ''
            Write-Host ("  -KeepRunning 已生效：后端保留运行，PID {0}，地址 {1}" -f $proc.Id, $base) -ForegroundColor Yellow
            Write-Host ("  停止：taskkill /PID {0} /T /F" -f $proc.Id) -ForegroundColor Yellow
            $proc = $null
        }
        return ($apiFail -eq 0)
    } finally {
        if ($null -ne $proc) {
            Stop-ProcessTree $proc
            $released = Wait-PortReleased $BackendPort 10
            if ($released) {
                Write-Host ("  已停止后端（PID {0}），端口 {1} 已释放" -f $proc.Id, $BackendPort)
            } else {
                Write-Host ("  警告：后端进程已杀，但端口 {0} 仍被占用，请手动检查" -f $BackendPort) -ForegroundColor Yellow
            }
        }
    }
}

# =====================================================================
# 主流程
# =====================================================================
$def = $StageMap[$Stage]
if ($null -eq $def) {
    Write-Host ("未知阶段：{0}" -f $Stage) -ForegroundColor Red
    exit 2
}

Write-Host ''
Write-Host '################################################################' -ForegroundColor Cyan
Write-Host ("  逐阶段自检  |  阶段 {0}  |  仓库根目录：{1}" -f $Stage, $RepoRoot) -ForegroundColor Cyan
Write-Host '################################################################' -ForegroundColor Cyan

$frontOk = $true
$backOk = $true

if ($Stage -eq 7) {
    $bePort = $def.BackendPort
    if ($Port -gt 0) { $bePort = $Port }
    $fePort = $def.DefaultPort
    if ($FrontendPort -gt 0) { $fePort = $FrontendPort }
    if (-not $SkipFrontend) {
        $frontOk = Invoke-FrontendStage $def $fePort
    } else {
        Write-Host '  （-SkipFrontend：跳过第 7 讲前端）' -ForegroundColor Yellow
    }
    if (-not $SkipBackend) {
        $backOk = Invoke-BackendStage $def $bePort
    } else {
        Write-Host '  （-SkipBackend：跳过第 7 讲后端）' -ForegroundColor Yellow
    }
} else {
    $fePort = $def.DefaultPort
    if ($Port -gt 0) { $fePort = $Port }
    $frontOk = Invoke-FrontendStage $def $fePort
}

# =====================================================================
# 汇总
# =====================================================================
$Script:TotalWatch.Stop()
$totalSec = [math]::Round($Script:TotalWatch.Elapsed.TotalSeconds, 1)
$failed = @($Script:Results | Where-Object { $_.结果 -eq 'FAIL' }).Count
Say-Head ("阶段 {0} 汇总（总耗时 {1}s）" -f $Stage, $totalSec)
if ($Script:Results.Count -gt 0) {
    $Script:Results | Format-Table -AutoSize | Out-String -Width 220 | Write-Host
}
if ($failed -eq 0) {
    Write-Host ("[PASS] 阶段 {0} 全部 {1} 项检查通过" -f $Stage, $Script:Results.Count) -ForegroundColor Green
    exit 0
} else {
    Write-Host ("[FAIL] 阶段 {0} 有 {1} 项未通过（退出码 {2}）" -f $Stage, $failed, $Script:ExitCode) -ForegroundColor Red
    if ($Script:ExitCode -eq 0) { exit 1 }
    exit $Script:ExitCode
}
