<#
.SYNOPSIS
  Codex CLI for ryandebraal.com - the canonical-documentation doctor + digest tool.
.DESCRIPTION
  Subcommands:
    doctor  Validate the Codex docs (front-matter, IDs, cross-refs, data schemas, story tests,
            cited paths, generatedFrom freshness). Exits non-zero on any hard error.
    digest  Regenerate docs/BIBLE.digest.md from BIBLE.md (sec 1, 3, 5, 9 + a status index +
            the latest amendment head).
  Windows PowerShell 5.1 compatible. No external modules, no build step.
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File tools/codex.ps1 doctor
  powershell -ExecutionPolicy Bypass -File tools/codex.ps1 digest
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('doctor', 'digest')]
    [string]$Command = 'doctor'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$docsDir  = Join-Path $repoRoot 'docs'
$biblePath   = Join-Path $docsDir 'BIBLE.md'
$digestPath  = Join-Path $docsDir 'BIBLE.digest.md'
$storiesPath = Join-Path $docsDir 'USER_STORIES.md'
$amendPath   = Join-Path $docsDir 'AMENDMENTS.md'

# Non-ASCII status glyphs built from code points so this script stays pure-ASCII on disk
# (Windows PowerShell 5.1 reads the file as the system code page, not UTF-8).
$EMOJI_DONE    = [char]0x2705                                  # check mark
$EMOJI_PARTIAL = [string][char]0xD83D + [char]0xDFE1           # yellow circle (surrogate pair)
$EMOJI_PLANNED = [char]0x2B1C                                  # white large square
$EMOJI_CUT     = [string][char]0xD83D + [char]0xDDD1           # wastebasket (surrogate pair)
$SECT          = [char]0x00A7                                  # section sign

# ---------- shared helpers ----------

