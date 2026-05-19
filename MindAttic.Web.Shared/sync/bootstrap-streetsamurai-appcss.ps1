# One-shot: replace app.css lines 1079..1803 (the CBG block) with the marker pair.
# After this runs, sync-streetsamurai.ps1 can keep the block in sync.
# Uses UTF-8 reading to preserve non-ASCII characters elsewhere in the file.
$src = 'D:/Projects/MindAttic/StreetSamurai/v3/StreetSamurai.Blazor/wwwroot/app.css'

$utf8 = [System.Text.UTF8Encoding]::new($false)
$text = [System.IO.File]::ReadAllText($src, $utf8)
$lines = $text -split "`r?`n"

# Replace 1079..1803 (1-based) -> indexes 1078..1802 with marker placeholder
$before = $lines[0..1077]
$after  = $lines[1803..($lines.Count - 1)]

$placeholder = @(
    '/* == BEGIN MINDATTIC.SHARED:CBG.CSS == */',
    '/* MindAttic.Shared rewrites this block. Do not hand-edit. */',
    '/* == END MINDATTIC.SHARED:CBG.CSS == */'
)
$new = ($before + $placeholder + $after) -join "`r`n"
[System.IO.File]::WriteAllText($src, $new, $utf8)
Write-Output "Replaced CBG block in $src with marker pair"
