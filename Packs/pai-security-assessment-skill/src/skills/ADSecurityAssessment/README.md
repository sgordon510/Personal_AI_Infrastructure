# AD/Azure Security Assessment Skill

Comprehensive security assessment tool for Active Directory and Azure AD (Entra ID) environments. Part of your Personal AI Infrastructure.

## Overview

This PAI skill provides automated security assessments for identity infrastructure, identifying misconfigurations, privilege escalation risks, and security gaps.

**Capabilities:**
- ✅ AD misconfiguration detection
- ✅ Privilege & access analysis
- ✅ Azure AD security posture assessment
- ✅ BloodHound & PingCastle integration
- ✅ Executive dashboard generation
- ✅ One-command orchestration
- ✅ Automated remediation guidance
- ✅ Risk-prioritized findings

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Step-by-step guide for your first production assessment
- **[EXAMPLES.md](EXAMPLES.md)** - Command examples for all scenarios
- **[INTEGRATED-WORKFLOW.md](INTEGRATED-WORKFLOW.md)** - Advanced integration with BloodHound/PingCastle
- **[EXECUTIVE-REPORTING.md](EXECUTIVE-REPORTING.md)** - Monthly reporting workflow and dashboard customization
- **[Findings/](Findings/)** - Detailed remediation guides for common issues

## Quick Start

### Easiest Way: Interactive Launcher

```bash
# Run the interactive menu-driven launcher
~/.claude/skills/ADSecurityAssessment/Scripts/assess.sh

# It will:
# 1. Prompt for organization name
# 2. Auto-detect all available data sources
# 3. Run complete assessment
# 4. Generate executive dashboard
# 5. Offer to open in browser
```

### Advanced: Manual Commands

#### 1. Assess Active Directory Misconfigurations

```bash
cd ~/.claude/skills/ADSecurityAssessment
bun run Tools/AssessADMisconfigs.ts /path/to/ad-config.json
```

### 2. Analyze Privilege Escalation Risks

```bash
bun run Tools/AnalyzePrivileges.ts /path/to/identity-data.json
```

### 3. Audit Azure AD Security

```bash
bun run Tools/AuditAzureAD.ts /path/to/azure-ad-data.json
```

## Data Collection

### Active Directory Data

**PowerShell Export:**
```powershell
# Export domain configuration
$config = @{
    domain = (Get-ADDomain).DNSRoot
    passwordPolicy = Get-ADDefaultDomainPasswordPolicy | Select-Object *
    ldapSettings = @{
        ldapSigning = (Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\NTDS\Parameters" -Name "LDAPServerIntegrity").LDAPServerIntegrity -eq 2
        channelBinding = $true  # Check manually
        ssl = $true  # Check manually
    }
    domainControllers = Get-ADDomainController -Filter * | Select-Object HostName, OperatingSystem, @{N='LastPatchDate';E={(Get-HotFix -ComputerName $_.HostName | Sort-Object InstalledOn -Descending | Select-Object -First 1).InstalledOn}}
    serviceAccounts = Get-ADUser -Filter {ServicePrincipalName -like "*"} -Properties ServicePrincipalName, PasswordLastSet, DoesNotRequirePreAuth | Select-Object SamAccountName, @{N='passwordLastSet';E={$_.PasswordLastSet}}, @{N='kerberosPreAuthRequired';E={-not $_.DoesNotRequirePreAuth}}
}

$config | ConvertTo-Json -Depth 5 | Out-File ad-config.json
```

### Identity & Privilege Data

```powershell
# Export accounts and groups
$identityData = @{
    accounts = Get-ADUser -Filter * -Properties MemberOf, LastLogonDate, PasswordLastSet, AdminCount, ServicePrincipalName | Select-Object SamAccountName, DistinguishedName, @{N='memberOf';E={$_.MemberOf}}, @{N='lastLogon';E={$_.LastLogonDate}}, @{N='pwdLastSet';E={$_.PasswordLastSet}}, AdminCount, @{N='servicePrincipalNames';E={$_.ServicePrincipalName}}

    groups = Get-ADGroup -Filter {Name -like "*Admin*"} -Properties Members | Select-Object Name, @{N='members';E={$_.Members}}
}

$identityData | ConvertTo-Json -Depth 5 | Out-File identity-data.json
```

### Azure AD Data

**Microsoft Graph PowerShell:**
```powershell
Connect-MgGraph -Scopes "User.Read.All", "Policy.Read.All", "RoleManagement.Read.Directory"

$azureADData = @{
    users = Get-MgUser -All -Property UserPrincipalName, DisplayName, UserType, AccountEnabled, SignInActivity, CreatedDateTime | ForEach-Object {
        $mfaStatus = (Get-MgUserAuthenticationMethod -UserId $_.Id).Count -gt 1 ? "enabled" : "disabled"
        @{
            userPrincipalName = $_.UserPrincipalName
            displayName = $_.DisplayName
            userType = $_.UserType
            accountEnabled = $_.AccountEnabled
            mfaStatus = $mfaStatus
            lastSignIn = $_.SignInActivity.LastSignInDateTime
            createdDateTime = $_.CreatedDateTime
        }
    }

    conditionalAccessPolicies = Get-MgIdentityConditionalAccessPolicy | Select-Object DisplayName, State, Conditions, GrantControls

    legacyAuthEnabled = $true  # Check via sign-in logs or tenant settings
    securityDefaults = (Get-MgPolicyIdentitySecurityDefaultEnforcementPolicy).IsEnabled
}

$azureADData | ConvertTo-Json -Depth 10 | Out-File azure-ad-data.json
```

