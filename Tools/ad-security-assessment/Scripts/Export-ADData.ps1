# Export-ADData.ps1
# Exports Active Directory configuration for security assessment
# Requires: Domain Admin or equivalent read access
#
# BEGINNER'S GUIDE:
# 1. Right-click PowerShell and select "Run as Administrator"
# 2. Navigate to this script's location: cd C:\SecurityAssessment\Scripts
# 3. Run: .\Export-ADData.ps1 -OutputPath C:\SecurityAssessment\data
# 4. Wait for completion (may take 5-30 minutes depending on environment size)

param(
    [Parameter(HelpMessage="Where to save the exported data files")]
    [string]$OutputPath = "C:\SecurityAssessment\data",

    [Parameter(HelpMessage="Include ACL data (slower but more comprehensive)")]
    [switch]$IncludeACLs = $false
)

# Create output directory if it doesn't exist
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AD Security Assessment Data Export" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Output Location: $OutputPath`n" -ForegroundColor Yellow

New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null

# Check for Active Directory module
Write-Host "[Step 1/5] Checking prerequisites..." -ForegroundColor Green
try {
    Import-Module ActiveDirectory -ErrorAction Stop
    Write-Host "  SUCCESS: Active Directory module loaded" -ForegroundColor Green
}
catch {
    Write-Host "`n  ERROR: Active Directory module not found!" -ForegroundColor Red
    Write-Host "  This script must be run on a domain-joined Windows computer" -ForegroundColor Yellow
    Write-Host "  with RSAT (Remote Server Administration Tools) installed.`n" -ForegroundColor Yellow
    Write-Host "  To install RSAT on Windows 10/11:" -ForegroundColor Cyan
    Write-Host "  1. Open Settings > Apps > Optional Features" -ForegroundColor White
    Write-Host "  2. Click 'Add a feature'" -ForegroundColor White
    Write-Host "  3. Search for 'RSAT: Active Directory'" -ForegroundColor White
    Write-Host "  4. Install and restart PowerShell`n" -ForegroundColor White
    exit 1
}

# Get domain information
$domain = Get-ADDomain
Write-Host "  Domain: $($domain.DNSRoot)" -ForegroundColor Cyan

# === SECTION 1: AD CONFIGURATION ===
Write-Host "`n[Step 2/5] Collecting AD Configuration..." -ForegroundColor Green

$adConfig = @{
    domain = $domain.DNSRoot
    collectionDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    passwordPolicy = $null
    ldapSettings = @{}
    domainControllers = @()
    serviceAccounts = @()
}

# Password Policy
Write-Host "  - Reading password policy..." -ForegroundColor Gray
$pwdPolicy = Get-ADDefaultDomainPasswordPolicy
$adConfig.passwordPolicy = @{
    minimumPasswordLength = $pwdPolicy.MinPasswordLength
    passwordComplexity = $pwdPolicy.ComplexityEnabled
    lockoutThreshold = $pwdPolicy.LockoutThreshold
    maximumPasswordAge = $pwdPolicy.MaxPasswordAge.Days
    minimumPasswordAge = $pwdPolicy.MinPasswordAge.Days
    passwordHistoryCount = $pwdPolicy.PasswordHistoryCount
}

# LDAP Settings (attempt to read from DC registry)
Write-Host "  - Checking LDAP security settings..." -ForegroundColor Gray
try {
    $dc = (Get-ADDomainController).HostName
    $ldapReg = Invoke-Command -ComputerName $dc -ScriptBlock {
        Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\NTDS\Parameters" -Name "LDAPServerIntegrity" -ErrorAction SilentlyContinue
    } -ErrorAction Stop

    $adConfig.ldapSettings.ldapSigning = ($ldapReg.LDAPServerIntegrity -eq 2)
    Write-Host "    LDAP Signing: $($adConfig.ldapSettings.ldapSigning)" -ForegroundColor Cyan
}
catch {
    Write-Host "    WARNING: Could not query LDAP settings remotely" -ForegroundColor Yellow
    $adConfig.ldapSettings.ldapSigning = $null
}

$adConfig.ldapSettings.channelBinding = $null  # Requires manual verification
$adConfig.ldapSettings.ssl = $null  # Requires manual verification

# Domain Controllers
Write-Host "  - Scanning domain controllers..." -ForegroundColor Gray
$dcs = Get-ADDomainController -Filter *
foreach ($dc in $dcs) {
    Write-Host "    Found: $($dc.HostName)" -ForegroundColor Gray

    # Try to get last patch date
    try {
        $hotfixes = Get-HotFix -ComputerName $dc.HostName -ErrorAction Stop |
                    Sort-Object InstalledOn -Descending |
                    Select-Object -First 1
        $lastPatch = if ($hotfixes) { $hotfixes.InstalledOn.ToString("yyyy-MM-dd") } else { "Unknown" }
    }
    catch {
        $lastPatch = "Unable to query"
    }

    $adConfig.domainControllers += @{
        hostname = $dc.HostName
        ipAddress = $dc.IPv4Address
        osVersion = $dc.OperatingSystem
        lastPatchDate = $lastPatch
        isGlobalCatalog = $dc.IsGlobalCatalog
    }
}

