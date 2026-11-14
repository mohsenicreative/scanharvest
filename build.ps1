# Builds dist\ScanHarvest.zip (same layout as the GitHub release) and syncs the guide's shared assets.
# Usage:  pwsh -File build.ps1
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$ext = Join-Path $root 'extension'
$dist = Join-Path $root 'dist'

# The guide page (docs/) reuses the extension's icons and flags.
Copy-Item (Join-Path $ext 'icons.js'), (Join-Path $ext 'flags.js') (Join-Path $root 'docs/assets') -Force

node (Join-Path $root 'tools/check.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Consistency checks failed.' }

New-Item -ItemType Directory -Force $dist | Out-Null
$staging = Join-Path $dist 'ScanHarvest'
if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }
Copy-Item $ext $staging -Recurse
Copy-Item (Join-Path $root 'LICENSE'), (Join-Path $root 'THIRD_PARTY_NOTICES.md') $staging

$zip = Join-Path $dist 'ScanHarvest.zip'
if (Test-Path $zip) { Remove-Item -Force $zip }
Compress-Archive -Path $staging -DestinationPath $zip   # one top-level "ScanHarvest" folder (Load unpacked)

# Chrome Web Store / Edge Add-ons need manifest.json at the root of the zip.
$store = Join-Path $dist 'ScanHarvest-webstore.zip'
if (Test-Path $store) { Remove-Item -Force $store }
Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $store

# Firefox Add-ons (AMO): same code, Firefox manifest.
$fxStaging = Join-Path $dist 'ScanHarvest-firefox'
if (Test-Path $fxStaging) { Remove-Item -Recurse -Force $fxStaging }
Copy-Item $staging $fxStaging -Recurse
node (Join-Path $root 'tools/firefox-manifest.mjs') $fxStaging | Out-Null
$firefox = Join-Path $dist 'ScanHarvest-firefox.zip'
if (Test-Path $firefox) { Remove-Item -Force $firefox }
Compress-Archive -Path (Join-Path $fxStaging '*') -DestinationPath $firefox
Remove-Item -Recurse -Force $staging, $fxStaging

$version = (Get-Content (Join-Path $ext 'manifest.json') -Raw | ConvertFrom-Json).version
Write-Host "Built v$version"
Write-Host "  $zip            (students: extract + Load unpacked)"
Write-Host "  $store   (upload to Chrome Web Store / Edge Add-ons)"
Write-Host "  $firefox   (upload to addons.mozilla.org)"
