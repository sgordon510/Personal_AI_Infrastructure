# Quick Reference Card: AD Security Assessment

**For Domain-Connected Windows Machines**

## 🚀 Quick Deploy (5 Minutes)

### 1. Copy to Windows Machine
```
Copy entire folder to: C:\SecurityAssessment\
```

### 2. Install Bun (One-Time)
```powershell
powershell -c "irm bun.sh/install.ps1|iex"
```

### 3. Install AD Module (One-Time)
```powershell
Add-WindowsCapability -Online -Name 'Rsat.ActiveDirectory.DS-LDS.Tools~~~~0.0.1.0'
```

### 4. Collect Data (As Domain Admin)
```powershell
cd C:\SecurityAssessment\Scripts
.\Export-ADData.ps1 -OutputPath C:\SecurityAssessment\data
```

### 5. Run Assessment
```batch
C:\SecurityAssessment\Scripts\assess.bat
```

### 6. View Dashboard
```
Open: C:\SecurityAssessment\reports\[timestamp]\executive-report.html
```

---

## 📋 Command Cheat Sheet

### Data Collection

**AD Only (Fast):**
```powershell
.\Export-ADData.ps1 -OutputPath .\data
```

**AD with ACLs (Slow but Complete):**
```powershell
.\Export-ADData.ps1 -OutputPath .\data -IncludeACLs
```

**Azure AD:**
```powershell
.\Export-AzureADData.ps1 -OutputPath .\data
```

### Assessment Execution

**Interactive (Easiest):**
```batch
Scripts\assess.bat
```

**Direct Command:**
```bash
bun run Tools/RunFullAssessment.ts --org "Company" --output reports/$(date +%Y%m%d) --ad-config data/ad-config.json --identity data/ad-identity.json
```

**With All Data Sources:**
```bash
bun run Tools/RunFullAssessment.ts \
  --org "Company" \
  --output reports/$(date +%Y%m%d) \
  --ad-config data/ad-config.json \
  --identity data/ad-identity.json \
  --azure data/azure-ad.json \
  --bloodhound data/bloodhound/ \
  --pingcastle data/ad_hc_domain.xml
```

---

## 🔧 Troubleshooting (30 Seconds Each)

### "bun: command not found"
```powershell
powershell -c "irm bun.sh/install.ps1|iex"
# Then restart terminal
```

### "Script cannot be loaded"
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Unblock-File .\Scripts\Export-ADData.ps1
```

### "Access Denied"
```powershell
# Run PowerShell as Administrator
# Ensure you have Domain Admin rights
```

### "Microsoft Graph not found"
```powershell
Install-Module Microsoft.Graph -Scope CurrentUser -Force
```

### "WSL not found"
```powershell
# Install WSL
wsl --install

# OR use Git Bash
# Download: https://git-scm.com/download/win
```

---

## 📊 Output Files

| File | Description |
|------|-------------|
| `executive-report.html` | Executive dashboard (open in browser) |
| `report-misconfigs.txt` | AD configuration issues |
| `report-privileges.txt` | Privilege escalation risks |
| `report-azure.txt` | Azure AD security findings |
| `report-bloodhound.txt` | Attack path analysis |
| `report-pingcastle.txt` | Risk assessment findings |

---

## 🔒 Security Checklist

- [ ] Data files created in `data/` directory
- [ ] Reports generated in `reports/` directory
- [ ] **Encrypt** data files before transferring
- [ ] **Restrict** permissions on data directory
- [ ] **Securely delete** data after processing
- [ ] **Follow** your org's data handling policies

**Encrypt Data:**
```powershell
# 7-Zip with password (recommended)
7z a -p -mhe=on data-encrypted.7z data\*

# Or Windows built-in
Compress-Archive -Path data\* -DestinationPath data.zip
```

**Secure Delete:**
```powershell
cipher /w:C:\SecurityAssessment\data
```

---

## 📅 Monthly Assessment Workflow

### Week 1: Data Collection
- Schedule: First Monday of month at 2 AM
- Run: `Export-ADData.ps1` + `Export-AzureADData.ps1`
- Store: Encrypted in secure location

### Week 2: Assessment & Analysis
- Run: `assess.bat` with collected data
- Review: All findings with security team
- Prioritize: Create remediation tickets

### Week 3: Remediation
- Fix: High/Critical findings
- Document: Changes made
- Test: Verify fixes

### Week 4: Executive Reporting
- Generate: Final dashboard
- Present: To leadership
- Track: Month-over-month trends

---

## 🎯 Success Metrics

After first assessment:
- ✅ Executive dashboard generated
- ✅ Security score calculated (0-100)
- ✅ Findings categorized by severity
- ✅ Remediation guidance provided
- ✅ Data securely deleted

After monthly assessments:
- 📈 Security score trending up
- 📉 Critical findings trending down
- ✅ Compliance requirements met
- ✅ Leadership informed

---

## 📞 Getting Help

**Documentation:**
- `README.md` - Overview
- `DEPLOYMENT.md` - Detailed setup
- `docs/QUICKSTART.md` - Step-by-step guide
- `docs/EXAMPLES.md` - Command examples

**Remediation:**
- `Findings/ADFindings.md` - AD fixes
- `Findings/AzureFindings.md` - Azure AD fixes

**Common Issues:**
Check error messages in PowerShell output for specific guidance.

---

## ⚡ Pro Tips

1. **Schedule monthly**: Set up Task Scheduler for automation
2. **Track trends**: Compare reports month-over-month
3. **Integrate tools**: Use with BloodHound + PingCastle for complete picture
4. **Customize**: Edit Tools/*.ts files for org-specific checks
5. **Share reports**: Executive dashboard is self-contained HTML

---

**Need the full guide?** See `DEPLOYMENT.md`

**Ready to start?** Run `Scripts\assess.bat`