# Service Accounts (accounts with SPNs)
Write-Host "  - Identifying service accounts..." -ForegroundColor Gray
$svcAccts = Get-ADUser -Filter {ServicePrincipalName -like "*"} -Properties `
    ServicePrincipalName, PasswordLastSet, DoesNotRequirePreAuth, AdminCount, Enabled |
    Where-Object {$_.Enabled}

foreach ($acct in $svcAccts) {
    $adConfig.serviceAccounts += @{
        name = $acct.SamAccountName
        distinguishedName = $acct.DistinguishedName
        servicePrincipalNames = @($acct.ServicePrincipalName)
        passwordLastSet = if ($acct.PasswordLastSet) { $acct.PasswordLastSet.ToString("yyyy-MM-dd") } else { "Never" }
        kerberosPreAuthRequired = -not $acct.DoesNotRequirePreAuth
        isPrivileged = ($acct.AdminCount -eq 1)
    }
}

# Save AD config
$adConfig | ConvertTo-Json -Depth 10 | Out-File "$OutputPath\ad-config.json" -Encoding UTF8
Write-Host "  SUCCESS: Saved ad-config.json" -ForegroundColor Green

# === SECTION 2: IDENTITY AND PRIVILEGE DATA ===
Write-Host "`n[Step 3/5] Collecting Identity and Privilege Data..." -ForegroundColor Green

$identityData = @{
    collectionDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    users = @()
    groups = @()
    acls = @()
}

# All user accounts
Write-Host "  - Enumerating user accounts..." -ForegroundColor Gray
$users = Get-ADUser -Filter * -Properties `
    MemberOf, LastLogonDate, PasswordLastSet, AdminCount, ServicePrincipalName, Enabled, Description, whenCreated

$totalUsers = $users.Count
$counter = 0

foreach ($user in $users) {
    $counter++
    if ($counter % 100 -eq 0) {
        Write-Host "    Processing user $counter of $totalUsers..." -ForegroundColor Gray
    }

    $identityData.users += @{
        samAccountName = $user.SamAccountName
        distinguishedName = $user.DistinguishedName
        memberOf = @($user.MemberOf)
        lastLogon = if ($user.LastLogonDate) { $user.LastLogonDate.ToString("yyyy-MM-dd") } else { $null }
        pwdLastSet = if ($user.PasswordLastSet) { $user.PasswordLastSet.ToString("yyyy-MM-dd") } else { $null }
        adminCount = $user.AdminCount
        servicePrincipalNames = @($user.ServicePrincipalName)
        enabled = $user.Enabled
        description = $user.Description
        whenCreated = $user.whenCreated.ToString("yyyy-MM-dd")
    }
}

Write-Host "  - Found $totalUsers user accounts" -ForegroundColor Cyan

# Privileged groups
Write-Host "  - Identifying privileged groups..." -ForegroundColor Gray
$groups = Get-ADGroup -Filter {
    Name -like "*Admin*" -or
    Name -like "*Operator*" -or
    Name -eq "Enterprise Admins" -or
    Name -eq "Schema Admins" -or
    Name -eq "Domain Admins" -or
    Name -eq "Account Operators" -or
    Name -eq "Backup Operators" -or
    Name -eq "Server Operators" -or
    Name -eq "Print Operators" -or
    Name -eq "Replicator"
} -Properties Members, Description

foreach ($group in $groups) {
    $identityData.groups += @{
        name = $group.Name
        distinguishedName = $group.DistinguishedName
        members = @($group.Members)
        description = $group.Description
    }
}

Write-Host "  - Found $($groups.Count) privileged groups" -ForegroundColor Cyan

# === SECTION 3: OPTIONAL ACL EXPORT ===
if ($IncludeACLs) {
    Write-Host "  - Exporting ACL data (this may take several minutes)..." -ForegroundColor Yellow

    $criticalOUs = @(
        $domain.DistinguishedName,  # Root domain
        "CN=Users,$($domain.DistinguishedName)",
        "OU=Domain Controllers,$($domain.DistinguishedName)"
    )

    $aclCount = 0
    foreach ($ou in $criticalOUs) {
        try {
            $acl = Get-Acl "AD:$ou" -ErrorAction Stop
            foreach ($access in $acl.Access) {
                if ($access.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDacl|WriteOwner|AddMember") {
                    $identityData.acls += @{
                        objectDN = $ou
                        trustee = $access.IdentityReference.Value
                        rights = $access.ActiveDirectoryRights.ToString()
                        accessControlType = $access.AccessControlType.ToString()
                        isInherited = $access.IsInherited
                    }
                    $aclCount++
                }
            }
        }
        catch {
            Write-Host "    WARNING: Could not read ACL for $ou" -ForegroundColor Yellow
        }
    }

    Write-Host "  - Exported $aclCount dangerous ACL entries" -ForegroundColor Cyan
}

# Save identity data
$identityData | ConvertTo-Json -Depth 15 | Out-File "$OutputPath\ad-identity.json" -Encoding UTF8
Write-Host "  SUCCESS: Saved ad-identity.json" -ForegroundColor Green

# === SECTION 4: STATISTICS ===
Write-Host "`n[Step 4/5] Generating Statistics..." -ForegroundColor Green

