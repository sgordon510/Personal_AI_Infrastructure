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

## Community Best Practices (from PAI Discussion #435)

The following practices are sourced from the [PAI GitHub Discussion #435](https://github.com/danielmiessler/Personal_AI_Infrastructure/discussions/435) and represent battle-tested approaches from the PAI community.

### SKILLCUSTOMIZATIONS Architecture

The recommended pattern for extending skills without modifying core files:

```
~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/
├── {SkillName}/
│   ├── EXTEND.yaml          # Extension configuration
│   ├── PREFERENCES.md       # Skill-specific preferences (auto-loaded)
│   └── Workflows/           # Custom workflows for this skill
│       └── MyCustomFlow.md
```

**Key insight**: Skills automatically load `PREFERENCES.md`, so use it as an entry point to chain-load additional custom files:

```markdown
<!-- In SKILLCUSTOMIZATIONS/Research/PREFERENCES.md -->
# Research Preferences

## My Custom Extensions
When executing research, also load:
- `SKILLCUSTOMIZATIONS/Research/Workflows/DeepDive.md`
- `SKILLCUSTOMIZATIONS/Research/Sources.md`
```

### Personal Skills Naming Convention

For completely custom skills that should never sync:

```
~/.claude/skills/
├── CORE/              # PAI standard (syncs with upstream)
├── Research/          # PAI standard (syncs with upstream)
├── _MYRESEARCH/       # YOUR custom skill (never syncs)
├── _WORKFLOWS/        # YOUR custom skill (never syncs)
└── _PERSONALSKILLS/   # YOUR custom skills directory
```

**The `_ALLCAPS` convention** signals "this is mine, never overwrite":
- `_MYSKILL` - Your custom skill
- `_WORKFLOWS` - Your custom workflows
- `_PERSONALSKILLS/` - Directory for all your custom skills

### Environment Separation

**Critical**: PAI v2.3 expects API keys in `~/.claude/.env`, NOT in `settings.json`:

```bash
# ~/.claude/.env (CORRECT - protected, never committed)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
ELEVENLABS_API_KEY=...

# settings.json (WRONG for secrets - may sync)
# Don't put API keys here!
```

This separation ensures:
1. Secrets never accidentally commit
2. `settings.json` can safely sync
3. `.env` is in `.gitignore` by default

### Platform-Specific Path Issues (Linux)

**Critical for Linux users**: Some PAI tools assume macOS and hardcode `/Users/` paths.

**Detection**:
```bash
# Find hardcoded macOS paths in your installation
grep -rn "/Users/" ~/.claude/skills/*/Tools/*.ts 2>/dev/null
grep -rn "/Users/" Releases/v2.3/.claude/skills/*/Tools/*.ts 2>/dev/null
```

**Solution**: Tools should use conditional path handling:
```typescript
const homeDir = process.env.HOME ||
  (process.platform === 'darwin' ? `/Users/${process.env.USER}` : `/home/${process.env.USER}`);
```

Add to your `.pai-customizations.yaml`:
```yaml
platform_fixes:
  description: "Files that need Linux path corrections"
  files_to_check:
    - "skills/*/Tools/*.ts"
  pattern_to_fix: "/Users/"
  replacement: "${HOME}/"
```

### What to Preserve vs. Skip During Migration

| Preserve | Skip |
|----------|------|
| `skills/CORE/USER/` | `raw-outputs/` (regeneratable) |
| `_PERSONALSKILLS/` | `node_modules/` (reinstall fresh) |
| `MEMORY/LEARNING/` | Hook-captured session summaries |
| `MEMORY/RESEARCH/` | Temporary work files |
| `MEMORY/SIGNALS/ratings.jsonl` | Build artifacts |
| `USER/kb/` (knowledge base) | Cache directories |
| Agent personalities | Log files |
| Custom workflows | |

### Chain-Loading Pattern for Extensions

When you want to extend a SYSTEM file without modifying it:

1. **Don't modify**: `skills/CORE/SYSTEM/MEMORYSYSTEM.md`
2. **Instead create**: `skills/CORE/USER/SKILLCUSTOMIZATIONS/CORE/MEMORY_EXTENSIONS.md`
3. **Reference it** from your `PREFERENCES.md`:

```markdown
<!-- SKILLCUSTOMIZATIONS/CORE/PREFERENCES.md -->
# CORE Skill Customizations

## Memory Extensions
For enhanced memory operations, also apply rules from:
`SKILLCUSTOMIZATIONS/CORE/MEMORY_EXTENSIONS.md`

## Response Format Extensions
Apply my formatting preferences from:
`USER/RESPONSEFORMAT.md`
```

This pattern:
- Keeps SYSTEM files pristine for upstream updates
- Your extensions load automatically via PREFERENCES.md
- No merge conflicts on SYSTEM files

### Knowledge Base Preservation

Your personal knowledge base lives outside the skill structure:

```
~/.claude/
├── USER/
│   └── kb/                    # Your knowledge base
│       ├── domains/           # Domain-specific knowledge
│       ├── projects/          # Project context
│       └── reference/         # Reference materials
```

Add to protected paths:
```yaml
never_merge:
  directories:
    - "USER/kb/"
```

### Migration Checklist (from Discussion)

When migrating to a new PAI version:

```bash
# 1. Full backup
tar -czf ~/pai-full-backup-$(date +%Y%m%d).tar.gz ~/.claude/

# 2. Inventory your customizations
find ~/.claude/skills -name "PREFERENCES.md" -o -name "_*" | head -50
ls ~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/

# 3. List personal skills
ls ~/.claude/skills/ | grep "^_"

# 4. Check for hardcoded paths (Linux)
grep -rn "/Users/" ~/.claude/skills/*/Tools/*.ts 2>/dev/null

# 5. Copy personal skills to new installation
cp -r ~/.claude/skills/_* ~/new-pai/.claude/skills/

# 6. Copy SKILLCUSTOMIZATIONS
cp -r ~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/* \
      ~/new-pai/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/

# 7. Copy knowledge base
cp -r ~/.claude/USER/kb ~/new-pai/.claude/USER/

# 8. Copy MEMORY (selective)
cp -r ~/.claude/MEMORY/LEARNING ~/new-pai/.claude/MEMORY/
cp -r ~/.claude/MEMORY/RESEARCH ~/new-pai/.claude/MEMORY/
cp ~/.claude/MEMORY/SIGNALS/ratings.jsonl ~/new-pai/.claude/MEMORY/SIGNALS/

# 9. Verify .env exists in new location
cp ~/.claude/.env ~/new-pai/.claude/.env
```

---

## Updated Protection Summary

Combining the original plan with community practices:

```
PROTECTION HIERARCHY (Enhanced)
├── Tier 0: SECRETS (Never in repo)
│   └── .env, .env.*, credentials
│
├── Tier 1: IDENTITY (Never merge)
│   ├── skills/CORE/USER/**
│   ├── USER/kb/**
│   ├── _PERSONALSKILLS/**
│   ├── skills/_*/**
│   └── MEMORY/SIGNALS/ratings.jsonl
│
├── Tier 2: LEARNING (Never merge)
│   ├── MEMORY/LEARNING/**
│   ├── MEMORY/RESEARCH/**
│   └── MEMORY/WORK/** (active only)
│
├── Tier 3: CUSTOMIZATIONS (Selective merge)
│   ├── SKILLCUSTOMIZATIONS/**
│   ├── Modified hooks
│   └── Extended SYSTEM files
│
└── Tier 4: UPSTREAM (Auto merge)
    ├── Packs/
    ├── Tools/
    └── Documentation
```

---

## Project Work Preservation

### Understanding the Two-Location Model

Your PAI setup has **two distinct locations**:

| Location | Purpose | What Lives Here |
|----------|---------|-----------------|
| **This Repository** (`~/Personal_AI_Infrastructure/`) | Fork of PAI for upstream sync | Templates, packs, documentation |
| **Live Installation** (`~/.claude/`) | Your working PAI system | Active projects, memory, customizations |

**Your project work** (Vulnerability Dashboard, Security Assessment, etc.) lives in your **live installation**, not this repository.

### Where Project Artifacts Are Stored

```
~/.claude/                              # Your LIVE PAI installation
├── MEMORY/
│   ├── Work/                           # ACTIVE PROJECT WORKSPACES
│   │   ├── Vulnerability-Dashboard/    # ← Your project
│   │   │   ├── artifacts/
│   │   │   ├── findings/
│   │   │   └── reports/
│   │   └── Security-Assessment/        # ← Your project
│   │       ├── scope/
│   │       ├── results/
│   │       └── deliverables/
│   ├── RESEARCH/                       # Research from projects
│   │   ├── vulnerability-patterns/
│   │   └── assessment-methodologies/
│   ├── LEARNINGS/                      # Insights extracted from work
│   └── SIGNALS/ratings.jsonl           # Learning feedback
│
├── skills/CORE/USER/
│   ├── WORK/                           # Client/work-sensitive content
│   │   ├── Customers/
│   │   └── Engagements/
│   └── TELOS/PROJECTS.md               # Project tracking
│
└── skills/_SECURITYPROJECTS/           # Personal security skill (if created)
```

### Project Preservation Strategy

**Your projects are already protected** by the existing plan because:

1. **MEMORY/Work/** is covered by `**/MEMORY/**` protection
2. **MEMORY/RESEARCH/** is covered by `**/MEMORY/**` protection
3. **USER/WORK/** is covered by `**/USER/**` protection
4. **Personal skills** (`_SECURITYPROJECTS/`) are covered by `skills/_*/**` protection

### Recommended: Backup Your Live Installation

Since your actual work is in `~/.claude/`, not this repo, add this to your backup routine:

```bash
# Backup live PAI installation (includes all project work)
backup_pai() {
    local BACKUP_DIR="${HOME}/pai-backups"
    local TIMESTAMP=$(date +%Y%m%d-%H%M%S)

    mkdir -p "$BACKUP_DIR"

    # Full backup of live installation
    tar -czf "$BACKUP_DIR/pai-live-$TIMESTAMP.tar.gz" \
        --exclude='node_modules' \
        --exclude='raw-outputs' \
        --exclude='.git' \
        ~/.claude/

    echo "Backed up to: $BACKUP_DIR/pai-live-$TIMESTAMP.tar.gz"
}

# Run weekly or before major changes
backup_pai
```

### Syncing Project Templates to This Repo

If you want project **templates** (not actual data) in this repo for backup:

```bash
# Copy sanitized project templates (NO sensitive data)
cp ~/.claude/MEMORY/Work/Vulnerability-Dashboard/templates/* \
   ~/Personal_AI_Infrastructure/Releases/v2.3/.claude/skills/CORE/USER/WORK/templates/

# NEVER copy actual findings, customer data, or deliverables
```

### Project Isolation Checklist

For each project (Vulnerability Dashboard, Security Assessment):

- [ ] Project workspace exists in `~/.claude/MEMORY/Work/[Project]/`
- [ ] Sensitive findings are NOT in this repository
- [ ] Templates (if any) are in `USER/WORK/templates/`
- [ ] Project is tracked in `USER/TELOS/PROJECTS.md`
- [ ] Regular backups of `~/.claude/` are scheduled

---

*Plan created: 2026-01-19*
*Updated: 2026-01-19 with community practices from Discussion #435*
*For: Personal AI Infrastructure customization preservation*
