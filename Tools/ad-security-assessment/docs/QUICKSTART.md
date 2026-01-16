# Quick Start: Your First Production Assessment

This guide walks you through running your first complete AD/Azure security assessment with executive dashboard generation.

## Prerequisites Check

Before starting, ensure you have:

### On Windows (Domain-Joined System)
- [ ] PowerShell 5.1+ or PowerShell 7+
- [ ] Active Directory PowerShell module (`RSAT-AD-PowerShell`)
- [ ] Microsoft Graph PowerShell SDK (`Install-Module Microsoft.Graph`)
- [ ] Domain Admin or equivalent permissions for AD data export
- [ ] Global Reader or Security Reader for Azure AD

### On Assessment System (Linux/Mac)
- [ ] Bun runtime installed (`curl -fsSL https://bun.sh/install | bash`)
- [ ] PAI installed with ADSecurityAssessment skill
- [ ] Network access to receive exported data files

### Optional Tools
- [ ] BloodHound (for attack path analysis)
- [ ] PingCastle (for comprehensive AD security scanning)

---

## Step 0: Download Third-Party Tools (First Time Setup)

For the most comprehensive assessment, download these security tools before collecting data:

### BloodHound (SharpHound.exe)

**What it does:** Identifies attack paths and privilege escalation opportunities

**Download:**
1. Visit: **https://github.com/SpecterOps/BloodHound/releases**
2. Find the latest release (green "Latest" tag)
3. Download `SharpHound-vX.X.X.zip` from the Assets section
4. Extract and place `SharpHound.exe` in: `C:\SecurityAssessment\ThirdParty\`

**Verify:**
```powershell
cd C:\SecurityAssessment\ThirdParty
.\SharpHound.exe --help
```

### PingCastle

**What it does:** Comprehensive AD security audit with risk scoring

**Download:**
1. Visit: **https://www.pingcastle.com/download/**
2. Download the latest version
3. Extract and place `PingCastle.exe` in: `C:\SecurityAssessment\ThirdParty\`

**Verify:**
```powershell
cd C:\SecurityAssessment\ThirdParty
.\PingCastle.exe --help
```

**Complete Instructions:** See [../ThirdParty/README.md](../ThirdParty/README.md) for detailed setup and troubleshooting.

**Skip if needed:** You can run the assessment without these tools using:
```powershell
.\Run-CompleteAssessment.ps1 -SkipBloodHound -SkipPingCastle
```

---

## Step 1: Collect Active Directory Data

On a domain-joined Windows system with appropriate permissions:

```powershell
# Navigate to scripts directory (or copy script locally)
cd C:\SecurityAssessment\Scripts

# Run AD data export
.\Export-ADData.ps1 -OutputPath "C:\SecurityAssessment\Data" -IncludeACLs

# Expected output:
# ✓ Exported domain configuration
# ✓ Exported password policy
# ✓ Exported LDAP settings
# ✓ Exported 5 domain controllers
# ✓ Exported 45 service accounts
# ✓ Exported 1,250 user accounts
# ✓ Exported 230 groups with memberships
# ✓ Exported ACLs for 1,250 objects
```

**Files created:**
- `ad-config.json` - Domain configuration and password policy
- `ad-identity.json` - Users, groups, and memberships
- `ad-acls.json` - Access control lists (if -IncludeACLs used)

**Security note:** These files contain sensitive data. Encrypt before transferring:

```powershell
# Compress and password-protect
Compress-Archive -Path "C:\SecurityAssessment\Data\*" -DestinationPath "C:\SecurityAssessment\ad-export-$(Get-Date -Format 'yyyyMMdd').zip"

# Use BitLocker, VeraCrypt, or 7-Zip with strong password for transfer
```

---

## Step 2: Collect Azure AD Data

On the same or different system with Azure AD PowerShell:

```powershell
# Install Graph module if not already installed
Install-Module Microsoft.Graph -Scope CurrentUser -Force

# Run Azure AD export
.\Export-AzureADData.ps1 -OutputPath "C:\SecurityAssessment\Data"

