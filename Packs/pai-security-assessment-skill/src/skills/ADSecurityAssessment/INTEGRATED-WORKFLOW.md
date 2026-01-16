# Integrated Security Assessment Workflow

Complete AD/Azure security assessment using PAI tools + BloodHound + PingCastle, all from one script.

---

## Overview

This workflow integrates:
- **PAI Assessment Tools** - Custom AD/Azure configuration and privilege analysis
- **BloodHound** - Graph-based attack path analysis
- **PingCastle** - Automated AD security scoring
- **Executive Dashboard** - Business-friendly HTML report

**One command runs everything** and generates a comprehensive executive dashboard.

---

## Quick Start

```bash
# Run full assessment with all available data sources
cd ~/.claude/skills/ADSecurityAssessment

bun run Tools/RunFullAssessment.ts \
  --org "Your Organization" \
  --output ~/assessments/$(date +%Y-%m) \
  --ad-config /path/to/ad-config.json \
  --identity /path/to/identity-data.json \
  --azure /path/to/azure-ad-data.json \
  --bloodhound /path/to/bloodhound-data \
  --pingcastle /path/to/pingcastle-report.xml
```

**Output:**
- `executive-report.html` - Executive dashboard
- `report-ad-misconfigs.txt` - AD configuration findings
- `report-privileges.txt` - Privilege analysis findings
- `report-azure-ad.txt` - Azure AD findings
- `report-bloodhound.txt` - BloodHound analysis
- `report-pingcastle.txt` - PingCastle findings

---

## Data Collection

### 1. PAI Custom Assessments

**AD Configuration (PowerShell):**
```powershell
# See README.md for full PowerShell export script
$adConfig = @{
    domain = (Get-ADDomain).DNSRoot
    passwordPolicy = Get-ADDefaultDomainPasswordPolicy
    ldapSettings = @{ ... }
    domainControllers = Get-ADDomainController -Filter *
    serviceAccounts = Get-ADUser -Filter {ServicePrincipalName -like "*"}
}
$adConfig | ConvertTo-Json -Depth 5 | Out-File ad-config.json
```

**Identity Data (PowerShell):**
```powershell
$identityData = @{
    accounts = Get-ADUser -Filter * -Properties *
    groups = Get-ADGroup -Filter *
    acls = ...  # See README.md
}
$identityData | ConvertTo-Json -Depth 10 | Out-File identity-data.json
```

**Azure AD (Microsoft Graph):**
```powershell
Connect-MgGraph
$azureADData = @{
    users = Get-MgUser -All
    conditionalAccessPolicies = Get-MgIdentityConditionalAccessPolicy
    # See README.md for full script
}
$azureADData | ConvertTo-Json | Out-File azure-ad-data.json
```

### 2. BloodHound Collection

**Run SharpHound:**
```powershell
# Download SharpHound from https://github.com/BloodHoundAD/SharpHound
.\SharpHound.exe -c All --outputdirectory C:\Temp\bloodhound

# Output files:
#   20260116120000_users.json
#   20260116120000_computers.json
#   20260116120000_groups.json
#   20260116120000_domains.json
#   etc.
```

**What BloodHound Detects:**
- Kerberoastable accounts (with privilege level)
- AS-REP roastable accounts
- Unconstrained delegation
- Dangerous permissions (GenericAll, WriteDacl, etc.)
- Attack paths to Domain Admins
- High-value targets
- LAPS coverage gaps
- Dormant admin accounts

### 3. PingCastle Assessment

**Run PingCastle:**
```powershell
# Download from https://www.pingcastle.com
.\PingCastle.exe --healthcheck --server yourdomain.com

# Output: ad_hc_yourdomain_20260116.xml
```

**What PingCastle Detects:**
- Overall risk score (0-100)
- Privilege escalation risks
- Trust relationship issues
- Anomalous behaviors
- Outdated systems
- Compliance gaps (100+ rules)

---

## Running Assessments

### Full Assessment (Recommended)

