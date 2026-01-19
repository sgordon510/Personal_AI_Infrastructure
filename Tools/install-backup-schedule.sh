#!/bin/bash
# =============================================================================
# PAI Backup Schedule Installer
# Sets up weekly automatic backups using cron or systemd
# Usage: ./Tools/install-backup-schedule.sh
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-pai.sh"
BACKUP_DIR="${HOME}/pai-backups"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           PAI Backup Schedule Installer                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check what's available
HAS_CRON=false
HAS_SYSTEMD=false

command -v crontab &>/dev/null && HAS_CRON=true
command -v systemctl &>/dev/null && HAS_SYSTEMD=true

if [[ "$HAS_CRON" == "false" && "$HAS_SYSTEMD" == "false" ]]; then
    echo -e "${RED}ERROR: Neither cron nor systemd found${NC}"
    echo ""
    echo "Manual alternatives:"
    echo "  1. Add to your shell profile (~/.bashrc or ~/.zshrc):"
    echo "     # Run backup on terminal start if last backup > 7 days ago"
    echo "     if [[ ! -f ~/.pai-last-backup ]] || [[ \$(find ~/.pai-last-backup -mtime +7) ]]; then"
    echo "         $BACKUP_SCRIPT --full && touch ~/.pai-last-backup"
    echo "     fi"
    echo ""
    echo "  2. Run manually each week:"
    echo "     $BACKUP_SCRIPT --full"
    exit 1
fi

# Prefer systemd if available (more modern, better logging)
if [[ "$HAS_SYSTEMD" == "true" ]]; then
    echo -e "${BLUE}Installing systemd timers...${NC}"

    SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
    mkdir -p "$SYSTEMD_USER_DIR"

    # Update paths in service files and install
    for file in "$SCRIPT_DIR/systemd"/*.service "$SCRIPT_DIR/systemd"/*.timer; do
        if [[ -f "$file" ]]; then
            BASENAME=$(basename "$file")
            sed "s|/home/user|$HOME|g" "$file" > "$SYSTEMD_USER_DIR/$BASENAME"
            echo -e "  Installed: ${GREEN}$BASENAME${NC}"
        fi
    done

    # Reload and enable
    systemctl --user daemon-reload
    systemctl --user enable pai-backup.timer
    systemctl --user enable pai-cleanup.timer
    systemctl --user start pai-backup.timer
    systemctl --user start pai-cleanup.timer

    echo ""
    echo -e "${GREEN}Systemd timers installed and started!${NC}"
    echo ""
    echo "Schedule:"
    echo -e "  ${BLUE}Weekly backup:${NC}   Sundays at 2:00 AM"
    echo -e "  ${BLUE}Monthly cleanup:${NC} 1st of month at 3:00 AM"
    echo ""
    echo "Commands:"
    echo "  Check timer status:  systemctl --user status pai-backup.timer"
    echo "  Run backup now:      systemctl --user start pai-backup.service"
    echo "  View logs:           journalctl --user -u pai-backup.service"
    echo "  Disable:             systemctl --user disable pai-backup.timer"

elif [[ "$HAS_CRON" == "true" ]]; then
    echo -e "${BLUE}Installing cron jobs...${NC}"

    # Check if already installed
    if crontab -l 2>/dev/null | grep -q "pai-backup"; then
        echo -e "${YELLOW}PAI backup cron jobs already exist. Updating...${NC}"
        # Remove existing PAI backup lines
        crontab -l 2>/dev/null | grep -v "pai-backup\|PAI.*Backup" | crontab -
    fi

    # Add new cron jobs
    (crontab -l 2>/dev/null; cat <<EOF

# =============================================================================
# PAI Automatic Backups
# Installed by: $0
# Date: $(date)
# =============================================================================

# Weekly full backup - Sundays at 2:00 AM
0 2 * * 0 $BACKUP_SCRIPT --full >> $BACKUP_DIR/backup.log 2>&1

# Monthly cleanup - 1st of each month at 3:00 AM
0 3 1 * * $BACKUP_SCRIPT --clean >> $BACKUP_DIR/backup.log 2>&1
EOF
    ) | crontab -

    echo ""
    echo -e "${GREEN}Cron jobs installed!${NC}"
    echo ""
    echo "Schedule:"
    echo -e "  ${BLUE}Weekly backup:${NC}   Sundays at 2:00 AM"
    echo -e "  ${BLUE}Monthly cleanup:${NC} 1st of month at 3:00 AM"
    echo ""
    echo "Commands:"
    echo "  View cron jobs:  crontab -l"
    echo "  View logs:       tail -f $BACKUP_DIR/backup.log"
    echo "  Remove:          crontab -e  (delete PAI lines)"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                Installation Complete!                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Backups will be saved to: $BACKUP_DIR"
echo ""
echo "Run a test backup now:"
echo "  $BACKUP_SCRIPT --full"
