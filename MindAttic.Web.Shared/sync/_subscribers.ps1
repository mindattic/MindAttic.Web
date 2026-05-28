# ====================================================================
# _subscribers.ps1 - helper for reading subscribers.json
# ====================================================================
# Dot-source from any sync-*.ps1:
#
#   . (Join-Path $PSScriptRoot '_subscribers.ps1')
#   $sub = Get-Subscriber -Name 'mindattic.com' -ContentRoot $ContentRoot
#   $sub.subscriptions | ForEach-Object { ... }
#
# Components and subscribers live in MindAttic.UiUx/subscribers.json.
# Edit that file (not this helper, not the per-subscriber scripts) to add
# or remove a subscription. The per-subscriber scripts iterate the
# subscriptions array, so a new entry there flows through automatically
# for `static-css` and `font-css` components.
# ====================================================================

function Get-SubscribersConfig {
    param([string]$ContentRoot)
    $path = Join-Path $ContentRoot 'subscribers.json'
    if (-not (Test-Path $path)) { throw "subscribers.json not found at $path" }
    return Get-Content $path -Raw -Encoding UTF8 | ConvertFrom-Json
}

function Get-Subscriber {
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$ContentRoot
    )
    $cfg = Get-SubscribersConfig -ContentRoot $ContentRoot
    if (-not ($cfg.subscribers.PSObject.Properties.Name -contains $Name)) {
        $known = ($cfg.subscribers.PSObject.Properties.Name | Sort-Object) -join ', '
        throw "Subscriber '$Name' not in subscribers.json. Known: $known"
    }
    $sub = $cfg.subscribers.$Name
    Add-Member -InputObject $sub -NotePropertyName 'name' -NotePropertyValue $Name -Force
    return $sub
}

function Get-ComponentDescriptor {
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$ContentRoot
    )
    $cfg = Get-SubscribersConfig -ContentRoot $ContentRoot
    if (-not ($cfg.components.PSObject.Properties.Name -contains $Name)) {
        $known = ($cfg.components.PSObject.Properties.Name | Sort-Object) -join ', '
        throw "Component '$Name' not registered in subscribers.json. Known: $known"
    }
    $comp = $cfg.components.$Name
    Add-Member -InputObject $comp -NotePropertyName 'name' -NotePropertyValue $Name -Force
    return $comp
}

# Build the body text for a `font-css` component (CSS file plus the optional
# applyToSelector rule). Mirrors Get-FontCssWithAppliedRule in the older
# scripts; the per-subscription `applyToSelector` (from subscribers.json)
# takes precedence over the component's JSON default.
function Build-FontCssBody {
    param(
        [Parameter(Mandatory)][PSCustomObject]$Component,
        [Parameter(Mandatory)][string]$ContentRoot,
        [object]$SelectorOverride = [System.Management.Automation.Language.NullString]::Value,
        [System.Text.Encoding]$Encoding = [System.Text.UTF8Encoding]::new($false)
    )
    $cssPath = Join-Path $ContentRoot $Component.cssFile
    if (-not (Test-Path $cssPath)) { throw "$($Component.name): CSS file not found at $cssPath" }
    $css = [System.IO.File]::ReadAllText($cssPath, $Encoding)

    $jsonPath = if ($Component.PSObject.Properties.Name -contains 'jsonFile') { Join-Path $ContentRoot $Component.jsonFile } else { $null }
    $cfg = if ($jsonPath -and (Test-Path $jsonPath)) { Get-Content $jsonPath -Raw -Encoding UTF8 | ConvertFrom-Json } else { $null }

    $selector = $null
    if ($PSBoundParameters.ContainsKey('SelectorOverride')) {
        $selector = $SelectorOverride
    } elseif ($null -ne $cfg -and $cfg.PSObject.Properties.Name -contains 'applyToSelector') {
        $selector = $cfg.applyToSelector
    }

    if (-not [string]::IsNullOrWhiteSpace($selector) -and $null -ne $cfg) {
        $family   = $cfg.fontFamily
        $fallback = if ($cfg.PSObject.Properties.Name -contains 'fallback') { $cfg.fallback } else { '' }
        $stack    = if ($fallback) { "'$family', $fallback" } else { "'$family'" }
        $css += "`r`n/* applyToSelector for this subscriber */`r`n" +
                "$selector { font-family: $stack; }`r`n"
    }
    return $css
}

# --------------------------------------------------------------------
# Line-ending normalization. Splicing component sources (LF) into a host
# file (usually CRLF) yields mixed EOLs and a huge EOL-only git diff in
# the subscriber repo -- which buries the real content change in any
# cross-repo sync PR. Detect the host file's dominant convention once
# (from its text as read, before splicing) and normalize the whole
# written file to it, so the only diff a subscriber sees is the actual
# content change. Idempotent: a file already uniform in its own
# convention re-writes byte-stable.
# --------------------------------------------------------------------

# Returns the dominant line ending of $Text: "`r`n" (CRLF) or "`n" (LF).
# CRLF wins ties -- the MindAttic subscriber files are Windows-authored.
function Get-DominantEol {
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    $lf     = ([regex]::Matches($Text, "`n")).Count
    $crlf   = ([regex]::Matches($Text, "`r`n")).Count
    $bareLf = $lf - $crlf
    if ($crlf -ge $bareLf) { return "`r`n" } else { return "`n" }
}

# Normalize every line ending in $Text to $Eol. Collapses to LF first so
# the result is uniform regardless of the input's mix.
function ConvertTo-Eol {
    param(
        [Parameter(Mandatory)][AllowEmptyString()][string]$Text,
        [Parameter(Mandatory)][string]$Eol
    )
    $lfText = $Text -replace "`r`n", "`n"
    if ($Eol -eq "`r`n") { return ($lfText -replace "`n", "`r`n") }
    return $lfText
}

# Build the body text for a `static-css` component (just the CSS file).
function Build-StaticCssBody {
    param(
        [Parameter(Mandatory)][PSCustomObject]$Component,
        [Parameter(Mandatory)][string]$ContentRoot,
        [System.Text.Encoding]$Encoding = [System.Text.UTF8Encoding]::new($false)
    )
    $cssPath = Join-Path $ContentRoot $Component.cssFile
    if (-not (Test-Path $cssPath)) { throw "$($Component.name): CSS file not found at $cssPath" }
    return [System.IO.File]::ReadAllText($cssPath, $Encoding)
}

