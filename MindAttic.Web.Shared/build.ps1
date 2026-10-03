# ====================================================================
# MindAttic.UiUx - standalone vendoring build
# --------------------------------------------------------------------
# Copies one component (Components/<Build>/) or theme (Themes/<Build>/) verbatim, every file and
# subfolder, into an output folder so it can be vendored without the CDN or a sync script:
#
#   .\build.ps1 -Build OutfitFont                          # -> dist/OutfitFont/
#   .\build.ps1 -Build Cyberspace -Kind Theme -Out x/      # a name that is both needs -Kind
#
# The canonical source is never modified and nothing is committed twice (dist/ is git-ignored).
# Tests: tests/pester/build.Tests.ps1.
# ====================================================================
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Build,                  # folder name, e.g. OutfitFont
    [ValidateSet('Component', 'Theme')][string]$Kind,      # disambiguate a name that is both (Cyberspace)
    [ValidateSet('standalone')][string]$Output = 'standalone',
    [string]$Out                                           # output dir (default: <repo>/dist/<Build>)
)
$ErrorActionPreference = 'Stop'
$root = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }

$sources = [ordered]@{ Component = 'Components'; Theme = 'Themes' }
$kinds = if ($Kind) { @($Kind) } else { @($sources.Keys) }

$found = @(foreach ($k in $kinds) {
    $dir = Join-Path (Join-Path $root $sources[$k]) $Build
    if (Test-Path $dir -PathType Container) { [pscustomobject]@{ Kind = $k; Dir = (Resolve-Path $dir).Path } }
})
if ($found.Count -eq 0) {
    $have = @(foreach ($k in $kinds) {
        Get-ChildItem -Path (Join-Path $root $sources[$k]) -Directory | ForEach-Object { "$($sources[$k])/$($_.Name)" }
    }) -join ', '
    throw "No $(($kinds | ForEach-Object { $sources[$_] }) -join ' or ') folder named '$Build'. Available: $have"
}
if ($found.Count -gt 1) {
    throw "Ambiguous -Build '$Build' (both a Component and a Theme). Disambiguate with -Kind Component|Theme."
}
$src = $found[0]

$dest = if ($Out) { $Out } else { Join-Path (Join-Path $root 'dist') $Build }
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$dest = (Resolve-Path $dest).Path

$n = 0
foreach ($f in Get-ChildItem -Path $src.Dir -Recurse -File) {
    $rel = $f.FullName.Substring($src.Dir.Length).TrimStart('\', '/')
    $target = Join-Path $dest $rel
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
    Copy-Item -LiteralPath $f.FullName -Destination $target -Force
    $n++
}
Write-Output "standalone: $($src.Kind) '$Build' -> $n file(s) in $dest"