**With all data sources:**
```bash
bun run Tools/RunFullAssessment.ts \
  --org "Acme Corporation" \
  --output ~/reports/2026-01 \
  --ad-config ./data/ad-config.json \
  --identity ./data/identity-data.json \
  --azure ./data/azure-ad-data.json \
  --bloodhound ./data/bloodhound \
  --pingcastle ./data/pingcastle-report.xml
```

**AD-only (on-prem focus):**
```bash
bun run Tools/RunFullAssessment.ts \
  --org "Acme Corporation" \
  --output ~/reports/2026-01 \
  --ad-config ./data/ad-config.json \
  --bloodhound ./data/bloodhound \
  --pingcastle ./data/pingcastle-report.xml
```

**Azure AD only (cloud focus):**
```bash
bun run Tools/RunFullAssessment.ts \
  --org "Acme Corporation" \
  --output ~/reports/2026-01 \
  --azure ./data/azure-ad-data.json
```

**Mix and match** - Use whatever data sources you have available!

### Individual Tool Usage

You can still run tools individually:

```bash
# Just BloodHound analysis
bun run Tools/ParseBloodHound.ts ./bloodhound-data

# Just PingCastle analysis
bun run Tools/ParsePingCastle.ts ./pingcastle-report.xml

# Traditional PAI assessments
bun run Tools/AssessADMisconfigs.ts ./ad-config.json
bun run Tools/AnalyzePrivileges.ts ./identity-data.json
bun run Tools/AuditAzureAD.ts ./azure-ad-data.json
```

---

## Understanding the Output

### Executive Report

**What it includes:**
- Aggregated findings from ALL sources (PAI + BloodHound + PingCastle)
- Overall security score
- Risk distribution by severity
- Top priority findings for leadership
- Category breakdown
- Automated recommendations

**Opens in any browser:**
```bash
open ~/reports/2026-01/executive-report.html
```

### Technical Reports

**For each data source:**
- Detailed technical findings
- Specific accounts/systems affected
- PowerShell remediation commands
- CVE references
- Attack technique descriptions

**Perfect for:**
- Technical teams implementing fixes
- Detailed incident investigation
- Compliance documentation
- Training and education

---

## Comparison: PAI vs. BloodHound vs. PingCastle

| Feature | PAI Tools | BloodHound | PingCastle |
|---------|-----------|------------|------------|
| **Focus** | Configuration & policies | Attack paths | Overall risk scoring |
| **Depth** | Specific misconfigs | Privilege escalation | 100+ security rules |
| **Output** | Detailed remediation | Visual graphs | Risk score + findings |
| **Best For** | Policy compliance | Penetration testing | Quarterly audits |
| **Runtime** | Instant (on exported data) | Fast (30 sec - 5 min collection) | Medium (5-15 min scan) |
| **Learning Curve** | Low | Medium-High | Low |

**Together they provide:**
- Complete coverage (PAI finds what others miss)
- Attack path visualization (BloodHound)
- Industry-standard risk scoring (PingCastle)
- Executive-friendly reporting (PAI dashboard)

---

## Monthly Assessment Workflow

### Week 1: Data Collection & Assessment

```bash
#!/bin/bash
# monthly-assessment.sh

MONTH=$(date +%Y-%m)
REPORT_DIR=~/reports/$MONTH
ORG_NAME="Your Organization"

echo "=== Monthly Security Assessment: $MONTH ==="

# 1. Export AD data (run on DC or domain-joined system)
echo "Step 1: Export AD configuration..."
pwsh ./export-ad-data.ps1  # Your PowerShell export script

# 2. Run SharpHound
echo "Step 2: Collect BloodHound data..."
./SharpHound.exe -c All --outputdirectory /tmp/bloodhound

# 3. Run PingCastle
echo "Step 3: Run PingCastle scan..."
./PingCastle.exe --healthcheck --server yourdomain.com

# 4. Export Azure AD (if hybrid)
echo "Step 4: Export Azure AD data..."
pwsh ./export-azure-data.ps1

# 5. Run full assessment
echo "Step 5: Running comprehensive assessment..."
cd ~/.claude/skills/ADSecurityAssessment

bun run Tools/RunFullAssessment.ts \
  --org "$ORG_NAME" \
  --output $REPORT_DIR \
  --ad-config /tmp/ad-config.json \
  --identity /tmp/identity-data.json \
  --azure /tmp/azure-ad-data.json \
  --bloodhound /tmp/bloodhound \
  --pingcastle /tmp/ad_hc_*.xml

echo "✅ Assessment complete! Report: $REPORT_DIR/executive-report.html"

# 6. Secure cleanup
shred -vfz /tmp/ad-config.json /tmp/identity-data.json /tmp/azure-ad-data.json
```

