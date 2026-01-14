# Helper script to install Node.js LTS on Windows
# Tries winget first, then Chocolatey (choco), otherwise prints manual instructions.
# Run as Administrator if installing via choco.

param(
    [switch]$Force
)

function Has-Command($cmd) {
    $null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)
}

if (Has-Command "node" -and -not $Force) {
    Write-Host "Node is already installed:" (node -v)
    exit 0
}

if (Has-Command "winget") {
    Write-Host "Installing Node.js LTS via winget..."
    winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
    if (Has-Command "node") { Write-Host "Node installed:" (node -v); exit 0 }
}

if (Has-Command "choco") {
    Write-Host "Installing Node.js LTS via Chocolatey..."
    choco install nodejs-lts -y
    if (Has-Command "node") { Write-Host "Node installed:" (node -v); exit 0 }
}

Write-Host "Automatic installation failed or package manager not available."
Write-Host "Please install Node.js LTS manually from: https://nodejs.org/en/download/"
Write-Host "After installing, open a NEW PowerShell window and run the following in the project folder:"
Write-Host "  cd \"$PWD\"\n  npm install\n  npm run dev"

exit 1
