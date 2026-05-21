# ====================================================================
# MindAttic.Content -> all consumers (local dev delivery)
# Runs every downstream sync script in sync/ that matches sync-*.ps1
# (except this file). Currently:
#   - sync-mindattic-com.ps1  → mindattic.com/index.htm (inline)
#   - sync-streetsamurai.ps1  → StreetSamurai.Blazor/wwwroot/
#
# Production delivery happens via .github/workflows/sync-consumers.yml
# (push-triggered cross-repo PRs). This script is the local equivalent
# for fast iteration without round-tripping through GitHub.
#
# Idempotent. Safe to re-run after any edit under cbg/.
#
# Usage:
#   powershell -File sync-all.ps1
# ====================================================================
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$here = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }

$scripts = Get-ChildItem -Path $here -Filter 'sync-*.ps1' |
           Where-Object { $_.Name -ne 'sync-all.ps1' } |
           Sort-Object Name

if (-not $scripts) { throw "No sync-*.ps1 scripts found in $here" }

$failed = @()
foreach ($s in $scripts) {
    Write-Output ""
    Write-Output "=== $($s.Name) ==="
    try {
        & $s.FullName
    } catch {
        Write-Output "  FAILED: $($_.Exception.Message)"
        $failed += $s.Name
    }
}

Write-Output ""
if ($failed.Count -gt 0) {
    throw "Sync failed for: $($failed -join ', ')"
}
Write-Output "All syncs completed."
