# ====================================================================
# MindAttic.UiUx -> all splice-in-place subscribers (local dev delivery)
# Runs every downstream sync script in sync/ that matches sync-*.ps1
# (except this file). Discovery is glob-based, so the subscriber set is
# whatever is wired up in sync/*.ps1 and subscribers.json. Currently:
#   - sync-mindattic-com.ps1   → mindattic.com/index.htm (CYBERSPACE block)
#   - sync-mindattic-psst.ps1  → MindAttic.Psst/{terms,privacy}.htm (OUTFITFONT block)
#   - sync-tutor.ps1           → Tutor.Blazor/wwwroot/ (auth-visual trio)
#   - sync-prose.ps1           → retired (Prose.Writer / Prose.Codex do not exist)
#   - sync-ideas.ps1           → retired (MindAttic.Ideas.Web does not exist)
#
# The three sites load fonts, logos and the engine from the jsDelivr CDN
# at the tag pinned by MindAttic.Deploy's linked deploy; only mindattic.com's
# CYBERSPACE block is spliced. There are no other CDN consumers.
#
# Production delivery happens via .github/workflows/sync-subscribers.yml
# (push-triggered cross-repo PRs). This script is the local equivalent
# for fast iteration without round-tripping through GitHub; it is also
# invoked piecewise by MindAttic.Deploy (sync-mindattic-com.ps1 as the
# mindattic.com preDeploy hook).
#
# Idempotent. Safe to re-run after any edit under Components/ or
# Themes/, or to subscribers.json.
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
        # Surface enough to debug a CI sync failure: message plus the script
        # stack trace pointing at the line that threw.
        Write-Output "  FAILED: $($_.Exception.Message)"
        if ($_.ScriptStackTrace) {
            $_.ScriptStackTrace -split "`n" | ForEach-Object { Write-Output "    at $_" }
        }
        $failed += $s.Name
    }
}

Write-Output ""
if ($failed.Count -gt 0) {
    throw "Sync failed for: $($failed -join ', ')"
}
Write-Output "All syncs completed."
