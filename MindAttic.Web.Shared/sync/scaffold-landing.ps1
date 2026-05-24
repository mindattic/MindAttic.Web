# scaffold-landing.ps1 -- create the README-driven landing-page scaffold for a
# project. Idempotent: skips files that already exist (unless -Force is passed).
#
# Produces:
#   <ProjectRoot>/index.htm                                  (template with marker blocks; only if missing)
#   <ProjectRoot>/package.json                               (marked + highlight.js deps)
#   <ProjectRoot>/scripts/cli/build-html.js                  (renders README.md into index.htm)
#   <ProjectRoot>/scripts/cli/deploy.bat                     (launcher)
#   <ProjectRoot>/scripts/cli/deploy.ps1                     (build + sync + stamp + FTP)
#   <ProjectRoot>/scripts/cli/deploy.settings.json.template  (committed template)
#   <ProjectRoot>/scripts/cli/deploy.settings.json           (real creds; gitignored)
#   <ProjectRoot>/.claude/skills/deploy/SKILL.md             (/deploy slash command)
#
# Also appends a .gitignore stanza if missing.
#
# Usage:
#   powershell -File scaffold-landing.ps1 `
#       -ProjectName 'IdiotProof' -RepoName 'IdiotProof' -ProjectRoot 'D:\Projects\MindAttic\IdiotProof' `
#       -FtpFolder 'idiotproof' -Tagline 'Branching trading strategies, evaluated 24/7.' `
#       -OpenUrl 'https://mindattic.com/idiotproof/'

[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$ProjectName,
    [Parameter(Mandatory)][string]$RepoName,
    [Parameter(Mandatory)][string]$ProjectRoot,
    [Parameter(Mandatory)][string]$FtpFolder,
    [Parameter(Mandatory)][string]$Tagline,
    [Parameter(Mandatory)][string]$OpenUrl,
    [string]$FtpHost     = '132.148.112.53',
    [int]   $FtpPort     = 21,
    [string]$FtpUsername = 'ha9h9a@ryandebraal.com',
    [string]$FtpPassword = '&#HVzS!=&v32',
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $ProjectRoot)) { throw "ProjectRoot not found: $ProjectRoot" }

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$slug = $ProjectName.ToLowerInvariant() -replace '[^a-z0-9]', ''  # used as #id selector

function Write-IfMissing {
    param([string]$Path, [string]$Content)
    if ((Test-Path $Path) -and -not $Force) {
        Write-Host "  [skip] $Path"
        return
    }
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
    Write-Host "  [write] $Path"
}

# ----- index.htm -----
$indexHtm = @"
<!-- Last Updated: pending first deploy -->
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>$ProjectName | MindAttic</title>
<meta name="description" content="$Tagline">

<!-- BEGIN MINDATTIC.UIUX:OUTFITFONT -->
<!-- END MINDATTIC.UIUX:OUTFITFONT -->

<!-- BEGIN MINDATTIC.UIUX:ATTICFONT -->
<!-- END MINDATTIC.UIUX:ATTICFONT -->

