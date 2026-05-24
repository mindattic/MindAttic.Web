# ====================================================================
# _subscribers.ps1 - helper for reading subscribers.json
# ====================================================================
# Dot-source from any sync-*.ps1:
#
#   . (Join-Path $PSScriptRoot '_subscribers.ps1')
#   $sub = Get-Subscriber -Name 'Claudia' -ContentRoot $ContentRoot
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

# Escape characters that would terminate or interpolate a JS template
# literal when this CSS gets spliced into a build-html-js subscriber's <style>
# block. Only the build-html-js subscribers need this; mindattic.com inlines
# CSS into a plain <style> element where backticks and dollar-braces are
# inert.
#
# The backslash replacement MUST run first — otherwise the backslashes we
# emit while escaping `, ${, etc. get themselves double-escaped on the next
# pass. Backslash escaping is required because CSS routinely uses
# `content: '\276E'` style Unicode escapes; without doubling, Node parses
# the spliced template literal and rejects `\276` as an illegal octal escape.
function ConvertTo-JsTemplateLiteralSafe {
    param([Parameter(Mandatory, ValueFromPipeline)][string]$Text)
    process {
        return $Text.Replace('\', '\\').Replace('`', '\`').Replace('${', '\${')
    }
}
