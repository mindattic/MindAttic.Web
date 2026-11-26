# Opens one of these sites in MindAttic Browser, served straight from this folder (https://<site>.local/),
# so pages behave as deployed and can be recorded:
#
#   .\capture.ps1                                   # mindattic.com, just browse
#   .\capture.ps1 ryandebraal.com -capture video    # film from open to close
#   .\capture.ps1 Hyperspace -capture screen 5      # a PNG every 5 seconds
#   .\capture.ps1 mindattic.com -capture video screen 5
#
# Output: R:\MindAttic\Media\Capture\<site>\<site>_<timestamp>.<ext> (ISO 8601, ':' as '.'). Pages can also call window.mindattic.capture.raise(...).
# Opens the Browser's Release deploy, R:\MindAttic\Apps\MindAttic.Browser\Release; rebuild it with
# ..\MindAttic.Browser\run.ps1 -Redeploy (or its run.bat, 1) Redeploy).
param([string]$Site = 'mindattic.com')

$browser = 'R:\MindAttic\Apps\MindAttic.Browser\Release\MindAttic.Browser.exe'
if (-not (Test-Path $browser)) {
    throw "MindAttic Browser is not deployed at $browser. Run ..\MindAttic.Browser\run.ps1 -Redeploy first."
}
$folder = Join-Path $PSScriptRoot $Site
if (-not (Test-Path (Join-Path $folder 'index.htm')) -and -not (Test-Path (Join-Path $folder 'index.html'))) {
    $sites = Get-ChildItem $PSScriptRoot -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'index.htm*') } | ForEach-Object Name
    throw "No site '$Site' here. Sites: $($sites -join ', ')"
}
& $browser $folder @args
