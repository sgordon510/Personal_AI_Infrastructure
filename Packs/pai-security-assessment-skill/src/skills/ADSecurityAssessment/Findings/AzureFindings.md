# Azure AD Security Findings Reference

Common security findings in Azure AD/Entra ID environments with remediation guidance.

---

## Multi-Factor Authentication

### Low MFA Adoption
**Risk:** Password-based attacks, credential stuffing, phishing

**Indicators:**
- < 100% MFA enrollment for privileged accounts
- < 80% MFA enrollment for all users
- No MFA enforcement policies

**Remediation:**
**Option 1: Security Defaults** (Small organizations)
```
Azure AD → Properties → Manage Security defaults → Enable
```
- Requires MFA for all users
- Blocks legacy authentication
- Requires MFA for privileged roles

**Option 2: Conditional Access** (Recommended for enterprises)
```
Create CA policy:
- Users: All users
- Cloud apps: All cloud apps
- Grant: Require multi-factor authentication
```

**References:**
- Microsoft Zero Trust guidance
- Azure AD MFA deployment guide

### Privileged Accounts Without MFA
**Risk:** High-value targets without additional protection

**Critical Roles:**
- Global Administrator
- Security Administrator
- Privileged Role Administrator
- User Administrator
- Exchange Administrator

**Remediation:**
1. Create Conditional Access policy targeting privileged roles
2. Require MFA for all administrative actions
3. Implement PIM (eligible vs permanent assignments)
4. Monitor privileged account sign-ins

---

## Conditional Access

### No Conditional Access Policies
**Risk:** Missing dynamic security controls, no risk-based access

**Baseline Policies:**
1. **Require MFA for administrators**
2. **Require MFA for all users**
3. **Block legacy authentication**
4. **Require device compliance for apps**
5. **Require password change on high user risk**
6. **Block access from untrusted locations**

### Policies in Report-Only Mode
**Risk:** Security controls not enforced

**Remediation Process:**
1. Review report-only policy impact for 2-4 weeks
2. Identify false positives
3. Adjust policy scope/conditions
4. Enable enforcement
5. Monitor for issues

### Missing Risk-Based Policies
**Risk:** No automated response to identity threats

**Recommended Policies:**
```
Sign-in Risk Policy:
- Condition: Sign-in risk high or medium
- Grant: Require MFA

User Risk Policy:
- Condition: User risk high
- Grant: Require password change
```

**Requirements:**
- Azure AD Premium P2
- Identity Protection enabled

---

## Privileged Identity Management (PIM)

### No PIM Configuration
**Risk:** Permanent privileged access, excessive standing privileges

**Impact:**
- Increased attack surface
- Insider threat risk
- Compliance violations (SOC 2, ISO 27001)

**Implementation Steps:**
1. Enable Azure AD PIM (requires P2 license)
2. Convert Global Admin assignments to eligible
3. Configure activation requirements
4. Set up access reviews

### Permanent Role Assignments
**Risk:** Standing privileged access violates least privilege principle

**Remediation:**
```
For each privileged role:
1. Navigate to PIM → Azure AD roles
2. Identify permanent assignments
3. Convert to eligible assignments
4. Set maximum activation duration (8 hours)
5. Require MFA + justification for activation
```

**Exceptions:**
- Break-glass accounts (2 max)
- Service principals (carefully reviewed)

### Weak Activation Requirements
**Risk:** Easy privilege escalation for attackers

**Best Practices:**
- ✅ Require MFA for activation
- ✅ Require justification
- ✅ Require approval for high-privilege roles
- ✅ Send notifications on activation
- ✅ Set maximum duration ≤ 8 hours

### No Access Reviews
**Risk:** Privilege creep, dormant assignments

**Configuration:**
```
PIM → Access Reviews → Create
- Scope: Role assignments
- Frequency: Quarterly
- Reviewers: Role owners
- Auto-remove: After 3 missed reviews
```

---

## Legacy Authentication

### Legacy Auth Protocols Enabled
**Risk:** Bypasses MFA, Conditional Access, and modern security controls

**Vulnerable Protocols:**
- Basic Authentication
- POP3/IMAP
- SMTP AUTH
- Legacy ActiveSync

**Attack Vectors:**
- Password spraying
- Credential stuffing
- No MFA enforcement

**Remediation:**
1. Identify clients using legacy auth (Azure AD sign-in logs)
2. Migrate clients to modern auth (OAuth 2.0)
3. Create CA policy to block legacy auth
4. Monitor for blocked attempts

**Conditional Access Policy:**
```
Name: Block Legacy Authentication
- Users: All users
- Cloud apps: All cloud apps
- Conditions: Client apps = Legacy authentication clients
- Grant: Block access
```

**References:**
- Microsoft's legacy auth deprecation timeline

---

## Guest User Management

### Excessive Guest Access
**Risk:** External users with unnecessary access

**Best Practices:**
1. Limit guest invitations to specific users
2. Require approval for guest access
3. Set guest user permissions to most restrictive
4. Implement expiration policies

**Configuration:**
```
Azure AD → External Identities → External collaboration settings
- Guest user access: Most restrictive
- Guest invite settings: Specific admin roles
- Enable guest self-service sign-up: No
```

### Stale Guest Accounts
**Risk:** Former partners/contractors with lingering access

**Indicators:**
- No sign-in activity > 90 days
- Created by users no longer in organization
- Access to sensitive applications

