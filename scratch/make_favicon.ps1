Add-Type -AssemblyName System.Drawing
$imgPath = "d:\Projects\Bricks\Elyon logo.jpeg"
$img = [System.Drawing.Bitmap]::FromFile($imgPath)

for ($x = 0; $x -lt $img.Width; $x++) {
    for ($y = 0; $y -lt $img.Height; $y++) {
        $p = $img.GetPixel($x, $y)
        if ($p.R -gt 215 -and $p.G -gt 215 -and $p.B -gt 215) {
            $img.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        }
    }
}

$img.Save("d:\Projects\Bricks\public\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$img.Save("d:\Projects\Bricks\public\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$img.Save("d:\Projects\Bricks\app\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
Write-Host "Transparent favicons successfully created!"
