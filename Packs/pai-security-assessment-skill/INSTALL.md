# Installation Guide: PAI Security Assessment Skill

This guide will walk you through installing the AD/Azure Security Assessment skill for Personal AI Infrastructure.

## Prerequisites

Before installing, ensure you have:

### Required
- ✅ **PAI Core**: Personal AI Infrastructure must be installed
- ✅ **Bun Runtime**: Required for TypeScript tools (`curl -fsSL https://bun.sh/install | bash`)
- ✅ **Skills Directory**: `~/.claude/skills/` should exist

### Optional (for data collection)
- ⚪ **Windows System**: For AD data collection (domain-joined)
- ⚪ **PowerShell AD Module**: `Install-WindowsFeature RSAT-AD-PowerShell`
- ⚪ **Microsoft Graph PowerShell**: `Install-Module Microsoft.Graph`
- ⚪ **BloodHound**: For attack path analysis
- ⚪ **PingCastle**: For comprehensive risk scoring

## Installation Methods

### Method 1: Automated Installation (Recommended)

From the PAI repository root:

```bash
# Run the PAI installer
bun run install.ts

# When prompted:
# 1. Select "Install additional packs"
# 2. Choose "pai-security-assessment-skill"
# 3. Confirm installation
```

The installer will:
1. Copy skill files to `~/.claude/skills/ADSecurityAssessment/`
2. Set correct permissions
3. Verify Bun runtime availability
4. Register the skill with PAI

### Method 2: Manual Installation

If you prefer manual installation:

```bash
# 1. Copy the skill to your PAI skills directory
cp -r Packs/pai-security-assessment-skill/src/skills/ADSecurityAssessment \
      ~/.claude/skills/

# 2. Set executable permissions on scripts
chmod +x ~/.claude/skills/ADSecurityAssessment/Scripts/*.sh
chmod +x ~/.claude/skills/ADSecurityAssessment/Tools/*.ts

# 3. Verify Bun can execute the tools
bun run ~/.claude/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts --help
```

## Post-Installation Setup

### 1. Verify Installation

Check that all files are in place:

```bash
ls -la ~/.claude/skills/ADSecurityAssessment/

# You should see:
# - Tools/ (7 TypeScript assessment tools)
# - Scripts/ (4 helper scripts)
# - Findings/ (2 remediation guides)
# - Documentation files (README.md, QUICKSTART.md, etc.)
```

### 2. Test the Tools

Run a basic health check:

```bash
# Check if tools are executable
bun run ~/.claude/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts --help

# Expected output: Usage information
```

### 3. Set Up Data Collection (Windows Only)

If you'll be collecting data from Active Directory:

```powershell
# On Windows domain-joined system:

# 1. Install PowerShell AD module (if not already installed)
Install-WindowsFeature RSAT-AD-PowerShell

# 2. Copy data collection scripts to Windows system
# From: ~/.claude/skills/ADSecurityAssessment/Scripts/Export-ADData.ps1
# To: C:\Scripts\Export-ADData.ps1

# 3. For Azure AD data collection, install Microsoft Graph
Install-Module Microsoft.Graph -Scope CurrentUser
```

### 4. Create Working Directories

Set up directories for data and reports:

```bash
# Create assessment directories
mkdir -p ~/assessments/data
mkdir -p ~/assessments/reports
mkdir -p ~/assessments/archives

# Set restrictive permissions
chmod 700 ~/assessments/data  # Only you can read sensitive data
chmod 755 ~/assessments/reports  # Reports can be shared
```

## Skill Registration

The skill should be automatically registered with PAI. Verify by checking:

```bash
# Check PAI settings
cat ~/.claude/settings.json | grep -A 5 "skills"

# Or invoke the skill from Claude Code
# In a Claude Code session, type:
# /ADSecurityAssessment
```

If not registered, add manually to `~/.claude/settings.json`:

```json
{
  "skills": {
    "ADSecurityAssessment": {
      "path": "/root/.claude/skills/ADSecurityAssessment",
      "enabled": true
    }
  }
}
```

## Configuration

### Optional: Customize Severity Thresholds

