#!/bin/bash
# =============================================================================
# PAI Backup Script
# Purpose: Create timestamped backups of your live PAI installation
# Usage: ./Tools/backup-pai.sh [--full | --projects | --identity]
# =============================================================================

set -e

# Configuration
PAI_DIR="${PAI_DIR:-$HOME/.claude}"
BACKUP_DIR="${PAI_BACKUP_DIR:-$HOME/pai-backups}"
RETENTION_DAYS=30

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Parse arguments
BACKUP_TYPE="full"
while [[ $# -gt 0 ]]; do
    case $1 in
        --full)
            BACKUP_TYPE="full"
            shift
            ;;
        --projects)
            BACKUP_TYPE="projects"
            shift
            ;;
        --identity)
            BACKUP_TYPE="identity"
            shift
            ;;
        --list)
            echo -e "${BLUE}Existing backups in ${BACKUP_DIR}:${NC}"
            ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "No backups found"
            exit 0
            ;;
        --clean)
            echo -e "${YELLOW}Cleaning backups older than ${RETENTION_DAYS} days...${NC}"
            find "$BACKUP_DIR" -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete -print
            echo -e "${GREEN}Done${NC}"
            exit 0
            ;;
        --help|-h)
            echo "PAI Backup Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --full       Full backup of ~/.claude/ (default)"
            echo "  --projects   Backup only MEMORY/Work and MEMORY/RESEARCH"
            echo "  --identity   Backup only USER customizations and identity"
            echo "  --list       List existing backups"
            echo "  --clean      Remove backups older than ${RETENTION_DAYS} days"
            echo "  --help       Show this help"
            echo ""
            echo "Environment variables:"
            echo "  PAI_DIR          PAI installation directory (default: ~/.claude)"
            echo "  PAI_BACKUP_DIR   Backup destination (default: ~/pai-backups)"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Verify PAI directory exists
if [[ ! -d "$PAI_DIR" ]]; then
    echo -e "${RED}ERROR: PAI directory not found: ${PAI_DIR}${NC}"
    echo "Set PAI_DIR environment variable to your PAI installation path"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    PAI Backup Utility                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  PAI Directory: ${GREEN}${PAI_DIR}${NC}"
echo -e "  Backup Type:   ${GREEN}${BACKUP_TYPE}${NC}"
echo -e "  Destination:   ${GREEN}${BACKUP_DIR}${NC}"
echo ""

case $BACKUP_TYPE in
    full)
        BACKUP_FILE="$BACKUP_DIR/pai-full-$TIMESTAMP.tar.gz"
        echo -e "${BLUE}Creating full backup...${NC}"

        tar -czf "$BACKUP_FILE" \
            --exclude='node_modules' \
            --exclude='raw-outputs' \
            --exclude='.git' \
            --exclude='*.log' \
            --exclude='__pycache__' \
            --exclude='.cache' \
            -C "$(dirname "$PAI_DIR")" \
            "$(basename "$PAI_DIR")"
        ;;

    projects)
        BACKUP_FILE="$BACKUP_DIR/pai-projects-$TIMESTAMP.tar.gz"
        echo -e "${BLUE}Creating projects backup...${NC}"

        # Build list of directories to backup
        INCLUDE_PATHS=()
        [[ -d "$PAI_DIR/MEMORY/Work" ]] && INCLUDE_PATHS+=("MEMORY/Work")
        [[ -d "$PAI_DIR/MEMORY/RESEARCH" ]] && INCLUDE_PATHS+=("MEMORY/RESEARCH")
        [[ -d "$PAI_DIR/MEMORY/LEARNING" ]] && INCLUDE_PATHS+=("MEMORY/LEARNING")
        [[ -f "$PAI_DIR/MEMORY/SIGNALS/ratings.jsonl" ]] && INCLUDE_PATHS+=("MEMORY/SIGNALS/ratings.jsonl")

        if [[ ${#INCLUDE_PATHS[@]} -eq 0 ]]; then
            echo -e "${YELLOW}No project directories found to backup${NC}"
            exit 0
        fi

        tar -czf "$BACKUP_FILE" \
            -C "$PAI_DIR" \
            "${INCLUDE_PATHS[@]}"
        ;;

    identity)
        BACKUP_FILE="$BACKUP_DIR/pai-identity-$TIMESTAMP.tar.gz"
        echo -e "${BLUE}Creating identity backup...${NC}"

        # Build list of identity files/directories
        INCLUDE_PATHS=()
        [[ -d "$PAI_DIR/skills/CORE/USER" ]] && INCLUDE_PATHS+=("skills/CORE/USER")
        [[ -d "$PAI_DIR/USER" ]] && INCLUDE_PATHS+=("USER")
        [[ -f "$PAI_DIR/.env" ]] && INCLUDE_PATHS+=(".env")
        [[ -f "$PAI_DIR/settings.json" ]] && INCLUDE_PATHS+=("settings.json")

        # Include personal skills (_* pattern)
        for skill in "$PAI_DIR/skills"/_*; do
            [[ -d "$skill" ]] && INCLUDE_PATHS+=("skills/$(basename "$skill")")
        done

        if [[ ${#INCLUDE_PATHS[@]} -eq 0 ]]; then
            echo -e "${YELLOW}No identity files found to backup${NC}"
            exit 0
        fi

        tar -czf "$BACKUP_FILE" \
            -C "$PAI_DIR" \
            "${INCLUDE_PATHS[@]}"
        ;;
esac

# Calculate size
SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Backup Complete!                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  File: ${GREEN}${BACKUP_FILE}${NC}"
echo -e "  Size: ${GREEN}${SIZE}${NC}"
echo ""

# Show backup contents summary
echo -e "${BLUE}Backup contents:${NC}"
tar -tzf "$BACKUP_FILE" | head -20
TOTAL=$(tar -tzf "$BACKUP_FILE" | wc -l)
if [[ $TOTAL -gt 20 ]]; then
    echo "  ... and $((TOTAL - 20)) more files"
fi

echo ""
echo -e "${YELLOW}Tip: Run '$0 --clean' to remove backups older than ${RETENTION_DAYS} days${NC}"