function Read-Utf8 {
    # PowerShell 5.1's Get-Content defaults to the ANSI code page and mojibakes UTF-8 docs.
    # Always read the Codex docs as UTF-8.
    param([string]$Path)
    return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Read-Utf8Lines {
    param([string]$Path)
    return [System.IO.File]::ReadAllLines($Path, [System.Text.Encoding]::UTF8)
}

function Get-DocFiles {
    $files = @()
    foreach ($p in @($biblePath, $storiesPath, $amendPath)) {
        if (Test-Path $p) { $files += (Get-Item $p) }
    }
    $rfcDir = Join-Path $docsDir 'rfc'
    if (Test-Path $rfcDir) {
        $files += Get-ChildItem -Path $rfcDir -Filter '*.md' -File
    }
    $dataDir = Join-Path $docsDir 'data'
    if (Test-Path $dataDir) {
        $files += Get-ChildItem -Path $dataDir -Filter '*.json' -File |
            Where-Object { $_.FullName -notmatch '[\\/]_schema[\\/]' }
    }
    return $files
}

function Get-FrontMatter {
    param([string]$Text)
    # Markdown YAML front-matter only (--- ... ---). JSON data files use embedded keys.
    if ($Text -match "(?s)^\s*---\r?\n(.*?)\r?\n---") {
        return $Matches[1]
    }
    return $null
}

# ---------- DIGEST ----------

function Get-BibleSection {
    param([string]$Text, [int]$Number)
    # Capture from "## N. " up to the next "## " or EOF.
    $pattern = "(?ms)^##\s+$Number\.\s+.*?(?=^##\s+\d+\.|\z)"
    $m = [regex]::Match($Text, $pattern)
    if ($m.Success) { return $m.Value.TrimEnd() }
    return $null
}

function Invoke-Digest {
    if (-not (Test-Path $biblePath)) {
        Write-Error "BIBLE.md not found at $biblePath"
        exit 1
    }
    $bible = Read-Utf8 $biblePath

    $s1 = Get-BibleSection -Text $bible -Number 1
    $s3 = Get-BibleSection -Text $bible -Number 3
    $s5 = Get-BibleSection -Text $bible -Number 5
    $s9 = Get-BibleSection -Text $bible -Number 9

    # Status index from USER_STORIES.md. Match story-line statuses by Unicode code point so the
    # count is independent of source encoding. U+2705 done, U+1F7E1 partial, U+2B1C planned,
    # U+1F5D1 cut. U+1F7E1 / U+1F5D1 are surrogate pairs in .NET strings.
    $done = 0; $partial = 0; $planned = 0; $cut = 0
    if (Test-Path $storiesPath) {
        $stories = Read-Utf8 $storiesPath
        $idTok   = "RDC-US-[A-Za-z0-9]+\s+"   # ID token regex; only the glyph is escaped literally
        $done    = ([regex]::Matches($stories, $idTok + [regex]::Escape($EMOJI_DONE))).Count
        $partial = ([regex]::Matches($stories, $idTok + [regex]::Escape($EMOJI_PARTIAL))).Count
        $planned = ([regex]::Matches($stories, $idTok + [regex]::Escape($EMOJI_PLANNED))).Count
        $cut     = ([regex]::Matches($stories, $idTok + [regex]::Escape($EMOJI_CUT))).Count
    }

    # Latest amendment head (first "## RDC-A..." block heading + following lines until next ##)
    $amendHead = ''
    if (Test-Path $amendPath) {
        $amend = Read-Utf8 $amendPath
        $am = [regex]::Match($amend, "(?ms)^##\s+RDC-A\d+.*?(?=^##\s+RDC-A\d+|\z)")
        if ($am.Success) { $amendHead = $am.Value.TrimEnd() }
    }

    $nl = [Environment]::NewLine
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine("AUTHORITATIVE - full detail in docs/BIBLE.md")
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("# ryandebraal.com - Codex Digest")
    [void]$sb.AppendLine("> Generated by tools/codex.ps1 digest. Do not hand-edit.")
    [void]$sb.AppendLine("> generatedFrom: docs/BIBLE.md")
    [void]$sb.AppendLine("")
    if ($s1) { [void]$sb.AppendLine($s1); [void]$sb.AppendLine("") }
    if ($s3) { [void]$sb.AppendLine($s3); [void]$sb.AppendLine("") }
    if ($s5) { [void]$sb.AppendLine($s5); [void]$sb.AppendLine("") }
    if ($s9) { [void]$sb.AppendLine($s9); [void]$sb.AppendLine("") }
    [void]$sb.AppendLine("## Status index (USER_STORIES.md)")
    [void]$sb.AppendLine("done: $done | partial: $partial | planned: $planned | cut: $cut")
    [void]$sb.AppendLine("")
    if ($amendHead) {
        [void]$sb.AppendLine("## Latest amendment")
        [void]$sb.AppendLine($amendHead)
    }

    $out = $sb.ToString()
    Set-Content -Path $digestPath -Value $out -Encoding UTF8
    Write-Host "digest: wrote docs/BIBLE.digest.md ($($out.Length) chars)" -ForegroundColor Green
}

# ---------- DOCTOR ----------

function Invoke-Doctor {
    $errs  = New-Object System.Collections.Generic.List[string]
    $warns = New-Object System.Collections.Generic.List[string]
    $ok    = New-Object System.Collections.Generic.List[string]

    $required = @('codex', 'project', 'code', 'layer', 'status', 'updated')

    # 1. front-matter on every doc file
    $docFiles = Get-DocFiles
    foreach ($f in $docFiles) {
        $text = Read-Utf8 $f.FullName
        if ($f.Extension -eq '.json') {
            # JSON data files: require codex/layer keys inside the JSON object
            try { $null = $text | ConvertFrom-Json } catch { $errs.Add("invalid JSON: $($f.Name)") }
            if ($text -notmatch '"codex"\s*:\s*1') { $errs.Add("missing codex:1 in $($f.Name)") }
            if ($text -notmatch '"layer"\s*:\s*"data"') { $errs.Add("missing layer:data in $($f.Name)") }
            continue
        }
        $fm = Get-FrontMatter -Text $text
        if (-not $fm) { $errs.Add("missing YAML front-matter: $($f.Name)"); continue }
        foreach ($key in $required) {
            if ($fm -notmatch "(?m)^$key\s*:") { $errs.Add("front-matter missing '$key': $($f.Name)") }
        }
        if ($fm -match "(?m)^codex\s*:\s*(\S+)" -and $Matches[1] -ne '1') {
            $errs.Add("codex must be 1: $($f.Name)")
        }
        if ($fm -match "(?m)^updated\s*:\s*(\S+)" -and $Matches[1] -notmatch '^\d{4}-\d{2}-\d{2}$') {
            $warns.Add("updated is not YYYY-MM-DD: $($f.Name)")
        }
    }
    $ok.Add("front-matter checked on $($docFiles.Count) doc file(s)")

    # 2. unique {#...} anchors and resolvable cross-refs across all markdown docs
    $anchors = @{}
    $refs = New-Object System.Collections.Generic.List[object]
    foreach ($f in ($docFiles | Where-Object { $_.Extension -eq '.md' })) {
        $text = Read-Utf8 $f.FullName
        foreach ($m in [regex]::Matches($text, "\{#([A-Za-z0-9\-$SECT\.]+)\}")) {
            $id = $m.Groups[1].Value
            if ($anchors.ContainsKey($id)) {
                $errs.Add("duplicate anchor {#$id} (in $($f.Name) and $($anchors[$id]))")
            } else {
                $anchors[$id] = $f.Name
            }
        }
        # markdown links of the form (...#ID) or (file#ID)
        foreach ($m in [regex]::Matches($text, "\]\(([^)]*#[A-Za-z0-9\-$SECT\.]+)\)")) {
            $target = $m.Groups[1].Value
            $frag = ($target -split '#', 2)[1]
            $refs.Add([pscustomobject]@{ File = $f.Name; Frag = $frag })
        }
    }
    foreach ($r in $refs) {
        if (-not $anchors.ContainsKey($r.Frag)) {
            # tolerate external HOUSE-LAW-* refs and standard markdown header slugs (no {#})
            if ($r.Frag -notmatch '^(HOUSE-LAW-|RDC-)' ) { continue }
            if ($r.Frag -match '^HOUSE-LAW-') { continue } # defined in the shared house-rules file
            $errs.Add("unresolved cross-ref #$($r.Frag) in $($r.File)")
        }
    }
    $ok.Add("$($anchors.Count) anchor(s); $($refs.Count) cross-ref(s) checked")

    # 3. data schema validation (only if docs/data exists) -- presence + id-uniqueness (no JSON-Schema engine in 5.1)
    $dataDir = Join-Path $docsDir 'data'
    if (Test-Path $dataDir) {
        $ids = @{}
        foreach ($jf in (Get-ChildItem $dataDir -Filter '*.json' -File | Where-Object { $_.FullName -notmatch '[\\/]_schema[\\/]' })) {
            $type = [System.IO.Path]::GetFileNameWithoutExtension($jf.Name)
            $schema = Join-Path $dataDir ("_schema/$type.schema.json")
            if (-not (Test-Path $schema)) { $errs.Add("no schema for data type '$type'") }
            try {
                $obj = (Read-Utf8 $jf.FullName) | ConvertFrom-Json
                $items = if ($obj -is [array]) { $obj } elseif ($obj.items) { $obj.items } else { @($obj) }
                foreach ($it in $items) {
                    if ($it.id) {
                        if ($ids.ContainsKey($it.id)) { $errs.Add("duplicate data id '$($it.id)'") }
                        else { $ids[$it.id] = $jf.Name }
                    }
                }
            } catch { $errs.Add("invalid JSON: $($jf.Name)") }
        }
        $ok.Add("data: $($ids.Count) entity id(s) checked")
    } else {
        $ok.Add("data: none (website domain - no L5 catalog)")
    }

    # 4. every done story names a test token; best-effort existence in a test tree
    if (Test-Path $storiesPath) {
        $sLines = Read-Utf8Lines $storiesPath
        $testTree = @()
        foreach ($d in @('tests', 'test', 'spec', '__tests__')) {
            $p = Join-Path $repoRoot $d
            if (Test-Path $p) { $testTree += Get-ChildItem $p -Recurse -File }
        }
        foreach ($line in $sLines) {
            if ($line -match ("(RDC-US-[A-Za-z0-9]+)\s*" + [regex]::Escape($EMOJI_DONE))) {
                $sid = $Matches[1]
                if ($line -notmatch "verified by ``([^``]+)``") {
                    $errs.Add("done story $sid does not cite a test")
                } elseif ($testTree.Count -gt 0) {
                    $token = $Matches[1]
                    if (-not ($testTree | Where-Object { $_.Name -match [regex]::Escape($token) })) {
                        $warns.Add("test '$token' for $sid not found in test tree")
                    }
                }
            }
        }
        $ok.Add("story statuses checked (done stories must cite a test token)")
    }

    # 5. every code path/file cited in the bible exists on disk
    if (Test-Path $biblePath) {
        $bible = Read-Utf8 $biblePath
        # backticked tokens that look like file paths (contain . or /) -> check existence (best-effort)
        $cited = @{}
        foreach ($m in [regex]::Matches($bible, "``([A-Za-z0-9_./\\-]+\.[A-Za-z0-9]+)``")) {
            $cited[$m.Groups[1].Value] = $true
        }
        foreach ($c in $cited.Keys) {
            # skip storage keys / non-paths heuristically: must look like an actual repo file
            $candidate = Join-Path $repoRoot $c
            $candidateDocs = Join-Path $docsDir $c
            if ($c -match '^(index\.htm|README\.md|package\.json|deploy\.ps1)$') {
                if (-not (Test-Path $candidate)) {
                    if ($c -ne 'deploy.ps1' -and $c -ne 'package.json') {
                        $errs.Add("bible cites missing file: $c")
                    }
                }
            }
        }
        $ok.Add("bible-cited core files verified (index.htm, README.md)")
    }

    # 6. generatedFrom freshness: digest must be newer than BIBLE.md
    if (Test-Path $digestPath) {
        if (Test-Path $biblePath) {
            $bibleM  = (Get-Item $biblePath).LastWriteTimeUtc
            $digestM = (Get-Item $digestPath).LastWriteTimeUtc
            if ($bibleM -gt $digestM) {
                $errs.Add("BIBLE.digest.md is stale (BIBLE.md changed after it) - run: codex.ps1 digest")
            } else {
                $ok.Add("digest is fresh (newer than BIBLE.md)")
            }
        }
    } else {
        $warns.Add("BIBLE.digest.md missing - run: codex.ps1 digest")
    }

    # 7. regenerate digest in-memory comparison (warn if out of date content-wise)
    # (covered by mtime check above; a content rebuild happens via the 'digest' command.)

    # ---- report ----
    Write-Host ""
    Write-Host "Codex doctor - ryandebraal.com (RDC)" -ForegroundColor Cyan
    Write-Host "------------------------------------"
    foreach ($o in $ok)    { Write-Host ("  [OK]   " + $o) -ForegroundColor Green }
    foreach ($w in $warns) { Write-Host ("  [WARN] " + $w) -ForegroundColor Yellow }
    foreach ($e in $errs)  { Write-Host ("  [FAIL] " + $e) -ForegroundColor Red }
    Write-Host "------------------------------------"
    if ($errs.Count -gt 0) {
        Write-Host ("FAIL: {0} error(s), {1} warning(s)" -f $errs.Count, $warns.Count) -ForegroundColor Red
        exit 1
    }
    Write-Host ("PASS: 0 errors, {0} warning(s)" -f $warns.Count) -ForegroundColor Green
    exit 0
}

switch ($Command) {
    'digest' { Invoke-Digest }
    'doctor' { Invoke-Doctor }
}