Edit assessment tools to match your organization's risk tolerance:

```bash
# Edit AD misconfiguration tool
nano ~/.claude/skills/ADSecurityAssessment/Tools/AssessADMisconfigs.ts

# Example: Change password age from 90 to 60 days
# Find: if (passwordPolicy.maximumPasswordAge > 90)
# Change to: if (passwordPolicy.maximumPasswordAge > 60)
```

### Optional: Customize Executive Dashboard

Modify the HTML template:

```bash
# Edit dashboard generator
nano ~/.claude/skills/ADSecurityAssessment/Tools/GenerateExecutiveReport.ts

# You can customize:
# - Color scheme (search for: background-color, color)
# - Risk score calculation (search for: calculateRiskScore)
# - Severity weights (CRITICAL=10, HIGH=5, etc.)
# - Company branding (add logo, change title)
```

## Integration Setup

### Schedule Monthly Assessments (Optional)

Set up automated data collection:

```bash
# Edit crontab
crontab -e

# Add monthly assessment on first Monday
0 2 * * 1 [ $(date +\%d) -le 7 ] && ~/.claude/skills/ADSecurityAssessment/Scripts/assess.sh "Your Org" ~/assessments/data ~/assessments/reports/$(date +\%Y\%m\%d)
```

### CI/CD Integration (Optional)

For GitLab CI:

```yaml
# .gitlab-ci.yml
security-assessment:
  stage: security
  image: oven/bun:latest
  script:
    - bun run ~/.claude/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts \
        --org "$CI_PROJECT_NAMESPACE" --output ./reports \
        --ad-config ./data/ad-config.json --identity ./data/ad-identity.json
  artifacts:
    paths:
      - reports/
```

## Troubleshooting

### "bun: command not found"

Install Bun runtime:

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc  # or source ~/.zshrc
```

### "Cannot find module" errors

Verify skill files were copied correctly:

```bash
find ~/.claude/skills/ADSecurityAssessment -type f | wc -l
# Should show 20+ files
```

### PowerShell AD module errors

On Windows, ensure RSAT tools are installed:

```powershell
Get-WindowsCapability -Online | Where-Object Name -like 'Rsat.ActiveDirectory*'
# If not installed:
Add-WindowsCapability -Online -Name 'Rsat.ActiveDirectory.DS-LDS.Tools~~~~0.0.1.0'
```

### Permission denied on scripts

Fix script permissions:

```bash
chmod +x ~/.claude/skills/ADSecurityAssessment/Scripts/*.sh
chmod +x ~/.claude/skills/ADSecurityAssessment/Tools/*.ts
```

## Verification

After installation, verify everything works:

```bash
# Run verification checks
bun run ~/.claude/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts --help

# Should display usage information without errors
```

See **VERIFY.md** for detailed verification tests.

## Next Steps

Now that installation is complete:

1. **Read QUICKSTART.md** - Walk through your first assessment
2. **Collect Data** - Use PowerShell scripts to export AD/Azure data
3. **Run Assessment** - Execute `assess.sh` for interactive assessment
4. **Review Dashboard** - Open the generated HTML report

## Uninstallation

To remove the skill:

```bash
# Remove skill files
rm -rf ~/.claude/skills/ADSecurityAssessment

# Remove skill registration from settings
# Edit ~/.claude/settings.json and remove ADSecurityAssessment entry

# Optional: Remove assessment data
rm -rf ~/assessments/
```

## Getting Help

- Check **QUICKSTART.md** for step-by-step guidance
- Review **EXAMPLES.md** for command examples
- Read **INTEGRATED-WORKFLOW.md** for advanced usage
- See **Findings/** directory for remediation guidance

## Security Note

This skill processes sensitive Active Directory and Azure AD data. Ensure:
- Assessment data is encrypted at rest
- Data files have restricted permissions (chmod 600)
- Secure deletion after processing (use `shred` on Linux)
- Network transfers use encryption (SSH, HTTPS)
- Compliance with your organization's data handling policies

---

**Installation Complete!** Proceed to QUICKSTART.md for your first assessment.
