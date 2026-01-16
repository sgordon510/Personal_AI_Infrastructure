# Command Examples

This file contains practical command examples for various assessment scenarios.

---

## Complete Assessment (All Data Sources)

Full assessment with AD, Azure AD, BloodHound, and PingCastle:

```bash
bun run ~/.claude/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts \
  --org "Acme Corporation" \
  --output ~/assessments/reports/$(date +%Y%m%d) \
  --ad-config ~/assessments/data/ad-config.json \
  --identity ~/assessments/data/ad-identity.json \
  --azure ~/assessments/data/azure-ad.json \
  --bloodhound ~/assessments/data/bloodhound/ \
  --pingcastle ~/assessments/data/ad_hc_acme.com.xml
```

---

## Partial Assessments

### AD-Only Assessment

Assess only Active Directory (no Azure AD or external tools):

```bash
bun run ~/.claude/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts \
  --org "Acme Corporation" \
  --output ~/assessments/ad-only-$(date +%Y%m%d) \
  --ad-config ~/data/ad-config.json \
  --identity ~/data/ad-identity.json
```

### Azure AD-Only Assessment

Assess only Azure Active Directory:

```bash
bun run ~/.claude/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts \
  --org "Acme Corporation" \
  --output ~/assessments/azure-only-$(date +%Y%m%d) \
  --azure ~/data/azure-ad.json
```

### BloodHound-Only Analysis

Parse only BloodHound data for attack path findings:

```bash
bun run ~/.claude/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts \
  --org "Acme Corporation" \
  --output ~/assessments/bloodhound-$(date +%Y%m%d) \
  --bloodhound ~/data/bloodhound/
```

### PingCastle-Only Analysis

Parse only PingCastle risk assessment:

```bash
bun run ~/.claude/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts \
  --org "Acme Corporation" \
  --output ~/assessments/pingcastle-$(date +%Y%m%d) \
  --pingcastle ~/data/ad_hc_acme.com.xml
```

---

## Individual Tool Runs

### Run AD Misconfiguration Assessment

Directly run the AD misconfigs tool without orchestration:

```bash
bun run ~/.claude/skills/ADSecurityAssessment/Tools/AssessADMisconfigs.ts \
  ~/data/ad-config.json \
  > ~/reports/ad-misconfigs-$(date +%Y%m%d).txt
```

### Run Privilege Analysis

Analyze privilege escalation risks:

```bash
bun run ~/.claude/skills/ADSecurityAssessment/Tools/AnalyzePrivileges.ts \
  ~/data/ad-identity.json \
  > ~/reports/privileges-$(date +%Y%m%d).txt
```

### Run Azure AD Audit

Assess Azure AD security posture:

```bash
bun run ~/.claude/skills/ADSecurityAssessment/Tools/AuditAzureAD.ts \
  ~/data/azure-ad.json \
  > ~/reports/azure-audit-$(date +%Y%m%d).txt
```

### Parse BloodHound Data

Extract findings from BloodHound JSON:

```bash
bun run ~/.claude/skills/ADSecurityAssessment/Tools/ParseBloodHound.ts \
  ~/data/bloodhound/ \
  > ~/reports/bloodhound-findings-$(date +%Y%m%d).txt
```

### Parse PingCastle Report

Extract findings from PingCastle XML:

```bash
bun run ~/.claude/skills/ADSecurityAssessment/Tools/ParsePingCastle.ts \
  ~/data/ad_hc_acme.com.xml \
  > ~/reports/pingcastle-findings-$(date +%Y%m%d).txt
```

### Generate Executive Dashboard

Create dashboard from existing assessment reports:

```bash
bun run ~/.claude/skills/ADSecurityAssessment/Tools/GenerateExecutiveReport.ts \
  "Acme Corporation" \
  ~/reports/ad-misconfigs-20260116.txt \
  ~/reports/privileges-20260116.txt \
  ~/reports/azure-audit-20260116.txt \
  ~/reports/bloodhound-findings-20260116.txt \
  ~/reports/pingcastle-findings-20260116.txt \
  > ~/reports/executive-report-20260116.html
```

---

## Using the Bash Helper Script

The convenience script auto-detects available data sources:

