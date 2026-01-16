# Third-Party Security Tools

This directory should contain the external security tools used by the assessment.

## Required Tools

### 1. SharpHound.exe (BloodHound Collector)

**What it does:** Collects Active Directory attack path data for analysis

**Download:**
1. Visit: https://github.com/SpecterOps/BloodHound/releases
2. Download the latest `SharpHound-vX.X.X.zip`
3. Extract `SharpHound.exe` to this directory

**Note:** This is the current official BloodHound maintained by SpecterOps. The legacy BloodHoundAD version is no longer maintained.

**File location after download:**
```
C:\SecurityAssessment\ThirdParty\SharpHound.exe
```

**How to verify:**
```powershell
.\SharpHound.exe --help
```

### 2. PingCastle.exe

**What it does:** Performs comprehensive Active Directory security audits

**Download:**
1. Visit: https://www.pingcastle.com/download/
2. Download the latest version
3. Extract `PingCastle.exe` to this directory

**File location after download:**
```
C:\SecurityAssessment\ThirdParty\PingCastle.exe
```

**How to verify:**
```powershell
.\PingCastle.exe --help
```

## Directory Structure

After downloading both tools, this directory should look like:

```
ThirdParty/
├── README.md (this file)
├── SharpHound.exe
└── PingCastle.exe
```

## Tool Versions

- **SharpHound:** Use the latest version from SpecterOps (v2.5.0+)
- **PingCastle:** v3.3.0.0 or later

**Important:** Always download the latest version of SharpHound from the SpecterOps repository. The tool is actively maintained and receives regular updates for new attack techniques and compatibility improvements.

## Security Notes

⚠️ **Important:**

1. **Download from official sources only**
   - SharpHound: Only from GitHub SpecterOps/BloodHound releases
   - PingCastle: Only from pingcastle.com

2. **Verify file integrity**
   - Check SHA256 hashes if provided on download pages
   - Scan with antivirus before use

3. **These are security assessment tools**
   - Only use on networks you own or have authorization to test
   - Some antivirus software may flag these as suspicious (false positive)
   - Add exceptions in your antivirus if needed

## Troubleshooting

### "SharpHound.exe not found" error

**Solution:**
1. Verify the file is in `C:\SecurityAssessment\ThirdParty\`
2. Check filename is exactly `SharpHound.exe` (not `SharpHound.exe.zip`)
3. Make sure you extracted the file from the ZIP

### "PingCastle.exe not found" error

**Solution:**
1. Verify the file is in `C:\SecurityAssessment\ThirdParty\`
2. Check filename is exactly `PingCastle.exe`
3. Ensure you have a recent version (v3.x or later)

### "Windows Defender blocked this file" error

**Solution:**
```powershell
# Run PowerShell as Administrator
Add-MpPreference -ExclusionPath "C:\SecurityAssessment\ThirdParty"
```

This adds the directory to Windows Defender's exclusion list.

### "This app can't run on your PC" error

**Solution:**
1. Ensure you're running 64-bit Windows (these tools require 64-bit)
2. Download the correct version for your OS
3. Try running PowerShell as Administrator

## Alternative: Run Without These Tools

If you cannot download these tools, you can still run a partial assessment:

```powershell
.\Run-CompleteAssessment.ps1 -SkipBloodHound -SkipPingCastle
```

This will run only the AD and Azure AD assessments without third-party tools.

## Support

**BloodHound/SharpHound Support:**
- GitHub Issues: https://github.com/SpecterOps/BloodHound/issues
- Documentation: https://support.bloodhoundenterprise.io/
- Legacy Docs: https://bloodhound.readthedocs.io/ (for reference only)

**PingCastle Support:**
- Website: https://www.pingcastle.com/
- Documentation: https://www.pingcastle.com/documentation/

## License Information

- **SharpHound:** GPL-3.0 (Open Source)
- **PingCastle:** Free for commercial use (check license for distribution)

These tools are property of their respective authors. This assessment package only uses them, it does not include or distribute them.