$enabledUsers = ($identityData.users | Where-Object {$_.enabled}).Count
$disabledUsers = $totalUsers - $enabledUsers
$privilegedUsers = ($identityData.users | Where-Object {$_.adminCount -eq 1}).Count
$serviceAcctCount = ($identityData.users | Where-Object {$_.servicePrincipalNames.Count -gt 0}).Count

Write-Host "  Domain: $($domain.DNSRoot)" -ForegroundColor Cyan
Write-Host "  Total Users: $totalUsers" -ForegroundColor Cyan
Write-Host "    - Enabled: $enabledUsers" -ForegroundColor White
Write-Host "    - Disabled: $disabledUsers" -ForegroundColor White
Write-Host "    - Privileged (AdminCount=1): $privilegedUsers" -ForegroundColor White
Write-Host "    - Service Accounts (with SPN): $serviceAcctCount" -ForegroundColor White
Write-Host "  Privileged Groups: $($identityData.groups.Count)" -ForegroundColor Cyan
Write-Host "  Domain Controllers: $($adConfig.domainControllers.Count)" -ForegroundColor Cyan
if ($IncludeACLs) {
    Write-Host "  Dangerous ACL Entries: $($identityData.acls.Count)" -ForegroundColor Cyan
}

# === SECTION 5: SECURE OUTPUT ===
Write-Host "`n[Step 5/5] Securing Output Files..." -ForegroundColor Green

# Restrict permissions to current user only
icacls $OutputPath /inheritance:r /grant:r "$env:USERNAME:(OI)(CI)F" | Out-Null
Write-Host "  SUCCESS: File permissions restricted to $env:USERNAME" -ForegroundColor Green

# === COMPLETION ===
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Export Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nOutput Files:" -ForegroundColor Yellow
Write-Host "  $OutputPath\ad-config.json" -ForegroundColor White
Write-Host "  $OutputPath\ad-identity.json" -ForegroundColor White

Write-Host "`n" -NoNewline
Write-Host "IMPORTANT SECURITY NOTICE" -ForegroundColor Red -BackgroundColor Black
Write-Host "These files contain HIGHLY SENSITIVE data about your organization:" -ForegroundColor Yellow
Write-Host "  - User accounts and group memberships" -ForegroundColor White
Write-Host "  - Password policies and security settings" -ForegroundColor White
Write-Host "  - Privileged account information" -ForegroundColor White
Write-Host "  - Domain controller details`n" -ForegroundColor White

Write-Host "Security Requirements:" -ForegroundColor Yellow
Write-Host "  [1] Encrypt files before transferring to another computer" -ForegroundColor White
Write-Host "  [2] Delete securely after completing assessment" -ForegroundColor White
Write-Host "  [3] NEVER commit to version control (Git, etc.)" -ForegroundColor White
Write-Host "  [4] NEVER email without encryption`n" -ForegroundColor White

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  [1] Run Azure AD export (if you have Azure AD):" -ForegroundColor White
Write-Host "      .\Export-AzureADData.ps1 -OutputPath $OutputPath`n" -ForegroundColor Gray
Write-Host "  [2] Run BloodHound collection (recommended):" -ForegroundColor White
Write-Host "      .\SharpHound.exe -c All --outputdirectory $OutputPath\bloodhound`n" -ForegroundColor Gray
Write-Host "  [3] Run PingCastle scan (recommended):" -ForegroundColor White
Write-Host "      .\PingCastle.exe --healthcheck --server $($domain.PDCEmulator)`n" -ForegroundColor Gray
Write-Host "  [4] Run the complete assessment:" -ForegroundColor White
Write-Host "      .\Run-CompleteAssessment.ps1`n" -ForegroundColor Gray