# You'll be prompted to authenticate - use GA/Security Reader credentials
# Browser window will open for interactive login

# Expected output:
# ✓ Connected to Microsoft Graph
# ✓ Exported 1,250 users (with MFA status)
# ✓ Exported 12 Conditional Access policies
# ✓ Exported 3 PIM role settings
# ✓ Security defaults: Enabled
```

**Files created:**
- `azure-ad.json` - Users, policies, and security configuration

---

## Step 3: (Optional) Run BloodHound

If you want attack path analysis:

```powershell
# Run SharpHound collector
.\SharpHound.exe -c All -d yourdomain.com --outputdirectory "C:\SecurityAssessment\Data"

# Or use Python ingestor
bloodhound-python -u 'username' -p 'password' -d yourdomain.com -dc dc01.yourdomain.com -c All --zip

# Files created: bloodhound_YYYYMMDD.zip
# Extract JSON files for assessment
```

---

## Step 4: (Optional) Run PingCastle

For comprehensive risk scoring:

```powershell
# Run PingCastle scanner
.\PingCastle.exe --healthcheck --server dc01.yourdomain.com

# Files created: ad_hc_yourdomain.com.xml
```

---

## Step 5: Transfer Data Securely

Transfer encrypted archives to your assessment system:

```bash
# Example using SCP
scp user@windows-host:/path/to/ad-export-20260116.zip ~/assessments/

# Extract on assessment system
cd ~/assessments
unzip ad-export-20260116.zip -d ./data/
```

**CRITICAL:** Delete encrypted archives after extraction:
```bash
shred -vfz -n 10 ad-export-20260116.zip  # Linux
rm -P ad-export-20260116.zip              # macOS
```

---

## Step 6: Run Complete Assessment

Now the exciting part - run everything with one command:

```bash
# Navigate to assessment skill
cd ~/.claude/skills/ADSecurityAssessment

# Run full assessment with all data sources
bun run Tools/RunFullAssessment.ts \
  --org "Your Organization Name" \
  --output ~/assessments/reports/$(date +%Y%m%d) \
  --ad-config ~/assessments/data/ad-config.json \
  --identity ~/assessments/data/ad-identity.json \
  --azure ~/assessments/data/azure-ad.json \
  --bloodhound ~/assessments/data/bloodhound/ \
  --pingcastle ~/assessments/data/ad_hc_yourdomain.com.xml
```

**What happens:**
1. Validates all input files exist
2. Runs AD misconfiguration assessment
3. Runs privilege escalation analysis
4. Runs Azure AD security audit
5. Parses BloodHound findings
6. Parses PingCastle risk analysis
7. Aggregates all findings
8. Generates executive HTML dashboard

**Expected output:**
```
🔍 Running Full Security Assessment for Your Organization Name
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Assessing AD misconfigurations... (12 findings)
✓ Analyzing privileges and access... (8 findings)
✓ Auditing Azure AD security... (15 findings)
✓ Parsing BloodHound data... (23 findings)
✓ Parsing PingCastle report... (31 findings)
✓ Generating executive dashboard...

📊 Assessment Complete!

Total Findings: 89
  🔴 Critical: 12
  🟠 High: 23
  🟡 Medium: 34
  🔵 Low: 15
  ⚪ Info: 5

Reports saved to: /home/spence/assessments/reports/20260116/
  - executive-report.html
  - report-misconfigs.txt
  - report-privileges.txt
  - report-azure.txt
  - report-bloodhound.txt
  - report-pingcastle.txt

Open dashboard: file:///home/spence/assessments/reports/20260116/executive-report.html
```

---

## Step 7: View Executive Dashboard

Open the HTML report in your browser:

```bash
# Linux
xdg-open ~/assessments/reports/20260116/executive-report.html

# macOS
open ~/assessments/reports/20260116/executive-report.html