```bash
# Basic usage
~/.claude/skills/ADSecurityAssessment/Scripts/run-production-assessment.sh \
  "Acme Corporation" \
  ~/data \
  ~/reports/$(date +%Y%m%d)

# The script will:
# 1. Check ~/data/ for all supported file types
# 2. Auto-detect: ad-config.json, ad-identity.json, azure-ad.json, bloodhound/, pingcastle XML
# 3. Build the RunFullAssessment command automatically
# 4. Execute the assessment
# 5. Offer to open the dashboard in your browser
```

---

## Data Collection Examples

### Export AD Data (Windows)

```powershell
# Full export with ACLs
~/.claude/skills/ADSecurityAssessment/Scripts/Export-ADData.ps1 `
  -OutputPath "C:\SecurityData" `
  -IncludeACLs

# Quick export without ACLs (faster)
~/.claude/skills/ADSecurityAssessment/Scripts/Export-ADData.ps1 `
  -OutputPath "C:\SecurityData"
```

### Export Azure AD Data (Windows)

```powershell
~/.claude/skills/ADSecurityAssessment/Scripts/Export-AzureADData.ps1 `
  -OutputPath "C:\SecurityData"

# You'll be prompted for authentication
# Use account with Global Reader or Security Reader role
```

### Collect BloodHound Data

```powershell
# Using SharpHound (Windows)
.\SharpHound.exe -c All -d acme.com --outputdirectory "C:\SecurityData\bloodhound"

# Using bloodhound-python (Linux)
bloodhound-python -u 'serviceaccount@acme.com' -p 'P@ssw0rd' \
  -d acme.com -dc dc01.acme.com -c All \
  --zip --outputdirectory ~/data/bloodhound/
```

### Run PingCastle Scan

```powershell
# Health check scan
.\PingCastle.exe --healthcheck --server dc01.acme.com

# Output will be: ad_hc_acme.com.xml
```

---

## Monthly Workflow

### January Assessment (Full)

```bash
#!/bin/bash
# jan-2026-assessment.sh

ORG="Acme Corporation"
MONTH="2026-01"
DATA_DIR=~/assessments/data/jan-2026
REPORT_DIR=~/assessments/reports/jan-2026

# Ensure directories exist
mkdir -p "$DATA_DIR" "$REPORT_DIR"

# Run full assessment
bun run ~/.claude/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts \
  --org "$ORG" \
  --output "$REPORT_DIR" \
  --ad-config "$DATA_DIR/ad-config.json" \
  --identity "$DATA_DIR/ad-identity.json" \
  --azure "$DATA_DIR/azure-ad.json" \
  --bloodhound "$DATA_DIR/bloodhound/" \
  --pingcastle "$DATA_DIR/ad_hc_acme.com.xml"

# Open report
xdg-open "$REPORT_DIR/executive-report.html"

# Compress for archival
tar -czf ~/assessments/archives/jan-2026-assessment.tar.gz -C ~/assessments reports/jan-2026

# Secure delete source data
shred -vfz -n 10 "$DATA_DIR"/*.json
```

---

## Comparison & Trend Analysis

### Compare This Month vs Last Month

```bash
#!/bin/bash
# compare-months.sh

# Run both assessments side-by-side
echo "Generating December 2025 Report..."
bun run ~/.claude/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts \
  --org "Acme Corp" \
  --output ~/compare/dec-2025 \
  --ad-config ~/data/dec-2025/ad-config.json \
  --identity ~/data/dec-2025/ad-identity.json

echo "Generating January 2026 Report..."
bun run ~/.claude/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts \
  --org "Acme Corp" \
  --output ~/compare/jan-2026 \
  --ad-config ~/data/jan-2026/ad-config.json \
  --identity ~/data/jan-2026/ad-identity.json

# Extract severity counts for comparison
echo "=== DECEMBER 2025 ==="
grep -E "^\s*(Critical|High|Medium|Low|Info):" ~/compare/dec-2025/report-*.txt | wc -l

echo "=== JANUARY 2026 ==="
grep -E "^\s*(Critical|High|Medium|Low|Info):" ~/compare/jan-2026/report-*.txt | wc -l

# Open both dashboards
firefox ~/compare/dec-2025/executive-report.html \
        ~/compare/jan-2026/executive-report.html
```

---

## Automated Scheduling

### Cron Job for Monthly Data Collection (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add entry to run first Monday of every month at 2 AM
0 2 * * 1 [ $(date +\%d) -le 7 ] && ~/scripts/monthly-data-collection.sh