<style id="mindattic-landing-css">
:root {
    --bg:           #07090b;
    --fg:           #d6dde2;
    --muted:        #8a949c;
    --accent:       #ff8c00;
    --accent-fg:    #07090b;
    --border:       rgba(214, 221, 226, 0.18);
    --card-bg:      rgba(10, 14, 18, 0.78);
    --content-bg:   rgba(10, 14, 18, 0.86);
    --code-bg:      rgba(255, 255, 255, 0.04);
    --code-border:  rgba(255, 255, 255, 0.10);
    --link:         #ffb347;
    --link-hover:   #ffd089;
    --table-stripe: rgba(255, 255, 255, 0.03);
    --table-border: rgba(214, 221, 226, 0.14);
    --max-width:    920px;
}
* { box-sizing: border-box; }
html, body {
    margin: 0;
    padding: 0;
    background: var(--bg);
    color: var(--fg);
    font-family: 'Outfit', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    line-height: 1.55;
}
.page { position: relative; z-index: 1; }
.home-link { position: fixed; top: 14px; left: 18px; z-index: 5; color: var(--muted); font-size: 0.82rem; text-decoration: none; letter-spacing: 0.04em; }
.home-link:hover { color: var(--fg); }
.hero { max-width: var(--max-width); margin: 0 auto; padding: 88px 24px 32px; text-align: center; }
.project-name { margin: 0 0 14px; font-size: clamp(2.6rem, 7vw, 4.4rem); line-height: 1; letter-spacing: 0.01em; color: var(--fg); }
.tagline { margin: 0 auto 32px; max-width: 720px; font-size: clamp(1rem, 1.55vw, 1.18rem); color: var(--muted); font-weight: 400; }
.btn-row { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-width: 160px; padding: 13px 24px; border-radius: 6px; font-family: inherit; font-size: 1rem; font-weight: 500; letter-spacing: 0.02em; text-decoration: none; transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease, color 120ms ease; cursor: pointer; border: 1px solid var(--border); }
.btn:hover, .btn:focus-visible { transform: translateY(-1px); }
.btn-primary { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); }
.btn-primary:hover { box-shadow: 0 8px 22px rgba(255, 140, 0, 0.32); }
.btn-secondary { background: transparent; color: var(--fg); }
.btn-secondary:hover { background: rgba(255, 255, 255, 0.06); }
.btn svg { width: 18px; height: 18px; }
.readme { max-width: var(--max-width); margin: 24px auto 96px; padding: 36px 44px 48px; background: var(--content-bg); border: 1px solid var(--border); border-radius: 10px; backdrop-filter: blur(6px); box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45); }
.readme h1, .readme h2, .readme h3, .readme h4, .readme h5, .readme h6 { color: var(--fg); line-height: 1.25; margin: 1.8em 0 0.6em; }
.readme h1 { font-size: 2.0rem; margin-top: 0; }
.readme h2 { font-size: 1.55rem; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
.readme h3 { font-size: 1.25rem; }
.readme h4 { font-size: 1.08rem; color: var(--muted); }
.readme p, .readme li { font-size: 1rem; }
.readme a { color: var(--link); text-decoration: none; border-bottom: 1px solid transparent; transition: color 120ms, border-color 120ms; }
.readme a:hover { color: var(--link-hover); border-bottom-color: var(--link-hover); }
.readme code { font-family: 'Fira Code', Consolas, 'SF Mono', Menlo, monospace; font-size: 0.92em; background: var(--code-bg); border: 1px solid var(--code-border); border-radius: 4px; padding: 0.12em 0.4em; }
.readme pre { background: var(--code-bg); border: 1px solid var(--code-border); border-radius: 6px; padding: 14px 16px; overflow-x: auto; line-height: 1.5; }
.readme pre code { background: transparent; border: 0; padding: 0; font-size: 0.9em; }
.readme blockquote { margin: 1em 0; padding: 0.4em 1em; border-left: 3px solid var(--accent); background: rgba(255, 140, 0, 0.06); color: var(--muted); }
.readme table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 0.95em; }
.readme th, .readme td { border: 1px solid var(--table-border); padding: 8px 12px; text-align: left; }
.readme th { background: rgba(255, 255, 255, 0.04); font-weight: 600; }
.readme tr:nth-child(even) td { background: var(--table-stripe); }
.readme img { max-width: 100%; height: auto; border-radius: 6px; }
.readme hr { border: none; border-top: 1px solid var(--border); margin: 2em 0; }
.readme ul, .readme ol { padding-left: 1.6em; }
.readme li + li { margin-top: 0.25em; }
.readme .heading-anchor { color: var(--muted); font-weight: 400; text-decoration: none; opacity: 0; transition: opacity 120ms; margin-left: 0.4em; border-bottom: none; }
.readme h2:hover .heading-anchor, .readme h3:hover .heading-anchor, .readme h4:hover .heading-anchor { opacity: 1; }
@media (max-width: 640px) {
    .hero { padding-top: 64px; }
    .readme { margin: 16px 14px 64px; padding: 22px 18px 30px; }
    .btn { min-width: 132px; padding: 11px 18px; font-size: 0.95rem; }
}
</style>
</head>
<body>

