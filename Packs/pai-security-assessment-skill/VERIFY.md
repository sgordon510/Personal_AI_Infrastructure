# Verification Guide: PAI Security Assessment Skill

This guide helps you verify that the Security Assessment skill is correctly installed and functioning.

## Quick Verification

Run this one-liner to check if everything is working:

```bash
bun run ~/.claude/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts --help && echo "✓ Security Assessment Skill is working!"
```

## Detailed Verification

### 1. File Structure Check

Verify all required files exist:

```bash
# Check main directories
test -d ~/.claude/skills/ADSecurityAssessment && echo "✓ Skill directory exists" || echo "✗ Skill directory missing"
test -d ~/.claude/skills/ADSecurityAssessment/Tools && echo "✓ Tools directory exists" || echo "✗ Tools directory missing"
test -d ~/.claude/skills/ADSecurityAssessment/Scripts && echo "✓ Scripts directory exists" || echo "✗ Scripts directory missing"
test -d ~/.claude/skills/ADSecurityAssessment/Findings && echo "✓ Findings directory exists" || echo "✗ Findings directory missing"

# Check assessment tools
test -f ~/.claude/skills/ADSecurityAssessment/Tools/AssessADMisconfigs.ts && echo "✓ AssessADMisconfigs.ts exists" || echo "✗ Missing"
test -f ~/.claude/skills/ADSecurityAssessment/Tools/AnalyzePrivileges.ts && echo "✓ AnalyzePrivileges.ts exists" || echo "✗ Missing"
test -f ~/.claude/skills/ADSecurityAssessment/Tools/AuditAzureAD.ts && echo "✓ AuditAzureAD.ts exists" || echo "✗ Missing"
test -f ~/.claude/skills/ADSecurityAssessment/Tools/ParseBloodHound.ts && echo "✓ ParseBloodHound.ts exists" || echo "✗ Missing"
test -f ~/.claude/skills/ADSecurityAssessment/Tools/ParsePingCastle.ts && echo "✓ ParsePingCastle.ts exists" || echo "✗ Missing"
test -f ~/.claude/skills/ADSecurityAssessment/Tools/GenerateExecutiveReport.ts && echo "✓ GenerateExecutiveReport.ts exists" || echo "✗ Missing"
test -f ~/.claude/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts && echo "✓ RunFullAssessment.ts exists" || echo "✗ Missing"

# Check scripts
test -f ~/.claude/skills/ADSecurityAssessment/Scripts/Export-ADData.ps1 && echo "✓ Export-ADData.ps1 exists" || echo "✗ Missing"
test -f ~/.claude/skills/ADSecurityAssessment/Scripts/Export-AzureADData.ps1 && echo "✓ Export-AzureADData.ps1 exists" || echo "✗ Missing"
test -x ~/.claude/skills/ADSecurityAssessment/Scripts/assess.sh && echo "✓ assess.sh exists and is executable" || echo "✗ Missing or not executable"
test -x ~/.claude/skills/ADSecurityAssessment/Scripts/run-production-assessment.sh && echo "✓ run-production-assessment.sh exists and is executable" || echo "✗ Missing or not executable"

# Check documentation
test -f ~/.claude/skills/ADSecurityAssessment/README.md && echo "✓ README.md exists" || echo "✗ Missing"
test -f ~/.claude/skills/ADSecurityAssessment/QUICKSTART.md && echo "✓ QUICKSTART.md exists" || echo "✗ Missing"
test -f ~/.claude/skills/ADSecurityAssessment/EXAMPLES.md && echo "✓ EXAMPLES.md exists" || echo "✗ Missing"
test -f ~/.claude/skills/ADSecurityAssessment/SKILL.md && echo "✓ SKILL.md exists" || echo "✗ Missing"
```

Expected output: All checks should show "✓"

### 2. Runtime Check

Verify Bun runtime is available:

