# Run-CompleteAssessment.ps1
# Master script that runs the complete AD/Azure security assessment
# This script orchestrates all data collection and analysis tools
#
# BEGINNER'S GUIDE:
# 1. Place this entire folder on a domain-joined Windows computer
# 2. Download tools (see instructions below)
# 3. Right-click PowerShell and select "Run as Administrator"
# 4. Navigate to Scripts folder: cd C:\SecurityAssessment\Scripts
# 5. Run: .\Run-CompleteAssessment.ps1
# 6. Follow the on-screen prompts
# 7. Wait for completion (may take 30-90 minutes total)

param(
    [Parameter(HelpMessage="Organization name for reports")]
    [string]$OrganizationName = "",

    [Parameter(HelpMessage="Skip AD data collection")]
    [switch]$SkipAD = $false,

    [Parameter(HelpMessage="Skip Azure AD data collection")]
    [switch]$SkipAzureAD = $false,

    [Parameter(HelpMessage="Skip BloodHound collection")]
    [switch]$SkipBloodHound = $false,

    [Parameter(HelpMessage="Skip PingCastle scan")]
    [switch]$SkipPingCastle = $false
)

# === CONFIGURATION ===
$ErrorActionPreference = "Continue"  # Continue on errors to complete as much as possible
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$AssessmentRoot = Split-Path -Parent $ScriptRoot
$DataDir = Join-Path $AssessmentRoot "data"
$ToolsDir = Join-Path $AssessmentRoot "Tools"
$ThirdPartyDir = Join-Path $AssessmentRoot "ThirdParty"
$ReportDir = Join-Path $AssessmentRoot "reports"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$CurrentReportDir = Join-Path $ReportDir $Timestamp

# Create directories
New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
New-Item -ItemType Directory -Path $CurrentReportDir -Force | Out-Null
New-Item -ItemType Directory -Path "$DataDir\bloodhound" -Force | Out-Null

# === BANNER ===
Clear-Host
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "     AD/Azure Security Assessment - Complete Analysis" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will perform a comprehensive security assessment by:" -ForegroundColor Yellow
Write-Host "  [1] Collecting Active Directory data" -ForegroundColor White
Write-Host "  [2] Collecting Azure AD data (if available)" -ForegroundColor White
Write-Host "  [3] Running BloodHound analysis" -ForegroundColor White
Write-Host "  [4] Running PingCastle security scan" -ForegroundColor White
Write-Host "  [5] Analyzing all collected data" -ForegroundColor White
Write-Host "  [6] Generating executive dashboard" -ForegroundColor White
Write-Host ""
Write-Host "Total estimated time: 30-90 minutes" -ForegroundColor Yellow
Write-Host ""

