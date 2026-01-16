# Active Directory Security Findings Reference

Common security findings in Active Directory environments with detailed remediation guidance.

---

## Password Policy Weaknesses

### Weak Minimum Password Length
**Risk:** Short passwords are vulnerable to brute force and password spraying attacks

**Indicators:**
- Minimum password length < 14 characters
- No complexity requirements
- Short maximum password age

**Remediation:**
1. Set minimum password length to 14+ characters
2. Enable password complexity requirements
3. Configure password history (24 previous passwords)
4. Set maximum password age to 60-90 days

**References:**
- NIST SP 800-63B
- CIS Benchmark for Active Directory

---

## LDAP Security

### LDAP Signing Not Enforced
**Risk:** Man-in-the-middle attacks, credential theft, LDAP relay attacks

**Attack Vectors:**
- LDAP relay to AD FS
- Credential interception
- Session hijacking

**Remediation:**
```powershell
# Enable LDAP signing requirement
Set-ADDomainController -Identity DC01 -LDAPServerIntegrity 2

# Verify LDAP signing
Get-ADDomainController -Filter * | Select-Object Name, LDAPServerIntegrity
```

**References:**
- Microsoft KB 935834
- CVE-2020-1041

### LDAPS Not Enforced
**Risk:** Credentials transmitted in cleartext

**Remediation:**
1. Install certificate on all DCs
2. Disable LDAP port 389
3. Enforce LDAPS (port 636) only

---

## Privilege Escalation Risks

### Kerberoasting
**Risk:** Service accounts with SPNs can be targeted for offline password cracking

**Indicators:**
- Service accounts with weak passwords
- SPNs registered for user accounts
- High-privilege service accounts

**Remediation:**
1. Use Group Managed Service Accounts (gMSAs)
2. Set service account passwords to 25+ random characters
3. Remove unnecessary SPNs
4. Monitor for Kerberoast attempts (Event ID 4769)

**Detection:**
```powershell
# Find accounts with SPNs
Get-ADUser -Filter {ServicePrincipalName -like "*"} -Properties ServicePrincipalName
```

### AS-REP Roasting
**Risk:** Accounts without Kerberos pre-auth can be cracked offline

**Indicators:**
- DONT_REQ_PREAUTH flag set
- Typically older service or legacy accounts

**Remediation:**
```powershell
# Find vulnerable accounts
Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true}

# Fix individual account
Set-ADAccountControl -Identity username -DoesNotRequirePreAuth $false
```

### DCSync Rights
**Risk:** Non-DC accounts with replication rights can dump all domain credentials

**Impact:**
- Dump KRBTGT hash
- Dump all user NTLM hashes
- Full domain compromise

**Remediation:**
1. Audit replication permissions immediately
2. Remove DS-Replication-Get-Changes rights from non-DC accounts
3. Investigate for compromise
4. Consider KRBTGT password reset if compromise suspected

**Detection:**
```powershell
# Find accounts with DCSync rights
Import-Module ActiveDirectory
$RootDSE = Get-ADRootDSE
$DomainDN = $RootDSE.defaultNamingContext
(Get-Acl "AD:$DomainDN").Access | Where-Object {
    $_.ObjectType -eq '1131f6aa-9c07-11d1-f79f-00c04fc2dcd2' -or
    $_.ObjectType -eq '1131f6ad-9c07-11d1-f79f-00c04fc2dcd2'
}
```

---

## Group Policy Security

### Weak GPO Permissions
**Risk:** Unauthorized modification of Group Policy Objects

**Remediation:**
1. Audit GPO permissions
2. Remove excessive edit rights
3. Use delegation for specific administrative tasks
4. Enable GPO audit logging

### GPP Passwords
**Risk:** Credentials stored in Group Policy Preferences (legacy issue)

**Remediation:**
1. Remove all GPP-stored passwords
2. Use LAPS for local admin passwords
3. Audit SYSVOL for cpassword attribute

---

## Domain Controller Security

### Unpatched Domain Controllers
**Risk:** Exploitation of known vulnerabilities

**Critical Patches:**
- PrintNightmare (CVE-2021-34527)
- ZeroLogon (CVE-2020-1472)
- PetitPotam (CVE-2021-36942)
- Kerberos vulnerabilities

**Remediation:**
1. Apply all security updates monthly
2. Test patches in staging first
3. Use WSUS or SCCM for patch management
4. Monitor Microsoft Security Response Center

---

## Service Account Security

### Dormant Privileged Accounts
**Risk:** Forgotten accounts with administrative access

**Indicators:**
- No logon activity > 90 days
- AdminCount = 1
- Member of privileged groups

**Remediation:**
1. Implement regular access reviews
2. Disable unused accounts after 90 days
3. Remove from privileged groups
4. Document service account lifecycle

### Stale Passwords on Service Accounts
**Risk:** Long-lived credentials increase compromise risk

**Remediation:**
1. Migrate to Group Managed Service Accounts
2. Rotate passwords every 90-180 days
3. Use 25+ character random passwords
4. Document password rotation procedures

---

## Attack Path Analysis

### Privilege Escalation Paths
**Common Paths:**
- GenericAll on privileged group
- WriteDACL on domain object
- AddMember rights on admin groups
- GPO edit rights + GPO linked to domain
- OU permissions + create computer objects

**Tools:**
- BloodHound - graph-based analysis
- PingCastle - automated assessment
- Purple Knight - AD security scoring

**Remediation:**
1. Use BloodHound to identify paths
2. Remove unnecessary permissions
3. Implement tiered administration model
4. Regular access reviews

---

## Monitoring & Detection

### Key Event IDs
- 4624/4625 - Logon success/failure
- 4672 - Special privileges assigned
- 4768 - Kerberos TGT request
- 4769 - Kerberos service ticket (Kerberoasting)
- 4776 - NTLM authentication
- 5136 - Directory object modified

### Detection Rules
1. Multiple failed logons (password spraying)
2. Service ticket requests for SPNs (Kerberoasting)
3. TGT requests without pre-auth (AS-REP Roasting)
4. Replication requests from non-DCs (DCSync)
5. Sensitive group modifications

---

## Remediation Priority

**Immediate (24 hours):**
- DCSync rights on non-DC accounts
- Unpatched DCs with critical vulnerabilities
- Privileged accounts without MFA
- LDAP signing not enforced

**High (1 week):**
- Kerberoasting vulnerable accounts
- AS-REP Roasting vulnerabilities
- Dormant privileged accounts
- Weak password policies

**Medium (1 month):**
- Service account password rotation
- GPO permission review
- Legacy protocol usage
- Access reviews

**Low (Ongoing):**
- Documentation updates
- Monitoring improvements
- User security training
