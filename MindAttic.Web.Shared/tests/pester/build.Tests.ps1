# Pester tests for build.ps1 (standalone vendoring build).
#   Invoke-Pester -Path tests/pester        (from the repo root; Pester 5+)
BeforeAll {
    $script:repo  = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
    $script:build = Join-Path $script:repo 'build.ps1'

    function Get-TreeHashes([string]$dir) {
        $base = (Resolve-Path $dir).Path
        Get-ChildItem -Path $base -Recurse -File | Sort-Object FullName | ForEach-Object {
            '{0}|{1}' -f $_.FullName.Substring($base.Length).TrimStart('\', '/'), (Get-FileHash $_.FullName -Algorithm SHA256).Hash
        }
    }
}

Describe 'build.ps1 -Output standalone' {
    BeforeEach {
        $script:out = Join-Path ([IO.Path]::GetTempPath()) ("uiux-build-" + [guid]::NewGuid().ToString('N'))
    }
    AfterEach {
        if (Test-Path $script:out) { Remove-Item -Recurse -Force $script:out }
    }

    It 'does not depend on an Ideas/ folder' {
        Test-Path (Join-Path $script:repo 'Ideas') | Should -BeFalse
        { & $script:build -Build OutfitFont -Output standalone -Out $script:out } | Should -Not -Throw
    }

    It 'copies a component folder verbatim' {
        & $script:build -Build OutfitFont -Output standalone -Out $script:out | Out-Null
        $expected = Get-TreeHashes (Join-Path $script:repo 'Components\OutfitFont')
        (Get-TreeHashes $script:out) | Should -Be $expected
    }

    It 'copies subfolders (Cyberspace assets) with -Kind Component' {
        & $script:build -Build Cyberspace -Kind Component -Out $script:out | Out-Null
        Test-Path (Join-Path $script:out 'assets\circuitboard.00.png') | Should -BeTrue
        (Get-TreeHashes $script:out) | Should -Be (Get-TreeHashes (Join-Path $script:repo 'Components\Cyberspace'))
    }

    It 'builds a theme with -Kind Theme' {
        & $script:build -Build Cyberspace -Kind Theme -Out $script:out | Out-Null
        (Get-TreeHashes $script:out) | Should -Be (Get-TreeHashes (Join-Path $script:repo 'Themes\Cyberspace'))
    }

    It 'is idempotent' {
        & $script:build -Build OutfitFont -Out $script:out | Out-Null
        $first = Get-TreeHashes $script:out
        & $script:build -Build OutfitFont -Out $script:out | Out-Null
        (Get-TreeHashes $script:out) | Should -Be $first
    }

    It 'rejects a name that is both a component and a theme without -Kind' {
        { & $script:build -Build Cyberspace -Out $script:out } | Should -Throw '*Ambiguous*'
    }

    It 'rejects an unknown name and lists what exists' {
        { & $script:build -Build NoSuchThing -Out $script:out } | Should -Throw '*Components/OutfitFont*'
    }

    It 'rejects removed outputs' {
        { & $script:build -Build OutfitFont -Output idea -Out $script:out } | Should -Throw
    }
}
