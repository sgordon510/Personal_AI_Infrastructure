# AD/Azure Security Assessment Tool - Standalone

Comprehensive security assessment for Active Directory and Azure AD environments. Runs directly on domain-connected machines without requiring PAI infrastructure.

## What This Does

Automated security assessment that:
- ✅ Detects AD misconfigurations (password policies, LDAP security, DC patching)
- ✅ Identifies privilege escalation risks (Kerberoasting, DCSync, dangerous ACLs)
- ✅ Assesses Azure AD security (MFA, Conditional Access, PIM)
- ✅ Integrates with BloodHound for attack path analysis
- ✅ Integrates with PingCastle for comprehensive risk scoring
- ✅ Generates executive dashboards with security scores
- ✅ Provides detailed remediation guidance

## Prerequisites

### Required Software

- **Windows 10/11** or **Windows Server 2016+** (domain-joined)
- **Bun Runtime** - JavaScript/TypeScript runtime for assessment tools
- **PowerShell 5.1+** - For data collection scripts
- **Active Directory PowerShell Module** - For AD data collection
- **Domain Admin permissions** - Required for comprehensive data collection

### Recommended Third-Party Tools

For the most comprehensive assessment, download these additional security tools:

#### 🩸 BloodHound (SharpHound.exe)
- **Purpose:** Attack path analysis and privilege escalation detection
- **Download:** https://github.com/SpecterOps/BloodHound/releases
- **Place at:** `ThirdParty/SharpHound.exe`
- **Details:** See `ThirdParty/README.md` for complete download instructions

#### 🏰 PingCastle
- **Purpose:** Automated AD security risk scoring
- **Download:** https://www.pingcastle.com/download/
- **Place at:** `ThirdParty/PingCastle.exe`
- **Details:** See `ThirdParty/README.md` for complete download instructions

**Note:** The assessment will run without these tools, but they provide valuable additional security insights. See [ThirdParty/README.md](ThirdParty/README.md) for detailed setup instructions.

### Optional Software

- **Microsoft Graph PowerShell Module** - For Azure AD assessment
- **WSL or Git Bash** - For running Bash scripts on Windows

---

## Quick Start

### 1. Install Prerequisites

```powershell
# Install Bun runtime
powershell -c "irm bun.sh/install.ps1|iex"

# Install AD PowerShell module
Add-WindowsCapability -Online -Name 'Rsat.ActiveDirectory.DS-LDS.Tools~~~~0.0.1.0'

# Optional: Install Microsoft Graph for Azure AD
Install-Module Microsoft.Graph -Scope CurrentUser
```

### 2. Download Third-Party Tools (Recommended)

For comprehensive analysis, download BloodHound and PingCastle:

1. **Download SharpHound:** Visit https://github.com/SpecterOps/BloodHound/releases
2. **Download PingCastle:** Visit https://www.pingcastle.com/download/
3. **Place both** in the `ThirdParty/` folder

**Complete instructions:** See [ThirdParty/README.md](ThirdParty/README.md)

### 3. Collect Data

```powershell
# Collect AD data (run as Domain Admin)
.\Scripts\Export-ADData.ps1 -OutputPath .\data

# Collect Azure AD data (requires Global/Security Reader)
.\Scripts\Export-AzureADData.ps1 -OutputPath .\data
```

### 4. Run Assessment

**Windows:**
```batch
Scripts\assess.bat
```

**Linux/WSL/Git Bash:**
```bash
bash Scripts/assess-standalone.sh
```

### 5. View Results

Open `reports/[timestamp]/executive-report.html` in your browser.

## What You Get

### Assessment Reports
- **executive-report.html** - Executive dashboard with security score
- **report-misconfigs.txt** - AD configuration issues
- **report-privileges.txt** - Privilege escalation risks
- **report-azure.txt** - Azure AD security findings
- **report-bloodhound.txt** - Attack path analysis (if BloodHound data provided)
- **report-pingcastle.txt** - Risk assessment (if PingCastle data provided)

### Key Features
- 🎯 **Risk Scoring**: 0-100 security score based on weighted findings
- 📊 **Executive Dashboard**: Beautiful HTML reports for leadership
- 🔍 **Detailed Findings**: Category, description, remediation for each issue
- 📚 **Remediation Guides**: Step-by-step fixes in `Findings/` directory
- 🤖 **Automation-Ready**: Can be scheduled for monthly assessments
- 🔒 **Privacy-Focused**: All processing happens locally, no cloud dependencies

## Directory Structure

