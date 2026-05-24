# One-shot: pull the 3 circuitboard PNG textures from StreetSamurai's media dir
# into MindAttic.UiUx/cyberspace/assets/ as lossless copies. The textures are
# tiled across the canvas by console-bg.js, so they must be lossless — JPEG
# block compression breaks the edge-pixel match between adjacent tile copies
# and produces visible seams (see the parallax background on mindattic.com
# before this script was switched from JPEG to PNG).
#
# Re-run this only when the upstream PNGs in StreetSamurai change.
[CmdletBinding()]
param(
    [string]$SourceDir = 'D:/Projects/MindAttic/StreetSamurai/engine/data/media',
    [string]$DestDir   = 'D:/Projects/MindAttic/MindAttic.UiUx/cyberspace/assets'
)

$ErrorActionPreference = 'Stop'

$names = @('circuitboard.00', 'circuitboard.01', 'circuitboard.02')

if (-not (Test-Path $DestDir)) {
    New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
}

foreach ($n in $names) {
    $src = Join-Path $SourceDir ($n + '.png')
    $dst = Join-Path $DestDir   ($n + '.png')
    if (-not (Test-Path $src)) { throw "Source not found: $src" }

    Copy-Item -Path $src -Destination $dst -Force

    $kb = [math]::Round((Get-Item $dst).Length / 1024, 1)
    Write-Output "  $n.png  ($kb KB)"
}
Write-Output "Textures copied to $DestDir"