<!-- BEGIN MINDATTIC.UIUX:CYBERSPACE -->
<!-- END MINDATTIC.UIUX:CYBERSPACE -->

<a class="home-link" href="https://mindattic.com/">&larr; mindattic.com</a>

<div class="page">
    <header class="hero">
        <h1 class="project-name" id="$slug">$ProjectName</h1>
        <p class="tagline">$Tagline</p>
        <div class="btn-row">
            <a class="btn btn-primary" href="$OpenUrl" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Open
            </a>
            <a class="btn btn-secondary" href="https://github.com/mindattic/$RepoName" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.97.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.58.23 2.75.11 3.04.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.07.78 2.16v3.2c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>
                GitHub
            </a>
        </div>
    </header>

    <article class="readme">
<!-- BEGIN README-CONTENT -->
<p>README will be rendered here on first build. Run <code>scripts\cli\deploy.bat</code>.</p>
<!-- END README-CONTENT -->
    </article>
</div>

</body>
</html>
"@

Write-IfMissing -Path (Join-Path $ProjectRoot 'index.htm') -Content $indexHtm

# ----- package.json -----
$pkgName = ($ProjectName.ToLowerInvariant() -replace '[^a-z0-9]+', '-') + '-landing'
$packageJson = @"
{
  "name": "$pkgName",
  "private": true,
  "version": "1.0.0",
  "description": "README -> index.htm renderer for the $ProjectName mindattic.com landing page.",
  "scripts": {
    "build": "node scripts/cli/build-html.js",
    "deploy": "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/cli/deploy.ps1"
  },
  "dependencies": {
    "highlight.js": "^11.9.0",
    "marked": "^4.3.0"
  }
}
"@
Write-IfMissing -Path (Join-Path $ProjectRoot 'package.json') -Content $packageJson

# ----- scripts/cli/build-html.js (copied from IdiotProof reference) -----
$refBuild = 'D:\Projects\MindAttic\IdiotProof\scripts\cli\build-html.js'
if (-not (Test-Path $refBuild)) { throw "Reference build-html.js missing: $refBuild" }
$buildJsContent = [System.IO.File]::ReadAllText($refBuild, $utf8NoBom)
Write-IfMissing -Path (Join-Path $ProjectRoot 'scripts/cli/build-html.js') -Content $buildJsContent

# ----- scripts/cli/deploy.bat -----
$deployBat = @"
@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1" %*
"@
Write-IfMissing -Path (Join-Path $ProjectRoot 'scripts/cli/deploy.bat') -Content $deployBat

# ----- scripts/cli/deploy.ps1 (copied from IdiotProof reference) -----
$refDeploy = 'D:\Projects\MindAttic\IdiotProof\scripts\cli\deploy.ps1'
if (-not (Test-Path $refDeploy)) { throw "Reference deploy.ps1 missing: $refDeploy" }
$deployPs1 = [System.IO.File]::ReadAllText($refDeploy, $utf8NoBom)
Write-IfMissing -Path (Join-Path $ProjectRoot 'scripts/cli/deploy.ps1') -Content $deployPs1

