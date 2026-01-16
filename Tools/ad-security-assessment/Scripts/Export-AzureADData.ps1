# Export-AzureADData.ps1
# Exports Azure AD configuration for security assessment
# Requires: Microsoft Graph PowerShell module and appropriate permissions
#
# BEGINNER'S GUIDE:
# 1. Open PowerShell (does not need to be Administrator)
# 2. Navigate to this script's location: cd C:\SecurityAssessment\Scripts
# 3. Run: .\Export-AzureADData.ps1 -OutputPath C:\SecurityAssessment\data
# 4. Sign in when prompted (use an account with Global Reader or Security Reader role)
# 5. Wait for completion (may take 10-45 minutes depending on tenant size)

param(
    [Parameter(HelpMessage="Where to save the exported data files")]
    [string]$OutputPath = "C:\SecurityAssessment\data"
)

# Create output directory if it doesn't exist
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Azure AD Security Assessment Export" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Output Location: $OutputPath`n" -ForegroundColor Yellow

New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null

# Check for Microsoft Graph module
Write-Host "[Step 1/7] Checking prerequisites..." -ForegroundColor Green
if (-not (Get-Module -ListAvailable -Name Microsoft.Graph)) {
    Write-Host "`n  ERROR: Microsoft Graph PowerShell module not found!" -ForegroundColor Red
    Write-Host "  This module is required to collect Azure AD data.`n" -ForegroundColor Yellow
    Write-Host "  To install (run PowerShell as Administrator):" -ForegroundColor Cyan
    Write-Host "    Install-Module Microsoft.Graph -Scope CurrentUser -Force`n" -ForegroundColor White
    Write-Host "  Then restart PowerShell and run this script again.`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "  SUCCESS: Microsoft Graph module found" -ForegroundColor Green

# Connect to Microsoft Graph
Write-Host "`n[Step 2/7] Connecting to Microsoft Graph..." -ForegroundColor Green
Write-Host "  A browser window will open for authentication..." -ForegroundColor Yellow
Write-Host "  Please sign in with Global Reader or Security Reader account`n" -ForegroundColor Yellow

try {
    Connect-MgGraph -Scopes @(
        "User.Read.All",
        "UserAuthenticationMethod.Read.All",
        "Policy.Read.All",
        "RoleManagement.Read.Directory",
        "AuditLog.Read.All",
        "Directory.Read.All"
    ) -ErrorAction Stop

    $context = Get-MgContext
    Write-Host "  SUCCESS: Connected to tenant $($context.TenantId)" -ForegroundColor Green
    Write-Host "  Account: $($context.Account)" -ForegroundColor Cyan
}
catch {
    Write-Host "`n  ERROR: Failed to connect to Microsoft Graph" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)`n" -ForegroundColor Yellow
    exit 1
}

# Initialize data collection object
$azureADData = @{
    collectionDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    tenantId = $context.TenantId
    users = @()
    conditionalAccessPolicies = @()
    pimConfiguration = @()
    securityDefaults = $null
}

# === SECTION 1: USER DATA ===
Write-Host "`n[Step 3/7] Collecting User Data..." -ForegroundColor Green
Write-Host "  This may take several minutes for large tenants..." -ForegroundColor Yellow

$allUsers = Get-MgUser -All -Property `
    UserPrincipalName, DisplayName, UserType, AccountEnabled, SignInActivity, CreatedDateTime, AssignedLicenses

$totalUsers = $allUsers.Count
$counter = 0

Write-Host "  - Found $totalUsers users" -ForegroundColor Cyan
Write-Host "  - Checking MFA status for each user..." -ForegroundColor Gray

foreach ($user in $allUsers) {
    $counter++
    if ($counter % 100 -eq 0) {
        $percentComplete = [math]::Round(($counter / $totalUsers) * 100, 1)
        Write-Host "    Progress: $counter of $totalUsers ($percentComplete%)" -ForegroundColor Gray
    }

    # Check MFA status
    $mfaEnabled = $false
    try {
        $authMethods = Get-MgUserAuthenticationMethod -UserId $user.Id -ErrorAction SilentlyContinue
        $mfaEnabled = ($authMethods.Count -gt 1)  # More than just password means MFA
    }
    catch {
        # Unable to query auth methods - likely no permission or user issue
    }

    # Check assigned roles
    $assignedRoles = @()
    try {
        $roleAssignments = Get-MgRoleManagementDirectoryRoleAssignment -Filter "principalId eq '$($user.Id)'" -ErrorAction SilentlyContinue
        foreach ($assignment in $roleAssignments) {
            try {
                $roleId = $assignment.RoleDefinitionId
                $role = Get-MgRoleManagementDirectoryRoleDefinition -UnifiedRoleDefinitionId $roleId -ErrorAction SilentlyContinue
                if ($role) {
                    $assignedRoles += $role.DisplayName
                }
            }
            catch {
                # Skip roles we cannot query
            }
        }
    }
    catch {
        # No role assignments or insufficient permissions
    }

    $azureADData.users += @{
        userPrincipalName = $user.UserPrincipalName
        displayName = $user.DisplayName
        userType = $user.UserType
        accountEnabled = $user.AccountEnabled
        mfaStatus = if ($mfaEnabled) { "enabled" } else { "disabled" }
        lastSignIn = $user.SignInActivity.LastSignInDateTime
        createdDateTime = $user.CreatedDateTime
        assignedRoles = $assignedRoles
        hasLicense = ($user.AssignedLicenses.Count -gt 0)
    }
}

$mfaEnabledCount = ($azureADData.users | Where-Object {$_.mfaStatus -eq "enabled"}).Count
$mfaPercentage = if ($totalUsers -gt 0) { [math]::Round(($mfaEnabledCount / $totalUsers) * 100, 1) } else { 0 }

Write-Host "  SUCCESS: Processed $totalUsers users" -ForegroundColor Green
Write-Host "    MFA Enabled: $mfaEnabledCount ($mfaPercentage%)" -ForegroundColor Cyan

# === SECTION 2: CONDITIONAL ACCESS POLICIES ===
Write-Host "`n[Step 4/7] Collecting Conditional Access Policies..." -ForegroundColor Green

try {
    $caPolicies = Get-MgIdentityConditionalAccessPolicy -ErrorAction Stop

    foreach ($policy in $caPolicies) {
        $azureADData.conditionalAccessPolicies += @{
            name = $policy.DisplayName
            state = $policy.State
            conditions = $policy.Conditions
            grantControls = $policy.GrantControls
            sessionControls = $policy.SessionControls
            createdDateTime = $policy.CreatedDateTime
            modifiedDateTime = $policy.ModifiedDateTime
        }
    }

    Write-Host "  SUCCESS: Found $($caPolicies.Count) Conditional Access policies" -ForegroundColor Green
}
catch {
    Write-Host "  WARNING: Unable to retrieve Conditional Access policies" -ForegroundColor Yellow
    Write-Host "    This feature requires Azure AD Premium P1 or P2" -ForegroundColor Gray
}

# === SECTION 3: PIM CONFIGURATION ===
Write-Host "`n[Step 5/7] Checking Privileged Identity Management..." -ForegroundColor Green

try {
    $roles = Get-MgRoleManagementDirectoryRoleDefinition -All -ErrorAction Stop

    $adminRoles = $roles | Where-Object { $_.DisplayName -match "Administrator|Admin" } | Select-Object -First 20

    foreach ($role in $adminRoles) {
        try {
            $assignments = Get-MgRoleManagementDirectoryRoleAssignment -Filter "roleDefinitionId eq '$($role.Id)'" -All -ErrorAction SilentlyContinue

            $activeCount = $assignments.Count

            if ($activeCount -gt 0) {
                $azureADData.pimConfiguration += @{
                    roleName = $role.DisplayName
                    roleId = $role.Id
                    activeAssignments = $activeCount
                    eligibleAssignments = 0  # Would need PIM-specific API for accurate eligible count
                }
            }
        }
        catch {
            # Skip roles we cannot query
        }
    }

    Write-Host "  SUCCESS: Analyzed $($azureADData.pimConfiguration.Count) privileged roles" -ForegroundColor Green
}
catch {
    Write-Host "  WARNING: PIM data unavailable" -ForegroundColor Yellow
    Write-Host "    Full PIM analysis requires Azure AD Premium P2" -ForegroundColor Gray
}

# === SECTION 4: SECURITY DEFAULTS ===
Write-Host "`n[Step 6/7] Checking Security Settings..." -ForegroundColor Green

try {
    $securityDefaults = Get-MgPolicyIdentitySecurityDefaultEnforcementPolicy -ErrorAction Stop
    $azureADData.securityDefaults = $securityDefaults.IsEnabled

    if ($securityDefaults.IsEnabled) {
        Write-Host "  Security Defaults: ENABLED" -ForegroundColor Green
    }
    else {
        Write-Host "  Security Defaults: DISABLED" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "  WARNING: Unable to check Security Defaults" -ForegroundColor Yellow
    $azureADData.securityDefaults = $null
}

# === SECTION 5: STATISTICS ===
Write-Host "`n[Step 7/7] Generating Statistics..." -ForegroundColor Green

$memberUsers = ($azureADData.users | Where-Object {$_.userType -eq "Member"}).Count
$guestUsers = ($azureADData.users | Where-Object {$_.userType -eq "Guest"}).Count
$enabledUsers = ($azureADData.users | Where-Object {$_.accountEnabled}).Count
$privilegedUsers = ($azureADData.users | Where-Object {$_.assignedRoles.Count -gt 0}).Count

Write-Host "`nTenant Summary:" -ForegroundColor Cyan
Write-Host "  Tenant ID: $($azureADData.tenantId)" -ForegroundColor White
Write-Host "  Total Users: $totalUsers" -ForegroundColor Cyan
Write-Host "    - Member Users: $memberUsers" -ForegroundColor White
Write-Host "    - Guest Users: $guestUsers" -ForegroundColor White
Write-Host "    - Enabled: $enabledUsers" -ForegroundColor White
Write-Host "  MFA Adoption: $mfaPercentage% ($mfaEnabledCount users)" -ForegroundColor Cyan
Write-Host "  Privileged Users: $privilegedUsers" -ForegroundColor Cyan
Write-Host "  Conditional Access Policies: $($azureADData.conditionalAccessPolicies.Count)" -ForegroundColor Cyan
Write-Host "  Privileged Roles with Assignments: $($azureADData.pimConfiguration.Count)" -ForegroundColor Cyan
Write-Host "  Security Defaults: $(if ($azureADData.securityDefaults) {'Enabled'} else {'Disabled or Unknown'})" -ForegroundColor Cyan

# === SECTION 6: SAVE OUTPUT ===
Write-Host "`n[Step 8/8] Saving Data..." -ForegroundColor Green

$outputFile = "$OutputPath\azure-ad.json"
$azureADData | ConvertTo-Json -Depth 15 | Out-File $outputFile -Encoding UTF8

# Secure permissions
icacls $OutputPath /inheritance:r /grant:r "$env:USERNAME:(OI)(CI)F" | Out-Null

# Disconnect from Microsoft Graph
Disconnect-MgGraph | Out-Null

Write-Host "  SUCCESS: Data saved to azure-ad.json" -ForegroundColor Green
Write-Host "  SUCCESS: File permissions restricted to $env:USERNAME" -ForegroundColor Green

# === COMPLETION ===
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Export Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nOutput File:" -ForegroundColor Yellow
Write-Host "  $outputFile" -ForegroundColor White

Write-Host "`n" -NoNewline
Write-Host "IMPORTANT SECURITY NOTICE" -ForegroundColor Red -BackgroundColor Black
Write-Host "This file contains HIGHLY SENSITIVE data about your organization:" -ForegroundColor Yellow
Write-Host "  - User accounts and authentication methods" -ForegroundColor White
Write-Host "  - MFA status for all users" -ForegroundColor White
Write-Host "  - Privileged role assignments" -ForegroundColor White
Write-Host "  - Conditional Access policies`n" -ForegroundColor White

Write-Host "Security Requirements:" -ForegroundColor Yellow
Write-Host "  [1] Encrypt files before transferring to another computer" -ForegroundColor White
Write-Host "  [2] Delete securely after completing assessment" -ForegroundColor White
Write-Host "  [3] NEVER commit to version control (Git, etc.)" -ForegroundColor White
Write-Host "  [4] NEVER email without encryption`n" -ForegroundColor White

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  [1] If you also have on-premises AD, run:" -ForegroundColor White
Write-Host "      .\Export-ADData.ps1 -OutputPath $OutputPath`n" -ForegroundColor Gray
Write-Host "  [2] Run the complete assessment:" -ForegroundColor White
Write-Host "      .\Run-CompleteAssessment.ps1`n" -ForegroundColor Gray
