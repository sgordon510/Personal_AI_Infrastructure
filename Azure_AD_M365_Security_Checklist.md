# Azure, Microsoft Entra ID & Microsoft 365 Security Configuration Checklist

> **Last Updated:** January 2026
> **Purpose:** Comprehensive security configuration checklist for Azure, Microsoft Entra ID (formerly Azure Active Directory), and Microsoft 365/Office 365 environments.

---

## Table of Contents

1. [Microsoft Entra ID (Identity & Access)](#1-microsoft-entra-id-identity--access)
2. [Conditional Access Policies](#2-conditional-access-policies)
3. [Privileged Identity Management (PIM)](#3-privileged-identity-management-pim)
4. [Azure Infrastructure Security](#4-azure-infrastructure-security)
5. [Azure Network Security](#5-azure-network-security)
6. [Azure Data Protection & Encryption](#6-azure-data-protection--encryption)
7. [Microsoft Defender for Cloud](#7-microsoft-defender-for-cloud)
8. [Microsoft 365 Email Security](#8-microsoft-365-email-security)
9. [SharePoint & OneDrive Security](#9-sharepoint--onedrive-security)
10. [Microsoft Teams Security](#10-microsoft-teams-security)
11. [Data Loss Prevention (DLP)](#11-data-loss-prevention-dlp)
12. [Audit & Monitoring](#12-audit--monitoring)
13. [Microsoft Secure Score](#13-microsoft-secure-score)
14. [CISA SCuBA Compliance](#14-cisa-scuba-compliance)

---

## 1. Microsoft Entra ID (Identity & Access)

### Multi-Factor Authentication (MFA)

- [ ] **Enable MFA for all users** - MFA blocks 99.9% of identity attacks
  [Microsoft Learn: MFA Setup](https://learn.microsoft.com/en-us/entra/identity/authentication/howto-mfa-getstarted)

- [ ] **Prioritize phishing-resistant MFA methods:**
  - [ ] FIDO2 security keys
  - [ ] Passkeys
  - [ ] Windows Hello for Business
  - [ ] Certificate-based authentication
  [Microsoft Learn: Phishing-Resistant MFA](https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-strengths)

- [ ] **Disable SMS and voice call as MFA methods** (low-security options)
  [Microsoft Learn: Authentication Methods](https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-methods)

- [ ] **Block legacy authentication protocols** (POP3, IMAP, SMTP AUTH) - these don't support MFA
  [Microsoft Learn: Block Legacy Auth](https://learn.microsoft.com/en-us/entra/identity/conditional-access/block-legacy-authentication)

### User & Application Permissions

- [ ] **Restrict non-admin users from creating tenants** - Set to "Yes"
  [Microsoft Learn: Default User Permissions](https://learn.microsoft.com/en-us/entra/fundamentals/users-default-permissions)

- [ ] **Configure application consent settings:**
  - [ ] Set to "Allow user consent for apps from verified publishers, for selected permissions" OR
  - [ ] Set to "Let Microsoft manage your consent settings (Recommended)"
  [Microsoft Learn: App Consent](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-user-consent)

- [ ] **Restrict device join permissions:**
  - [ ] Set "Users may join devices to Microsoft Entra" to "Selected" groups
  - [ ] Enable "Require MFA to register or join devices with Microsoft Entra"
  [Microsoft Learn: Device Settings](https://learn.microsoft.com/en-us/entra/identity/devices/manage-device-identities)

### Password & Credential Security

- [ ] **Enable password hash synchronization** - Even if using federation, configure as backup
  [Microsoft Learn: Password Hash Sync](https://learn.microsoft.com/en-us/entra/identity/hybrid/connect/whatis-phs)

- [ ] **Configure self-service password reset (SSPR)** with strong authentication methods
  [Microsoft Learn: SSPR](https://learn.microsoft.com/en-us/entra/identity/authentication/howto-sspr-deployment)

- [ ] **Enable Microsoft Entra Password Protection** - Block common and custom banned passwords
  [Microsoft Learn: Password Protection](https://learn.microsoft.com/en-us/entra/identity/authentication/concept-password-ban-bad)

### Hybrid Identity Security

- [ ] **Do NOT synchronize highly privileged on-premises accounts** to Entra ID
  [Microsoft Learn: Hybrid Security](https://learn.microsoft.com/en-us/entra/architecture/secure-best-practices)

- [ ] **Ensure Global Administrator accounts are cloud-only** - No ties to on-premises AD
  [Microsoft Learn: Privileged Access](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/security-planning)

### Emergency Access (Break Glass) Accounts

- [ ] **Create at least 2 emergency access accounts** with:
  - [ ] Highly protected Global Administrator rights
  - [ ] Cloud-only authentication (not federated)
  - [ ] Excluded from Conditional Access policies
  - [ ] Different authentication methods than regular admins
  - [ ] Monitored for any sign-in activity
  [Microsoft Learn: Emergency Access](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/security-emergency-access)

---

## 2. Conditional Access Policies

### Core Policies

- [ ] **Require MFA for all users accessing all resources**
  [Microsoft Learn: Require MFA](https://learn.microsoft.com/en-us/entra/identity/conditional-access/howto-conditional-access-policy-all-users-mfa)

- [ ] **Require MFA for all administrators** (especially for Microsoft admin portals)
  [Microsoft Learn: Admin MFA](https://learn.microsoft.com/en-us/entra/identity/conditional-access/howto-conditional-access-policy-admin-mfa)

- [ ] **Block access for high-risk sign-ins** using Identity Protection
  [Microsoft Learn: Risk-Based Access](https://learn.microsoft.com/en-us/entra/id-protection/howto-identity-protection-configure-risk-policies)

- [ ] **Require password change for high-risk users**
  [Microsoft Learn: User Risk Policy](https://learn.microsoft.com/en-us/entra/id-protection/concept-identity-protection-policies)

- [ ] **Require compliant or Hybrid Azure AD joined devices**
  [Microsoft Learn: Device Compliance](https://learn.microsoft.com/en-us/entra/identity/conditional-access/howto-conditional-access-policy-compliant-device)

- [ ] **Block access from unauthorized geographic locations**
  [Microsoft Learn: Named Locations](https://learn.microsoft.com/en-us/entra/identity/conditional-access/howto-conditional-access-policy-location)

### Policy Configuration Best Practices

- [ ] **Use Conditional Access templates** aligned with Microsoft Zero Trust recommendations
  [Microsoft Learn: CA Templates](https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-conditional-access-policy-common)

- [ ] **Deploy policies in Report-Only mode first** before enforcement
  [Microsoft Learn: Report-Only Mode](https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-conditional-access-report-only)

- [ ] **Exclude break-glass accounts** from all CA policies
  [Microsoft Learn: CA Best Practices](https://learn.microsoft.com/en-us/entra/identity/conditional-access/plan-conditional-access)

- [ ] **Stay within 195 policy limit** per tenant
  [Microsoft Learn: CA Limits](https://learn.microsoft.com/en-us/entra/identity/conditional-access/plan-conditional-access)

- [ ] **Review Microsoft-managed policies** and adopt where appropriate
  [Microsoft Learn: Managed Policies](https://learn.microsoft.com/en-us/entra/identity/conditional-access/managed-policies)

---

## 3. Privileged Identity Management (PIM)

### Just-in-Time Access

- [ ] **Implement "no standing access"** - No permanent privileged role assignments
  [Microsoft Learn: PIM Overview](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure)

- [ ] **Configure just-in-time activation** for all privileged roles
  [Microsoft Learn: PIM Activation](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-how-to-activate-role)

- [ ] **Require MFA for all role activations**
  [Microsoft Learn: PIM Settings](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-resource-roles-configure-role-settings)

- [ ] **Require approval workflow** for sensitive role activations
  [Microsoft Learn: Approval Workflow](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-resource-roles-approval-workflow)

- [ ] **Require justification** for all role activations
  [Microsoft Learn: Role Settings](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-how-to-change-default-settings)

- [ ] **Set limited activation duration** (e.g., 1-8 hours maximum)
  [Microsoft Learn: Time-Bound Access](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure)

### Monitoring & Review

- [ ] **Enable alerts for privileged role activations**
  [Microsoft Learn: PIM Alerts](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-how-to-configure-security-alerts)

- [ ] **Configure regular access reviews** for privileged roles
  [Microsoft Learn: Access Reviews](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-create-roles-and-resource-roles-review)

- [ ] **Monitor all 28 Microsoft-tagged "Privileged" roles** (as of October 2025)
  [Microsoft Learn: Built-in Roles](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/permissions-reference)

- [ ] **Limit Global Administrators** to 5 or fewer
  [Microsoft Learn: Best Practices](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/best-practices)

---

## 4. Azure Infrastructure Security

### Virtual Machine Security

- [ ] **Enable Trusted Launch** for all new Gen2 VMs (default since 2024)
  [Microsoft Learn: Trusted Launch](https://learn.microsoft.com/en-us/azure/virtual-machines/trusted-launch)

- [ ] **Consider Confidential VMs** for sensitive workloads (AMD SEV-SNP)
  [Microsoft Learn: Confidential Computing](https://learn.microsoft.com/en-us/azure/confidential-computing/confidential-vm-overview)

- [ ] **Enable encryption at host** for end-to-end VM data encryption
  [Microsoft Learn: Encryption at Host](https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption)

- [ ] **Use Azure Disk Encryption** or Server-Side Encryption with customer-managed keys
  [Microsoft Learn: Disk Encryption](https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption-overview)

- [ ] **Apply OS security baselines** using Defender for Cloud recommendations
  [Microsoft Learn: Security Baselines](https://learn.microsoft.com/en-us/azure/defender-for-cloud/apply-security-baseline)

- [ ] **Enable Azure Update Management** for automated patching
  [Microsoft Learn: Update Management](https://learn.microsoft.com/en-us/azure/update-manager/overview)

- [ ] **Enable Just-in-Time (JIT) VM access** - Reduce exposure to management ports
  [Microsoft Learn: JIT Access](https://learn.microsoft.com/en-us/azure/defender-for-cloud/just-in-time-access-usage)

- [ ] **Use hardened VM images** from Azure Marketplace (CIS benchmarks)
  [Microsoft Learn: Hardened Images](https://learn.microsoft.com/en-us/azure/virtual-machines/linux/tutorial-secure-web-server)

### Resource Security

- [ ] **Enable Azure Resource Locks** on critical resources
  [Microsoft Learn: Resource Locks](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources)

- [ ] **Implement Azure Policy** for enforcing security standards at scale
  [Microsoft Learn: Azure Policy](https://learn.microsoft.com/en-us/azure/governance/policy/overview)

- [ ] **Use Azure Blueprints** for consistent security deployment
  [Microsoft Learn: Blueprints](https://learn.microsoft.com/en-us/azure/governance/blueprints/overview)

---

## 5. Azure Network Security

### Network Security Groups (NSGs)

- [ ] **Apply NSGs to all subnets and NICs**
  [Microsoft Learn: NSG Overview](https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview)

- [ ] **Review NSG rules regularly** - Remove overly permissive rules
  [Microsoft Learn: NSG Best Practices](https://learn.microsoft.com/en-us/azure/security/fundamentals/network-best-practices)

- [ ] **Never allow inbound from 'Any' or 'Internet'** to management ports
  [Microsoft Learn: NSG Rules](https://learn.microsoft.com/en-us/azure/virtual-network/manage-network-security-group)

- [ ] **Migrate from NSG flow logs to Virtual Network flow logs** (NSG flow logs deprecated after June 30, 2025)
  [Microsoft Learn: VNet Flow Logs](https://learn.microsoft.com/en-us/azure/network-watcher/vnet-flow-logs-overview)

### Azure Firewall & Perimeter Security

- [ ] **Deploy Azure Firewall** for centralized network security
  [Microsoft Learn: Azure Firewall](https://learn.microsoft.com/en-us/azure/firewall/overview)

- [ ] **Enable Azure DDoS Protection** for public-facing resources
  [Microsoft Learn: DDoS Protection](https://learn.microsoft.com/en-us/azure/ddos-protection/ddos-protection-overview)

- [ ] **Use Private Endpoints** for Azure PaaS services
  [Microsoft Learn: Private Endpoints](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview)

- [ ] **Implement Network Security Perimeter** (Preview) for PaaS resources
  [Microsoft Learn: Network Perimeter](https://learn.microsoft.com/en-us/azure/private-link/network-security-perimeter-concepts)

### 2025 Important Changes

- [ ] **Upgrade from Basic to Standard SKU public IPs** (Basic SKU retired September 30, 2025)
  [Microsoft Learn: Public IP SKUs](https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/public-ip-addresses)

- [ ] **Plan for removal of default outbound internet access** (September 30, 2025)
  [Microsoft Learn: Default Outbound](https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/default-outbound-access)

---

## 6. Azure Data Protection & Encryption

### Encryption at Rest

- [ ] **Verify Storage Service Encryption (SSE)** is enabled (default with Microsoft-managed keys)
  [Microsoft Learn: Storage Encryption](https://learn.microsoft.com/en-us/azure/storage/common/storage-service-encryption)

- [ ] **Consider customer-managed keys (CMK)** for sensitive data using Azure Key Vault
  [Microsoft Learn: CMK](https://learn.microsoft.com/en-us/azure/storage/common/customer-managed-keys-overview)

- [ ] **Enable Azure Disk Encryption** for VM OS and data disks
  [Microsoft Learn: ADE](https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption-overview)

### Encryption in Transit

- [ ] **Enforce TLS 1.2 or later** for all connections (required by August 31, 2025)
  [Microsoft Learn: TLS Requirements](https://learn.microsoft.com/en-us/azure/security/fundamentals/data-encryption-best-practices)

- [ ] **Enable HTTPS-only access** for storage accounts
  [Microsoft Learn: Secure Transfer](https://learn.microsoft.com/en-us/azure/storage/common/storage-require-secure-transfer)

- [ ] **Use Azure VPN Gateway or ExpressRoute** for hybrid connectivity
  [Microsoft Learn: VPN Gateway](https://learn.microsoft.com/en-us/azure/vpn-gateway/vpn-gateway-about-vpngateways)

### Azure Key Vault Security

- [ ] **Use Azure Key Vault Premium or Managed HSM** for encryption key management
  [Microsoft Learn: Key Vault Best Practices](https://learn.microsoft.com/en-us/azure/key-vault/general/best-practices)

- [ ] **Enable soft-delete and purge protection** on Key Vault
  [Microsoft Learn: Soft Delete](https://learn.microsoft.com/en-us/azure/key-vault/general/soft-delete-overview)

- [ ] **Configure key rotation policies**
  [Microsoft Learn: Key Rotation](https://learn.microsoft.com/en-us/azure/key-vault/keys/how-to-configure-key-rotation)

- [ ] **Enable Key Vault access logging**
  [Microsoft Learn: KV Logging](https://learn.microsoft.com/en-us/azure/key-vault/general/logging)

- [ ] **Use RBAC for Key Vault access control** (instead of access policies)
  [Microsoft Learn: KV RBAC](https://learn.microsoft.com/en-us/azure/key-vault/general/rbac-guide)

- [ ] **Backup Key Vault secrets/keys** that cannot be recreated
  [Microsoft Learn: Backup](https://learn.microsoft.com/en-us/azure/key-vault/general/backup)

---

## 7. Microsoft Defender for Cloud

### Enable Protection Plans

- [ ] **Enable Defender for Cloud** on all subscriptions
  [Microsoft Learn: Enable Defender](https://learn.microsoft.com/en-us/azure/defender-for-cloud/enable-enhanced-security)

- [ ] **Enable Defender CSPM** (Cloud Security Posture Management)
  [Microsoft Learn: Defender CSPM](https://learn.microsoft.com/en-us/azure/defender-for-cloud/concept-cloud-security-posture-management)

- [ ] **Enable Defender for Servers** (Plan 1 or Plan 2)
  [Microsoft Learn: Defender for Servers](https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-servers-introduction)

- [ ] **Enable Defender for Storage**
  [Microsoft Learn: Defender for Storage](https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-storage-introduction)

- [ ] **Enable Defender for Containers**
  [Microsoft Learn: Defender for Containers](https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-containers-introduction)

- [ ] **Enable Defender for Key Vault**
  [Microsoft Learn: Defender for KV](https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-key-vault-introduction)

- [ ] **Enable Defender for SQL**
  [Microsoft Learn: Defender for SQL](https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-sql-introduction)

### Configuration

- [ ] **Apply Microsoft Cloud Security Benchmark (MCSB)** as default standard
  [Microsoft Learn: MCSB](https://learn.microsoft.com/en-us/security/benchmark/azure/overview)

- [ ] **Configure auto-provisioning** for agents and extensions
  [Microsoft Learn: Auto-Provisioning](https://learn.microsoft.com/en-us/azure/defender-for-cloud/monitoring-components)

- [ ] **Enable Attack Disruption** with "Full - remediate threats automatically"
  [Microsoft Learn: Attack Disruption](https://learn.microsoft.com/en-us/defender-xdr/automatic-attack-disruption)

- [ ] **Review and remediate security recommendations** by risk priority
  [Microsoft Learn: Recommendations](https://learn.microsoft.com/en-us/azure/defender-for-cloud/review-security-recommendations)

- [ ] **Configure security alerts and notifications**
  [Microsoft Learn: Alerts](https://learn.microsoft.com/en-us/azure/defender-for-cloud/configure-email-notifications)

---

## 8. Microsoft 365 Email Security

### Email Authentication (SPF, DKIM, DMARC)

- [ ] **Configure SPF record** for your domain with `-all` (hard fail)
  [Microsoft Learn: SPF Setup](https://learn.microsoft.com/en-us/defender-office-365/email-authentication-spf-configure)

- [ ] **Enable DKIM signing** for all domains (disabled by default)
  [Microsoft Learn: DKIM Setup](https://learn.microsoft.com/en-us/defender-office-365/email-authentication-dkim-configure)

- [ ] **Implement DMARC** - Start with `p=none`, progress to `p=quarantine` then `p=reject`
  [Microsoft Learn: DMARC Setup](https://learn.microsoft.com/en-us/defender-office-365/email-authentication-dmarc-configure)

- [ ] **Configure DKIM and SPF for third-party email services** (Mailchimp, Salesforce, etc.)
  [Microsoft Learn: Third-Party Email](https://learn.microsoft.com/en-us/defender-office-365/email-authentication-about)

- [ ] **Use subdomains for bulk email services** to protect main domain reputation
  [Microsoft Learn: Email Best Practices](https://learn.microsoft.com/en-us/defender-office-365/email-authentication-about)

### Microsoft Defender for Office 365

- [ ] **Enable Safe Attachments** - Scan email attachments for malware
  [Microsoft Learn: Safe Attachments](https://learn.microsoft.com/en-us/defender-office-365/safe-attachments-about)

- [ ] **Enable Safe Links** - Scan URLs at time of click
  [Microsoft Learn: Safe Links](https://learn.microsoft.com/en-us/defender-office-365/safe-links-about)

- [ ] **Configure anti-phishing policies** with:
  - [ ] Mailbox intelligence
  - [ ] Impersonation protection
  - [ ] Spoof intelligence
  [Microsoft Learn: Anti-Phishing](https://learn.microsoft.com/en-us/defender-office-365/anti-phishing-protection-about)

- [ ] **Enable Zero-hour Auto Purge (ZAP)** for spam and malware
  [Microsoft Learn: ZAP](https://learn.microsoft.com/en-us/defender-office-365/zero-hour-auto-purge)

- [ ] **Configure preset security policies** (Standard or Strict)
  [Microsoft Learn: Preset Policies](https://learn.microsoft.com/en-us/defender-office-365/preset-security-policies)

### Exchange Online Security

- [ ] **Disable automatic email forwarding** to external addresses
  [Microsoft Learn: Mail Flow Rules](https://learn.microsoft.com/en-us/exchange/security-and-compliance/mail-flow-rules/mail-flow-rules)

- [ ] **Enable mailbox auditing** (enabled by default since 2019)
  [Microsoft Learn: Mailbox Auditing](https://learn.microsoft.com/en-us/purview/audit-mailboxes)

- [ ] **Configure connection filtering** to block known malicious IPs
  [Microsoft Learn: Connection Filtering](https://learn.microsoft.com/en-us/defender-office-365/connection-filter-policies-configure)

---

## 9. SharePoint & OneDrive Security

### External Sharing Controls

- [ ] **Limit SharePoint external sharing** to:
  - [ ] "Only people in your organization" OR
  - [ ] "Existing guests"
  [Microsoft Learn: Sharing Settings](https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off)

- [ ] **Limit OneDrive external sharing** to same or more restrictive than SharePoint
  [Microsoft Learn: OneDrive Sharing](https://learn.microsoft.com/en-us/sharepoint/manage-sharing)

- [ ] **Block sharing with specific domains** (competitors, high-risk countries)
  [Microsoft Learn: Domain Restrictions](https://learn.microsoft.com/en-us/sharepoint/restricted-domains-sharing)

- [ ] **Set expiration dates** for guest access and sharing links
  [Microsoft Learn: Guest Expiration](https://learn.microsoft.com/en-us/sharepoint/external-sharing-overview)

- [ ] **Disable anonymous sharing links** for sensitive sites
  [Microsoft Learn: Anonymous Links](https://learn.microsoft.com/en-us/sharepoint/change-external-sharing-site)

### Access Controls

- [ ] **Configure restricted access control** to limit access to specific security groups
  [Microsoft Learn: Restrict Access](https://learn.microsoft.com/en-us/sharepoint/limit-access)

- [ ] **Enable idle session sign-out** for SharePoint and OneDrive
  [Microsoft Learn: Idle Timeout](https://learn.microsoft.com/en-us/sharepoint/sign-out-inactive-users)

- [ ] **Require managed devices** for access to sensitive data
  [Microsoft Learn: Device Access](https://learn.microsoft.com/en-us/sharepoint/control-access-from-unmanaged-devices)

- [ ] **Configure Information Barriers** if needed for compliance
  [Microsoft Learn: Info Barriers](https://learn.microsoft.com/en-us/purview/information-barriers-sharepoint)

### Site Security

- [ ] **Apply sensitivity labels** to sites for automatic protection
  [Microsoft Learn: Site Labels](https://learn.microsoft.com/en-us/purview/sensitivity-labels-teams-groups-sites)

- [ ] **Enable versioning** to protect against ransomware
  [Microsoft Learn: Versioning](https://learn.microsoft.com/en-us/sharepoint/governance/versioning-content-approval-retention)

- [ ] **Configure site access requests** and approvals
  [Microsoft Learn: Access Requests](https://learn.microsoft.com/en-us/sharepoint/set-up-or-change-the-access-requests-list)

---

## 10. Microsoft Teams Security

### External & Guest Access

- [ ] **Review and configure external access settings** - Control federation with other organizations
  [Microsoft Learn: External Access](https://learn.microsoft.com/en-us/microsoftteams/manage-external-access)

- [ ] **Configure guest access policies** - Limit what guests can do
  [Microsoft Learn: Guest Access](https://learn.microsoft.com/en-us/microsoftteams/guest-access)

- [ ] **Block guest access** if not required by business
  [Microsoft Learn: Guest Settings](https://learn.microsoft.com/en-us/microsoftteams/set-up-guests)

### Meeting Security

- [ ] **Configure meeting policies** to control who can present, record, etc.
  [Microsoft Learn: Meeting Policies](https://learn.microsoft.com/en-us/microsoftteams/meeting-policies-overview)

- [ ] **Enable lobby** for external participants
  [Microsoft Learn: Lobby](https://learn.microsoft.com/en-us/microsoftteams/who-can-bypass-meeting-lobby)

- [ ] **Disable anonymous meeting join** if not needed
  [Microsoft Learn: Anonymous Join](https://learn.microsoft.com/en-us/microsoftteams/anonymous-users-in-meetings)

- [ ] **Configure watermarking** for sensitive meetings (E5)
  [Microsoft Learn: Watermarks](https://learn.microsoft.com/en-us/microsoftteams/watermark-meeting-content-video)

### App & Bot Security

- [ ] **Control which apps can be installed** in Teams
  [Microsoft Learn: App Policies](https://learn.microsoft.com/en-us/microsoftteams/manage-apps)

- [ ] **Block specific third-party apps** that pose security risks
  [Microsoft Learn: Block Apps](https://learn.microsoft.com/en-us/microsoftteams/manage-apps)

---

## 11. Data Loss Prevention (DLP)

### Policy Configuration

- [ ] **Create DLP policies** for sensitive information types:
  - [ ] Credit card numbers
  - [ ] Social Security Numbers
  - [ ] Health records (HIPAA)
  - [ ] Financial data
  - [ ] Custom sensitive data
  [Microsoft Learn: DLP Overview](https://learn.microsoft.com/en-us/purview/dlp-learn-about-dlp)

- [ ] **Apply DLP to all locations:**
  - [ ] Exchange Online
  - [ ] SharePoint Online
  - [ ] OneDrive
  - [ ] Teams
  - [ ] Endpoints (Windows/macOS)
  - [ ] Microsoft 365 Copilot (new in 2025)
  [Microsoft Learn: DLP Locations](https://learn.microsoft.com/en-us/purview/dlp-policy-reference)

- [ ] **Deploy policies in simulation mode first** before enforcement
  [Microsoft Learn: Test Mode](https://learn.microsoft.com/en-us/purview/dlp-test-dlp-policies)

- [ ] **Configure policy tips** to educate users
  [Microsoft Learn: Policy Tips](https://learn.microsoft.com/en-us/purview/dlp-policy-tips-reference)

### Advanced DLP Features

- [ ] **Enable Adaptive Protection** integration with Insider Risk Management
  [Microsoft Learn: Adaptive Protection](https://learn.microsoft.com/en-us/purview/insider-risk-management-adaptive-protection)

- [ ] **Configure DLP for Microsoft 365 Copilot** (new in 2025)
  [Microsoft Learn: DLP for Copilot](https://learn.microsoft.com/en-us/purview/dlp-microsoft365-copilot-location-learn-about)

- [ ] **Enable DLP for Windows Recall** on Copilot+ PCs
  [Microsoft Learn: DLP for Recall](https://learn.microsoft.com/en-us/purview/dlp-recall-get-started)

### Sensitivity Labels

- [ ] **Create and publish sensitivity labels** for document classification
  [Microsoft Learn: Sensitivity Labels](https://learn.microsoft.com/en-us/purview/sensitivity-labels)

- [ ] **Configure automatic labeling** for sensitive content
  [Microsoft Learn: Auto-Labeling](https://learn.microsoft.com/en-us/purview/apply-sensitivity-label-automatically)

- [ ] **Enable label encryption** for highly confidential data
  [Microsoft Learn: Label Encryption](https://learn.microsoft.com/en-us/purview/encryption-sensitivity-labels)

---

## 12. Audit & Monitoring

### Unified Audit Logging

- [ ] **Verify Unified Audit Logging is enabled** (default for most tenants)
  PowerShell: `Get-AdminAuditLogConfig | FL UnifiedAuditLogIngestionEnabled`
  [Microsoft Learn: Enable Auditing](https://learn.microsoft.com/en-us/purview/audit-log-enable-disable)

- [ ] **Understand retention periods:**
  - [ ] E3/Business Premium: 180 days (changed from 90 days in Oct 2023)
  - [ ] E5: 1 year default, extendable with retention policies
  [Microsoft Learn: Audit Retention](https://learn.microsoft.com/en-us/purview/audit-log-retention-policies)

- [ ] **Create custom audit log retention policies** for critical activities
  [Microsoft Learn: Retention Policies](https://learn.microsoft.com/en-us/purview/audit-log-retention-policies)

- [ ] **Monitor for audit logging being disabled** (indicator of compromise)
  [Microsoft Learn: Search Audit Log](https://learn.microsoft.com/en-us/purview/audit-search)

### SIEM Integration

- [ ] **Forward logs to Azure Monitor / Log Analytics**
  [Microsoft Learn: Azure Monitor](https://learn.microsoft.com/en-us/entra/identity/monitoring-health/howto-integrate-activity-logs-with-azure-monitor-logs)

- [ ] **Configure Microsoft Sentinel** for advanced threat detection
  [Microsoft Learn: Sentinel](https://learn.microsoft.com/en-us/azure/sentinel/overview)

- [ ] **Enable Office 365 connector** in Sentinel for M365 log ingestion
  [Microsoft Learn: O365 Connector](https://learn.microsoft.com/en-us/azure/sentinel/data-connectors/microsoft-365)

- [ ] **Create detection rules** for suspicious activities
  [Microsoft Learn: Analytics Rules](https://learn.microsoft.com/en-us/azure/sentinel/detect-threats-built-in)

### Alert Policies

- [ ] **Review and customize default alert policies**
  [Microsoft Learn: Alert Policies](https://learn.microsoft.com/en-us/purview/alert-policies)

- [ ] **Create custom alerts** for organization-specific risks
  [Microsoft Learn: Custom Alerts](https://learn.microsoft.com/en-us/purview/alert-policies)

- [ ] **Configure email notifications** for critical alerts
  [Microsoft Learn: Notifications](https://learn.microsoft.com/en-us/purview/alert-policies)

---

## 13. Microsoft Secure Score

### Monitoring

- [ ] **Access Secure Score** in Microsoft Defender portal
  [Microsoft Secure Score](https://security.microsoft.com/securescore)

- [ ] **Target score above 80%** for strong security posture
  [Microsoft Learn: Secure Score](https://learn.microsoft.com/en-us/defender-xdr/microsoft-secure-score)

- [ ] **Review score trends** over time using new trend chart feature (2025)
  [Microsoft Learn: Track History](https://learn.microsoft.com/en-us/defender-xdr/microsoft-secure-score-history-metrics-trends)

### Focus Areas (2025 Categorization)

- [ ] **Identity** - MFA, Conditional Access, PIM
- [ ] **Device** - Compliance policies, Intune baselines, updates
- [ ] **Apps** - App protection, consent controls
- [ ] **Data** - DLP, sensitivity labels, encryption
  [Microsoft Learn: Improvement Actions](https://learn.microsoft.com/en-us/defender-xdr/microsoft-secure-score-improvement-actions)

### High-Impact Actions

- [ ] **Implement all "High Impact" recommendations first**
  [Microsoft Learn: Prioritization](https://learn.microsoft.com/en-us/defender-xdr/microsoft-secure-score-improvement-actions)

- [ ] **Address identity-related recommendations** - Most impactful category
  [Microsoft Learn: Identity Actions](https://learn.microsoft.com/en-us/defender-xdr/microsoft-secure-score-improvement-actions)

- [ ] **Document score for cyber insurance** requirements (increasingly important in 2025)
  [CoreView: Secure Score Playbook](https://www.coreview.com/blog/secure-score-playbook)

---

## 14. CISA SCuBA Compliance

### Overview

The Secure Cloud Business Applications (SCuBA) project provides secure configuration baselines for Microsoft 365. While mandatory for US federal agencies (BOD 25-01), all organizations can benefit from these baselines.

**Compliance Deadlines (Federal Agencies):**
- February 21, 2025: Identify all Microsoft 365 cloud tenants
- June 20, 2025: Implement SCuBA secure configuration baselines

### SCuBA Baselines by Service

- [ ] **Microsoft Entra ID baseline** - Identity and access controls
  [CISA: Entra ID Baseline](https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/aad.md)

- [ ] **Microsoft Defender for Office 365 baseline** - Email protection
  [CISA: Defender Baseline](https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/defender.md)

- [ ] **Exchange Online baseline** - Mail flow and mailbox security
  [CISA: Exchange Baseline](https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/exo.md)

- [ ] **Microsoft Teams baseline** - Collaboration security
  [CISA: Teams Baseline](https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/teams.md)

- [ ] **SharePoint Online / OneDrive baseline** - File sharing security
  [CISA: SharePoint Baseline](https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/sharepoint.md)

- [ ] **Power Platform baseline** - Low-code app security
  [CISA: Power Platform Baseline](https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/powerplatform.md)

### ScubaGear Assessment Tool

- [ ] **Install ScubaGear** from PowerShell Gallery:
  ```powershell
  Install-Module -Name ScubaGear
  ```
  [GitHub: ScubaGear](https://github.com/cisagov/ScubaGear)

- [ ] **Run assessment** against your tenant
  [CISA: SCuBA Project](https://www.cisa.gov/resources-tools/services/secure-cloud-business-applications-scuba-project)

- [ ] **Review HTML/JSON/CSV reports** for compliance gaps
  [CISA: Using ScubaGear](https://github.com/cisagov/ScubaGear#readme)

- [ ] **Remediate findings** based on priority and risk
  [CISA: Baselines](https://www.cisa.gov/news-events/news/cisa-finalizes-microsoft-365-secure-configuration-baselines)

---

## Quick Reference: Key Resources

| Resource | Link |
|----------|------|
| Microsoft Entra Admin Center | https://entra.microsoft.com |
| Microsoft Defender Portal | https://security.microsoft.com |
| Microsoft Purview Portal | https://purview.microsoft.com |
| Azure Portal | https://portal.azure.com |
| Microsoft Secure Score | https://security.microsoft.com/securescore |
| CISA SCuBA Project | https://www.cisa.gov/resources-tools/services/secure-cloud-business-applications-scuba-project |
| ScubaGear GitHub | https://github.com/cisagov/ScubaGear |
| Microsoft Cloud Security Benchmark | https://learn.microsoft.com/en-us/security/benchmark/azure/overview |
| Microsoft Security Best Practices | https://learn.microsoft.com/en-us/azure/security/fundamentals/best-practices-and-patterns |

---

## Sources

This checklist was compiled from the following authoritative sources:

- [Microsoft Learn - Security Best Practices and Patterns](https://learn.microsoft.com/en-us/azure/security/fundamentals/best-practices-and-patterns)
- [Microsoft Learn - Azure Identity & Access Security Best Practices](https://learn.microsoft.com/en-us/azure/security/fundamentals/identity-management-best-practices)
- [Microsoft Learn - Best Practices to Secure with Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/architecture/secure-best-practices)
- [Microsoft Learn - Data Encryption Best Practices](https://learn.microsoft.com/en-us/azure/security/fundamentals/data-encryption-best-practices)
- [Microsoft Learn - Network Security Best Practices](https://learn.microsoft.com/en-us/azure/security/fundamentals/network-best-practices)
- [Microsoft Learn - Microsoft Defender for Cloud](https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-cloud-introduction)
- [Microsoft Learn - Conditional Access](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview)
- [Microsoft Learn - Email Authentication](https://learn.microsoft.com/en-us/defender-office-365/email-authentication-about)
- [CISA - Secure Cloud Business Applications (SCuBA)](https://www.cisa.gov/resources-tools/services/secure-cloud-business-applications-scuba-project)
- [CISA - Microsoft 365 Secure Configuration Baselines](https://www.cisa.gov/news-events/news/cisa-finalizes-microsoft-365-secure-configuration-baselines)
- [SentinelOne - Azure Security Best Practices 2026](https://www.sentinelone.com/cybersecurity-101/cloud-security/azure-security-best-practices/)
- [Netrix Global - Microsoft 365 Security Hardening Checklist](https://netrixglobal.com/blog/cybersecurity/microsoft-365-security-hardening-checklist/)
- [CoreView - 2025 Microsoft Secure Score Playbook](https://www.coreview.com/blog/secure-score-playbook)
- [LA NET Azure - Microsoft Entra ID Security Baseline 2025](https://lanet.co.uk/blog/microsoft-entra-id-security-baseline/)
- [Paradigm Security - Top 10 Conditional Access Policies 2025](https://paradigmsecurity.nl/blog/conditional-access-policies-for-enhanced-security/)
- [Jeffrey Appel - 2025 Microsoft Defender Optimization Cheat Sheet](https://jeffreyappel.nl/2025-microsoft-defender-optimization-configuration-cheat-sheet/)
