<#
.SYNOPSIS
  Codex documentation CLI for MindAttic Cares (MAC).
.DESCRIPTION
  Subcommands:
    doctor  - validate the Codex docs (front-matter, IDs, cross-refs, data schemas,
              story tests, cited paths, generatedFrom freshness, digest staleness).
              Exits non-zero on any hard error.
    digest  - regenerate docs/BIBLE.digest.md from BIBLE.md (1, 3, 5, 9) + a status index
              + the latest amendment head.
  No build step; pure PowerShell (5.1 / Win-1252 safe).
.EXAMPLE
  pwsh tools/codex.ps1 doctor
  pwsh tools/codex.ps1 digest
#>
[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [ValidateSet('doctor', 'digest')]
  [string]$Command = 'doctor'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# --- Paths ---------------------------------------------------------------
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
$DocsDir   = Join-Path $RepoRoot 'docs'
$DataDir   = Join-Path $DocsDir 'data'
$RfcDir    = Join-Path $DocsDir 'rfc'
$Bible     = Join-Path $DocsDir 'BIBLE.md'
$Stories   = Join-Path $DocsDir 'USER_STORIES.md'
$Amend     = Join-Path $DocsDir 'AMENDMENTS.md'
$Digest    = Join-Path $DocsDir 'BIBLE.digest.md'

# --- Result accumulators -------------------------------------------------
$script:Errors   = New-Object System.Collections.ArrayList
$script:Warnings = New-Object System.Collections.ArrayList
$script:Checks   = New-Object System.Collections.ArrayList

function Add-Err  ([string]$m) { [void]$script:Errors.Add($m) }
function Add-Warn ([string]$m) { [void]$script:Warnings.Add($m) }
function Add-Ok   ([string]$m) { [void]$script:Checks.Add($m) }

# --- Helpers -------------------------------------------------------------
function Get-FrontMatter {
  param([string]$Path)
  $lines = Get-Content -LiteralPath $Path -Encoding UTF8
  if ($lines.Count -lt 1 -or $lines[0].Trim() -ne '---') { return $null }
  $fm = @{}
  for ($i = 1; $i -lt $lines.Count; $i++) {
    if ($lines[$i].Trim() -eq '---') { return $fm }
    if ($lines[$i] -match '^\s*([A-Za-z0-9_]+)\s*:\s*(.+?)\s*$') {
      $fm[$matches[1]] = $matches[2]
    }
  }
  return $null  # no closing fence
}

function Test-FrontMatter {
  param([string]$Path, [string[]]$AllowedLayers)
  if (-not (Test-Path -LiteralPath $Path)) { Add-Err "missing file: $Path"; return }
  $rel = $Path.Substring($RepoRoot.Length).TrimStart('\','/')
  $fm = Get-FrontMatter -Path $Path
  if ($null -eq $fm) { Add-Err "$rel : missing or unterminated YAML front-matter"; return }
  foreach ($key in @('codex','project','code','layer','status','updated')) {
    if (-not $fm.ContainsKey($key)) { Add-Err "$rel : front-matter missing '$key'" }
  }
  if ($fm.ContainsKey('codex') -and $fm['codex'] -ne '1') { Add-Err "$rel : codex must be 1" }
  if ($fm.ContainsKey('layer') -and $AllowedLayers -and ($AllowedLayers -notcontains $fm['layer'])) {
    Add-Err "$rel : layer '$($fm['layer'])' not in [$($AllowedLayers -join ', ')]"
  }
  if ($fm.ContainsKey('updated') -and $fm['updated'] -notmatch '^\d{4}-\d{2}-\d{2}$') {
    Add-Err "$rel : updated must be YYYY-MM-DD"
  }
  Add-Ok "$rel : front-matter OK"
}

function Get-AllDocFiles {
  $files = @()
  foreach ($p in @($Bible, $Stories, $Amend)) { if (Test-Path $p) { $files += $p } }
  if (Test-Path $RfcDir)  { $files += (Get-ChildItem -LiteralPath $RfcDir -Filter '*.md' -File | Select-Object -ExpandProperty FullName) }
  if (Test-Path $DataDir) { $files += (Get-ChildItem -LiteralPath $DataDir -Filter '*.json' -File -Recurse | Where-Object { $_.FullName -notmatch '_schema' } | Select-Object -ExpandProperty FullName) }
  return $files
}

# =========================================================================
# DOCTOR
# =========================================================================
function Invoke-Doctor {
  # 1. front-matter on every layered file
  Test-FrontMatter -Path $Bible   -AllowedLayers @('bible')
  Test-FrontMatter -Path $Stories -AllowedLayers @('stories')
  Test-FrontMatter -Path $Amend   -AllowedLayers @('amendments')
  if (Test-Path $RfcDir) {
    Get-ChildItem -LiteralPath $RfcDir -Filter '*.md' -File | ForEach-Object {
      Test-FrontMatter -Path $_.FullName -AllowedLayers @('rfc')
    }
  }
  if (Test-Path $DataDir) {
    Get-ChildItem -LiteralPath $DataDir -Filter '*.json' -File -Recurse |
      Where-Object { $_.FullName -notmatch '_schema' } |
      ForEach-Object { Test-FrontMatter -Path $_.FullName -AllowedLayers @('data') }
  }

  # 2. collect anchors {#...} and verify uniqueness; collect link targets
  $anchorMap = @{}     # anchor -> file
  $linkRefs  = New-Object System.Collections.ArrayList   # @{ file; anchor }
  $mdFiles = @()
  foreach ($p in @($Bible, $Stories, $Amend)) { if (Test-Path $p) { $mdFiles += $p } }
  if (Test-Path $RfcDir) { $mdFiles += (Get-ChildItem -LiteralPath $RfcDir -Filter '*.md' -File | Select-Object -ExpandProperty FullName) }

  foreach ($f in $mdFiles) {
    $rel  = $f.Substring($RepoRoot.Length).TrimStart('\','/')
    $text = Get-Content -LiteralPath $f -Raw -Encoding UTF8
    foreach ($m in [regex]::Matches($text, '\{#([^}]+)\}')) {
      $a = $m.Groups[1].Value
      if ($anchorMap.ContainsKey($a)) { Add-Err "duplicate anchor {#$a} in $rel (also $($anchorMap[$a]))" }
      else { $anchorMap[$a] = $rel }
    }
    # markdown links: [text](target#anchor) or (file#anchor) or (#anchor)
    foreach ($m in [regex]::Matches($text, '\]\(([^)]*#[^)]+)\)')) {
      $target = $m.Groups[1].Value
      $hash = $target.Substring($target.IndexOf('#') + 1)
      [void]$linkRefs.Add(@{ file = $rel; anchor = $hash; raw = $target })
    }
  }
  Add-Ok "collected $($anchorMap.Count) anchors across $($mdFiles.Count) markdown files"

  # 3. cross-ref resolution (intra-repo #ID links must resolve; skip external/http and HOUSE-* refs to shared file)
  foreach ($r in $linkRefs) {
    $a = $r.anchor
    if ($r.raw -match '^https?://') { continue }
    if ($a -match '^MAC-') {
      if (-not $anchorMap.ContainsKey($a)) { Add-Err "$($r.file): link to {#$a} does not resolve" }
    }
    elseif ($a -match '^HOUSE-') {
      # resolves into the shared MindAttic.HouseRules.md (outside repo) - informational only
    }
    # other hashes (e.g. README section slugs) are not Codex anchors; ignore
  }
  Add-Ok "cross-references checked ($($linkRefs.Count) link(s))"

  # 4. data schema validation (only if data dir exists)
  if (Test-Path $DataDir) {
    $schemaDir = Join-Path $DataDir '_schema'
    Get-ChildItem -LiteralPath $DataDir -Filter '*.json' -File -Recurse |
      Where-Object { $_.FullName -notmatch '_schema' } | ForEach-Object {
        try { $null = Get-Content -LiteralPath $_.FullName -Raw -Encoding UTF8 | ConvertFrom-Json }
        catch { Add-Err "data file $($_.Name): invalid JSON - $($_.Exception.Message)" }
      }
    Add-Ok "data files present and parsed (schema dir: $(Test-Path $schemaDir))"
  } else {
    Add-Ok "no docs/data (lean website domain) - L5 check skipped"
  }

  # 5. every checked story names a test token; best-effort existence
  if (Test-Path $Stories) {
    $sText = Get-Content -LiteralPath $Stories -Raw -Encoding UTF8
    $check = [string][char]0x2705   # white check mark (avoid non-ASCII literal in this script)
    $doneCount = 0
    foreach ($line in ($sText -replace "`r`n","`n" -split "`n")) {
      if ($line -match 'MAC-US-[A-Z]\d+' -and $line.Contains($check)) {
        $doneCount++
        if ($line -notmatch 'verified by `[^`]+`') {
          Add-Err "done story lacks a verified-by test token: $($line.Trim())"
        }
      }
    }
    # verify cited test tokens exist somewhere in the repo (best-effort)
    foreach ($m in [regex]::Matches($sText, 'verified by `([^`]+)`')) {
      $tok = $m.Groups[1].Value
      $hit = Get-ChildItem -LiteralPath $RepoRoot -Recurse -File -ErrorAction SilentlyContinue |
             Where-Object { $_.FullName -notmatch '\\\.git\\' } |
             Select-String -SimpleMatch -Pattern $tok -List -ErrorAction SilentlyContinue
      if (-not $hit) { Add-Warn "cited test token '$tok' not found in repo (best-effort)" }
    }
    Add-Ok "story check OK ($doneCount done stories with test citations)"
  }

  # 6. every code path/file cited in the bible exists on disk
  if (Test-Path $Bible) {
    $bText = Get-Content -LiteralPath $Bible -Raw -Encoding UTF8
    # backtick-quoted tokens that look like repo paths/files
    $seen = @{}
    foreach ($m in [regex]::Matches($bText, '`([^`]+)`')) {
      $tok = $m.Groups[1].Value
      if ($seen.ContainsKey($tok)) { continue }
      $seen[$tok] = $true
      # candidate file paths: contain a slash or a known extension, no spaces, no shell args
      if ($tok -match '\s') { continue }
      if ($tok -match '^[\w./-]+\.(htm|html|ps1|bat|json|md|js|css)$' -or
          ($tok -match '/' -and $tok -notmatch '^https?:' -and $tok -match '\.')) {
        $candidate = Join-Path $RepoRoot ($tok -replace '/', '\')
        if (-not (Test-Path -LiteralPath $candidate)) {
          # tolerate paths that reference sibling repos or retired files explicitly noted
          Add-Warn "bible cites path '$tok' not found in repo (may be external/retired - confirm)"
        }
      }
    }
    Add-Ok "bible-cited path existence checked"
  }

  # 7. generatedFrom freshness + digest staleness
  if (Test-Path $Digest) {
    $dText = Get-Content -LiteralPath $Digest -Raw -Encoding UTF8
    $srcMtime = (Get-Item -LiteralPath $Bible).LastWriteTimeUtc
    $digMtime = (Get-Item -LiteralPath $Digest).LastWriteTimeUtc
    if ($dText -match 'generatedFrom:\s*(\S+)') {
      if ($srcMtime -gt $digMtime) {
        Add-Err "BIBLE.digest.md is STALE (BIBLE.md modified after digest). Run: codex.ps1 digest"
      } else { Add-Ok "digest is fresh (generatedFrom BIBLE.md)" }
    } else {
      Add-Warn "BIBLE.digest.md has no generatedFrom marker"
    }
    # content staleness: regenerate to temp and compare body
    $fresh = Build-DigestContent
    $current = $dText -replace "`r`n", "`n"
    $freshN  = $fresh  -replace "`r`n", "`n"
    if ($current.Trim() -ne $freshN.Trim()) {
      Add-Warn "BIBLE.digest.md content differs from a fresh regen. Run: codex.ps1 digest"
    }
  } else {
    Add-Err "docs/BIBLE.digest.md missing. Run: codex.ps1 digest"
  }

  # --- report ---
  Write-Host ""
  Write-Host "Codex doctor - MindAttic Cares (MAC)" -ForegroundColor Cyan
  Write-Host ("=" * 50)
  foreach ($c in $script:Checks)   { Write-Host "  [OK]   $c" -ForegroundColor DarkGray }
  foreach ($w in $script:Warnings) { Write-Host "  [WARN] $w" -ForegroundColor Yellow }
  foreach ($e in $script:Errors)   { Write-Host "  [FAIL] $e" -ForegroundColor Red }
  Write-Host ("=" * 50)
  Write-Host ("checks: {0}  warnings: {1}  errors: {2}" -f $script:Checks.Count, $script:Warnings.Count, $script:Errors.Count)
  if ($script:Errors.Count -gt 0) { Write-Host "DOCTOR: FAIL" -ForegroundColor Red; exit 1 }
  Write-Host "DOCTOR: PASS" -ForegroundColor Green
  exit 0
}

# =========================================================================
# DIGEST
# =========================================================================
function Get-Section {
  param([string]$Text, [int]$Number)
  # returns the lines of the "## N. Title {#MAC-<section>N}" section up to the next "## ".
  # Matched by the leading "## N." number to avoid embedding non-ASCII anchor chars in this
  # script (PowerShell 5.1 reads BOM-less .ps1 as ANSI, mangling the section sign).
  $lines = $Text -replace "`r`n", "`n" -split "`n"
  $out = New-Object System.Collections.ArrayList
  $in = $false
  foreach ($l in $lines) {
    if (-not $in -and $l -match ('^##\s+' + $Number + '\.\s')) { $in = $true; [void]$out.Add($l); continue }
    if ($in -and $l -match '^##\s') { break }
    if ($in) { [void]$out.Add($l) }
  }
  return ($out -join "`n")
}

function Build-DigestContent {
  $bText = Get-Content -LiteralPath $Bible -Raw -Encoding UTF8

  $s1 = Get-Section -Text $bText -Number 1
  $s3 = Get-Section -Text $bText -Number 3
  $s5 = Get-Section -Text $bText -Number 5
  $s9 = Get-Section -Text $bText -Number 9

  # status index from USER_STORIES - count only per-story status markers
  # (a story line carries "MAC-US-<E><n> <marker>"), so the legend line is not counted.
  $done = 0; $partial = 0; $planned = 0; $cut = 0
  if (Test-Path $Stories) {
    $st = Get-Content -LiteralPath $Stories -Raw -Encoding UTF8
    $check   = [string][char]0x2705                    # done
    $yellow  = [string]([char]0xD83D + [char]0xDFE1)   # partial
    $square  = [string][char]0x2B1C                    # planned
    $scissor = [string]([char]0xD83D + [char]0xDDD1)   # cut
    foreach ($line in ($st -replace "`r`n","`n" -split "`n")) {
      if ($line -notmatch 'MAC-US-[A-Z]\d+') { continue }
      if     ($line.Contains($check))   { $done++ }
      elseif ($line.Contains($yellow))  { $partial++ }
      elseif ($line.Contains($square))  { $planned++ }
      elseif ($line.Contains($scissor)) { $cut++ }
    }
  }

  # latest amendment head
  $amendHead = ''
  if (Test-Path $Amend) {
    $aLines = (Get-Content -LiteralPath $Amend -Raw -Encoding UTF8) -replace "`r`n", "`n" -split "`n"
    $headers = @($aLines | Where-Object { $_ -match '^##\s+MAC-A\d+' })
    if ($headers.Count -gt 0) { $amendHead = $headers[-1].TrimStart('#',' ') }
  }

  $today = (Get-Date).ToString('yyyy-MM-dd')
  $sb = New-Object System.Text.StringBuilder
  [void]$sb.AppendLine("---")
  [void]$sb.AppendLine("codex: 1")
  [void]$sb.AppendLine("project: MindAttic Cares")
  [void]$sb.AppendLine("code: MAC")
  [void]$sb.AppendLine("layer: digest")
  [void]$sb.AppendLine("status: living")
  [void]$sb.AppendLine("updated: $today")
  [void]$sb.AppendLine("generatedFrom: MAC-bible")
  [void]$sb.AppendLine("---")
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine("AUTHORITATIVE - full detail in docs/BIBLE.md")
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine("# MindAttic Cares - Bible Digest (generated)")
  [void]$sb.AppendLine("> Do not hand-edit. Regenerate with: tools/codex.ps1 digest")
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine($s1); [void]$sb.AppendLine("")
  [void]$sb.AppendLine($s3); [void]$sb.AppendLine("")
  [void]$sb.AppendLine($s5); [void]$sb.AppendLine("")
  [void]$sb.AppendLine($s9); [void]$sb.AppendLine("")
  [void]$sb.AppendLine("## Status index (USER_STORIES)")
  [void]$sb.AppendLine("- done: $done   partial: $partial   planned: $planned   cut: $cut")
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine("## Latest amendment")
  [void]$sb.AppendLine("- $amendHead")
  return $sb.ToString()
}

function Invoke-Digest {
  if (-not (Test-Path $Bible)) { Write-Host "BIBLE.md missing" -ForegroundColor Red; exit 1 }
  $content = Build-DigestContent
  Set-Content -LiteralPath $Digest -Value $content -Encoding UTF8
  Write-Host "digest written: $Digest" -ForegroundColor Green
}

switch ($Command) {
  'doctor' { Invoke-Doctor }
  'digest' { Invoke-Digest }
}
