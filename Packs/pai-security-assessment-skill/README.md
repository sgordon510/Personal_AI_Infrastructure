# PAI Security Assessment Skill

Comprehensive Active Directory and Azure AD security assessment tool for Personal AI Infrastructure.

## Overview

This pack provides a complete security assessment system for identity infrastructure, including:

- **AD Security Analysis**: Detect misconfigurations, weak policies, and security gaps
- **Privilege Escalation Detection**: Identify dangerous permissions and attack paths
- **Azure AD Security Posture**: Assess MFA, Conditional Access, PIM, and security defaults
- **BloodHound Integration**: Parse and analyze BloodHound data for attack path findings
- **PingCastle Integration**: Extract and prioritize findings from PingCastle risk assessments
- **Executive Dashboard**: Generate business-friendly HTML reports with security scoring
- **One-Command Orchestration**: Run complete assessments with a single command

## What's Included

### Assessment Tools (TypeScript)
- `AssessADMisconfigs.ts` - AD configuration security analysis
- `AnalyzePrivileges.ts` - Privilege escalation risk detection
- `AuditAzureAD.ts` - Azure AD security posture assessment
- `ParseBloodHound.ts` - BloodHound data parser and analyzer
- `ParsePingCastle.ts` - PingCastle report parser
- `GenerateExecutiveReport.ts` - Executive dashboard generator
- `RunFullAssessment.ts` - Master orchestration script

### Data Collection Scripts
- `Export-ADData.ps1` (PowerShell) - Active Directory data export
- `Export-AzureADData.ps1` (PowerShell) - Azure AD data export via Microsoft Graph
- `assess.sh` (Bash) - Interactive assessment launcher
- `run-production-assessment.sh` (Bash) - Auto-detect wrapper script

### Documentation
- `QUICKSTART.md` - Step-by-step guide for first production assessment
- `EXAMPLES.md` - Command examples for all scenarios
- `INTEGRATED-WORKFLOW.md` - Advanced integration patterns
- `EXECUTIVE-REPORTING.md` - Monthly reporting workflow
- `Findings/` - Detailed remediation guides

## Use Cases

### Information Security Managers
- Monthly security assessments for compliance reporting
- Track security posture improvements over time
- Generate executive-friendly dashboards for leadership
- Identify and prioritize remediation efforts

### Security Architects
- Validate security designs against best practices
- Identify privilege escalation paths before attackers do
- Assess impact of configuration changes
- Document security baselines

### Compliance Teams
- Demonstrate controls for audits (SOC 2, ISO 27001, PCI-DSS)
- Track remediation of audit findings
- Generate evidence for compliance frameworks
- Monitor ongoing compliance status

### Penetration Testers
- Automate initial reconnaissance
- Identify low-hanging fruit vulnerabilities
- Generate comprehensive assessment reports
- Integrate with BloodHound for attack path analysis

## Key Features

✅ **Production-Ready**: Includes data collection scripts for real-world use
✅ **Comprehensive**: Covers AD, Azure AD, BloodHound, and PingCastle
✅ **Executive Reporting**: Beautiful HTML dashboards for non-technical audiences
✅ **Risk Scoring**: 0-100 security scores based on weighted findings
✅ **Detailed Remediation**: Step-by-step fixes for every finding
✅ **Automation-Friendly**: CLI tools designed for CI/CD integration
✅ **Privacy-Focused**: All processing happens locally, no cloud dependencies

## Quick Start

After installation, run your first assessment:

```bash
# Interactive launcher (easiest)
~/.claude/skills/ADSecurityAssessment/Scripts/assess.sh

# Or use the master script directly
bun run ~/.claude/skills/ADSecurityAssessment/Tools/RunFullAssessment.ts \
  --org "Your Organization" \
  --output ~/reports/$(date +%Y%m%d) \
  --ad-config ~/data/ad-config.json \
  --identity ~/data/ad-identity.json \
  --azure ~/data/azure-ad.json
```

## Documentation

Full documentation is included in the skill:
- **QUICKSTART.md** - Your first assessment in 10 minutes
- **EXAMPLES.md** - Copy-paste command examples
- **INTEGRATED-WORKFLOW.md** - BloodHound & PingCastle integration
- **EXECUTIVE-REPORTING.md** - Monthly reporting best practices

## Requirements

- **Runtime**: Bun (for TypeScript tools)
- **Data Collection**: PowerShell 5.1+ with AD module (Windows)
- **Optional**: Microsoft Graph PowerShell SDK (for Azure AD)
- **Optional**: BloodHound and/or PingCastle (for enhanced analysis)

## Architecture

```
Data Collection (PowerShell)
    ↓
JSON Exports (Local Storage)
    ↓
Assessment Tools (TypeScript/Bun)
    ↓
Text Reports + Executive Dashboard (HTML)
    ↓
Distribution (Email, SharePoint, SIEM)
```

All processing happens locally. No cloud services required.

## Support

This is an open-source PAI pack. For issues or contributions:
- Review the included documentation
- Check EXAMPLES.md for common scenarios
- Customize tools to fit your environment

## License

Part of Personal AI Infrastructure (PAI). See LICENSE in repository root.

## Version

1.0.0 - Initial release with complete AD/Azure security assessment capabilities
