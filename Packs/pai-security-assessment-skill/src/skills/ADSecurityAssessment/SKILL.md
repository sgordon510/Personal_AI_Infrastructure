---
name: ADSecurityAssessment
description: Active Directory and Azure AD security assessment tool. USE WHEN user wants to assess AD/Azure environments, analyze security posture, detect misconfigurations, or generate security reports.
---

# AD/Azure Security Assessment

Comprehensive security assessment tool for Active Directory and Azure AD environments.

## Capabilities

### 1. Misconfiguration Detection
Identify security weaknesses in AD configurations:
- Weak Group Policy Objects (GPOs)
- Insecure password policies
- Exposed credentials and service accounts
- Unpatched domain controllers
- Insecure LDAP configurations

### 2. Privilege & Access Analysis
Analyze identity and access risks:
- Overprivileged accounts
- Dormant administrative accounts
- Privilege escalation paths
- Risky permission assignments
- Service account security
- Kerberos delegation risks

### 3. Azure AD Security Posture
Evaluate cloud identity security:
- Multi-factor authentication (MFA) gaps
- Conditional access policy weaknesses
- Legacy authentication usage
- Privileged Identity Management (PIM) configuration
- Identity Protection findings
- Guest user risks

## Master Script (Recommended)

### RunFullAssessment
```bash
bun run $PAI_DIR/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts \
  --org "Your Organization" \
  --output ./reports \
  [data source options]
```
**One-command comprehensive assessment** that runs all tools and generates executive dashboard. Integrates PAI assessments, BloodHound, and PingCastle.

**See `INTEGRATED-WORKFLOW.md` for complete guide.**

## Individual Assessment Tools

### AssessADMisconfigs
```bash
bun run $PAI_DIR/skills/ADSecurityAssessment/Tools/AssessADMisconfigs.ts [domain-data.json]
```
Analyzes AD configuration for security weaknesses.

### AnalyzePrivileges
```bash
bun run $PAI_DIR/skills/ADSecurityAssessment/Tools/AnalyzePrivileges.ts [identity-data.json]
```
Identifies privilege escalation risks and overprivileged accounts.

### AuditAzureAD
```bash
bun run $PAI_DIR/skills/ADSecurityAssessment/Tools/AuditAzureAD.ts [azure-ad-data.json]
```
Evaluates Azure AD security configuration.

### ParseBloodHound
```bash
bun run $PAI_DIR/skills/ADSecurityAssessment/Tools/ParseBloodHound.ts [bloodhound-dir]
```
Parses BloodHound JSON output and extracts security findings (Kerberoasting, AS-REP roasting, unconstrained delegation, attack paths, etc.)

### ParsePingCastle
```bash
bun run $PAI_DIR/skills/ADSecurityAssessment/Tools/ParsePingCastle.ts [pingcastle-report.xml]
```
Parses PingCastle XML/HTML reports and converts risk rules to findings format.

### GenerateExecutiveReport
```bash
bun run $PAI_DIR/skills/ADSecurityAssessment/Tools/GenerateExecutiveReport.ts [reports-dir] [org-name] [output.html]
```
Generates executive-friendly HTML dashboard for leadership review. Aggregates findings from all assessments into a visual, business-focused report.

## Usage

**Quick Assessment:**
```
"Assess this Active Directory environment for security issues"
[Provide AD export data]
```

**Privilege Analysis:**
```
"Analyze these accounts for privilege escalation risks"
[Provide identity/permission data]
```

**Azure AD Audit:**
```
"Audit this Azure AD tenant for security gaps"
[Provide Azure AD export]
```

**Executive Reporting:**
```
"Generate an executive dashboard from these assessment reports for monthly leadership review"
[Provide assessment report files]
```

See `EXECUTIVE-REPORTING.md` for detailed workflow guide.

## Findings Database

Reference documentation for common findings:
- `Findings/ADFindings.md` - Active Directory security issues
- `Findings/AzureFindings.md` - Azure AD security findings
- `Findings/Remediation.md` - Remediation guidance

## Data Sources

This skill works with data from:
- **AD:** PowerShell exports, BloodHound data, LDAP queries
- **Azure AD:** Microsoft Graph API exports, Azure AD Connect data
- **Third-party tools:** Tenable, CrowdStrike, Azure Security Center

## Security Note

This skill is for authorized security assessments only. Ensure you have proper authorization before assessing any environment.