# Get organization name if not provided
if ([string]::IsNullOrWhiteSpace($OrganizationName)) {
    $OrganizationName = Read-Host "Enter your organization name"
    if ([string]::IsNullOrWhiteSpace($OrganizationName)) {
        Write-Host "ERROR: Organization name is required" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Organization: $OrganizationName" -ForegroundColor Cyan
Write-Host "Output Directory: $CurrentReportDir`n" -ForegroundColor Cyan

# === PREREQUISITES CHECK ===
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  Step 1: Checking Prerequisites" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

$prereqErrors = 0

# Check for Bun (required for assessment tools)
Write-Host "[1/4] Checking for Bun runtime..." -ForegroundColor Yellow
$bunPath = Get-Command bun -ErrorAction SilentlyContinue
if ($bunPath) {
    $bunVersion = & bun --version
    Write-Host "  SUCCESS: Bun $bunVersion found" -ForegroundColor Green
} else {
    Write-Host "  ERROR: Bun runtime not found!" -ForegroundColor Red
    Write-Host "  Install from: https://bun.sh" -ForegroundColor Yellow
    Write-Host "  Or run: powershell -c `"irm bun.sh/install.ps1|iex`"`n" -ForegroundColor Gray
    $prereqErrors++
}

# Check for AD PowerShell module (required for AD assessment)
Write-Host "[2/4] Checking for Active Directory PowerShell module..." -ForegroundColor Yellow
if (Get-Module -ListAvailable -Name ActiveDirectory) {
    Write-Host "  SUCCESS: Active Directory module found" -ForegroundColor Green
} else {
    Write-Host "  WARNING: Active Directory module not found" -ForegroundColor Yellow
    Write-Host "  AD assessment will be skipped" -ForegroundColor Gray
    $SkipAD = $true
}

# Check for Microsoft Graph module (required for Azure AD assessment)
Write-Host "[3/4] Checking for Microsoft Graph PowerShell module..." -ForegroundColor Yellow
if (Get-Module -ListAvailable -Name Microsoft.Graph) {
    Write-Host "  SUCCESS: Microsoft Graph module found" -ForegroundColor Green
} else {
    Write-Host "  WARNING: Microsoft Graph module not found" -ForegroundColor Yellow
    Write-Host "  Azure AD assessment will be skipped" -ForegroundColor Gray
    Write-Host "  To install: Install-Module Microsoft.Graph -Scope CurrentUser" -ForegroundColor Gray
    $SkipAzureAD = $true
}

# Check for third-party tools
Write-Host "[4/4] Checking for third-party security tools..." -ForegroundColor Yellow

$sharpHoundPath = Join-Path $ThirdPartyDir "SharpHound.exe"
$pingCastlePath = Join-Path $ThirdPartyDir "PingCastle.exe"

if (Test-Path $sharpHoundPath) {
    Write-Host "  SUCCESS: BloodHound (SharpHound.exe) found" -ForegroundColor Green
} else {
    Write-Host "  WARNING: SharpHound.exe not found at $sharpHoundPath" -ForegroundColor Yellow
    Write-Host "  BloodHound analysis will be skipped" -ForegroundColor Gray
    Write-Host "  Download from: https://github.com/SpecterOps/BloodHound/releases" -ForegroundColor Gray
    $SkipBloodHound = $true
}

if (Test-Path $pingCastlePath) {
    Write-Host "  SUCCESS: PingCastle.exe found" -ForegroundColor Green
} else {
    Write-Host "  WARNING: PingCastle.exe not found at $pingCastlePath" -ForegroundColor Yellow
    Write-Host "  PingCastle scan will be skipped" -ForegroundColor Gray
    Write-Host "  Download from: https://www.pingcastle.com/download/" -ForegroundColor Gray
    $SkipPingCastle = $true
}

if ($prereqErrors -gt 0) {
    Write-Host "`nERROR: Cannot proceed due to missing prerequisites" -ForegroundColor Red
    Write-Host "Please install required software and try again`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nPress any key to begin assessment..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# === PHASE 1: DATA COLLECTION ===
Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "  Phase 1: Data Collection" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

$collectedData = @{
    adConfig = $null
    adIdentity = $null
    azureAD = $null
    bloodhound = $null
    pingcastle = $null
}

# Collect AD Data
if (-not $SkipAD) {
    Write-Host "[1/4] Collecting Active Directory Data..." -ForegroundColor Cyan
    Write-Host "This may take 5-30 minutes depending on domain size`n" -ForegroundColor Yellow

    try {
        $adScript = Join-Path $ScriptRoot "Export-ADData.ps1"
        & $adScript -OutputPath $DataDir -IncludeACLs

        if (Test-Path "$DataDir\ad-config.json") {
            $collectedData.adConfig = "$DataDir\ad-config.json"
            Write-Host "SUCCESS: AD configuration data collected`n" -ForegroundColor Green
        }

        if (Test-Path "$DataDir\ad-identity.json") {
            $collectedData.adIdentity = "$DataDir\ad-identity.json"
            Write-Host "SUCCESS: AD identity data collected`n" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "ERROR: AD data collection failed: $($_.Exception.Message)`n" -ForegroundColor Red
    }
} else {
    Write-Host "[1/4] Skipping Active Directory data collection`n" -ForegroundColor Gray
}

# Collect Azure AD Data
if (-not $SkipAzureAD) {
    Write-Host "[2/4] Collecting Azure AD Data..." -ForegroundColor Cyan
    Write-Host "You will be prompted to sign in with Global Reader or Security Reader account" -ForegroundColor Yellow
    Write-Host "This may take 10-45 minutes depending on tenant size`n" -ForegroundColor Yellow

    try {
        $azureScript = Join-Path $ScriptRoot "Export-AzureADData.ps1"
        & $azureScript -OutputPath $DataDir

        if (Test-Path "$DataDir\azure-ad.json") {
            $collectedData.azureAD = "$DataDir\azure-ad.json"
            Write-Host "SUCCESS: Azure AD data collected`n" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "ERROR: Azure AD data collection failed: $($_.Exception.Message)`n" -ForegroundColor Red
    }
} else {
    Write-Host "[2/4] Skipping Azure AD data collection`n" -ForegroundColor Gray
}

# Run BloodHound
if (-not $SkipBloodHound) {
    Write-Host "[3/4] Running BloodHound Analysis..." -ForegroundColor Cyan
    Write-Host "Collecting attack path data with SharpHound" -ForegroundColor Yellow
    Write-Host "This may take 5-20 minutes`n" -ForegroundColor Yellow

    try {
        Push-Location "$DataDir\bloodhound"
        $domain = (Get-ADDomain).DNSRoot

        Write-Host "  Executing: SharpHound.exe -c All -d $domain" -ForegroundColor Gray
        & $sharpHoundPath -c All -d $domain --outputdirectory "$DataDir\bloodhound"

        # Find the generated zip file
        $bhZip = Get-ChildItem "$DataDir\bloodhound" -Filter "*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

        if ($bhZip) {
            Write-Host "  Extracting BloodHound data..." -ForegroundColor Gray
            Expand-Archive -Path $bhZip.FullName -DestinationPath "$DataDir\bloodhound" -Force
            $collectedData.bloodhound = "$DataDir\bloodhound"
            Write-Host "SUCCESS: BloodHound data collected`n" -ForegroundColor Green
        }

        Pop-Location
    }
    catch {
        Pop-Location
        Write-Host "ERROR: BloodHound collection failed: $($_.Exception.Message)`n" -ForegroundColor Red
    }
} else {
    Write-Host "[3/4] Skipping BloodHound analysis`n" -ForegroundColor Gray
}

# Run PingCastle
if (-not $SkipPingCastle) {
    Write-Host "[4/4] Running PingCastle Security Scan..." -ForegroundColor Cyan
    Write-Host "Performing comprehensive domain security analysis" -ForegroundColor Yellow
    Write-Host "This may take 5-15 minutes`n" -ForegroundColor Yellow

    try {
        Push-Location $DataDir
        $domain = (Get-ADDomain).DNSRoot
        $dc = (Get-ADDomainController).HostName

        Write-Host "  Executing: PingCastle.exe --healthcheck --server $dc" -ForegroundColor Gray
        & $pingCastlePath --healthcheck --server $dc

        # Find the generated report
        $pcReport = Get-ChildItem $DataDir -Filter "ad_hc_*.xml" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

        if ($pcReport) {
            $collectedData.pingcastle = $pcReport.FullName
            Write-Host "SUCCESS: PingCastle report generated`n" -ForegroundColor Green
        }

        Pop-Location
    }
    catch {
        Pop-Location
        Write-Host "ERROR: PingCastle scan failed: $($_.Exception.Message)`n" -ForegroundColor Red
    }
} else {
    Write-Host "[4/4] Skipping PingCastle scan`n" -ForegroundColor Gray
}

# === PHASE 2: ANALYSIS ===
Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "  Phase 2: Security Analysis" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Analyzing collected data and generating findings..." -ForegroundColor Cyan
Write-Host "This may take 2-5 minutes`n" -ForegroundColor Yellow

# Build command arguments
$assessmentCmd = "bun run `"$ToolsDir\RunFullAssessment.ts`""
$assessmentArgs = @("--org", "`"$OrganizationName`"", "--output", "`"$CurrentReportDir`"")

if ($collectedData.adConfig) {
    $assessmentArgs += @("--ad-config", "`"$($collectedData.adConfig)`"")
}

if ($collectedData.adIdentity) {
    $assessmentArgs += @("--identity", "`"$($collectedData.adIdentity)`"")
}

if ($collectedData.azureAD) {
    $assessmentArgs += @("--azure", "`"$($collectedData.azureAD)`"")
}

if ($collectedData.bloodhound) {
    $assessmentArgs += @("--bloodhound", "`"$($collectedData.bloodhound)`"")
}

if ($collectedData.pingcastle) {
    $assessmentArgs += @("--pingcastle", "`"$($collectedData.pingcastle)`"")
}

try {
    $fullCommand = "$assessmentCmd $($assessmentArgs -join ' ')"
    Write-Host "  Executing assessment..." -ForegroundColor Gray
    Invoke-Expression $fullCommand

    Write-Host "SUCCESS: Analysis complete`n" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Analysis failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# === COMPLETION ===
Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "  Assessment Complete!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Results Location:" -ForegroundColor Cyan
Write-Host "  $CurrentReportDir`n" -ForegroundColor White

Write-Host "Generated Reports:" -ForegroundColor Cyan
if (Test-Path "$CurrentReportDir\executive-report.html") {
    Write-Host "  executive-report.html  (Executive Dashboard)" -ForegroundColor Green
} else {
    Write-Host "  executive-report.html  (NOT FOUND)" -ForegroundColor Red
}

$reportFiles = Get-ChildItem $CurrentReportDir -Filter "report-*.txt"
foreach ($report in $reportFiles) {
    Write-Host "  $($report.Name)" -ForegroundColor White
}

Write-Host ""
Write-Host "Data Files:" -ForegroundColor Cyan
Write-Host "  $DataDir`n" -ForegroundColor White

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  [1] Open the executive dashboard in your browser:" -ForegroundColor White
Write-Host "      $CurrentReportDir\executive-report.html`n" -ForegroundColor Gray

Write-Host "  [2] Review detailed findings in report-*.txt files`n" -ForegroundColor White

Write-Host "  [3] Consult remediation guides:" -ForegroundColor White
Write-Host "      $AssessmentRoot\Findings\ADFindings.md" -ForegroundColor Gray
Write-Host "      $AssessmentRoot\Findings\AzureFindings.md`n" -ForegroundColor Gray

Write-Host "  [4] IMPORTANT: Securely delete sensitive data when done:" -ForegroundColor White
Write-Host "      Remove-Item -Recurse -Force $DataDir" -ForegroundColor Red
Write-Host "      cipher /w:$DataDir`n" -ForegroundColor Red

# Offer to open dashboard
$openDashboard = Read-Host "Open executive dashboard now? (Y/N)"
if ($openDashboard -eq "Y" -or $openDashboard -eq "y") {
    if (Test-Path "$CurrentReportDir\executive-report.html") {
        Start-Process "$CurrentReportDir\executive-report.html"
    } else {
        Write-Host "ERROR: Dashboard file not found" -ForegroundColor Red
    }
}

Write-Host "`nAssessment completed at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host ""
