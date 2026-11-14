# Renders the Chrome Web Store images from art.html with headless Microsoft Edge.
# Serve the repository root first:  python -m http.server 5178
$ErrorActionPreference = 'Stop'
$edge = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) { throw 'Microsoft Edge or Google Chrome is required.' }

$out = Join-Path $PSScriptRoot 'out'
New-Item -ItemType Directory -Force $out | Out-Null
$base = 'http://localhost:5178/store/art/art.html'

$jobs = @(
  @{ name = 'screenshot-1.png'; v = 'shot1';   size = '1280,800'; scale = 1 },
  @{ name = 'screenshot-2.png'; v = 'shot2';   size = '1280,800'; scale = 1 },
  @{ name = 'screenshot-3.png'; v = 'shot3';   size = '1280,800'; scale = 1 },
  @{ name = 'screenshot-4.png'; v = 'shot4';   size = '1280,800'; scale = 1 },
  @{ name = 'promo-small.png';  v = 'promo';   size = '880,560';  scale = 0.5 },
  @{ name = 'promo-marquee.png'; v = 'marquee'; size = '1400,560'; scale = 1 }
)

foreach ($job in $jobs) {
  $file = Join-Path $out $job.name
  if (Test-Path $file) { Remove-Item $file }
  $profile = Join-Path $env:TEMP ("store-art-" + [guid]::NewGuid())
  $args = @('--headless=new', '--disable-gpu', '--hide-scrollbars', "--force-device-scale-factor=$($job.scale)",
            '--virtual-time-budget=6000', "--window-size=$($job.size)", "--user-data-dir=$profile",
            "--screenshot=$file", "$base`?v=$($job.v)")
  Start-Process -FilePath $edge -ArgumentList $args -Wait -WindowStyle Hidden
  Remove-Item -Recurse -Force $profile -ErrorAction SilentlyContinue
  if (Test-Path $file) {
    $bytes = [IO.File]::ReadAllBytes($file)
    $w = [BitConverter]::ToInt32([byte[]]($bytes[19], $bytes[18], $bytes[17], $bytes[16]), 0)
    $h = [BitConverter]::ToInt32([byte[]]($bytes[23], $bytes[22], $bytes[21], $bytes[20]), 0)
    Write-Host ("{0,-20} {1}x{2}" -f $job.name, $w, $h)
  } else {
    Write-Warning "$($job.name) was not created"
  }
}