```
ad-security-assessment-standalone/
├── Scripts/
│   ├── assess.bat                    # Windows launcher
│   ├── assess-standalone.sh          # Bash launcher
│   ├── Export-ADData.ps1            # AD data collection
│   ├── Export-AzureADData.ps1       # Azure AD data collection
│   └── run-production-assessment.sh # Helper script
│
├── Tools/
│   ├── AssessADMisconfigs.ts        # AD configuration analysis
│   ├── AnalyzePrivileges.ts         # Privilege escalation detection
│   ├── AuditAzureAD.ts              # Azure AD security audit
│   ├── ParseBloodHound.ts           # BloodHound integration
│   ├── ParsePingCastle.ts           # PingCastle integration
│   ├── GenerateExecutiveReport.ts   # Dashboard generator
│   └── RunFullAssessment.ts         # Master orchestration
│
├── Findings/
│   ├── ADFindings.md                # AD remediation guide
│   └── AzureFindings.md             # Azure AD remediation guide
│
├── docs/
│   ├── QUICKSTART.md                # Step-by-step guide
│   ├── EXAMPLES.md                  # Command examples
│   ├── INTEGRATED-WORKFLOW.md       # Advanced integration
│   └── EXECUTIVE-REPORTING.md       # Reporting best practices
│
├── data/                            # Created on first run
├── reports/                         # Created on first run
├── README.md                        # This file
└── DEPLOYMENT.md                    # Detailed deployment guide
```

## Use Cases

### For Security Teams
- Monthly security assessments for compliance reporting
- Track security posture improvements over time
- Identify and prioritize remediation efforts
- Generate executive-friendly dashboards

### For Compliance Officers
- Demonstrate controls for audits (SOC 2, ISO 27001, PCI-DSS)
- Track remediation of audit findings
- Generate evidence for compliance frameworks

### For Penetration Testers
- Automate initial reconnaissance
- Identify low-hanging fruit vulnerabilities
- Generate comprehensive assessment reports
- Integrate with BloodHound for attack path analysis

## Requirements

### Minimum Requirements
- Windows 10/11 or Windows Server 2016+
- Domain-joined machine
- Bun runtime
- PowerShell 5.1+

### For Full Functionality
- Domain Admin permissions (for AD data collection)
- Global Reader or Security Reader (for Azure AD data collection)
- Microsoft Graph PowerShell module (for Azure AD)
- WSL or Git Bash (for running Bash scripts on Windows)

### Optional Tools
- BloodHound (attack path analysis)
- PingCastle (comprehensive risk scoring)

## Security Notes

⚠️ **Important**: The data collected by this tool is **highly sensitive**:
- User accounts and group memberships
- Password policies and security settings
- Privileged account lists
- ACL configurations
- Azure AD security settings

**Always:**
- Encrypt data at rest and in transit
- Restrict file permissions (Windows: `icacls`, Linux: `chmod 600`)
- Securely delete data after processing (`cipher /w` on Windows, `shred` on Linux)
- Follow your organization's data handling policies
- Ensure compliance with GDPR, SOX, PCI-DSS, HIPAA as applicable

## Documentation

- **DEPLOYMENT.md** - Complete deployment guide for Windows machines
- **docs/QUICKSTART.md** - Step-by-step first assessment
- **docs/EXAMPLES.md** - Copy-paste command examples
- **docs/INTEGRATED-WORKFLOW.md** - BloodHound & PingCastle integration
- **docs/EXECUTIVE-REPORTING.md** - Monthly reporting workflow
- **Findings/** - Detailed remediation guidance

## Automation

Set up monthly assessments with Windows Task Scheduler:

```powershell
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
  -Argument "-File C:\SecurityAssessment\Scripts\monthly-assessment.ps1"

$trigger = New-ScheduledTaskTrigger -Weekly -WeeksInterval 4 -DaysOfWeek Monday -At 2am

Register-ScheduledTask -TaskName "MonthlyADAssessment" `
  -Action $action -Trigger $trigger
```

See **DEPLOYMENT.md** for complete automation examples.

## Troubleshooting

### "bun: command not found"
```powershell
powershell -c "irm bun.sh/install.ps1|iex"
```

### "Export-ADData.ps1 cannot be loaded"
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Unblock-File .\Scripts\Export-ADData.ps1
```

### "Access Denied" collecting AD data
- Run PowerShell as Administrator
- Ensure Domain Admin or equivalent permissions
- Verify domain controllers are reachable

### Assessment produces no findings
```powershell
# Verify data files exist
Get-ChildItem .\data\*.json

# Check JSON validity
Get-Content .\data\ad-config.json | ConvertFrom-Json
```

## Architecture

```
Data Collection (PowerShell on Windows)
    ↓
JSON Exports (Local Storage)
    ↓
Assessment Tools (TypeScript/Bun)
    ↓
Text Reports + HTML Dashboard
    ↓
Distribution (Email, SharePoint, etc.)
```

All processing happens locally. No cloud services required.

## Support

For detailed help:
1. Read **DEPLOYMENT.md** for deployment issues
2. Check **docs/QUICKSTART.md** for usage questions
3. Review **docs/EXAMPLES.md** for command examples
4. See **Findings/** for remediation guidance

## License

Part of Personal AI Infrastructure (PAI) security assessment tools.
See repository root for license information.

## Version

v1.0.0 - Standalone deployment package
Compatible with Windows 10/11, Windows Server 2016+

---

**Ready to assess your environment?**

1. Install prerequisites
2. Run `Scripts\Export-ADData.ps1`
3. Run `Scripts\assess.bat`
4. Review your executive dashboard!
