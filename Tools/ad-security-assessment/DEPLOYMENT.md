# Deployment Guide: Standalone AD/Azure Security Assessment

This guide explains how to deploy and run the security assessment tool on a domain-connected Windows machine without PAI.

## Quick Start

### For Windows Domain-Joined Machines

1. **Copy this entire directory to your Windows machine**
   ```
   C:\SecurityAssessment\
   ```

2. **Install prerequisites** (one-time setup):
   - Install Bun runtime
   - Install PowerShell AD module
   - Optionally install Microsoft Graph PowerShell

3. **Run data collection** (PowerShell as Administrator):
   ```powershell
   cd C:\SecurityAssessment\Scripts
   .\Export-ADData.ps1 -OutputPath C:\SecurityAssessment\data
   .\Export-AzureADData.ps1 -OutputPath C:\SecurityAssessment\data
   ```

4. **Run assessment**:
   ```batch
   Scripts\assess.bat
   ```
   Or with WSL/Git Bash:
   ```bash
   bash Scripts/assess-standalone.sh
   ```

5. **View results**:
   - Open `reports/[timestamp]/executive-report.html` in browser

---

## Detailed Setup

### Prerequisites

#### Required
- **Windows 10/11** or **Windows Server 2016+**
- **Domain-joined** machine (for AD data collection)
- **Domain Admin** or equivalent permissions
- **Bun runtime** (for assessment execution)

#### Optional
- **WSL** or **Git Bash** (for running Bash scripts)
- **Microsoft Graph PowerShell** (for Azure AD data)
- **BloodHound** (for attack path analysis)
- **PingCastle** (for risk scoring)

### Step 1: Install Bun Runtime

#### On Windows (PowerShell):
```powershell
powershell -c "irm bun.sh/install.ps1|iex"
```

#### On WSL:
```bash
curl -fsSL https://bun.sh/install | bash
```

Verify installation:
```bash
bun --version
```

### Step 2: Install PowerShell Modules

#### Active Directory Module (Required for AD assessment):
```powershell
# On Windows Server
Install-WindowsFeature RSAT-AD-PowerShell

# On Windows 10/11
Add-WindowsCapability -Online -Name 'Rsat.ActiveDirectory.DS-LDS.Tools~~~~0.0.1.0'
```

#### Microsoft Graph PowerShell (Optional, for Azure AD):
```powershell
Install-Module Microsoft.Graph -Scope CurrentUser -Force
```

### Step 3: Deploy Assessment Tool

#### Option A: Copy from USB/Network Share
```batch
xcopy /E /I \\fileserver\security\ad-assessment C:\SecurityAssessment
```

#### Option B: Download from Git Repository
```bash
git clone https://github.com/yourorg/ad-security-assessment C:\SecurityAssessment
```

#### Option C: Manual Copy
1. Copy entire `ad-security-assessment-standalone/` directory
2. Place at `C:\SecurityAssessment\`

### Step 4: Verify Directory Structure

After copying, you should have:

```
C:\SecurityAssessment\
├── Scripts/
│   ├── assess.bat (Windows launcher)
│   ├── assess-standalone.sh (Bash launcher)
│   ├── Export-ADData.ps1 (AD data collection)
│   ├── Export-AzureADData.ps1 (Azure AD collection)
│   └── run-production-assessment.sh
├── Tools/
│   ├── AssessADMisconfigs.ts
│   ├── AnalyzePrivileges.ts
│   ├── AuditAzureAD.ts
│   ├── ParseBloodHound.ts
│   ├── ParsePingCastle.ts
│   ├── GenerateExecutiveReport.ts
│   └── RunFullAssessment.ts
├── Findings/
│   ├── ADFindings.md
│   └── AzureFindings.md
├── docs/
│   ├── QUICKSTART.md
│   ├── EXAMPLES.md
│   ├── INTEGRATED-WORKFLOW.md
│   └── EXECUTIVE-REPORTING.md
├── data/ (will be created on first run)
├── reports/ (will be created on first run)
├── README.md
└── DEPLOYMENT.md (this file)
```

---

## Running the Assessment

### Full Workflow

#### 1. Collect AD Data (PowerShell as Admin)

```powershell
cd C:\SecurityAssessment\Scripts