```bash
# Check Bun installation
command -v bun >/dev/null 2>&1 && echo "✓ Bun runtime found" || echo "✗ Bun not installed"

# Check Bun version
bun --version
```

Expected: Bun version 1.0.0 or higher

### 3. Tool Execution Check

Test each tool individually:

```bash
cd ~/.claude/skills/ADSecurityAssessment

# Test RunFullAssessment (master script)
echo "Testing RunFullAssessment..."
bun run Tools/RunFullAssessment.ts --help >/dev/null 2>&1 && echo "✓ RunFullAssessment works" || echo "✗ Failed"

# Note: Individual tool tests would require sample data files
# We'll verify they can at least be parsed by Bun
echo "Testing individual tools..."
for tool in Tools/*.ts; do
  tool_name=$(basename "$tool")
  bun --eval "import('$tool')" >/dev/null 2>&1 && echo "✓ $tool_name can be loaded" || echo "✗ $tool_name has syntax errors"
done
```

### 4. Script Permissions Check

Verify scripts have correct permissions:

```bash
# Check executable permissions
stat -c "%a %n" ~/.claude/skills/ADSecurityAssessment/Scripts/*.sh

# Expected: 755 or 750 for .sh files
```

### 5. PAI Skill Registration Check

Verify the skill is registered with PAI:

```bash
# Check if skill is in PAI settings (if settings file exists)
if [ -f ~/.claude/settings.json ]; then
  grep -q "ADSecurityAssessment" ~/.claude/settings.json && echo "✓ Skill registered in PAI" || echo "⚠ Skill not in settings (may be auto-discovered)"
else
  echo "⚠ PAI settings file not found (this may be normal)"
fi

# Check SKILL.md has proper format
grep -q "^---$" ~/.claude/skills/ADSecurityAssessment/SKILL.md && echo "✓ SKILL.md has proper frontmatter" || echo "✗ SKILL.md missing frontmatter"
```

## Functional Testing

### Test 1: Sample Data Test

Create minimal sample data and test assessment:

```bash
# Create test directory
mkdir -p /tmp/security-assessment-test

# Create minimal AD config sample
cat > /tmp/security-assessment-test/test-ad-config.json <<'EOF'
{
  "domain": "test.local",
  "passwordPolicy": {
    "minimumPasswordLength": 8,
    "maximumPasswordAge": 180,
    "passwordComplexity": true,
    "passwordHistory": 12
  },
  "ldapSettings": {
    "ldapSigning": false,
    "channelBinding": false,
    "ssl": false
  },
  "domainControllers": [
    {
      "name": "DC01",
      "os": "Windows Server 2019",
      "lastPatchDate": "2024-01-01"
    }
  ],
  "serviceAccounts": []
}
EOF

# Test AD misconfiguration assessment
echo "Testing AssessADMisconfigs with sample data..."
bun run ~/.claude/skills/ADSecurityAssessment/Tools/AssessADMisconfigs.ts \
  /tmp/security-assessment-test/test-ad-config.json \
  > /tmp/security-assessment-test/test-output.txt

# Check if output was generated
if [ -s /tmp/security-assessment-test/test-output.txt ]; then
  echo "✓ AssessADMisconfigs produced output"

  # Check if findings were detected
  grep -q "\[CRITICAL\]\|\[HIGH\]\|\[MEDIUM\]" /tmp/security-assessment-test/test-output.txt && \
    echo "✓ Findings detected in sample data" || \
    echo "⚠ No findings detected (may be expected for minimal data)"

  # Show sample output
  echo ""
  echo "Sample output (first 10 lines):"
  head -n 10 /tmp/security-assessment-test/test-output.txt
else
  echo "✗ AssessADMisconfigs produced no output"
fi

# Cleanup
rm -rf /tmp/security-assessment-test
```

### Test 2: Interactive Launcher Test

Test the interactive launcher with dry-run:

```bash
# This test requires user interaction, so we'll just verify it starts
echo "Testing interactive launcher..."
timeout 2 ~/.claude/skills/ADSecurityAssessment/Scripts/assess.sh 2>&1 | head -n 5
# Should show the banner and prompt for organization name
```

### Test 3: Executive Report Generation (Minimal)

Test dashboard generation with minimal data:

```bash
# Create minimal report file
mkdir -p /tmp/report-test
echo "🔴 [CRITICAL] Test Finding" > /tmp/report-test/test-report.txt
echo "   Category: Test" >> /tmp/report-test/test-report.txt
echo "   Description: This is a test finding" >> /tmp/report-test/test-report.txt
echo "   Remediation: Fix the test issue" >> /tmp/report-test/test-report.txt

# Generate dashboard
bun run ~/.claude/skills/ADSecurityAssessment/Tools/GenerateExecutiveReport.ts \
  "Test Organization" \
  /tmp/report-test/test-report.txt \
  > /tmp/report-test/test-dashboard.html

# Verify HTML was generated
if [ -s /tmp/report-test/test-dashboard.html ]; then
  echo "✓ Executive dashboard generated"

  # Check for key HTML elements
  grep -q "<html" /tmp/report-test/test-dashboard.html && echo "✓ Valid HTML structure" || echo "✗ Invalid HTML"
  grep -q "Test Organization" /tmp/report-test/test-dashboard.html && echo "✓ Organization name included" || echo "✗ Missing org name"
  grep -q "Security Score" /tmp/report-test/test-dashboard.html && echo "✓ Security score present" || echo "✗ Missing security score"
else
  echo "✗ Executive dashboard generation failed"
fi

# Cleanup
rm -rf /tmp/report-test
```

## Common Issues and Fixes

### Issue: "bun: command not found"

**Fix:**
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### Issue: "Permission denied" on scripts

**Fix:**
```bash
chmod +x ~/.claude/skills/ADSecurityAssessment/Scripts/*.sh
```

### Issue: Tools have syntax errors

**Fix:**
```bash
# Re-install the pack
rm -rf ~/.claude/skills/ADSecurityAssessment
cp -r Packs/pai-security-assessment-skill/src/skills/ADSecurityAssessment ~/.claude/skills/
```

### Issue: Skill not found by Claude Code

**Fix:**
```bash
# Check SKILL.md format
head -n 5 ~/.claude/skills/ADSecurityAssessment/SKILL.md

# Should show:
# ---
# name: ADSecurityAssessment
# description: ...
# ---
```

## Performance Benchmark

Test assessment performance with sample data:

```bash
# Create sample data (if you have it)
# Time a full assessment run
time bun run ~/.claude/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts \
  --org "Test" --output /tmp/test-output \
  --ad-config ~/sample-data/ad-config.json \
  --identity ~/sample-data/ad-identity.json

# Expected: < 5 seconds for small datasets (< 1000 users)
# Expected: < 30 seconds for medium datasets (1000-10000 users)
# Expected: < 2 minutes for large datasets (> 10000 users)
```

## Integration Tests

### Test PowerShell Scripts (Windows Only)

On a Windows system:

```powershell
# Test AD data export script syntax
PowerShell.exe -File Export-ADData.ps1 -WhatIf

# Test Azure AD data export script syntax
PowerShell.exe -File Export-AzureADData.ps1 -WhatIf
```

## Verification Summary

After running all checks, you should see:

- ✓ All files present
- ✓ Bun runtime available
- ✓ Tools executable and can be loaded
- ✓ Scripts have correct permissions
- ✓ Sample assessment produces output
- ✓ Dashboard generation works

If any checks fail, review the troubleshooting section in **INSTALL.md**.

## Next Steps

Once verification is complete:

1. Read **QUICKSTART.md** for your first real assessment
2. Review **EXAMPLES.md** for command examples
3. Collect production data using PowerShell scripts
4. Run your first complete assessment

---

**Verification Complete!** Your Security Assessment Skill is ready to use.
