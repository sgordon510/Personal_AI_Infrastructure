# AI Customization Preservation Plan

## Executive Summary

This plan ensures your Personal AI Infrastructure customizations survive updates from Daniel Miessler's upstream PAI repository. The strategy leverages PAI's built-in USER/SYSTEM tier separation while adding robust git workflow practices for managing upstream changes.

---

## Current State Analysis

### Your Customizations (Protected Assets)

Your repository contains extensive personalizations in `Releases/v2.3/.claude/skills/CORE/USER/`:

| Category | Files | Purpose |
|----------|-------|---------|
| **Identity** | `ABOUTME.md`, `BASICINFO.md`, `RESUME.md` | Who you are |
| **DA Personality** | `DAIDENTITY.md` | Your AI's voice and behavior |
| **Life OS (Telos)** | 20+ files in `TELOS/` | Beliefs, goals, mission, strategies |
| **Preferences** | `TECHSTACKPREFERENCES.md`, `ALGOPREFS.md` | How you work |
| **Skills** | `SKILLCUSTOMIZATIONS/Art/` | Per-skill overrides |
| **Relationships** | `CONTACTS.md` | People your AI knows |
| **Context** | `ARCHITECTURE.md`, `DEFINITIONS.md`, `CORECONTENT.md` | Your mental models |

### Existing Protection Mechanisms

1. **USER/SYSTEM Tier Separation** - Built into PAI architecture
2. **`.pai-protected.json`** - Comprehensive validation manifest
3. **`.gitignore`** - Excludes sensitive files from version control

### Current Gap

**No upstream remote configured** - You cannot currently pull updates from Daniel Miessler's repository.

---

## Strategy Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    THREE-TIER PROTECTION MODEL                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Tier 1: NEVER MERGE (Your Identity)                                │
│  ├── skills/CORE/USER/**                                            │
│  ├── .env, credentials                                              │
│  └── MEMORY/, History/                                              │
│                                                                      │
│  Tier 2: SELECTIVE MERGE (Infrastructure You've Modified)          │
│  ├── Custom hooks you've enhanced                                   │
│  ├── Skills you've extended                                         │
│  └── SYSTEM files with your additions                               │
│                                                                      │
│  Tier 3: AUTO-MERGE (Pure Upstream)                                 │
│  ├── New Packs/                                                     │
│  ├── Tools/ (validation, utilities)                                 │
│  └── Documentation updates                                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Configure Upstream Remote

```bash
# Add Daniel Miessler's PAI as upstream
git remote add upstream https://github.com/danielmiessler/PAI.git

# Verify remotes
git remote -v
# Should show:
# origin    <your-fork> (fetch/push)
# upstream  https://github.com/danielmiessler/PAI.git (fetch/push)
```

### Phase 2: Create Protection Branch Structure

```bash
# Your customizations live on main
# Create a tracking branch for upstream
git fetch upstream
git checkout -b upstream-tracking upstream/main

# Return to your main branch
git checkout main
```

**Branch Strategy:**
- `main` - Your customized version (protected)
- `upstream-tracking` - Clean upstream mirror
- `feature/*` - Your new features
- `upstream-merge/*` - Integration branches for reviewing upstream changes

### Phase 3: Create Customization Manifest

Create a file that explicitly lists YOUR customizations (complement to `.pai-protected.json`):

```yaml
# .pai-customizations.yaml
version: "1.0"
description: "Files that contain YOUR customizations - never overwrite from upstream"

# Tier 1: NEVER MERGE - Your identity and personal data
never_merge:
  directories:
    - "Releases/v2.3/.claude/skills/CORE/USER/"
    - "Releases/v2.3/.claude/MEMORY/"
    - "Releases/v2.3/.claude/History/"
  files:
    - ".env"
    - ".env.local"
    - "settings.json"
  patterns:
    - "**/USER/**"
    - "**/MEMORY/**"
    - "**/.env*"