# Windows
start ~/assessments/reports/20260116/executive-report.html
```

**Dashboard features:**
- **Security Score:** 0-100 calculated from risk weighting
- **Severity Breakdown:** Visual pie chart of findings by severity
- **Category Analysis:** Bar chart showing issue distribution
- **Top 10 Priority Findings:** Most critical items requiring immediate attention
- **Detailed Findings:** Expandable sections with full remediation guidance

---

## Step 8: Share with Leadership

The executive dashboard is designed for non-technical audiences:

### Distribution Options

**Email:**
```bash
# The HTML file is self-contained (no external dependencies)
# Simply attach executive-report.html to email

# Or inline the report
mutt -s "Monthly Security Assessment - January 2026" \
     -a ~/assessments/reports/20260116/executive-report.html \
     -- leadership@yourorg.com < email-body.txt
```

**SharePoint/Web:**
```bash
# Upload to SharePoint document library
# The report works without modification
scp executive-report.html user@sharepoint:/sites/security/reports/
```

**Print/PDF:**
```bash
# Use headless Chrome for high-quality PDF
google-chrome --headless --print-to-pdf=security-report-jan-2026.pdf \
  executive-report.html

# Or use wkhtmltopdf
wkhtmltopdf executive-report.html security-report-jan-2026.pdf
```

---

## Troubleshooting

### "Cannot find module" errors
```bash
# Ensure PAI is properly installed
ls -la ~/.claude/skills/ADSecurityAssessment/Tools/

# Verify Bun is installed
bun --version

# Re-run PAI installation if needed
```

### "Permission denied" on data files
```bash
# Check file permissions
ls -l ~/assessments/data/

# Fix if needed
chmod 600 ~/assessments/data/*.json
```

### "No findings extracted" in dashboard
```bash
# Verify assessment tools ran successfully
cat ~/assessments/reports/20260116/report-misconfigs.txt

# Look for emoji + [SEVERITY] + title format
# Example: 🔴 [CRITICAL] Default Domain Password Policy Too Weak
```

### BloodHound/PingCastle parsing fails
```bash
# Check file formats
file ~/assessments/data/bloodhound/*.json
file ~/assessments/data/ad_hc_yourdomain.com.xml

# Verify files aren't corrupted
jq . ~/assessments/data/bloodhound/users.json > /dev/null
```

---

## Monthly Assessment Workflow

Establish a recurring process:

### Week 1: Data Collection
- Schedule PowerShell scripts to run automatically
- Use Task Scheduler (Windows) or cron (Linux)

```powershell
# Example scheduled task (Windows)
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
  -Argument "-File C:\Scripts\Export-ADData.ps1 -OutputPath C:\Data"
$trigger = New-ScheduledTaskTrigger -Weekly -At 2am -DaysOfWeek Monday
Register-ScheduledTask -TaskName "MonthlyADExport" -Action $action -Trigger $trigger
```

### Week 2: Assessment & Analysis
- Run full assessment suite
- Review findings with security team
- Prioritize remediation items

### Week 3: Remediation Planning
- Create tickets for high/critical findings
- Assign owners and deadlines
- Document mitigation strategies

### Week 4: Executive Reporting
- Generate dashboard with latest data
- Present to leadership
- Track progress on previous month's issues

---

## Next Steps

Now that you've run your first assessment:

1. **Baseline Documentation:** Save this first report as your security baseline
2. **Track Trends:** Compare future assessments to identify improvements or regressions
3. **Automate:** Set up scheduled data collection and assessment runs
4. **Customize:** Adjust severity thresholds and add organization-specific checks
5. **Integrate:** Connect findings to your ticketing system (Jira, ServiceNow, etc.)

---

## Support & Customization

All tools in this assessment suite are TypeScript files you can customize:

- **Modify severity thresholds:** Edit `Tools/AssessADMisconfigs.ts`
- **Add custom checks:** Create new assessment functions
- **Adjust risk scoring:** Modify `GenerateExecutiveReport.ts` calculation
- **Change report styling:** Edit HTML template in `GenerateExecutiveReport.ts`

For questions or issues, review the full documentation:
- `README.md` - Technical reference
- `INTEGRATED-WORKFLOW.md` - Advanced integration guide
- `EXECUTIVE-REPORTING.md` - Reporting best practices
- `Findings/*.md` - Remediation guides
