# Directory Structure Guide

Visual guide to the file organization of the AD/Azure Security Assessment tool.

## Complete Directory Tree

```
C:\SecurityAssessment\                    ← Main installation directory
│
├── 📁 Scripts\                           ← Executable scripts
│   ├── 🪟 assess.bat                     │ Windows launcher (double-click to run)
│   ├── 🐧 assess-standalone.sh           │ Bash launcher
│   ├── 🔵 Export-ADData.ps1              │ Collects Active Directory data
│   ├── ☁️ Export-AzureADData.ps1          │ Collects Azure AD data
│   ├── 🎯 Run-CompleteAssessment.ps1     │ Master script (runs everything)
│   └── run-production-assessment.sh      │ Helper wrapper script
│
├── 📁 Tools\                             ← Assessment analysis tools (TypeScript)
│   ├── AssessADMisconfigs.ts             │ AD configuration analysis
│   ├── AnalyzePrivileges.ts              │ Privilege escalation detection
│   ├── AuditAzureAD.ts                   │ Azure AD security audit
│   ├── ParseBloodHound.ts                │ BloodHound data parser
│   ├── ParsePingCastle.ts                │ PingCastle report parser
│   ├── GenerateExecutiveReport.ts        │ HTML dashboard generator
│   └── RunFullAssessment.ts              │ Assessment orchestrator
│
├── 📁 ThirdParty\                        ← Third-party security tools
│   ├── 📄 README.md                      │ Download instructions ⭐ READ THIS FIRST
│   ├── 🩸 SharpHound.exe                 │ BloodHound collector (YOU DOWNLOAD)
│   └── 🏰 PingCastle.exe                 │ AD security scanner (YOU DOWNLOAD)
│
├── 📁 Findings\                          ← Remediation documentation
│   ├── ADFindings.md                     │ AD security issue fixes
│   └── AzureFindings.md                  │ Azure AD security issue fixes
│
├── 📁 docs\                              ← User documentation
│   ├── QUICKSTART.md                     │ Step-by-step first assessment
│   ├── EXAMPLES.md                       │ Command examples
│   ├── INTEGRATED-WORKFLOW.md            │ Advanced integration
│   └── EXECUTIVE-REPORTING.md            │ Reporting guide
│
├── 📁 data\                              ← Collected data (created automatically)
│   ├── ad-config.json                    │ Domain configuration
│   ├── ad-identity.json                  │ Users, groups, permissions
│   ├── azure-ad.json                     │ Azure AD data
│   ├── 📁 bloodhound\                    │ BloodHound JSON files
│   └── ad_hc_domain.xml                  │ PingCastle report
│
├── 📁 reports\                           ← Generated reports (created automatically)
│   └── 📁 [timestamp]\                   │ Each assessment run
│       ├── executive-report.html         │ Executive dashboard ⭐ MAIN OUTPUT
│       ├── report-misconfigs.txt         │ AD configuration issues
│       ├── report-privileges.txt         │ Privilege escalation risks
│       ├── report-azure.txt              │ Azure AD findings
│       ├── report-bloodhound.txt         │ Attack path analysis
│       └── report-pingcastle.txt         │ Risk assessment findings
│
├── 📄 README.md                          ← Overview and quick start
├── 📄 DEPLOYMENT.md                      ← Detailed deployment guide
├── 📄 QUICK-REFERENCE.md                 ← One-page cheat sheet
└── 📄 DIRECTORY-STRUCTURE.md             ← This file

```

## What You Need to Download

### ⚠️ REQUIRED: You must download these tools yourself

The assessment tool does **NOT** include these executables. You must download them:

1. **SharpHound.exe** → Place in `ThirdParty\`
   - Download from: https://github.com/SpecterOps/BloodHound/releases

2. **PingCastle.exe** → Place in `ThirdParty\`
   - Download from: https://www.pingcastle.com/download/

See `ThirdParty\README.md` for complete download instructions.

## Directory Purpose Summary

| Directory | Purpose | Created By |
|-----------|---------|------------|
| `Scripts\` | Executable scripts for data collection and assessment | Included |
| `Tools\` | TypeScript analysis tools | Included |
| `ThirdParty\` | **YOU DOWNLOAD** BloodHound and PingCastle here | You create |
| `Findings\` | Remediation guides for security issues | Included |
| `docs\` | User documentation | Included |
| `data\` | Collected data (sensitive!) | Auto-created |
| `reports\` | Generated assessment reports | Auto-created |

## Key Files

### 🎯 Main Executable Scripts

| File | What It Does | When to Use |
|------|--------------|-------------|
| `Run-CompleteAssessment.ps1` | Runs entire assessment (AD + Azure + BloodHound + PingCastle) | **Use this for complete assessment** |
| `assess.bat` | Windows launcher (interactive menu) | Quick launch on Windows |
| `assess-standalone.sh` | Bash launcher (interactive menu) | Quick launch on Linux/WSL |
| `Export-ADData.ps1` | Collects AD data only | Manual data collection |
| `Export-AzureADData.ps1` | Collects Azure AD data only | Manual data collection |

### 📊 Output Files

| File | Description | Audience |
|------|-------------|----------|
| `executive-report.html` | Visual dashboard with security score | **Leadership/executives** |
| `report-misconfigs.txt` | AD configuration issues | IT administrators |
| `report-privileges.txt` | Privilege escalation risks | Security team |
| `report-azure.txt` | Azure AD security findings | Cloud administrators |
| `report-bloodhound.txt` | Attack path analysis | Security analysts |
| `report-pingcastle.txt` | Comprehensive risk assessment | Security team |

## Typical Workflow File Flow

```
1. USER DOWNLOADS
   └─> SharpHound.exe → ThirdParty\
   └─> PingCastle.exe → ThirdParty\

2. DATA COLLECTION
   └─> Export-ADData.ps1 → data\ad-config.json
   └─> Export-AzureADData.ps1 → data\azure-ad.json
   └─> SharpHound.exe → data\bloodhound\*.json
   └─> PingCastle.exe → data\ad_hc_domain.xml

3. ASSESSMENT
   └─> Run-CompleteAssessment.ps1 reads data\ files
   └─> Runs all Tools\*.ts analyzers
   └─> Generates reports\[timestamp]\*.txt and .html

4. REVIEW
   └─> Open executive-report.html in browser
   └─> Review detailed findings in report-*.txt
   └─> Consult Findings\*.md for remediation
```

## Important Notes

### 🔒 Security Warnings

The `data\` directory contains **HIGHLY SENSITIVE** information:
- User accounts and passwords policies
- Group memberships and permissions
- Privileged account information
- Azure AD security configurations

**Always:**
- Encrypt before transferring
- Delete securely after assessment
- Restrict file permissions
- Never commit to version control

### 📁 Auto-Created Directories

These directories are created automatically on first run:
- `data\` - Created when data collection scripts run
- `reports\` - Created when assessment runs
- `data\bloodhound\` - Created when BloodHound runs

You don't need to create them manually.

### 🚫 What's NOT Included

This tool does **NOT** include:
- SharpHound.exe (BloodHound collector)
- PingCastle.exe
- Sample data files
- Pre-configured domain settings

You must provide these yourself.

## Setup Checklist

Use this checklist to verify your setup:

```
Setup Checklist:
[ ] Tool extracted to C:\SecurityAssessment\
[ ] Bun runtime installed
[ ] PowerShell AD module installed
[ ] SharpHound.exe downloaded to ThirdParty\
[ ] PingCastle.exe downloaded to ThirdParty\
[ ] Verified SharpHound: .\ThirdParty\SharpHound.exe --help
[ ] Verified PingCastle: .\ThirdParty\PingCastle.exe --help
[ ] Read QUICKSTART.md
[ ] Ready to run first assessment!
```

## Need Help?

- **Tool download:** See `ThirdParty\README.md`
- **First assessment:** See `docs\QUICKSTART.md`
- **Command examples:** See `docs\EXAMPLES.md`
- **Deployment:** See `DEPLOYMENT.md`
- **Quick reference:** See `QUICK-REFERENCE.md`

---

**Visual Directory Structure** - Shows where everything goes and what you need to download