# ----- scripts/cli/deploy.settings.json.template -----
$tpl = @"
{
  "_comment": "Copy this file to deploy.settings.json (no .template suffix) and fill in real FTP credentials. The .gitignore excludes deploy.settings.json so credentials never get committed.",

  "Subscriber":     "$ProjectName",
  "FtpHost":        "ftp.example.com",
  "FtpPort":        21,
  "FtpUsername":    "user@example.com",
  "FtpPassword":    "REPLACE_ME",
  "FtpRemotePath":  "/mindattic.com/$FtpFolder",
  "FtpUseSsl":      true,
  "FtpPassive":     true
}
"@
Write-IfMissing -Path (Join-Path $ProjectRoot 'scripts/cli/deploy.settings.json.template') -Content $tpl

# ----- scripts/cli/deploy.settings.json (real creds) -----
$real = @"
{
  "Subscriber":     "$ProjectName",
  "FtpHost":        "$FtpHost",
  "FtpPort":        $FtpPort,
  "FtpUsername":    "$FtpUsername",
  "FtpPassword":    "$FtpPassword",
  "FtpRemotePath":  "/mindattic.com/$FtpFolder",
  "FtpUseSsl":      true,
  "FtpPassive":     true
}
"@
Write-IfMissing -Path (Join-Path $ProjectRoot 'scripts/cli/deploy.settings.json') -Content $real

# ----- .claude/skills/deploy/SKILL.md -----
$skillMd = @"
---
name: deploy
description: Render README.md, sync MindAttic.UiUx, and FTP-upload index.htm to mindattic.com/$FtpFolder/. Runs scripts/cli/deploy.bat.
---

When invoked:

1. Run ``scripts\cli\deploy.bat`` from the project root (``$ProjectRoot``).
2. The script will:
   - ``node scripts/cli/build-html.js`` -- renders ``README.md`` into the ``<!-- BEGIN README-CONTENT -->`` marker block of ``index.htm`` (using marked + highlight.js). Auto-runs ``npm install`` if ``node_modules`` is absent.
   - ``git pull`` MindAttic.UiUx (sibling repo) for the latest font / Cyberspace bundle.
   - ``sync-landing-page.ps1 -Subscriber $ProjectName`` -- splices OutfitFont / AtticFont / Cyberspace marker blocks into ``index.htm``.
   - Stamp ``<!-- Last Updated: ... -->`` at the top of ``index.htm``.
   - FTPS upload ``index.htm`` to ``/mindattic.com/$FtpFolder/`` (defined in ``scripts/cli/deploy.settings.json``).
3. Report the FTP outcome (OK/FAIL) and the deployed URL.

Flags:
- ``-NoBuild`` -- skip the README render step.
- ``-NoSync`` -- skip the components pull/splice.

Notes:
- Credentials come from ``scripts/cli/deploy.settings.json`` (gitignored). If missing, copy ``deploy.settings.json.template`` and fill in.
- ``node_modules/`` is gitignored; ``npm install`` runs on first deploy.
"@
Write-IfMissing -Path (Join-Path $ProjectRoot '.claude/skills/deploy/SKILL.md') -Content $skillMd

# ----- .gitignore stanza -----
$gi = Join-Path $ProjectRoot '.gitignore'
$stanza = @(
    '',
    '# Landing-page renderer (README -> index.htm) -- credentials and Node deps',
    'scripts/cli/deploy.settings.json',
    'node_modules/',
    'package-lock.json'
) -join "`r`n"
if (Test-Path $gi) {
    $existing = [System.IO.File]::ReadAllText($gi, $utf8NoBom)
    if ($existing -notmatch 'scripts/cli/deploy\.settings\.json') {
        $existing = $existing.TrimEnd("`r","`n") + "`r`n" + $stanza + "`r`n"
        [System.IO.File]::WriteAllText($gi, $existing, $utf8NoBom)
        Write-Host "  [append] $gi"
    } else {
        Write-Host "  [skip]   $gi (already has stanza)"
    }
} else {
    [System.IO.File]::WriteAllText($gi, $stanza.TrimStart("`r","`n") + "`r`n", $utf8NoBom)
    Write-Host "  [write]  $gi"
}

Write-Host ""
Write-Host "Scaffolded $ProjectName at $ProjectRoot"
