# Builds dist\MegascansClaimer.zip (same layout as the GitHub release) and syncs the guide's shared assets.
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
$staging = Join-Path $dist 'MegascansClaimer'
if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }
Copy-Item $ext $staging -Recurse
Copy-Item (Join-Path $root 'LICENSE'), (Join-Path $root 'THIRD_PARTY_NOTICES.md') $staging

$zip = Join-Path $dist 'MegascansClaimer.zip'
if (Test-Path $zip) { Remove-Item -Force $zip }
Compress-Archive -Path $staging -DestinationPath $zip   # one top-level "MegascansClaimer" folder
Remove-Item -Recurse -Force $staging

$version = (Get-Content (Join-Path $ext 'manifest.json') -Raw | ConvertFrom-Json).version
Write-Host "Built $zip (v$version)"
