# =====================================================================
#  实训7 SpringBoot 项目 —— 端到端验证脚本
#  用法:  powershell -ExecutionPolicy Bypass -File _verify_lab7.ps1 -ProjectPath "D:\course\Javaweb\07\xm-pro\springboot"
#
#  做的事情（模拟老师讲义里的验收动作）：
#    1) 检查 JDK / Maven / MySQL 服务 / 3306 端口 / 8080 端口
#    2) mvn clean package 打包（验证能否编译、依赖能否下载）
#    3) 后台启动 jar（等价于讲义里"启动 SpringBoot 工程"）
#    4) 依次请求 /hello /number /map /result /business，打印真实返回
#    5) 停止服务，打印汇总
# =====================================================================
param(
    [Parameter(Mandatory = $true)][string]$ProjectPath,
    [int]$Port = 8080,
    [int]$WaitSeconds = 90,
    [string]$MavenHome = "D:\software\apache-maven-3.8.1",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Continue"
$mvn = Join-Path $MavenHome "bin\mvn.cmd"
$results = New-Object System.Collections.ArrayList

function Say($t) { Write-Host $t }
function Pass($name, $detail) { [void]$results.Add([pscustomobject]@{ 项 = $name; 结果 = "通过"; 说明 = $detail }); Write-Host "  [通过] $name  $detail" -ForegroundColor Green }
function Fail($name, $detail) { [void]$results.Add([pscustomobject]@{ 项 = $name; 结果 = "失败"; 说明 = $detail }); Write-Host "  [失败] $name  $detail" -ForegroundColor Red }

Say "=================== 1. 环境检查 ==================="
if (Test-Path $mvn) { Pass "Maven 存在" $MavenHome } else { Fail "Maven 存在" $mvn; exit 1 }

$javaV = (& java -version 2>&1 | Select-Object -First 1)
if ("$javaV" -match '"(?<v>\d+[\.\d]*)') { Pass "JDK 可用" "$javaV" } else { Fail "JDK 可用" "$javaV" }

$svc = Get-Service MySQL80 -ErrorAction SilentlyContinue
if ($svc -and $svc.Status -eq "Running") { Pass "MySQL80 服务" "Running" } else { Fail "MySQL80 服务" "未运行（数据库连不上，项目启动会失败）" }

try {
    $conn = New-Object System.Net.Sockets.TcpClient
    $conn.Connect("127.0.0.1", 3306); $conn.Close()
    Pass "3306 端口" "可连接"
} catch { Fail "3306 端口" $_.Exception.Message }

$busy = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($busy) {
    $busyPid = $busy[0].OwningProcess
    $busyProc = Get-CimInstance Win32_Process -Filter "ProcessId=$busyPid" -ErrorAction SilentlyContinue
    if ($busyProc -and ($busyProc.CommandLine -like "*-jar*") -and ($busyProc.CommandLine -like "*springboot*")) {
        Say "  发现本项目上次遗留的进程 PID $busyPid，先清掉..."
        & taskkill /PID $busyPid /T /F 2>&1 | Out-Null
        Start-Sleep -Milliseconds 1000
        $busy = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    }
}
if ($busy) { Fail "$Port 端口" "已被 PID $($busy[0].OwningProcess) 占用，且不是本项目进程，请先关掉再验证"; exit 1 } else { Pass "$Port 端口" "空闲" }

Say ""
Say "=================== 2. Maven 打包 ==================="
Push-Location $ProjectPath
$jar = $null
if (-not $SkipBuild) {
    $log = Join-Path $env:TEMP "lab7_build.log"
    & $mvn -B -DskipTests clean package *>&1 | Tee-Object -FilePath $log | Select-Object -Last 12
    if ($LASTEXITCODE -eq 0) {
        $jar = Get-ChildItem (Join-Path $ProjectPath "target\*.jar") -ErrorAction SilentlyContinue |
               Where-Object { $_.Name -notmatch "sources|javadoc|original" } | Select-Object -First 1
        if ($jar) { Pass "打包成功" $jar.Name } else { Fail "打包成功" "BUILD SUCCESS 但没找到 jar" }
    } else { Fail "打包成功" "见 $log" }
} else {
    $jar = Get-ChildItem (Join-Path $ProjectPath "target\*.jar") -ErrorAction SilentlyContinue |
           Where-Object { $_.Name -notmatch "sources|javadoc|original" } | Select-Object -First 1
    if ($jar) { Pass "使用已有 jar" $jar.Name } else { Fail "使用已有 jar" "target 下没有 jar，去掉 -SkipBuild 重跑" }
}
Pop-Location
if (-not $jar) { Say ""; Say "打包没通过，后面的启动验证跳过。"; $results | Format-Table -AutoSize; exit 1 }

Say ""
Say "=================== 3. 启动服务 ==================="
$outLog = Join-Path $env:TEMP "lab7_app.out.log"
$errLog = Join-Path $env:TEMP "lab7_app.err.log"
Remove-Item $outLog, $errLog -ErrorAction SilentlyContinue
$proc = Start-Process -FilePath "java" -ArgumentList @("-jar", $jar.FullName) `
        -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru -WindowStyle Hidden
Say "  已启动 java -jar $($jar.Name)  (PID $($proc.Id))，等待 8080 就绪…"

$started = $false
for ($i = 1; $i -le $WaitSeconds; $i++) {
    Start-Sleep -Seconds 1
    if ($proc.HasExited) { break }
    try { $r = Invoke-WebRequest "http://localhost:$Port/hello" -TimeoutSec 3 -UseBasicParsing; $started = $true; break } catch { }
}
if ($started) { Pass "服务启动" "http://localhost:$Port 已监听（约 $i 秒）" }
else {
    Fail "服务启动" "等待 ${WaitSeconds}s 未就绪"
    Say "---- 控制台输出（最后 40 行）----"; Get-Content $outLog -Tail 40 -ErrorAction SilentlyContinue
    Say "---- 错误输出（最后 40 行）----"; Get-Content $errLog -Tail 40 -ErrorAction SilentlyContinue
    if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
    $results | Format-Table -AutoSize; exit 1
}

Say ""
Say "=================== 4. 接口验证 ==================="
function Try-Endpoint {
    param([string]$Path, [string]$Expect, [string]$Note, [string]$MustHex, [string]$MustNotHex)
    $url = "http://localhost:$Port$Path"
    $req = [System.Net.WebRequest]::Create($url)
    $req.Timeout = 10000
    try {
        $resp = $req.GetResponse()
    } catch [System.Net.WebException] {
        if ($_.Exception.Response) { $resp = $_.Exception.Response } else { Fail $Path $_.Exception.Message; return }
    }
    $stream = $resp.GetResponseStream()
    $ms = New-Object System.IO.MemoryStream
    $stream.CopyTo($ms)
    $stream.Close()
    $bytes = $ms.ToArray()
    $body = [System.Text.Encoding]::UTF8.GetString($bytes)
    $ctype = $resp.ContentType
    $status = [int]$resp.StatusCode
    $resp.Close()

    $hex = (($bytes | ForEach-Object { $_.ToString("X2") }) -join "").ToUpperInvariant()
    Write-Host ("  GET {0}  ->  HTTP {1}" -f $Path, $status)
    Write-Host ("    Content-Type: {0}" -f $ctype)
    Write-Host ("    字节数: {0}   前 24 字节: {1}" -f $bytes.Length, ($hex.Substring(0, [Math]::Min(48, $hex.Length))))
    Write-Host ("    按 UTF-8 解码: {0}" -f $body)

    $ok = $true
    if ($body -match $Expect) { Write-Host "    内容匹配: 是" } else { $ok = $false; Write-Host "    内容匹配: 否（期望 /$Expect/）" -ForegroundColor Red }
    if ($MustHex) {
        if (($hex.ToUpperInvariant()) -match ("(" + $MustHex.ToUpperInvariant() + ")")) { Write-Host ("    字节验证: 含 UTF-8 序列 {0}（中文按 UTF-8 输出，未乱码）" -f $MustHex) }
        else { $ok = $false; Write-Host ("    字节验证: 缺少 UTF-8 序列 {0}（中文不是 UTF-8 编码）" -f $MustHex) -ForegroundColor Red }
    }
    if ($MustNotHex -and ($hex.ToUpperInvariant() -match ("(" + $MustNotHex.ToUpperInvariant() + ")"))) { $ok = $false; Write-Host ("    字节验证: 出现 ISO-8859-1 中文 ({0})，说明乱码" -f $MustNotHex) -ForegroundColor Red }

    if ($ok) { Pass "接口 $Path" $Note } else { Fail "接口 $Path" "见上方详情" }
}

$utf8Cjk = "E5AE89|E8AFB7|E6B58B|E7B3BB|E794A8"   # 安/请/测/系/用 的 UTF-8 序列：出现任意一个即说明中文按 UTF-8 输出
$utf8Any = "E5|E6|E7|E8|E9"                       # 任意常见汉字的 UTF-8 首字节
$latin1Cjk = "B0B2|C7EB|B2E2|CFB5"               # 安/请/测/系 若被 ISO-8859-1/GBK 处理会出现的字节
Try-Endpoint "/hello"    "Hello 安徽中医药大学"  "返回中文字符串，验证 UTF-8 不乱码" $utf8Cjk $latin1Cjk
Try-Endpoint "/number"   '"code"\s*:\s*"500"'    "除零异常被全局捕获，统一返回 500 系统错误" $utf8Any
Try-Endpoint "/map"      '"name"\s*:\s*"安徽中医药大学"' "Map 序列化为 JSON 且中文正常" $utf8Cjk $latin1Cjk
Try-Endpoint "/result"   '"code"\s*:\s*"200"'    "统一返回包装类 success" $utf8Cjk $latin1Cjk
Try-Endpoint "/business" '"code"\s*:\s*"400"'    "自定义业务异常返回 400" $utf8Cjk $latin1Cjk

Say ""
Say "=================== 5. 收尾 ==================="
# 注意：java -jar 在 Windows 上会再产生一个子进程，只杀父进程会留下孤儿进程继续占用 8080，
# 所以必须按进程树杀（taskkill /T）。
if (-not $proc.HasExited) { & taskkill /PID $proc.Id /T /F 2>&1 | Out-Null; Say "  已停止服务 (PID $($proc.Id) 及其子进程)" }
Start-Sleep -Milliseconds 800
$still = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($still) { Say "  警告：$Port 仍被 PID $($still[0].OwningProcess) 占用" } else { Say "  $Port 已释放" }

Say ""
Say "=================== 汇总 ==================="
$results | Format-Table -AutoSize
$bad = ($results | Where-Object { $_.结果 -eq "失败" }).Count
if ($bad -eq 0) { Write-Host "全部通过 ✓" -ForegroundColor Green } else { Write-Host "$bad 项失败 ✗" -ForegroundColor Red }
exit $bad
