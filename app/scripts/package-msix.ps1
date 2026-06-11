param(
    [string]$Configuration = "Release",
    [string]$Runtime = "win-x64",
    [string]$Version = "0.1.0.0",
    [switch]$Unsigned,
    [switch]$TrustCertificate
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

function Write-VolunCoreLog {
    param([Parameter(Mandatory = $true)][string]$Message)
    Write-Host "[VolunCore MSIX] $Message"
}

function Resolve-RepoRoot {
    $scriptPath = $PSScriptRoot
    return (Resolve-Path (Join-Path $scriptPath "..")).Path
}

function Assert-ChildPath {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Parent
    )

    $fullParent = [System.IO.Path]::GetFullPath($Parent).TrimEnd('\') + '\'
    $fullPath = [System.IO.Path]::GetFullPath($Path).TrimEnd('\') + '\'

    if (-not $fullPath.StartsWith($fullParent, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to modify path outside repo output folder: $fullPath"
    }
}

function Find-WindowsKitTool {
    param([Parameter(Mandatory = $true)][string]$ToolName)

    $kitsRoot = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin"
    if (-not (Test-Path $kitsRoot)) {
        throw "Windows SDK bin folder was not found. Install the Windows SDK to get $ToolName."
    }

    $tool = Get-ChildItem -Path $kitsRoot -Recurse -Filter $ToolName |
        Where-Object { $_.FullName -match "\\x64\\$([regex]::Escape($ToolName))$" } |
        Sort-Object FullName -Descending |
        Select-Object -First 1

    if (-not $tool) {
        throw "$ToolName was not found under $kitsRoot."
    }

    return $tool.FullName
}

function Invoke-VolunCoreCommand {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [switch]$AllowFailure
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        if ($AllowFailure) {
            return $LASTEXITCODE
        }

        throw "Command failed with exit code ${LASTEXITCODE}: $FilePath $($Arguments -join ' ')"
    }

    if ($AllowFailure) {
        return 0
    }
}

function Copy-CleanDirectory {
    param(
        [Parameter(Mandatory = $true)][string]$Source,
        [Parameter(Mandatory = $true)][string]$Destination,
        [Parameter(Mandatory = $true)][string]$AllowedRoot
    )

    Assert-ChildPath -Path $Destination -Parent $AllowedRoot

    if (Test-Path $Destination) {
        Remove-Item -LiteralPath $Destination -Recurse -Force
    }

    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    Copy-Item -Path (Join-Path $Source "*") -Destination $Destination -Recurse -Force
}

$repoRoot = Resolve-RepoRoot
$outputsRoot = Join-Path $repoRoot "outputs"
$msixRoot = Join-Path $outputsRoot "msix"
$publishDir = Join-Path $msixRoot "publish"
$packageDir = Join-Path $msixRoot "package"
$webDistDir = Join-Path $repoRoot "dist"
$windowsProject = Join-Path $repoRoot "windows\VolunCore.Desktop\VolunCore.Desktop.csproj"
$manifestTemplate = Join-Path $repoRoot "windows\VolunCore.Desktop\Package\AppxManifest.xml"
$msixAssetsDir = Join-Path $repoRoot "windows\VolunCore.Desktop\MsixAssets"
$desktopAssetsDir = Join-Path $repoRoot "windows\VolunCore.Desktop\Assets"
$packageSuffix = if ($Unsigned) { "unsigned" } else { "signed" }
$msixPath = Join-Path $outputsRoot "VulanCore_${Version}_x64_${packageSuffix}.msix"
$certPath = Join-Path $msixRoot "VolunCore-TestCertificate.cer"

New-Item -ItemType Directory -Path $outputsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $msixRoot -Force | Out-Null
Assert-ChildPath -Path $publishDir -Parent $outputsRoot
Assert-ChildPath -Path $packageDir -Parent $outputsRoot

Write-VolunCoreLog "Building React assets."
Invoke-VolunCoreCommand -FilePath "npm.cmd" -Arguments @("run", "build")

Write-VolunCoreLog "Publishing Windows desktop host."
Invoke-VolunCoreCommand -FilePath "dotnet" -Arguments @(
    "publish",
    $windowsProject,
    "-c",
    $Configuration,
    "-r",
    $Runtime,
    "--self-contained",
    "true",
    "-p:PublishSingleFile=false",
    "-o",
    $publishDir
)

Write-VolunCoreLog "Preparing MSIX package layout."
Copy-CleanDirectory -Source $publishDir -Destination $packageDir -AllowedRoot $outputsRoot
Copy-CleanDirectory -Source $webDistDir -Destination (Join-Path $packageDir "WebApp") -AllowedRoot $outputsRoot

$packageAssetsDir = Join-Path $packageDir "Assets"
New-Item -ItemType Directory -Path $packageAssetsDir -Force | Out-Null
Copy-Item -Path (Join-Path $msixAssetsDir "*") -Destination $packageAssetsDir -Recurse -Force
Copy-Item -Path (Join-Path $desktopAssetsDir "VolunCore.ico") -Destination $packageAssetsDir -Force
Copy-Item -Path $manifestTemplate -Destination (Join-Path $packageDir "AppxManifest.xml") -Force

if (Test-Path $msixPath) {
    Remove-Item -LiteralPath $msixPath -Force
}

$makeAppx = Find-WindowsKitTool -ToolName "makeappx.exe"

Write-VolunCoreLog "Packing MSIX."
Invoke-VolunCoreCommand -FilePath $makeAppx -Arguments @("pack", "/d", $packageDir, "/p", $msixPath, "/o")

if ($Unsigned) {
    Write-VolunCoreLog "Created unsigned package: $msixPath"
    return
}

$signtool = Find-WindowsKitTool -ToolName "signtool.exe"

Write-VolunCoreLog "Creating or reusing local signing certificate."
$publisher = "CN=8D5E8299-C1EE-4376-8783-93E12C1B1BC"
$cert = Get-ChildItem Cert:\CurrentUser\My |
    Where-Object { $_.Subject -eq $publisher -and $_.HasPrivateKey } |
    Sort-Object NotAfter -Descending |
    Select-Object -First 1

if (-not $cert) {
    $cert = New-SelfSignedCertificate `
        -Type Custom `
        -Subject $publisher `
        -KeyUsage DigitalSignature `
        -FriendlyName "VolunCore MSIX Local Test Certificate" `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3")
}

Export-Certificate -Cert $cert -FilePath $certPath -Force | Out-Null

if ($TrustCertificate) {
    Write-VolunCoreLog "Trusting local certificate for current Windows user."
    Import-Certificate -FilePath $certPath -CertStoreLocation "Cert:\CurrentUser\TrustedPeople" | Out-Null
}

Write-VolunCoreLog "Signing MSIX."
Invoke-VolunCoreCommand -FilePath $signtool -Arguments @("sign", "/fd", "SHA256", "/sha1", "$($cert.Thumbprint)", $msixPath)

Write-VolunCoreLog "Verifying MSIX signature."
$verifyExitCode = Invoke-VolunCoreCommand -FilePath $signtool -Arguments @("verify", "/pa", "/v", $msixPath) -AllowFailure
if ($verifyExitCode -ne 0) {
    Write-VolunCoreLog "Signature is present, but Windows did not fully trust the local test certificate chain."
    Write-VolunCoreLog "For sideloading, keep the exported certificate and trust it on the target machine."
}

Write-VolunCoreLog "Created package: $msixPath"
Write-VolunCoreLog "Certificate: $certPath"