# Full export with ACLs (slower, more comprehensive)
.\Export-ADData.ps1 -OutputPath C:\SecurityAssessment\data -IncludeACLs

# Quick export without ACLs (faster)
.\Export-ADData.ps1 -OutputPath C:\SecurityAssessment\data
```

**Files created:**
- `data/ad-config.json` - Domain configuration
- `data/ad-identity.json` - Users, groups, memberships
- `data/ad-acls.json` - ACL data (if -IncludeACLs used)

#### 2. Collect Azure AD Data (Optional)

```powershell
cd C:\SecurityAssessment\Scripts
.\Export-AzureADData.ps1 -OutputPath C:\SecurityAssessment\data
```

**Files created:**
- `data/azure-ad.json` - Azure AD users, policies, security config

#### 3. Run BloodHound (Optional)

```powershell
cd C:\SecurityAssessment\data
.\SharpHound.exe -c All -d yourdomain.com --outputdirectory bloodhound
```

**Files created:**
- `data/bloodhound/*.json` - BloodHound data files

#### 4. Run PingCastle (Optional)

```powershell
cd C:\SecurityAssessment\data
.\PingCastle.exe --healthcheck --server dc01.yourdomain.com
```

**Files created:**
- `data/ad_hc_yourdomain.com.xml` - PingCastle report

#### 5. Run Assessment

**On Windows:**
```batch
cd C:\SecurityAssessment
Scripts\assess.bat
```

**On WSL/Git Bash:**
```bash
cd /c/SecurityAssessment
bash Scripts/assess-standalone.sh
```

**Direct with Bun:**
```bash
cd C:\SecurityAssessment
bun run Tools/RunFullAssessment.ts \
  --org "Your Organization" \
  --output reports/$(date +%Y%m%d) \
  --ad-config data/ad-config.json \
  --identity data/ad-identity.json \
  --azure data/azure-ad.json
```

#### 6. View Results

Open in browser:
```
C:\SecurityAssessment\reports\[timestamp]\executive-report.html
```

---

## Security Considerations

### Data Protection

The exported data contains **highly sensitive** information:
- Password policies and security settings
- User accounts and group memberships
- Privileged account lists
- ACL configurations
- Azure AD security settings

**Protect this data:**

1. **Encrypt data at rest:**
   ```powershell
   # After data collection, encrypt the data directory
   Compress-Archive -Path C:\SecurityAssessment\data\* -DestinationPath C:\SecurityAssessment\data-encrypted.zip

   # Use 7-Zip with AES-256 encryption (recommended)
   7z a -p -mhe=on C:\SecurityAssessment\data-encrypted.7z C:\SecurityAssessment\data\*
   ```

2. **Restrict permissions:**
   ```powershell
   # Remove inherited permissions
   icacls C:\SecurityAssessment\data /inheritance:r

   # Grant only to current user
   icacls C:\SecurityAssessment\data /grant:r "$env:USERNAME:(OI)(CI)F"
   ```

3. **Secure deletion after processing:**
   ```powershell
   # Use cipher for secure deletion
   cipher /w:C:\SecurityAssessment\data

   # Or use sdelete
   sdelete -p 10 C:\SecurityAssessment\data\*.json
   ```

4. **Network transfer security:**
   - Use SFTP/SCP for remote transfers
   - Encrypt before transferring
   - Delete source after verifying transfer

### Compliance Notes

- **GDPR**: Contains PII (user names, email addresses)
- **SOX**: Contains access control data
- **PCI-DSS**: May contain cardholder data environment access info
- **HIPAA**: May contain access to PHI systems

Ensure data handling complies with your organization's policies.

---

## Automation

### Scheduled Task (Monthly Assessment)

Create a scheduled task to run assessments automatically:

```powershell
# Create scheduled task
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\SecurityAssessment\Scripts\monthly-assessment.ps1"

$trigger = New-ScheduledTaskTrigger -Weekly -WeeksInterval 4 -DaysOfWeek Monday -At 2am

$principal = New-ScheduledTaskPrincipal -UserId "DOMAIN\SecurityScanner" `
  -LogonType Password -RunLevel Highest

Register-ScheduledTask -TaskName "MonthlyADSecurityAssessment" `
  -Action $action -Trigger $trigger -Principal $principal `
  -Description "Monthly AD/Azure security assessment"
```

Create `Scripts/monthly-assessment.ps1`:
```powershell
# Monthly assessment automation script
$ErrorActionPreference = "Stop"
$Timestamp = Get-Date -Format "yyyyMMdd"
$DataDir = "C:\SecurityAssessment\data\$Timestamp"
$ReportDir = "C:\SecurityAssessment\reports\$Timestamp"

New-Item -ItemType Directory -Path $DataDir -Force
New-Item -ItemType Directory -Path $ReportDir -Force

# Collect AD data
.\Export-ADData.ps1 -OutputPath $DataDir

# Collect Azure AD data
.\Export-AzureADData.ps1 -OutputPath $DataDir

# Run assessment
cd C:\SecurityAssessment
wsl bash Scripts/assess-standalone.sh -org "Your Org" -data $DataDir -output $ReportDir -auto

# Email report to leadership
Send-MailMessage -To "leadership@yourorg.com" `
  -From "security@yourorg.com" `
  -Subject "Monthly Security Assessment - $Timestamp" `
  -Body "See attached executive dashboard" `
  -Attachments "$ReportDir\executive-report.html" `
  -SmtpServer "smtp.yourorg.com"

# Archive and encrypt
Compress-Archive -Path $DataDir\* -DestinationPath "C:\SecurityAssessment\archives\data-$Timestamp.zip"

# Secure delete source data
cipher /w:$DataDir
Remove-Item -Recurse -Force $DataDir
```

---

## Troubleshooting

### "bun: command not found"

**Fix:**
1. Verify Bun installation: `bun --version`
2. If not found, reinstall: `powershell -c "irm bun.sh/install.ps1|iex"`
3. Restart terminal

### "Export-ADData.ps1 cannot be loaded"

**Fix:**
```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Unblock the script
Unblock-File C:\SecurityAssessment\Scripts\Export-ADData.ps1
```

### "Access Denied" when collecting AD data

**Fix:**
1. Run PowerShell as Administrator
2. Ensure your account has Domain Admin or equivalent rights
3. Check if domain controllers are reachable

### "Microsoft Graph module not found"

**Fix:**
```powershell
Install-Module Microsoft.Graph -Scope CurrentUser -Force
Import-Module Microsoft.Graph
```

### "WSL not found" error

**Fix:**
Install WSL:
```powershell
wsl --install
```

Or use Git Bash:
- Download from: https://git-scm.com/download/win

### Assessment produces no findings

**Fix:**
1. Verify data files exist and are not empty:
   ```powershell
   Get-ChildItem C:\SecurityAssessment\data\*.json | ForEach-Object {
     Write-Host "$($_.Name): $($_.Length) bytes"
   }
   ```
2. Check JSON validity:
   ```powershell
   Get-Content C:\SecurityAssessment\data\ad-config.json | ConvertFrom-Json
   ```

---

## Network-Isolated Environments

For environments without internet access:

### Prerequisites
1. Download Bun offline installer on internet-connected machine
2. Copy installer to isolated machine via USB/CD

### Data Collection
- All PowerShell scripts work offline (no internet required)
- Scripts only query local AD/Azure AD

### Assessment Execution
- All tools run locally (no internet required)
- No cloud dependencies

### Report Distribution
- HTML reports are self-contained
- No external CDN dependencies
- Works offline in any browser

---

## Uninstallation

To remove the tool:

```powershell
# Delete assessment directory
Remove-Item -Recurse -Force C:\SecurityAssessment

# Remove scheduled task (if created)
Unregister-ScheduledTask -TaskName "MonthlyADSecurityAssessment" -Confirm:$false

# Optional: Uninstall Bun
# (Only if not used for other purposes)
```

---

## Support

For documentation:
- `docs/QUICKSTART.md` - First assessment walkthrough
- `docs/EXAMPLES.md` - Command examples
- `docs/INTEGRATED-WORKFLOW.md` - Advanced usage
- `Findings/` - Remediation guides

For issues:
- Check error messages in PowerShell output
- Verify prerequisites are installed
- Ensure proper permissions

---

## Version

Standalone deployment package v1.0
Compatible with Windows 10/11, Windows Server 2016+