### Week 2: Executive Review

1. Distribute `executive-report.html` to leadership 24h before meeting
2. Present top findings with business impact
3. Discuss CRITICAL/HIGH items requiring investment
4. Assign owners and timelines

### Week 3-4: Remediation

1. Technical teams implement fixes
2. Track progress in ticketing system
3. Document completed remediations
4. Prepare for next month's comparison

---

## Advanced Features

### Automated Scheduling

**Cron job (monthly on 1st):**
```bash
# /etc/cron.monthly/security-assessment
0 2 1 * * /path/to/monthly-assessment.sh
```

**Or use systemd timer for more control.**

### SIEM Integration

**Export findings to JSON:**
```bash
# Parse findings and send to SIEM
cat report-*.txt | grep "^\[CRITICAL\]" | \
  jq -R -s '{findings: split("\n")}' | \
  curl -X POST https://siem.company.com/api/security-events -d @-
```

### Ticketing Integration

**Create Jira tickets from CRITICAL findings:**
```bash
#!/bin/bash
# Parse findings and create tickets
cat /tmp/full-assessment/report-*.txt | \
  grep "🔴 \[CRITICAL\]" | \
  while read -r line; do
    # Extract title and create Jira ticket
    TITLE=$(echo "$line" | sed 's/🔴 \[CRITICAL\] //')
    jira create-issue \
      --project SEC \
      --type "Security Finding" \
      --priority Critical \
      --summary "$TITLE"
  done
```

### Trend Analysis

**Compare with previous month:**
```bash
# Compare security scores
LAST_MONTH=$(date -d "last month" +%Y-%m)
THIS_MONTH=$(date +%Y-%m)

echo "Last month: $(grep "Security Score:" ~/reports/$LAST_MONTH/executive-report.html)"
echo "This month: $(grep "Security Score:" ~/reports/$THIS_MONTH/executive-report.html)"

# Show improvement or decline
```

---

## Troubleshooting

### "BloodHound files not found"

**Cause:** SharpHound output files have timestamps in filename

**Solution:**
```bash
# The script looks for files ending in _users.json, _computers.json, etc.
# Make sure your BloodHound directory contains these files

ls bloodhound-data/
# Should see:
#   20260116120000_users.json
#   20260116120000_computers.json
#   20260116120000_groups.json
```

### "PingCastle report parse error"

**Cause:** HTML vs XML format mismatch

**Solution:**
- Parser supports both XML and HTML formats
- Ensure file is complete (not truncated)
- Check for valid XML/HTML structure

### "No findings generated"

**Cause:** Data export incomplete or incorrect format

**Solution:**
1. Validate JSON files: `cat file.json | jq .`
2. Check for required fields in data
3. Review export scripts for errors

### Memory issues with large environments

**Cause:** Very large AD environments (100K+ objects)

**Solution:**
- Filter data during export (active accounts only)
- Process in batches
- Increase Node.js memory limit: `NODE_OPTIONS=--max-old-space-size=4096`

---

## Best Practices

### Security

1. **Encrypt sensitive data exports**
   ```bash
   gpg -c ad-config.json
   gpg -c bloodhound-data.zip
   ```

2. **Secure deletion after assessment**
   ```bash
   shred -vfz -n 10 *.json
   ```

3. **Limit access to reports**
   - Store in access-controlled directory
   - Use group permissions
   - Audit report access

### Operational