# monthly-data-collection.sh:
#!/bin/bash
MONTH=$(date +%Y-%m)
DATA_DIR=~/assessments/data/$MONTH

mkdir -p "$DATA_DIR"

# SSH to Windows system and trigger PowerShell exports
ssh windowshost "powershell.exe -File C:\Scripts\Export-ADData.ps1 -OutputPath C:\Data\$MONTH"
ssh windowshost "powershell.exe -File C:\Scripts\Export-AzureADData.ps1 -OutputPath C:\Data\$MONTH"

# Copy data back
scp -r windowshost:C:/Data/$MONTH/* "$DATA_DIR/"

# Run assessment
bun run ~/.claude/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts \
  --org "Acme Corp" \
  --output ~/assessments/reports/$MONTH \
  --ad-config "$DATA_DIR/ad-config.json" \
  --identity "$DATA_DIR/ad-identity.json"

# Email report to leadership
mutt -s "Monthly Security Assessment - $MONTH" \
     -a ~/assessments/reports/$MONTH/executive-report.html \
     -- leadership@acme.com < ~/templates/monthly-report-email.txt
```

### Windows Task Scheduler (PowerShell)

```powershell
# Create scheduled task for monthly AD export
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\Scripts\Export-ADData.ps1 -OutputPath C:\Data\$(Get-Date -Format 'yyyy-MM')"

$trigger = New-ScheduledTaskTrigger -Weekly -WeeksInterval 4 -DaysOfWeek Monday -At 2am

$principal = New-ScheduledTaskPrincipal -UserId "DOMAIN\ServiceAccount" `
  -LogonType Password -RunLevel Highest

Register-ScheduledTask -TaskName "MonthlyADSecurityExport" `
  -Action $action -Trigger $trigger -Principal $principal `
  -Description "Monthly AD data export for security assessment"
```

---

## CI/CD Integration

### GitLab CI Pipeline

```yaml
# .gitlab-ci.yml
security-assessment:
  stage: security
  image: oven/bun:latest
  script:
    - mkdir -p reports
    - bun run ~/.claude/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts \
        --org "$CI_PROJECT_NAMESPACE" \
        --output ./reports \
        --ad-config ./data/ad-config.json \
        --identity ./data/ad-identity.json
  artifacts:
    paths:
      - reports/executive-report.html
    expire_in: 30 days
  only:
    - schedules
```

### GitHub Actions

```yaml
# .github/workflows/security-assessment.yml
name: Monthly Security Assessment

on:
  schedule:
    - cron: '0 2 1 * *'  # First day of month at 2 AM
  workflow_dispatch:

jobs:
  assess:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Run Security Assessment
        run: |
          bun run ~/.claude/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts \
            --org "GitHub Org" \
            --output ./reports \
            --ad-config ./data/ad-config.json \
            --identity ./data/ad-identity.json

      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: reports/executive-report.html
```

---

## Troubleshooting Commands

### Verify Tool Functionality

```bash
# Check if Bun can find and execute tools
bun run ~/.claude/skills/ADSecurityAssessment/Tools/AssessADMisconfigs.ts --help

# Test with sample data (if you have test fixtures)
bun run ~/.claude/skills/ADSecurityAssessment/Tools/AssessADMisconfigs.ts \
  ~/.claude/skills/ADSecurityAssessment/test-data/sample-ad-config.json
```

### Debug Data Files

```bash
# Validate JSON structure
jq . ~/data/ad-config.json > /dev/null && echo "✓ Valid JSON" || echo "✗ Invalid JSON"

# Check for required fields
jq -r '.domain, .passwordPolicy, .ldapSettings' ~/data/ad-config.json

# Count objects in identity data
jq '.users | length' ~/data/ad-identity.json
jq '.groups | length' ~/data/ad-identity.json
```

### Check BloodHound Files

```bash
# List BloodHound JSON files
ls -lh ~/data/bloodhound/*.json

# Validate JSON and count records
jq '. | length' ~/data/bloodhound/users.json
jq '. | length' ~/data/bloodhound/groups.json
jq '. | length' ~/data/bloodhound/computers.json
```

### Verify PingCastle Report

```bash
# Check if XML is well-formed
xmllint --noout ~/data/ad_hc_acme.com.xml && echo "✓ Valid XML" || echo "✗ Invalid XML"

# Extract risk score
xmllint --xpath '//HealthcheckData/@GlobalScore' ~/data/ad_hc_acme.com.xml
```

---

## Advanced Usage

### Custom Severity Thresholds

Edit the tool files to adjust what constitutes CRITICAL vs HIGH:

```typescript
// ~/.claude/skills/ADSecurityAssessment/Tools/AssessADMisconfigs.ts

// Example: Change password age threshold
if (passwordPolicy.maximumPasswordAge > 90) {  // Original: 90 days
  findings.push({
    severity: 'CRITICAL',  // Original: HIGH
    // ...
  });
}
```

### Add Custom Checks

Create a new assessment tool:

```bash
# Copy template
cp ~/.claude/skills/ADSecurityAssessment/Tools/AssessADMisconfigs.ts \
   ~/.claude/skills/ADSecurityAssessment/Tools/CustomChecks.ts

# Edit to add your organization-specific checks
# Then include in RunFullAssessment.ts orchestration
```

### Export Findings to JSON

Convert text reports to JSON for programmatic processing:

```bash
# Run assessment with JSON output
bun run ~/.claude/skills/ADSecurityAssessment/Tools/AssessADMisconfigs.ts \
  ~/data/ad-config.json --format json > findings.json

# Parse with jq
jq '.findings[] | select(.severity == "CRITICAL")' findings.json
```

---

## Integration with SIEM/Ticketing

### Send to Splunk

```bash
# Convert findings to Splunk HEC format
cat ~/reports/report-misconfigs.txt | while read line; do
  echo "$line" | curl -k https://splunk.acme.com:8088/services/collector \
    -H "Authorization: Splunk YOUR-HEC-TOKEN" \
    -d "{\"event\": \"$line\", \"sourcetype\": \"security_assessment\"}"
done
```

### Create Jira Tickets

```bash
# Extract CRITICAL findings and create Jira tickets
grep "🔴 \[CRITICAL\]" ~/reports/report-*.txt | while IFS= read -r finding; do
  curl -X POST https://jira.acme.com/rest/api/2/issue \
    -H "Content-Type: application/json" \
    -u user:token \
    -d "{
      \"fields\": {
        \"project\": {\"key\": \"SEC\"},
        \"summary\": \"$finding\",
        \"description\": \"Security assessment finding\",
        \"issuetype\": {\"name\": \"Bug\"},
        \"priority\": {\"name\": \"Critical\"}
      }
    }"
done
```

### Send to ServiceNow

```bash
# Create incident for each HIGH/CRITICAL finding
jq -r '.findings[] | select(.severity == "CRITICAL" or .severity == "HIGH") | .title' findings.json | \
while read -r title; do
  curl -X POST https://acme.service-now.com/api/now/table/incident \
    -H "Content-Type: application/json" \
    -u admin:password \
    -d "{
      \"short_description\": \"$title\",
      \"category\": \"Security\",
      \"impact\": \"1\",
      \"urgency\": \"1\"
    }"
done
```

---

## Performance Optimization

### Large Environments (10,000+ Users)

```bash
# Run assessments in parallel
bun run ~/.claude/skills/ADSecurityAssessment/Tools/AssessADMisconfigs.ts ~/data/ad-config.json > report1.txt &
bun run ~/.claude/skills/ADSecurityAssessment/Tools/AnalyzePrivileges.ts ~/data/ad-identity.json > report2.txt &
bun run ~/.claude/skills/ADSecurityAssessment/Tools/AuditAzureAD.ts ~/data/azure-ad.json > report3.txt &

wait  # Wait for all background jobs

# Then generate dashboard
bun run ~/.claude/skills/ADSecurityAssessment/Tools/GenerateExecutiveReport.ts \
  "Acme Corp" report1.txt report2.txt report3.txt > executive-report.html
```

### Reduce Data Collection Time

```powershell
# AD export: Skip ACLs for faster collection
.\Export-ADData.ps1 -OutputPath C:\Data  # No -IncludeACLs flag

# Azure AD: Export only essential data
.\Export-AzureADData.ps1 -OutputPath C:\Data -Minimal
```

---

Need more examples? Check the full documentation:
- `QUICKSTART.md` - Step-by-step first assessment
- `INTEGRATED-WORKFLOW.md` - Advanced integration patterns
- `README.md` - Technical reference
