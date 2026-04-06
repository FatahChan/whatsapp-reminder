# Creates github.com/<you>/whatsapp-reminder and pushes branch main.
# Run in PowerShell (interactive) — not in a headless CI shell.
# Prerequisite: gh auth login   OR   $env:GH_TOKEN = "ghp_..."

$ErrorActionPreference = "Stop"
$repo = "whatsapp-reminder"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $gh) {
	$candidates = @(
		"C:\Program Files\GitHub CLI\gh.exe",
		"${env:ProgramFiles(x86)}\GitHub CLI\gh.exe"
	)
	foreach ($c in $candidates) {
		if (Test-Path $c) {
			$gh = @{ Source = $c }
			break
		}
	}
}
if (-not $gh) {
	Write-Error "GitHub CLI (gh) not found. Install: winget install GitHub.cli"
}

$exe = if ($gh.Source) { $gh.Source } else { "gh" }

Write-Host "Using: $exe"
& $exe version

$auth = & $exe auth status 2>&1
if ($LASTEXITCODE -ne 0 -and -not $env:GH_TOKEN) {
	Write-Host @"

Not logged in. Do one of:
  1) Interactive:  gh auth login
  2) Token (PAT):   `$env:GH_TOKEN = 'ghp_your_token'; .\scripts\setup-github-repo.ps1

"@ -ForegroundColor Yellow
	exit 1
}

if (git remote get-url origin 2>$null) {
	Write-Host "Removing existing origin..."
	git remote remove origin
}

Write-Host "Creating repo $repo on GitHub and pushing main..."
& $exe repo create $repo --public --source=. --remote=origin --push --description "WhatsApp Reminder desktop app (Electrobun + React)"

$user = & $exe api user --jq .login
Write-Host "Done. Remote: https://github.com/$user/$repo"
if ((Get-Content (Join-Path $root package.json) -Raw) -match "YOUR_USERNAME") {
	Write-Host "Tip: set package.json repository.url to https://github.com/$user/$repo.git" -ForegroundColor Cyan
}
