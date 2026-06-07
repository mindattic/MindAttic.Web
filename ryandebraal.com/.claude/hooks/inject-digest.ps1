# SessionStart hook for ryandebraal.com (RDC).
# Injects docs/BIBLE.digest.md into the session as authoritative context.
# Windows PowerShell 5.1 safe: reads UTF-8, escapes all non-ASCII to \uXXXX so the emitted
# JSON is pure ASCII regardless of console code page. Emits {} if the digest is missing/empty.

$ErrorActionPreference = 'Stop'

# repo root = two levels up from this file (.claude/hooks/inject-digest.ps1)
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$digestPath = Join-Path $repoRoot 'docs/BIBLE.digest.md'

if (-not (Test-Path $digestPath)) { Write-Output '{}'; exit 0 }

$digest = [System.IO.File]::ReadAllText($digestPath, [System.Text.Encoding]::UTF8)
if ([string]::IsNullOrWhiteSpace($digest)) { Write-Output '{}'; exit 0 }

$preamble = @"
[ryandebraal.com - Codex BIBLE digest | AUTHORITATIVE]
The following is the authoritative, condensed source of truth for this project (generated from
docs/BIBLE.md). Treat it as ground truth for what the project IS, is NOT, and its Laws. When in
doubt, defer to docs/BIBLE.md and docs/AMENDMENTS.md (an amendment wins over the bible). Do not
modify the shipped index.htm content or introduce dependencies/build steps.

"@

$full = $preamble + $digest

# Build the JSON value string char-by-char, escaping JSON specials and all non-ASCII to \uXXXX.
$sb = New-Object System.Text.StringBuilder
foreach ($ch in $full.ToCharArray()) {
    $code = [int][char]$ch
    switch ($ch) {
        '"'  { [void]$sb.Append('\"') ; continue }
        '\'  { [void]$sb.Append('\\') ; continue }
        "`b" { [void]$sb.Append('\b') ; continue }
        "`f" { [void]$sb.Append('\f') ; continue }
        "`n" { [void]$sb.Append('\n') ; continue }
        "`r" { [void]$sb.Append('\r') ; continue }
        "`t" { [void]$sb.Append('\t') ; continue }
        default {
            if ($code -lt 0x20 -or $code -gt 0x7E) {
                [void]$sb.Append('\u' + $code.ToString('x4'))
            } else {
                [void]$sb.Append($ch)
            }
        }
    }
}
$escaped = $sb.ToString()

$json = '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"' + $escaped + '"}}'
Write-Output $json
exit 0
