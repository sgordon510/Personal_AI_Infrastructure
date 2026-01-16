#!/usr/bin/env bun
// Privilege & Access Analysis Tool
// Identifies privilege escalation risks and overprivileged accounts

import { readFileSync } from 'fs';

interface Account {
  samAccountName: string;
  distinguishedName: string;
  memberOf?: string[];
  lastLogon?: string;
  pwdLastSet?: string;
  userAccountControl?: number;
  adminCount?: number;
  servicePrincipalNames?: string[];
}

interface Group {
  name: string;
  members: string[];
  description?: string;
}

interface ACL {
  objectDN: string;
  trustee: string;
  rights: string[];
  isInherited: boolean;
}

interface IdentityData {
  accounts: Account[];
  groups?: Group[];
  acls?: ACL[];
}

interface PrivilegeFinding {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: string;
  account: string;
  issue: string;
  impact: string;
  remediation: string;
}

const PRIVILEGED_GROUPS = [
  'Domain Admins',
  'Enterprise Admins',
  'Schema Admins',
  'Administrators',
  'Account Operators',
  'Backup Operators',
  'Server Operators',
  'Print Operators',
];

const DANGEROUS_RIGHTS = [
  'GenericAll',
  'GenericWrite',
  'WriteOwner',
  'WriteDacl',
  'DCSync',
  'AddMember',
  'ForceChangePassword',
];

