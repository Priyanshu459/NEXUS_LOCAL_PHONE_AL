Add-Type -AssemblyName System.Drawing
$destPath = 'c:\Dev\moonligth_ai_nexus\NEXUS_LOCAL_PHONE_AL\feature_graphic_stitch.png'
$width = 1024
$height = 500

$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 25, 25, 30))
$g.FillRectangle($bgBrush, 0, 0, $width, $height)
$bgBrush.Dispose()

$cardX = 132
$cardY = 90
$cardW = 760
$cardH = 320
$radius = 24

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc($cardX, $cardY, ($radius*2), ($radius*2), 180, 90)
$path.AddArc(($cardX + $cardW - ($radius*2)), $cardY, ($radius*2), ($radius*2), 270, 90)
$path.AddArc(($cardX + $cardW - ($radius*2)), ($cardY + $cardH - ($radius*2)), ($radius*2), ($radius*2), 0, 90)
$path.AddArc($cardX, ($cardY + $cardH - ($radius*2)), ($radius*2), ($radius*2), 90, 90)
$path.CloseFigure()

$cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 255, 255, 255))
$g.FillPath($cardBrush, $path)
$cardPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(30, 255, 255, 255), 1)
$g.DrawPath($cardPen, $path)

$iconX = $cardX + 64
$iconY = $cardY + (($cardH - 180) / 2)
$iconW = 180
$iconH = 180
$iconRadius = 36
$iconPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$iconPath.AddArc($iconX, $iconY, ($iconRadius*2), ($iconRadius*2), 180, 90)
$iconPath.AddArc(($iconX + $iconW - ($iconRadius*2)), $iconY, ($iconRadius*2), ($iconRadius*2), 270, 90)
$iconPath.AddArc(($iconX + $iconW - ($iconRadius*2)), ($iconY + $iconH - ($iconRadius*2)), ($iconRadius*2), ($iconRadius*2), 0, 90)
$iconPath.AddArc($iconX, ($iconY + $iconH - ($iconRadius*2)), ($iconRadius*2), ($iconRadius*2), 90, 90)
$iconPath.CloseFigure()

$iconBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.FillPath($iconBrush, $iconPath)

$logoImg = [System.Drawing.Image]::FromFile('c:\Dev\moonligth_ai_nexus\NEXUS_LOCAL_PHONE_AL\src\assets\branding\moon-brand-dark.png')
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($logoImg, ($iconX + 30), ($iconY + 30), 120, 120)
$logoImg.Dispose()

$font1 = New-Object System.Drawing.Font("Segoe UI", 48, [System.Drawing.FontStyle]::Bold)
$font2 = New-Object System.Drawing.Font("Segoe UI", 20, [System.Drawing.FontStyle]::Regular)
$textBrush1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$textBrush2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 200, 200, 200))

$textX = $iconX + $iconW + 48
$textY = $cardY + 80
$g.DrawString("Moonlight AI", $font1, $textBrush1, [float]$textX, [float]$textY)
$g.DrawString("Private, on-device workspace", $font2, $textBrush2, [float]$textX, [float]($textY + 85))

$font1.Dispose()
$font2.Dispose()
$textBrush1.Dispose()
$textBrush2.Dispose()
$cardBrush.Dispose()
$cardPen.Dispose()
$iconBrush.Dispose()
$path.Dispose()
$iconPath.Dispose()
$g.Dispose()
$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