# Tier 2: SELECTIVE MERGE - Review before accepting upstream changes
selective_merge:
  description: "Infrastructure you've customized - review diffs carefully"
  files:
    - "Releases/v2.3/.claude/hooks/*.ts"      # If you've modified hooks
    - "Releases/v2.3/.claude/skills/*/SKILL.md"  # If you've customized skills
  review_strategy: "Compare your version with upstream, cherry-pick improvements"

# Tier 3: AUTO-MERGE - Safe to update
auto_merge:
  description: "Pure upstream content you haven't modified"
  directories:
    - "Packs/"
    - "Tools/"
    - "Plans/"
  files:
    - "README.md"
    - "INSTALL.md"
    - "SECURITY.md"
```

### Phase 4: Safe Upstream Sync Workflow

#### Step-by-Step Merge Process

```bash
# 1. Fetch upstream changes (don't merge yet)
git fetch upstream

# 2. See what's changed
git log main..upstream/main --oneline

# 3. Create integration branch
git checkout -b upstream-merge/$(date +%Y-%m-%d) main

# 4. Attempt merge with conflict detection
git merge upstream/main --no-commit --no-ff

# 5. If conflicts in USER files, ALWAYS keep yours:
git checkout --ours "Releases/v2.3/.claude/skills/CORE/USER/*"

# 6. Review other conflicts manually
git diff --cached  # See what will be committed

# 7. If satisfied, commit
git commit -m "Merge upstream PAI updates ($(date +%Y-%m-%d))"

# 8. Test thoroughly before merging to main
# Run validation, test your customizations still work

# 9. Merge to main when satisfied
git checkout main
git merge upstream-merge/$(date +%Y-%m-%d)
```

### Phase 5: Create Automated Sync Script

```bash
#!/bin/bash
# sync-upstream.sh - Safe upstream sync with customization protection

set -e

PROTECTED_PATHS=(
    "Releases/v2.3/.claude/skills/CORE/USER"
    "Releases/v2.3/.claude/MEMORY"
    ".env"
)

echo "🔄 Fetching upstream changes..."
git fetch upstream

BEHIND=$(git rev-list --count main..upstream/main)
if [ "$BEHIND" -eq 0 ]; then
    echo "✅ Already up to date with upstream"
    exit 0
fi

echo "📊 $BEHIND commits behind upstream"
echo ""
echo "Changes from upstream:"
git log main..upstream/main --oneline | head -20

echo ""
read -p "Proceed with merge? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Create integration branch
BRANCH="upstream-merge/$(date +%Y-%m-%d-%H%M)"
git checkout -b "$BRANCH" main

# Merge with strategy
echo "🔀 Merging with protected paths..."
git merge upstream/main --no-commit --no-ff || true

# Protect customized files
for path in "${PROTECTED_PATHS[@]}"; do
    if git diff --cached --name-only | grep -q "$path"; then
        echo "🛡️  Protecting: $path"
        git checkout --ours "$path" 2>/dev/null || true
        git add "$path" 2>/dev/null || true
    fi
done

# Show status
echo ""
echo "📋 Merge status:"
git status --short

echo ""
echo "Next steps:"
echo "  1. Review changes: git diff --cached"
echo "  2. Resolve remaining conflicts"
echo "  3. Commit: git commit -m 'Merge upstream PAI updates'"
echo "  4. Test your customizations"
echo "  5. Merge to main: git checkout main && git merge $BRANCH"
```

### Phase 6: Add Git Attributes for Merge Strategy

Create `.gitattributes` to define merge strategies:

```gitattributes
# .gitattributes - Define merge strategies for PAI customization protection