function analyzePrivilegedAccounts(accounts: Account[]): PrivilegeFinding[] {
  const findings: PrivilegeFinding[] = [];

  accounts.forEach((account) => {
    // Check for overprivileged accounts
    const privilegedGroups = (account.memberOf || []).filter((group) =>
      PRIVILEGED_GROUPS.some((pg) => group.includes(pg))
    );

    if (privilegedGroups.length > 0) {
      // Check for dormant admin accounts
      if (account.lastLogon) {
        const lastLogonDate = new Date(account.lastLogon);
        const daysSinceLogon = Math.floor(
          (Date.now() - lastLogonDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLogon > 90) {
          findings.push({
            severity: 'HIGH',
            category: 'Dormant Privileged Account',
            account: account.samAccountName,
            issue: `Privileged account has not logged in for ${daysSinceLogon} days`,
            impact: 'Dormant privileged accounts are attractive targets for attackers and may indicate compromised or forgotten accounts',
            remediation: `Review account usage and disable if no longer needed. Member of: ${privilegedGroups.join(', ')}`,
          });
        }
      }

      // Check for stale passwords on privileged accounts
      if (account.pwdLastSet) {
        const pwdDate = new Date(account.pwdLastSet);
        const daysSinceChanged = Math.floor(
          (Date.now() - pwdDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceChanged > 180) {
          findings.push({
            severity: 'HIGH',
            category: 'Stale Privileged Password',
            account: account.samAccountName,
            issue: `Privileged account password has not been changed in ${daysSinceChanged} days`,
            impact: 'Long-lived passwords on privileged accounts increase the risk of credential compromise',
            remediation: 'Enforce regular password changes for privileged accounts (recommended: 60-90 days)',
          });
        }
      }
    }

    // Check for Kerberoastable accounts (accounts with SPNs)
    if (account.servicePrincipalNames && account.servicePrincipalNames.length > 0) {
      findings.push({
        severity: 'MEDIUM',
        category: 'Kerberoastable Account',
        account: account.samAccountName,
        issue: `Account has Service Principal Names (SPNs) and may be vulnerable to Kerberoasting`,
        impact: 'Attackers can request service tickets and perform offline password cracking',
        remediation: 'Use strong passwords (25+ characters) for service accounts or migrate to Group Managed Service Accounts (gMSAs)',
      });
    }

    // Check for accounts with adminCount=1 (indicates current or former privileged access)
    if (account.adminCount === 1 && privilegedGroups.length === 0) {
      findings.push({
        severity: 'MEDIUM',
        category: 'Residual Privilege Marker',
        account: account.samAccountName,
        issue: 'Account has adminCount=1 but is not currently in privileged groups',
        impact: 'May have non-inherited ACLs or represent former admin access that was not properly cleaned up',
        remediation: 'Review account permissions and clean up residual privileges',
      });
    }
  });

  return findings;
}

function analyzeGroupMembership(groups: Group[], accounts: Account[]): PrivilegeFinding[] {
  const findings: PrivilegeFinding[] = [];

  PRIVILEGED_GROUPS.forEach((privGroupName) => {
    const group = groups.find((g) => g.name.includes(privGroupName));

    if (group) {
      // Check for excessive membership in privileged groups
      if (group.members.length > 5) {
        findings.push({
          severity: 'HIGH',
          category: 'Excessive Privileged Group Membership',
          account: group.name,
          issue: `${group.name} has ${group.members.length} members (recommended: <5 for highly privileged groups)`,
          impact: 'Large privileged groups increase attack surface and make access control harder to manage',
          remediation: 'Review membership and implement least privilege. Use role-based delegation instead of direct admin group membership',
        });
      }

      // Check for service accounts in privileged groups
      group.members.forEach((memberDN) => {
        if (memberDN.toLowerCase().includes('svc_') || memberDN.toLowerCase().includes('service')) {
          findings.push({
            severity: 'CRITICAL',
            category: 'Service Account in Privileged Group',
            account: memberDN,
            issue: `Service account detected in ${group.name}`,
            impact: 'Service accounts with privileged access are high-value targets and often have weak security controls',
            remediation: 'Remove service accounts from privileged groups. Use Group Managed Service Accounts (gMSAs) with least privilege',
          });
        }
      });
    }
  });

  return findings;
}

function analyzeACLs(acls: ACL[]): PrivilegeFinding[] {
  const findings: PrivilegeFinding[] = [];

  acls.forEach((acl) => {
    // Check for dangerous permissions
    const dangerousPerms = acl.rights.filter((right) =>
      DANGEROUS_RIGHTS.some((dr) => right.includes(dr))
    );

    if (dangerousPerms.length > 0 && !acl.isInherited) {
      const severity = dangerousPerms.some((p) => p.includes('GenericAll') || p.includes('DCSync'))
        ? 'CRITICAL'
        : 'HIGH';

      findings.push({
        severity,
        category: 'Dangerous ACL Permission',
        account: acl.trustee,
        issue: `${acl.trustee} has dangerous permissions on ${acl.objectDN}: ${dangerousPerms.join(', ')}`,
        impact: 'These permissions can be exploited for privilege escalation or lateral movement',
        remediation: 'Review and remove unnecessary permissions. Implement least privilege access controls',
      });
    }

    // Check for DCSync rights specifically
    if (acl.rights.some((r) => r.includes('DS-Replication-Get-Changes'))) {
      findings.push({
        severity: 'CRITICAL',
        category: 'DCSync Rights Detected',
        account: acl.trustee,
        issue: `${acl.trustee} has DCSync rights (DS-Replication-Get-Changes) on ${acl.objectDN}`,
        impact: 'DCSync rights allow an attacker to dump all domain credentials, including KRBTGT hash',
        remediation: 'Remove DCSync rights from non-domain controller accounts immediately. Audit for potential compromise',
      });
    }
  });

  return findings;
}

function findPrivilegeEscalationPaths(accounts: Account[], acls: ACL[]): PrivilegeFinding[] {
  const findings: PrivilegeFinding[] = [];

  // Simple privilege escalation path detection
  // In production, this would use graph analysis (like BloodHound)

  accounts.forEach((account) => {
    // Check if non-privileged account has write access to privileged objects
    const hasWriteToPrivileged = acls.some(
      (acl) =>
        acl.trustee.includes(account.samAccountName) &&
        acl.rights.some((r) => r.includes('GenericWrite') || r.includes('WriteProperty')) &&
        PRIVILEGED_GROUPS.some((pg) => acl.objectDN.includes(pg))
    );

    if (hasWriteToPrivileged) {
      findings.push({
        severity: 'CRITICAL',
        category: 'Privilege Escalation Path',
        account: account.samAccountName,
        issue: `Account has write permissions to privileged group objects`,
        impact: 'Can modify privileged group membership to escalate privileges',
        remediation: 'Remove write permissions to privileged groups. Implement proper access controls',
      });
    }
  });

  return findings;
}

function generateReport(findings: PrivilegeFinding[]): void {
  // Sort by severity
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   AD SECURITY ASSESSMENT - PRIVILEGE ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const summary = findings.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('SUMMARY:');
  console.log(`  🔴 CRITICAL: ${summary.CRITICAL || 0}`);
  console.log(`  🟠 HIGH:     ${summary.HIGH || 0}`);
  console.log(`  🟡 MEDIUM:   ${summary.MEDIUM || 0}`);
  console.log(`  🔵 LOW:      ${summary.LOW || 0}`);
  console.log(`  ⚪ INFO:     ${summary.INFO || 0}`);
  console.log(`\n  Total Findings: ${findings.length}\n`);

  console.log('═══════════════════════════════════════════════════════════\n');

  findings.forEach((finding) => {
    const icon = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
      LOW: '🔵',
      INFO: '⚪',
    }[finding.severity];

    console.log(`${icon} [${finding.severity}] ${finding.category}`);
    console.log(`   Account: ${finding.account}`);
    console.log(`   Issue: ${finding.issue}`);
    console.log(`   Impact: ${finding.impact}`);
    console.log(`   Remediation: ${finding.remediation}`);
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════════\n');
}

// Main execution
try {
  const inputFile = process.argv[2];

  if (!inputFile) {
    console.error('Usage: bun run AnalyzePrivileges.ts <identity-data.json>');
    console.error('\nExample input JSON structure:');
    console.error(JSON.stringify({
      accounts: [
        {
          samAccountName: 'jdoe',
          distinguishedName: 'CN=John Doe,OU=Users,DC=example,DC=com',
          memberOf: ['CN=Domain Admins,CN=Users,DC=example,DC=com'],
          lastLogon: '2025-01-01T00:00:00Z',
          pwdLastSet: '2024-01-01T00:00:00Z',
          adminCount: 1,
        },
      ],
      groups: [
        {
          name: 'Domain Admins',
          members: ['CN=jdoe,...', 'CN=admin,...'],
        },
      ],
      acls: [
        {
          objectDN: 'DC=example,DC=com',
          trustee: 'jdoe',
          rights: ['GenericAll'],
          isInherited: false,
        },
      ],
    }, null, 2));
    process.exit(1);
  }

  const data: IdentityData = JSON.parse(readFileSync(inputFile, 'utf-8'));

  if (!data.accounts || data.accounts.length === 0) {
    console.error('Error: No accounts found in input data');
    process.exit(1);
  }

  const allFindings: PrivilegeFinding[] = [];

  // Run all analyses
  allFindings.push(...analyzePrivilegedAccounts(data.accounts));

  if (data.groups) {
    allFindings.push(...analyzeGroupMembership(data.groups, data.accounts));
  }

  if (data.acls) {
    allFindings.push(...analyzeACLs(data.acls));
    allFindings.push(...findPrivilegeEscalationPaths(data.accounts, data.acls));
  }

  // Generate report
  generateReport(allFindings);

  // Exit with appropriate code
  const hasCritical = allFindings.some((f) => f.severity === 'CRITICAL');
  process.exit(hasCritical ? 1 : 0);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
