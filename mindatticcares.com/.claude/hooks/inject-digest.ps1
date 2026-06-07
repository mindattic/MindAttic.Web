<#
  SessionStart hook for MindAttic Cares (MAC).
  Reads docs/BIBLE.digest.md and emits Claude Code hook JSON injecting it as
  authoritative context. Non-ASCII is escaped to \uXXXX so the output is safe under
  Windows PowerShell 5.1 / Windows-1252. If the digest is missing or empty, emits {}.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$here   = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo   = Split-Path -Parent (Split-Path -Parent $here)
$digest = Join-Path $repo 'docs\BIBLE.digest.md'

if (-not (Test-Path -LiteralPath $digest)) { Write-Output '{}'; return }

$body = Get-Content -LiteralPath $digest -Raw -Encoding UTF8
if ([string]::IsNullOrWhiteSpace($body)) { Write-Output '{}'; return }

$preamble = @"
The following is the AUTHORITATIVE Codex digest for MindAttic Cares (MAC), generated from
docs/BIBLE.md. Treat it as the source of truth for what this project IS, is NOT, and its Laws.
Full detail lives in docs/BIBLE.md; amendments in docs/AMENDMENTS.md win over the bible.

"@

$context = $preamble + $body

# JSON-escape, then escape any non-ASCII to \uXXXX (5.1 / Win-1252 safe).
function ConvertTo-JsonString {
  param([string]$s)
  $sb = New-Object System.Text.StringBuilder
  foreach ($ch in $s.ToCharArray()) {
    $code = [int]$ch
    switch ($ch) {
      '"'  { [void]$sb.Append('\"'); continue }
      '\'  { [void]$sb.Append('\\'); continue }
      "`b" { [void]$sb.Append('\b'); continue }
      "`f" { [void]$sb.Append('\f'); continue }
      "`n" { [void]$sb.Append('\n'); continue }
      "`r" { [void]$sb.Append('\r'); continue }
      "`t" { [void]$sb.Append('\t'); continue }
      default {
        if ($code -lt 32 -or $code -gt 126) {
          [void]$sb.Append(('\u{0:x4}' -f $code))
        } else {
          [void]$sb.Append($ch)
        }
      }
    }
  }
  return $sb.ToString()
}

$escaped = ConvertTo-JsonString $context
$json = '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"' + $escaped + '"}}'
Write-Output $json
