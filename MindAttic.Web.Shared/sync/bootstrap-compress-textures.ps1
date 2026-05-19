# One-shot: re-encode the 3 circuitboard PNGs from StreetSamurai as low-quality
# JPEGs and place them in MindAttic.Shared/frontpage/assets/. The textures
# tile at 0.008..0.015 opacity, so heavy JPEG compression is visually
# invisible.
#
# Re-run this only when the upstream PNGs in StreetSamurai change.
[CmdletBinding()]
param(
    [string]$SourceDir = 'D:/Projects/MindAttic/StreetSamurai/engine/data/media',
    [string]$DestDir   = 'D:/Projects/MindAttic/MindAttic.Shared/frontpage/assets',
    [int]$Quality      = 30
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$names = @('circuitboard.00', 'circuitboard.01', 'circuitboard.02')

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
             Where-Object { $_.FormatID -eq [System.Drawing.Imaging.ImageFormat]::Jpeg.Guid }

foreach ($n in $names) {
    $src = Join-Path $SourceDir ($n + '.png')
    $dst = Join-Path $DestDir   ($n + '.jpg')
    if (-not (Test-Path $src)) { throw "Source not found: $src" }

    $img = [System.Drawing.Image]::FromFile($src)
    try {
        $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
            [System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)
        $img.Save($dst, $jpegCodec, $params)
    } finally {
        $img.Dispose()
    }

    $srcKb = [math]::Round((Get-Item $src).Length / 1024, 1)
    $dstKb = [math]::Round((Get-Item $dst).Length / 1024, 1)
    Write-Output "  $n.png ($srcKb KB)  ->  $n.jpg ($dstKb KB)"
}
Write-Output "Compressed textures written to $DestDir"