## Understanding Output

### Severity Levels

- 🔴 **CRITICAL** - Immediate risk, potential for full compromise
- 🟠 **HIGH** - Significant security gap, should address within 1 week
- 🟡 **MEDIUM** - Important issue, plan remediation within 1 month
- 🔵 **LOW** - Minor improvement, address as time permits
- ⚪ **INFO** - Informational finding, no immediate action required

### Report Structure

```
═══════════════════════════════════════
   ASSESSMENT TYPE
═══════════════════════════════════════

SUMMARY:
  🔴 CRITICAL: X
  🟠 HIGH: X
  🟡 MEDIUM: X
  🔵 LOW: X
  ⚪ INFO: X

[Detailed findings sorted by severity]
```

## Integration with PAI

### Use via Natural Language

Simply ask me:
```
"Assess this Active Directory configuration for security issues"
[Provide/attach data file]
```

I'll:
1. Identify the appropriate assessment tool
2. Run the analysis
3. Explain the findings in context
4. Recommend prioritized remediation steps

### Automated Workflows

Create workflows that:
- Run assessments on schedule
- Compare results over time
- Track remediation progress
- Generate executive summaries

## Findings Database

**Reference Documentation:**
- `Findings/ADFindings.md` - Active Directory security issues and remediation
- `Findings/AzureFindings.md` - Azure AD security findings and fixes

These contain:
- Detailed attack descriptions
- Detection methods
- Step-by-step remediation
- PowerShell commands
- Industry references

## Data Sources

### Recommended Tools

**Active Directory:**
- PowerShell AD module (built-in)
- BloodHound (graph analysis)
- PingCastle (automated assessment)
- Purple Knight (scoring)

**Azure AD:**
- Microsoft Graph PowerShell
- Azure AD PowerShell
- Azure Portal exports
- Identity Protection data

**Third-Party Integrations:**
- Tenable Identity Exposure
- CrowdStrike Falcon Identity Protection
- Microsoft Defender for Identity
- Semperis Purple Knight

## Use Cases

### Security Assessments
- Quarterly internal audits
- Pre-merger infrastructure review
- Compliance validation
- Post-incident forensics

### Continuous Monitoring
- Scheduled assessments
- Drift detection
- Compliance tracking
- Security posture metrics

### Incident Response
- Privilege escalation analysis
- Compromise assessment
- Attack path identification
- Blast radius determination

## Limitations

**Current Version:**
- Requires manual data export (no direct API integration yet)
- Focuses on configuration, not behavioral analytics
- Simplified privilege escalation path analysis

**Future Enhancements:**
- Direct Azure AD/Graph API integration
- Real-time data collection
- BloodHound integration
- Automated remediation scripts
- Trend analysis over time

## Security Notice

**Authorization Required:**
- This tool is for authorized security assessments only
- Ensure proper permissions before collecting data
- Follow your organization's security assessment policies
- Protect exported data (contains sensitive info)

**Data Handling:**
- Exported JSON files contain sensitive identity data
- Store securely, encrypt if needed
- Delete after assessment
- Never commit to public repositories

## Examples

### Example 1: Quick AD Assessment

```bash
# Export basic AD config
pwsh -c "Get-ADDomain | ConvertTo-Json > ad-basic.json"

# Run assessment
bun run Tools/AssessADMisconfigs.ts ad-basic.json

# Review critical findings
# Focus on CRITICAL and HIGH severity items first
```

### Example 2: Privilege Analysis

```bash
# Export privileged accounts
pwsh -c "Get-ADGroupMember 'Domain Admins' -Recursive | Get-ADUser -Properties * | ConvertTo-Json > admins.json"

# Analyze
bun run Tools/AnalyzePrivileges.ts admins.json
```

### Example 3: Azure AD Audit

```bash
# Quick Azure AD export (requires Graph API permissions)
# Use provided PowerShell script above

# Audit
bun run Tools/AuditAzureAD.ts azure-ad-data.json

# Review MFA compliance and CA policies first
```

## Troubleshooting

**"Cannot find module":**
```bash
# Ensure Bun is installed
bun --version

# Run from skill directory
cd ~/.claude/skills/ADSecurityAssessment
```

**"Invalid JSON":**
- Check JSON syntax with: `cat file.json | jq .`
- Ensure UTF-8 encoding
- Remove BOM if present

**"No findings generated":**
- Verify input data structure matches examples
- Check for empty arrays/objects in input
- Review console for parse errors

## Contributing

This is part of your personal PAI infrastructure. Customize as needed:

- Add organization-specific checks
- Adjust severity thresholds
- Add custom remediation guidance
- Integrate with your SIEM/ticketing

## References

- [Microsoft AD Security Best Practices](https://docs.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices)
- [Azure AD Security Operations Guide](https://docs.microsoft.com/en-us/azure/active-directory/fundamentals/security-operations-introduction)
- [MITRE ATT&CK for Enterprise](https://attack.mitre.org/tactics/enterprise/)
- [CIS Benchmarks for AD/Azure AD](https://www.cisecurity.org/cis-benchmarks)

---

**Version:** 1.0.0
**Created:** 2026-01-16
**Part of:** Spence's Personal AI Infrastructure