1. **Consistent scheduling** - Same time each month
2. **Document changes** - Note infrastructure changes between assessments
3. **Version control** - Track remediation progress
4. **Backup reports** - Keep for compliance (typically 2-3 years)

### Continuous Improvement

1. **Customize findings** - Add organization-specific checks
2. **Adjust severity** - Tune to your risk appetite
3. **Automate remediation** - Script fixes for common issues
4. **Track metrics** - Monitor improvement over time

---

## Example: Complete Monthly Run

```bash
#!/bin/bash
# Complete monthly assessment example

# Configuration
MONTH=$(date +%Y-%m)
ORG="Acme Corporation"
OUTPUT=~/assessments/$MONTH
TEMP=/tmp/sec-assessment-$$

# Preparation
mkdir -p $TEMP $OUTPUT

# === DATA COLLECTION ===
echo "📊 Collecting data..."

# AD Configuration (requires Domain Admin)
pwsh -Command "
  # Export AD config
  \$config = @{
    domain = (Get-ADDomain).DNSRoot
    passwordPolicy = Get-ADDefaultDomainPasswordPolicy
    # ... (full export script)
  }
  \$config | ConvertTo-Json -Depth 5 | Out-File $TEMP/ad-config.json
"

# BloodHound (requires domain access)
SharpHound.exe -c All --outputdirectory $TEMP/bloodhound

# PingCastle (requires domain access)
PingCastle.exe --healthcheck --server $(hostname -d) --no-enum-limit

# Azure AD (requires Graph API permissions)
pwsh -Command "
  Connect-MgGraph -Scopes 'User.Read.All','Policy.Read.All'
  # ... (full export script)
  \$data | ConvertTo-Json | Out-File $TEMP/azure-ad.json
"

# === RUN ASSESSMENT ===
echo "🔍 Running assessment..."

cd ~/.claude/skills/ADSecurityAssessment
bun run Tools/RunFullAssessment.ts \
  --org "$ORG" \
  --output $OUTPUT \
  --ad-config $TEMP/ad-config.json \
  --bloodhound $TEMP/bloodhound \
  --pingcastle $TEMP/ad_hc_*.xml \
  --azure $TEMP/azure-ad.json

# === CLEANUP ===
echo "🧹 Cleaning up..."
shred -vfz $TEMP/*.json
rm -rf $TEMP

# === DISTRIBUTE ===
echo "📧 Distributing report..."
# Option 1: Email
mail -s "Security Assessment - $MONTH" -a $OUTPUT/executive-report.html ciso@company.com < /dev/null

# Option 2: SharePoint/Web
scp $OUTPUT/executive-report.html webserver:/var/www/reports/$MONTH.html

echo "✅ Complete! Report: $OUTPUT/executive-report.html"
```

---

## Integration with Other Tools

### Splunk/ELK

**Send findings to SIEM:**
```bash
# Convert findings to JSON events
bun run Tools/ExportToJSON.ts $OUTPUT | \
  curl -X POST https://splunk.company.com:8088/services/collector \
    -H "Authorization: Splunk YOUR-TOKEN" \
    -d @-
```

### ServiceNow/Jira

**Auto-create tickets:**
```bash
# Parse critical findings
while IFS= read -r finding; do
  # Create ticket via API
  curl -X POST https://jira.company.com/rest/api/2/issue \
    -H "Content-Type: application/json" \
    -d "{
      \"fields\": {
        \"project\": {\"key\": \"SEC\"},
        \"summary\": \"$finding\",
        \"issuetype\": {\"name\": \"Task\"},
        \"priority\": {\"name\": \"Critical\"}
      }
    }"
done < <(grep "🔴 \[CRITICAL\]" $OUTPUT/report-*.txt)
```

### Microsoft Sentinel

**Import as security incidents:**
```powershell
$findings | ForEach-Object {
  New-AzSentinelIncident -WorkspaceId $workspaceId `
    -Title $_.title `
    -Severity $_.severity `
    -Description $_.description
}
```

---

**Next:** See `EXECUTIVE-REPORTING.md` for guidance on presenting findings to leadership.