**Remediation:**
1. Implement access reviews for guests (quarterly)
2. Set guest account expiration (180 days)
3. Automated cleanup via Logic Apps
4. Regular manual audits

**PowerShell Cleanup:**
```powershell
# Find stale guests
$staleDate = (Get-Date).AddDays(-90)
Get-AzureADUser -Filter "userType eq 'Guest'" -All $true |
    Where-Object {$_.RefreshTokensValidFromDateTime -lt $staleDate}
```

---

## Security Baseline

### Security Defaults Disabled
**Risk:** No baseline security protections

**Security Defaults Include:**
- MFA for all users (when risk detected)
- MFA for administrators (always)
- Block legacy authentication
- Protect privileged activities

**When to use Security Defaults:**
- Small organizations (< 100 users)
- No Conditional Access policies
- Quick security wins

**When to use Conditional Access instead:**
- Granular control needed
- Multiple policies required
- Enterprise scenarios

### Password Protection Not Configured
**Risk:** Users choosing organization-specific weak passwords

**Custom Banned Passwords:**
- Company name and variations
- Product names
- Office locations
- Industry terms
- Previously breached passwords from your org

**Configuration:**
```
Azure AD → Security → Authentication methods
→ Password protection → Custom banned password list
Add: company names, products, locations (1000 max)
```

---

## Identity Protection

### High-Risk Users Unaddressed
**Risk:** Compromised accounts operating in environment

**Risk Indicators:**
- Leaked credentials
- Atypical travel
- Anonymous IP usage
- Malware-linked IP
- Suspicious sign-ins

**Automated Remediation:**
```
Conditional Access Policy:
- Condition: User risk = High
- Grant: Require password change + MFA
```

### No Investigation Workflow
**Risk:** Threats go unnoticed or unaddressed

**Recommended Process:**
1. Daily review of risky users/sign-ins
2. Investigate unfamiliar locations/IPs
3. Confirm compromised or dismiss false positives
4. Force password reset if compromised
5. Review access after resolution

**Tools:**
- Azure AD Identity Protection dashboard
- Risk detection API for SIEM integration
- Security alerts via email/webhook

---

## Application Security

### Overprivileged App Consents
**Risk:** Applications with excessive permissions

**Red Flags:**
- User consent for high-privilege apps
- Delegated permissions for admin APIs
- offline_access + sensitive scopes

**Remediation:**
1. Review app permissions (Azure AD → Enterprise applications)
2. Disable user consent for apps
3. Require admin consent workflow
4. Audit app permissions quarterly

**Dangerous Permissions:**
- Mail.ReadWrite (read/modify all mail)
- Files.ReadWrite.All (access all files)
- User.ReadWrite.All (modify users)
- Directory.ReadWrite.All (modify directory)

### Unmanaged Applications
**Risk:** Shadow IT, data exfiltration

**Discovery:**
- Microsoft Defender for Cloud Apps
- Azure AD app discovery
- Sign-in logs analysis

**Controls:**
1. Conditional Access app control
2. Session policies for unmanaged apps
3. Download/copy restrictions
4. User education

---

## Monitoring & Detection

### Key Signals to Monitor

**Privileged Activity:**
- Role activations (PIM)
- Privilege escalations
- Sensitive directory changes
- Admin sign-ins from new locations

**Risky Behavior:**
- High-risk sign-ins
- Impossible travel
- Multiple failed sign-ins
- Legacy auth attempts (if blocked)

**Application:**
- High-privilege app consents
- New enterprise applications
- Service principal credential changes

### Azure AD Logs

**Sign-in Logs:**
- Location: Azure AD → Monitoring → Sign-ins
- Retention: 30 days (Premium P1/P2)
- Export to: Log Analytics, Storage, Event Hub, SIEM

**Audit Logs:**
- Directory changes
- Role assignments
- Application changes
- Policy modifications

**Risk Detections:**
- Identity Protection detections
- User and sign-in risk levels

### SIEM Integration

**Recommended Logs:**
```
Azure AD Sign-ins
Azure AD Audit
Azure AD Risk Detections
Azure AD Provisioning
Conditional Access
PIM Activity
```

**Alert Examples:**
- Global Admin role assigned
- Conditional Access policy disabled
- New enterprise application added
- High-risk user detected
- Multiple failed sign-ins from single IP

---

## Compliance & Governance

### No Access Certification
**Risk:** Privilege creep, stale access

**Remediation:**
```
Azure AD → Access Reviews
Create reviews for:
- Azure AD roles (quarterly)
- Group memberships (semi-annually)
- Application access (annually)
- Guest access (quarterly)
```

### Inadequate Audit Trail
**Risk:** Cannot investigate incidents

**Requirements:**
- Enable all Azure AD logs
- Export to Log Analytics (1-year retention)
- Backup audit logs externally (compliance)
- SIEM integration for real-time monitoring

---

## Remediation Priority

**Critical (Immediate):**
- Privileged accounts without MFA
- High-risk users unaddressed
- No Conditional Access + Security Defaults disabled
- DCSync-equivalent permissions (rare in Azure AD)

**High (1 week):**
- Legacy authentication enabled
- No PIM for privileged roles
- Permanent Global Admin assignments
- Overprivileged application consents

**Medium (1 month):**
- Stale guest accounts
- Missing risk-based CA policies
- No access reviews configured
- Password protection not enabled

**Low (Ongoing):**
- Monitoring improvements
- Documentation updates
- User training
- Quarterly access reviews
