#!/bin/bash
# =============================================================================
# PAI Upstream Sync Script
# Purpose: Safely merge updates from Daniel Miessler's PAI while protecting
#          your customizations
# Usage: ./Tools/sync-upstream.sh [--dry-run] [--auto]
# =============================================================================

set -e

# Configuration
UPSTREAM_URL="https://github.com/danielmiessler/PAI.git"
UPSTREAM_BRANCH="main"
BACKUP_DIR="${HOME}/pai-backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Protected paths - NEVER accept upstream changes for these
PROTECTED_PATHS=(
    "Releases/v2.3/.claude/skills/CORE/USER"
    "Releases/v2.3/.claude/USER"
    "Releases/v2.3/.claude/MEMORY"
    "Releases/v2.3/.claude/History"
    "Packs/pai-core-install/src/skills/CORE/USER"
    ".env"
    ".env.local"
    "settings.json"
)

# Parse arguments
DRY_RUN=false
AUTO_MODE=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --auto)
            AUTO_MODE=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          PAI Upstream Sync - Customization Safe                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Ensure we're in the right directory
if [[ ! -f ".pai-protected.json" ]]; then
    echo -e "${RED}ERROR: Must run from PAI repository root${NC}"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}WARNING: You have uncommitted changes${NC}"
    git status --short
    echo ""
    if [[ "$AUTO_MODE" == "false" ]]; then
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Commit or stash your changes first."
            exit 1
        fi
    fi
fi

# Setup upstream remote if needed
echo -e "${BLUE}[1/7] Checking upstream remote...${NC}"
if ! git remote get-url upstream &>/dev/null; then
    echo -e "${YELLOW}Adding upstream remote: ${UPSTREAM_URL}${NC}"
    git remote add upstream "$UPSTREAM_URL"
fi

# Fetch upstream
echo -e "${BLUE}[2/7] Fetching upstream changes...${NC}"
git fetch upstream

# Check how far behind we are
BEHIND=$(git rev-list --count HEAD..upstream/${UPSTREAM_BRANCH} 2>/dev/null || echo "0")
AHEAD=$(git rev-list --count upstream/${UPSTREAM_BRANCH}..HEAD 2>/dev/null || echo "0")

echo ""
echo -e "  Local is ${YELLOW}${BEHIND}${NC} commits behind upstream"
echo -e "  Local is ${GREEN}${AHEAD}${NC} commits ahead of upstream"
echo ""

if [[ "$BEHIND" -eq 0 ]]; then
    echo -e "${GREEN}✓ Already up to date with upstream!${NC}"
    exit 0
fi

# Show what changed
echo -e "${BLUE}[3/7] Changes from upstream:${NC}"
echo "────────────────────────────────────────"
git log HEAD..upstream/${UPSTREAM_BRANCH} --oneline | head -20
if [[ "$BEHIND" -gt 20 ]]; then
    echo "  ... and $((BEHIND - 20)) more commits"
fi
echo "────────────────────────────────────────"
echo ""

# Check for conflicts with protected paths
echo -e "${BLUE}[4/7] Checking for conflicts with your customizations...${NC}"
CONFLICTS_FOUND=false
for path in "${PROTECTED_PATHS[@]}"; do
    CHANGED=$(git diff HEAD..upstream/${UPSTREAM_BRANCH} --name-only -- "$path" 2>/dev/null | wc -l)
    if [[ "$CHANGED" -gt 0 ]]; then
        echo -e "  ${YELLOW}⚠${NC}  Protected path has upstream changes: ${path}"
        CONFLICTS_FOUND=true
    fi
done

if [[ "$CONFLICTS_FOUND" == "true" ]]; then
    echo ""
    echo -e "${YELLOW}NOTE: Protected paths with upstream changes will keep YOUR version${NC}"
fi
echo ""

# Dry run mode
if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${BLUE}[DRY RUN] Would merge the following (excluding protected):${NC}"
    git diff HEAD..upstream/${UPSTREAM_BRANCH} --stat -- \
        ':!**/USER/**' \
        ':!**/MEMORY/**' \
        ':!.env*' \
        ':!settings.json'
    echo ""
    echo -e "${GREEN}Dry run complete. No changes made.${NC}"
    exit 0
fi

# Confirmation
if [[ "$AUTO_MODE" == "false" ]]; then
    echo -e "${YELLOW}Ready to merge ${BEHIND} commits from upstream.${NC}"
    read -p "Proceed? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Backup
echo -e "${BLUE}[5/7] Creating backup of customizations...${NC}"
BACKUP_NAME="pai-user-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
for path in "${PROTECTED_PATHS[@]}"; do
    if [[ -e "$path" ]]; then
        DEST="$BACKUP_DIR/$BACKUP_NAME/$(dirname "$path")"
        mkdir -p "$DEST"
        cp -r "$path" "$DEST/" 2>/dev/null || true
    fi
done
echo -e "  Backup saved to: ${GREEN}${BACKUP_DIR}/${BACKUP_NAME}${NC}"
echo ""

# Create integration branch
BRANCH="upstream-merge/$(date +%Y-%m-%d-%H%M)"
echo -e "${BLUE}[6/7] Creating integration branch: ${BRANCH}${NC}"
git checkout -b "$BRANCH"

# Perform merge
echo -e "${BLUE}[7/7] Merging upstream changes...${NC}"
if git merge upstream/${UPSTREAM_BRANCH} --no-commit --no-ff 2>/dev/null; then
    echo -e "  ${GREEN}✓ Merge completed without conflicts${NC}"
else
    echo -e "  ${YELLOW}⚠ Merge has conflicts - resolving protected paths...${NC}"
fi

# Protect customized files - always keep ours
PROTECTED_COUNT=0
for path in "${PROTECTED_PATHS[@]}"; do
    if git diff --cached --name-only 2>/dev/null | grep -q "$path"; then
        echo -e "  ${GREEN}✓${NC} Protecting: $path"
        git checkout --ours "$path" 2>/dev/null || true
        git add "$path" 2>/dev/null || true
        ((PROTECTED_COUNT++)) || true
    fi
done

if [[ "$PROTECTED_COUNT" -gt 0 ]]; then
    echo -e "  Protected ${GREEN}${PROTECTED_COUNT}${NC} paths"
fi

# Check for remaining conflicts
REMAINING=$(git diff --name-only --diff-filter=U 2>/dev/null | wc -l)
if [[ "$REMAINING" -gt 0 ]]; then
    echo ""
    echo -e "${YELLOW}Remaining conflicts to resolve manually:${NC}"
    git diff --name-only --diff-filter=U
    echo ""
    echo -e "${YELLOW}Resolve these conflicts, then:${NC}"
    echo "  1. git add <resolved-files>"
    echo "  2. git commit -m 'Merge upstream PAI updates'"
    echo "  3. git checkout main && git merge $BRANCH"
else
    # Auto-commit if no conflicts
    git commit -m "Merge upstream PAI updates ($(date +%Y-%m-%d))

Merged ${BEHIND} commits from upstream.
Protected paths preserved:
$(printf '  - %s\n' "${PROTECTED_PATHS[@]}")
"
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    Merge Successful!                           ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Next steps:"
    echo -e "  1. Review changes: ${BLUE}git diff main..HEAD${NC}"
    echo -e "  2. Test your customizations still work"
    echo -e "  3. Merge to main: ${BLUE}git checkout main && git merge $BRANCH${NC}"
    echo ""
    echo -e "To abort: ${YELLOW}git checkout main && git branch -D $BRANCH${NC}"
fi
