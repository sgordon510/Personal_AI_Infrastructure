# PAI Installation Troubleshooting Guide

> A comprehensive guide to diagnosing and fixing PAI (Personal AI Infrastructure) installation issues.

---

## Table of Contents

1. [Pre-Installation Checks](#pre-installation-checks)
2. [Common Installation Errors](#common-installation-errors)
3. [Post-Installation Issues](#post-installation-issues)
4. [Pack-Specific Troubleshooting](#pack-specific-troubleshooting)
5. [Diagnostic Commands](#diagnostic-commands)
6. [Recovery Procedures](#recovery-procedures)

---

## Pre-Installation Checks

Before installing PAI, verify these prerequisites:

### 1. Check Bun Installation

```bash
bun --version
```

**Expected:** Version number (e.g., `1.0.0` or higher)

**If missing:**
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.zshrc  # or source ~/.bashrc
```

### 2. Check Git

```bash
git --version
```

### 3. Check Existing Installation

```bash
# Check if ~/.claude exists
ls -la ~/.claude 2>/dev/null && echo "Existing installation found" || echo "Fresh install"

# Check if PAI_DIR is set
echo "PAI_DIR: ${PAI_DIR:-NOT SET}"
```

### 4. Check Shell Configuration

```bash
# Identify your shell
echo $SHELL

# Check profile file exists
ls ~/.zshrc 2>/dev/null || ls ~/.bashrc 2>/dev/null || echo "No shell profile found"
```

---

## Common Installation Errors

### Error: "bun: command not found"

**Symptom:** Running install.ts fails immediately

**Solution:**
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Reload shell
source ~/.zshrc  # For zsh
# OR
source ~/.bashrc  # For bash

# Verify
bun --version
```

---

### Error: "Existing backup found"

**Symptom:** Installer refuses to proceed due to existing `~/.claude-BACKUP`

**Solution:**
```bash
# Option 1: Remove old backup
rm -rf ~/.claude-BACKUP

# Option 2: Rename old backup
mv ~/.claude-BACKUP ~/.claude-BACKUP-$(date +%Y%m%d)

# Then re-run installer
bun run install.ts
```

---

### Error: "Update mode requires an existing installation"

**Symptom:** Running `bun run install.ts --update` with no existing PAI

**Solution:**
```bash
# Run fresh install instead (without --update flag)
bun run install.ts
```

---

### Error: Invalid timezone

**Symptom:** Installer rejects timezone input

**Solution:**
Use IANA timezone format:
- `America/New_York` (not `EST` or `Eastern`)
- `Europe/London` (not `GMT`)
- `Asia/Tokyo` (not `JST`)

Find your timezone:
```bash
# Auto-detect system timezone
echo $(date +%Z) "detected - use IANA format instead"

# Common IANA timezones:
# US: America/New_York, America/Chicago, America/Denver, America/Los_Angeles
# Europe: Europe/London, Europe/Paris, Europe/Berlin
# Asia: Asia/Tokyo, Asia/Singapore, Asia/Shanghai
```

---

### Error: "Permission denied"

**Symptom:** Can't write to ~/.claude directory

**Solution:**
```bash
# Check ownership
ls -la ~ | grep .claude

# Fix permissions
chmod -R u+rw ~/.claude

# If directory is owned by root (shouldn't happen)
sudo chown -R $USER:$USER ~/.claude
```

---

### Error: JSON syntax error in settings.json

**Symptom:** Claude Code fails to start or hooks don't fire

**Diagnosis:**
```bash
# Validate JSON
cat ~/.claude/settings.json | python3 -m json.tool

# Or with jq
cat ~/.claude/settings.json | jq .
```

**Solution:**
```bash
# Backup corrupt file
cp ~/.claude/settings.json ~/.claude/settings.json.broken

# Re-run installer with update mode
bun run install.ts --update
```

---

## Post-Installation Issues

### Hooks Not Firing

**Symptom:** Hooks are installed but not executing

**Diagnosis checklist:**
```bash
# 1. Check hooks are registered in settings.json
grep -i "hooks" ~/.claude/settings.json | head -5

# 2. Check hook files exist
ls ~/.claude/hooks/*.hook.ts | wc -l
# Expected: 15

# 3. Check lib files exist
ls ~/.claude/hooks/lib/*.ts | wc -l
# Expected: 12

# 4. Check handler files exist
ls ~/.claude/hooks/handlers/*.ts | wc -l
# Expected: 4
```

**Common solutions:**
1. **Restart Claude Code** - Hooks only load at startup
2. **Verify file count** - All 31 files must be present
3. **Check file integrity** - Files must not be truncated

```bash
# Verify total hook system files
find ~/.claude/hooks -name "*.ts" | wc -l
# Expected: 31
```

---

### Tab Title Not Updating

**Symptom:** Terminal tab title doesn't change with prompts

**Causes:**
1. Terminal doesn't support OSC escape sequences
2. UpdateTabTitle hook not registered

**Diagnosis:**
```bash
# Check hook exists
test -f ~/.claude/hooks/UpdateTabTitle.hook.ts && echo "Hook exists" || echo "Hook missing"

# Check it's registered
grep -i "UpdateTabTitle" ~/.claude/settings.json
```

**Solution:**
- Use a modern terminal (iTerm2, Hyper, Windows Terminal)
- Verify hook is in settings.json under UserPromptSubmit hooks

---

### Security Validator Blocking Valid Commands

**Symptom:** Legitimate commands are being blocked

**Test:**
```bash
# This should PASS (exit 0)
echo '{"session_id":"test","tool_name":"Bash","tool_input":{"command":"ls -la"}}' | \
  bun run ~/.claude/hooks/SecurityValidator.hook.ts
echo "Exit code: $?"

# This should BLOCK (exit 2)
echo '{"session_id":"test","tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' | \
  bun run ~/.claude/hooks/SecurityValidator.hook.ts
echo "Exit code: $?"
```

**Expected exit codes:**
- `0` = Allowed
- `2` = Blocked

---

### Skills Not Loading

**Symptom:** Skills not available or CORE not recognized

**Diagnosis:**
```bash
# Check SKILL.md exists
test -f ~/.claude/skills/CORE/SKILL.md && echo "SKILL.md: OK" || echo "SKILL.md: MISSING"

# Check file size (should be ~20KB)
wc -c ~/.claude/skills/CORE/SKILL.md

# Check SYSTEM files
ls ~/.claude/skills/CORE/SYSTEM/ | wc -l
# Expected: 19 or more
```

**Solution:**
```bash
# Re-copy from pack source
cp -r Packs/pai-core-install/src/skills/CORE/* ~/.claude/skills/CORE/
```

---

### Environment Variables Not Working

**Symptom:** `$DA`, `$PAI_DIR`, or `$TIME_ZONE` not set

**Diagnosis:**
```bash
echo "DA: ${DA:-NOT SET}"
echo "PAI_DIR: ${PAI_DIR:-NOT SET}"
echo "TIME_ZONE: ${TIME_ZONE:-NOT SET}"
```

**Solution - Check all three sources:**

```bash
# 1. Check .env file
cat ~/.claude/.env

# 2. Check settings.json env section
grep -A10 '"env"' ~/.claude/settings.json

# 3. Check shell profile
grep "PAI Configuration" ~/.zshrc || grep "PAI Configuration" ~/.bashrc
```

**Manual fix:**
```bash
# Add to ~/.zshrc or ~/.bashrc
export DA="YourDAName"
export PAI_DIR="$HOME/.claude"
export TIME_ZONE="America/New_York"  # Your timezone
export PAI_SOURCE_APP="$DA"

# Reload
source ~/.zshrc  # or ~/.bashrc
```

---

### Voice System Not Working

**Symptom:** Voice notifications don't play

**Diagnosis:**
```bash
# Check API key is set
echo "ELEVENLABS_API_KEY: ${ELEVENLABS_API_KEY:+SET (hidden)}"
echo "ELEVENLABS_VOICE_ID: ${ELEVENLABS_VOICE_ID:-NOT SET}"
```

**Common issues:**
1. API key not set or invalid
2. Voice ID doesn't exist
3. Network connectivity issues

**Test voice manually:**
```bash
# Test with curl (replace YOUR_API_KEY)
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/s3TPKV1kjDlVtZbl4Ksh" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test", "model_id": "eleven_monolingual_v1"}' \
  -o /tmp/test.mp3

# Play (macOS)
afplay /tmp/test.mp3 2>/dev/null || echo "Use your audio player"
```

---

## Pack-Specific Troubleshooting

### pai-hook-system

**Required file counts:**
- 15 hook files (`*.hook.ts`)
- 12 library files (`hooks/lib/*.ts`)
- 4 handler files (`hooks/handlers/*.ts`)

```bash
# Full verification
PAI_DIR="${PAI_DIR:-$HOME/.claude}"
echo "Hooks: $(ls $PAI_DIR/hooks/*.hook.ts 2>/dev/null | wc -l) / 15"
echo "Libs: $(ls $PAI_DIR/hooks/lib/*.ts 2>/dev/null | wc -l) / 12"
echo "Handlers: $(ls $PAI_DIR/hooks/handlers/*.ts 2>/dev/null | wc -l) / 4"
```

---

### pai-core-install

**Required structure:**
```
~/.claude/skills/CORE/
├── SKILL.md
├── SYSTEM/       (19+ files)
├── USER/         (4 subdirectories)
├── WORK/
├── Workflows/    (4 files)
└── Tools/        (4 files)
```

**Quick check:**
```bash
test -f ~/.claude/skills/CORE/SKILL.md && echo "SKILL.md: OK" || echo "SKILL.md: FAIL"
test -d ~/.claude/skills/CORE/SYSTEM && echo "SYSTEM/: OK" || echo "SYSTEM/: FAIL"
test -d ~/.claude/skills/CORE/USER && echo "USER/: OK" || echo "USER/: FAIL"
test -d ~/.claude/skills/CORE/WORK && echo "WORK/: OK" || echo "WORK/: FAIL"
test -d ~/.claude/skills/CORE/Workflows && echo "Workflows/: OK" || echo "Workflows/: FAIL"
test -d ~/.claude/skills/CORE/Tools && echo "Tools/: OK" || echo "Tools/: FAIL"
```

---

## Diagnostic Commands

### Full System Diagnostic

```bash
#!/bin/bash
# Save as pai-diagnose.sh and run: bash pai-diagnose.sh

echo "=== PAI Installation Diagnostic ==="
echo ""

PAI_DIR="${PAI_DIR:-$HOME/.claude}"

echo "1. Environment"
echo "   PAI_DIR: ${PAI_DIR}"
echo "   DA: ${DA:-NOT SET}"
echo "   TIME_ZONE: ${TIME_ZONE:-NOT SET}"
echo "   Bun: $(bun --version 2>/dev/null || echo 'NOT INSTALLED')"
echo ""

echo "2. Directory Structure"
test -d "$PAI_DIR" && echo "   $PAI_DIR: EXISTS" || echo "   $PAI_DIR: MISSING"
test -d "$PAI_DIR/hooks" && echo "   hooks/: EXISTS" || echo "   hooks/: MISSING"
test -d "$PAI_DIR/skills" && echo "   skills/: EXISTS" || echo "   skills/: MISSING"
test -d "$PAI_DIR/MEMORY" && echo "   MEMORY/: EXISTS" || echo "   MEMORY/: MISSING"
echo ""

echo "3. Hook System"
HOOK_COUNT=$(ls "$PAI_DIR/hooks/"*.hook.ts 2>/dev/null | wc -l | tr -d ' ')
LIB_COUNT=$(ls "$PAI_DIR/hooks/lib/"*.ts 2>/dev/null | wc -l | tr -d ' ')
HANDLER_COUNT=$(ls "$PAI_DIR/hooks/handlers/"*.ts 2>/dev/null | wc -l | tr -d ' ')
echo "   Hook files: $HOOK_COUNT / 15"
echo "   Lib files: $LIB_COUNT / 12"
echo "   Handler files: $HANDLER_COUNT / 4"
echo ""

echo "4. Core System"
test -f "$PAI_DIR/skills/CORE/SKILL.md" && echo "   SKILL.md: OK" || echo "   SKILL.md: MISSING"
SYSTEM_COUNT=$(ls "$PAI_DIR/skills/CORE/SYSTEM/" 2>/dev/null | wc -l | tr -d ' ')
echo "   SYSTEM files: $SYSTEM_COUNT / 19+"
echo ""

echo "5. Configuration"
test -f "$PAI_DIR/settings.json" && echo "   settings.json: EXISTS" || echo "   settings.json: MISSING"
test -f "$PAI_DIR/.env" && echo "   .env: EXISTS" || echo "   .env: MISSING"
echo ""

echo "6. JSON Validation"
if [ -f "$PAI_DIR/settings.json" ]; then
    python3 -m json.tool "$PAI_DIR/settings.json" >/dev/null 2>&1 && \
        echo "   settings.json: VALID JSON" || echo "   settings.json: INVALID JSON"
fi

echo ""
echo "=== Diagnostic Complete ==="
```

---

### Check Installation Health Score

```bash
# Quick health score (0-10)
score=0
PAI_DIR="${PAI_DIR:-$HOME/.claude}"

test -d "$PAI_DIR" && ((score++))
test -f "$PAI_DIR/settings.json" && ((score++))
test -f "$PAI_DIR/.env" && ((score++))
test -d "$PAI_DIR/hooks" && ((score++))
[ $(ls "$PAI_DIR/hooks/"*.hook.ts 2>/dev/null | wc -l) -eq 15 ] && ((score++))
[ $(ls "$PAI_DIR/hooks/lib/"*.ts 2>/dev/null | wc -l) -eq 12 ] && ((score++))
test -f "$PAI_DIR/skills/CORE/SKILL.md" && ((score++))
test -d "$PAI_DIR/skills/CORE/SYSTEM" && ((score++))
[ -n "$DA" ] && ((score++))
[ -n "$PAI_DIR" ] && ((score++))

echo "PAI Health Score: $score / 10"
case $score in
    10) echo "Status: EXCELLENT" ;;
    8|9) echo "Status: GOOD - Minor issues" ;;
    5|6|7) echo "Status: PARTIAL - Some components missing" ;;
    *) echo "Status: NEEDS ATTENTION - Run full diagnostic" ;;
esac
```

---

## Recovery Procedures

### Full Reset (Start Over)

```bash
# 1. Backup current state (if valuable)
cp -r ~/.claude ~/.claude-save-$(date +%Y%m%d)

# 2. Remove existing installation
rm -rf ~/.claude
rm -rf ~/.claude-BACKUP

# 3. Remove environment variables from shell profile
# Edit ~/.zshrc or ~/.bashrc and remove PAI Configuration section

# 4. Reload shell
source ~/.zshrc  # or ~/.bashrc

# 5. Fresh install
cd /path/to/Personal_AI_Infrastructure/Bundles/Official
bun run install.ts
```

---

### Restore from Backup

```bash
# 1. Remove current (broken) installation
rm -rf ~/.claude

# 2. Restore from backup
cp -r ~/.claude-BACKUP ~/.claude

# 3. Restart Claude Code
```

---

### Selective Pack Reinstall

If only one pack is broken:

```bash
# Example: Reinstall hook system
cd /path/to/Personal_AI_Infrastructure/Packs/pai-hook-system

# Follow INSTALL.md for that specific pack
# Copy source files from src/ to ~/.claude/
```

---

## Getting Help

If issues persist after trying these solutions:

1. **Check GitHub Issues:** https://github.com/danielmiessler/PAI/issues
2. **GitHub Discussions:** https://github.com/danielmiessler/PAI/discussions
3. **Run full diagnostic** and share the output

When reporting issues, include:
- Operating system and version
- Shell (zsh/bash)
- Bun version (`bun --version`)
- Full diagnostic output
- Exact error message

---

## Quick Reference Card

| Issue | Quick Fix |
|-------|-----------|
| bun not found | `curl -fsSL https://bun.sh/install \| bash` |
| Hooks not firing | Restart Claude Code |
| Invalid JSON | `cat ~/.claude/settings.json \| jq .` to find error |
| Missing hooks | Check file count: should be 31 total |
| Env vars not set | Check ~/.zshrc, settings.json, and .env |
| Backup conflict | Remove or rename ~/.claude-BACKUP |
| Invalid timezone | Use IANA format: `America/New_York` |
| Permission denied | `chmod -R u+rw ~/.claude` |

---

*Last updated: 2026-01-19*
