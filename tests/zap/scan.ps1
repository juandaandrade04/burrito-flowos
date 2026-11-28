$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$outDir = Join-Path $root 'evidence\entregable-2\zap'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# Ruta portable: definir ZAP_BAT o tener zap.bat en PATH. Sin rutas personales.
$zapBat = $env:ZAP_BAT
if (-not $zapBat) {
  $cmd = Get-Command zap.bat -ErrorAction SilentlyContinue
  if ($cmd) { $zapBat = $cmd.Source }
}
if (-not $zapBat -or -not (Test-Path $zapBat)) {
  throw 'No se encontró zap.bat. Define $env:ZAP_BAT con la ruta a ZAP_2.17.0\zap.bat (paquete portable Core).'
}

$port = 8090
$base = "http://127.0.0.1:$port"
$target = 'http://localhost:3000/'
$loginEndpoint = 'http://localhost:3000/api/v1/auth/login'
$loginRegistrado = $false

Write-Output "Usando ZAP: $zapBat"
Write-Output 'Iniciando ZAP en modo daemon...'
$zapProc = Start-Process -FilePath $zapBat -ArgumentList @(
  '-daemon',
  '-port', $port,
  '-host', '127.0.0.1',
  '-config', 'api.disablekey=true',
  '-silent',
  '-notel'
) -WorkingDirectory (Split-Path -Parent $zapBat) -PassThru -WindowStyle Hidden

try {
  # Esperar a que la API responda
  $ready = $false
  for ($i = 0; $i -lt 30; $i++) {
    try {
      $null = Invoke-RestMethod -Uri "$base/JSON/core/view/version/" -TimeoutSec 3
      $ready = $true
      break
    } catch {
      Start-Sleep -Seconds 2
    }
  }
  if (-not $ready) { throw 'ZAP API no respondió a tiempo.' }

  $version = (Invoke-RestMethod -Uri "$base/JSON/core/view/version/").version
  Write-Output "ZAP version: $version"

  # 1) Spider del sitio
  $enc = [uri]::EscapeDataString($target)
  $spider = Invoke-RestMethod -Uri "$base/JSON/spider/action/scan/?url=$enc"
  $spiderId = $spider.scan
  Write-Output "Spider iniciado: $spiderId"
  do {
    Start-Sleep -Seconds 2
    $status = (Invoke-RestMethod -Uri "$base/JSON/spider/view/status/?scanId=$spiderId").status
  } while ([int]$status -lt 100)
  Write-Output 'Spider completado.'

  # 2) Tráfico real del formulario de Login a través del proxy de ZAP
  $env:ZAP_PROXY = $base
  $env:BASE_URL = 'http://localhost:3000'
  Write-Output 'Registrando el formulario de Login vía proxy...'
  node (Join-Path $PSScriptRoot 'trafico-login.mjs')
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo registrar el tráfico del formulario de Login en ZAP.' }
  $loginRegistrado = $true
  Write-Output 'Formulario de Login registrado.'

  # 3) Active scan sobre la raíz
  $ascan = Invoke-RestMethod -Uri "$base/JSON/ascan/action/scan/?url=$enc"
  $ascanId = $ascan.scan
  Write-Output "Active scan iniciado: $ascanId"
  do {
    Start-Sleep -Seconds 3
    $status = (Invoke-RestMethod -Uri "$base/JSON/ascan/view/status/?scanId=$ascanId").status
  } while ([int]$status -lt 100)
  Write-Output 'Active scan completado.'

  # 4) Active scan específico del endpoint de autenticación
  try {
    $encLogin = [uri]::EscapeDataString($loginEndpoint)
    $ascanLogin = Invoke-RestMethod -Uri "$base/JSON/ascan/action/scan/?url=$encLogin"
    $ascanLoginId = $ascanLogin.scan
    do {
      Start-Sleep -Seconds 3
      $statusLogin = (Invoke-RestMethod -Uri "$base/JSON/ascan/view/status/?scanId=$ascanLoginId").status
    } while ([int]$statusLogin -lt 100)
    Write-Output 'Active scan del endpoint de login completado.'
  } catch {
    Write-Output "Active scan del endpoint de login omitido: $($_.Exception.Message)"
  }

  # Reportes
  $html = Invoke-WebRequest -Uri "$base/OTHER/core/other/htmlreport/" -UseBasicParsing -TimeoutSec 60
  [System.IO.File]::WriteAllText((Join-Path $outDir 'report.html'), $html.Content)

  $json = Invoke-WebRequest -Uri "$base/OTHER/core/other/jsonreport/" -UseBasicParsing -TimeoutSec 60
  [System.IO.File]::WriteAllText((Join-Path $outDir 'report.json'), $json.Content)

  # Resumen derivado del reporte exportado: alertas únicas e instancias por riesgo.
  $report = Get-Content (Join-Path $outDir 'report.json') -Raw | ConvertFrom-Json
  $alertas = @()
  foreach ($site in $report.site) { $alertas += @($site.alerts) }

  $riesgos = @('High', 'Medium', 'Low', 'Informational')
  $porRiesgo = [ordered]@{}
  $instancias = [ordered]@{}
  foreach ($riesgo in $riesgos) {
    $delRiesgo = @($alertas | Where-Object { (($_.riskdesc -split ' ')[0]) -eq $riesgo })
    $porRiesgo[$riesgo] = $delRiesgo.Count
    $suma = 0
    foreach ($alerta in $delRiesgo) { $suma += [int]$alerta.count }
    $instancias[$riesgo] = $suma
  }

  $resumen = [ordered]@{
    totalAlertas       = $alertas.Count
    alertasPorRiesgo   = $porRiesgo
    instanciasPorRiesgo = $instancias
    nota               = 'Alertas = tipos únicos del reporte; instancias = ocurrencias (campo count de cada alerta).'
    endpointLoginProbado = $loginRegistrado
  }
  $resumen | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $outDir 'resumen.json')

  Write-Output "Reporte HTML: $(Join-Path $outDir 'report.html')"
  Write-Output "Resumen: $($resumen | ConvertTo-Json -Compress -Depth 6)"
} finally {
  try { $null = Invoke-RestMethod -Uri "$base/JSON/core/action/shutdown/" -TimeoutSec 5 } catch {}
  if ($zapProc -and -not $zapProc.HasExited) {
    Stop-Process -Id $zapProc.Id -Force -ErrorAction SilentlyContinue
  }
}