# NEVER overwrite USER customizations - always keep ours
Releases/v2.3/.claude/skills/CORE/USER/** merge=ours
**/USER/** merge=ours
.env merge=ours
.env.* merge=ours
settings.json merge=ours

# Binary files
*.png binary
*.jpg binary
*.pdf binary
```

Enable the "ours" merge driver:
```bash
git config merge.ours.driver true
```

---

## Verification Checklist

### Before Each Upstream Sync

- [ ] Backup current USER directory: `cp -r Releases/v2.3/.claude/skills/CORE/USER ~/pai-user-backup-$(date +%Y%m%d)`
- [ ] Commit all local changes
- [ ] Note any SYSTEM files you've customized

### After Each Upstream Sync

- [ ] Run validation: `bun Tools/validate-protected.ts` (if available)
- [ ] Verify USER files unchanged: `git diff HEAD~1 -- "**/USER/**"`
- [ ] Test DA personality loads correctly
- [ ] Verify hooks still function
- [ ] Check custom skills still work

---

## Directory Structure Best Practices

### Current (Good)
```
Releases/v2.3/.claude/skills/CORE/
├── SYSTEM/          ← Upstream updates go here
└── USER/            ← YOUR customizations (protected)
```

### Recommendation: Create Local Override Layer

For SYSTEM files you want to customize without blocking upstream updates:

```
Releases/v2.3/.claude/skills/CORE/
├── SYSTEM/          ← Upstream (auto-merge)
├── USER/            ← Your identity (never merge)
└── OVERRIDES/       ← Your SYSTEM modifications (selective merge)
    ├── MEMORYSYSTEM.local.md
    └── RESPONSEFORMAT.local.md
```

This allows you to:
1. Accept SYSTEM updates from upstream
2. Keep your modifications in OVERRIDES
3. Your DA loads: USER → OVERRIDES → SYSTEM (fallback chain)

---

## Emergency Recovery Procedures

### Accidentally Overwrote USER Files

```bash
# If you haven't committed yet
git checkout HEAD -- "Releases/v2.3/.claude/skills/CORE/USER/"

# If you committed but haven't pushed
git reset HEAD~1 --hard

# If you pushed, find the last good commit
git log --oneline -- "Releases/v2.3/.claude/skills/CORE/USER/"
git checkout <good-commit-hash> -- "Releases/v2.3/.claude/skills/CORE/USER/"
```

### Upstream Introduced Breaking Changes

```bash
# Revert the merge commit
git revert -m 1 <merge-commit-hash>

# Or reset to before merge
git reset --hard <pre-merge-commit>
```

---

## Recommended Tooling

### 1. Pre-commit Hook (`.git/hooks/pre-commit`)

```bash
#!/bin/bash
# Prevent accidental commits of USER files from wrong branch

BRANCH=$(git branch --show-current)
CHANGED_USER=$(git diff --cached --name-only | grep -c "USER/" || true)

if [[ "$BRANCH" == upstream-* ]] && [[ "$CHANGED_USER" -gt 0 ]]; then
    echo "❌ ERROR: USER files modified on upstream branch!"
    echo "   USER files should only change on main branch."
    exit 1
fi
```

### 2. Diff Wrapper for Upstream Comparison

```bash
# compare-upstream.sh
#!/bin/bash
# Show what upstream changed, excluding your customizations

git diff main..upstream/main \
    --stat \
    -- ':!**/USER/**' \
    -- ':!.env*' \
    -- ':!MEMORY/'
```

---

## Summary: The Golden Rules

1. **USER Directory is Sacred** - Never accept upstream changes to `USER/`
2. **Test Before Merge to Main** - Always use integration branches
3. **Backup Before Sync** - One command: `cp -r USER/ ~/backup-$(date +%s)`
4. **Review SYSTEM Changes** - Upstream improvements may benefit you
5. **Document Your Customizations** - Keep `.pai-customizations.yaml` updated
6. **Validate After Merge** - Run protection validation scripts

---

## Quick Reference Card

```
# Daily: Check for upstream updates
git fetch upstream && git log main..upstream/main --oneline

# Weekly: Sync if updates available
./sync-upstream.sh

# Before major upstream sync: Backup
tar -czf ~/pai-backup-$(date +%Y%m%d).tar.gz Releases/v2.3/.claude/skills/CORE/USER/

# After sync: Validate
git diff HEAD~1 -- "**/USER/**"  # Should be empty

# Emergency: Restore USER files
git checkout HEAD~1 -- "Releases/v2.3/.claude/skills/CORE/USER/"
```

---

*Plan created: 2026-01-19*
*For: Personal AI Infrastructure customization preservation*
