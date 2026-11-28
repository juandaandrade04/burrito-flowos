$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$jmx = Join-Path $PSScriptRoot 'login.jmx'
$results = Join-Path $root 'evidence\entregable-2\jmeter\results.jtl'
$report = Join-Path $root 'evidence\entregable-2\jmeter\report'

$jmeter = (Get-Command jmeter.bat -ErrorAction SilentlyContinue).Source
if (-not $jmeter) {
  $jmeter = (Get-Command jmeter -ErrorAction SilentlyContinue).Source
}
if ($env:JMETER_BAT -and (Test-Path $env:JMETER_BAT)) {
  $jmeter = $env:JMETER_BAT
}
if (-not $jmeter) {
  $candidato = Join-Path $env:LOCALAPPDATA 'Programs\JMeter\bin\jmeter.bat'
  if (Test-Path $candidato) { $jmeter = $candidato }
}
if (-not $jmeter) {
  throw 'No se encontró JMeter en PATH. Instala Apache JMeter o ajusta este script.'
}

Remove-Item -Path $results -Force -ErrorAction SilentlyContinue
Remove-Item -Path $report -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path (Split-Path $results), $report | Out-Null

& $jmeter -n -t $jmx -l $results -e -o $report

Write-Output "Resultados: $results"
Write-Output "Reporte HTML: $report\index.html"
