#!/bin/bash
# Production Security Assessment Runner
# Runs complete assessment after data collection

set -e  # Exit on error

# Configuration
ORG_NAME="${1:-Your Organization}"
MONTH=$(date +%Y-%m)
REPORTS_DIR="${2:-$HOME/security-assessments/$MONTH}"
DATA_DIR="${3:-/tmp/assessment-data}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║         Production Security Assessment                            ║"
echo "║         Organization: $(printf '%-43s' "$ORG_NAME")║"
echo "║         Month: $(printf '%-51s' "$MONTH")║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if data directory exists
if [ ! -d "$DATA_DIR" ]; then
    echo -e "${RED}Error: Data directory not found: $DATA_DIR${NC}"
    echo -e "${YELLOW}Expected structure:${NC}"
    echo "  $DATA_DIR/"
    echo "    ├── ad-config.json             (from Export-ADData.ps1)"
    echo "    ├── identity-data.json         (from Export-ADData.ps1)"
    echo "    ├── azure-ad-data.json         (from Export-AzureADData.ps1)"
    echo "    ├── bloodhound/                (from SharpHound.exe)"
    echo "    └── ad_hc_*.xml                (from PingCastle.exe)"
    exit 1
fi

# Create reports directory
mkdir -p "$REPORTS_DIR"
echo -e "${GREEN}✓${NC} Created reports directory: $REPORTS_DIR"
echo

# Check available data sources
echo -e "${CYAN}=== Data Sources Available ===${NC}"
HAS_AD_CONFIG=false
HAS_IDENTITY=false
HAS_AZURE=false
HAS_BLOODHOUND=false
HAS_PINGCASTLE=false

if [ -f "$DATA_DIR/ad-config.json" ]; then
    echo -e "${GREEN}✓${NC} AD Configuration data"
    HAS_AD_CONFIG=true
fi

if [ -f "$DATA_DIR/identity-data.json" ]; then
    echo -e "${GREEN}✓${NC} Identity & Privilege data"
    HAS_IDENTITY=true
fi

if [ -f "$DATA_DIR/azure-ad-data.json" ]; then
    echo -e "${GREEN}✓${NC} Azure AD data"
    HAS_AZURE=true
fi

if [ -d "$DATA_DIR/bloodhound" ] && [ "$(ls -A $DATA_DIR/bloodhound)" ]; then
    echo -e "${GREEN}✓${NC} BloodHound data"
    HAS_BLOODHOUND=true
fi

if compgen -G "$DATA_DIR/ad_hc_*.xml" > /dev/null; then
    echo -e "${GREEN}✓${NC} PingCastle report"
    HAS_PINGCASTLE=true
fi

# Check if we have at least one data source
if [ "$HAS_AD_CONFIG" = false ] && [ "$HAS_IDENTITY" = false ] && [ "$HAS_AZURE" = false ] && [ "$HAS_BLOODHOUND" = false ] && [ "$HAS_PINGCASTLE" = false ]; then
    echo -e "${RED}Error: No assessment data found in $DATA_DIR${NC}"
    exit 1
fi

echo

# Build command arguments
ASSESSMENT_ARGS="--org \"$ORG_NAME\" --output \"$REPORTS_DIR\""

if [ "$HAS_AD_CONFIG" = true ]; then
    ASSESSMENT_ARGS="$ASSESSMENT_ARGS --ad-config \"$DATA_DIR/ad-config.json\""
fi

if [ "$HAS_IDENTITY" = true ]; then
    ASSESSMENT_ARGS="$ASSESSMENT_ARGS --identity \"$DATA_DIR/identity-data.json\""
fi

if [ "$HAS_AZURE" = true ]; then
    ASSESSMENT_ARGS="$ASSESSMENT_ARGS --azure \"$DATA_DIR/azure-ad-data.json\""
fi

if [ "$HAS_BLOODHOUND" = true ]; then
    ASSESSMENT_ARGS="$ASSESSMENT_ARGS --bloodhound \"$DATA_DIR/bloodhound\""
fi

if [ "$HAS_PINGCASTLE" = true ]; then
    PINGCASTLE_FILE=$(ls $DATA_DIR/ad_hc_*.xml | head -1)
    ASSESSMENT_ARGS="$ASSESSMENT_ARGS --pingcastle \"$PINGCASTLE_FILE\""
fi

# Run assessment
echo -e "${CYAN}=== Running Assessment ===${NC}"
cd ~/.claude/skills/ADSecurityAssessment

eval "bun run Tools/RunFullAssessment.ts $ASSESSMENT_ARGS"

ASSESSMENT_EXIT=$?

if [ $ASSESSMENT_EXIT -eq 0 ]; then
    echo
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                  Assessment Complete!                             ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${CYAN}📊 Reports Generated:${NC}"
    echo "  📁 $REPORTS_DIR/"
    ls -lh "$REPORTS_DIR" | tail -n +2 | awk '{printf "     %s  %s\n", $9, $5}'
    echo
    echo -e "${CYAN}🌐 View Executive Dashboard:${NC}"
    echo -e "  ${GREEN}file://$REPORTS_DIR/executive-report.html${NC}"
    echo
    echo -e "${CYAN}🔒 Data Security:${NC}"
    echo -e "  ${YELLOW}Remember to securely delete source data:${NC}"
    echo "     shred -vfz $DATA_DIR/*.json"
    echo "     rm -rf $DATA_DIR/bloodhound"
    echo

    # Optional: Open report in browser
    if command -v xdg-open &> /dev/null; then
        read -p "Open executive report in browser? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            xdg-open "$REPORTS_DIR/executive-report.html"
        fi
    elif command -v open &> /dev/null; then
        read -p "Open executive report in browser? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "$REPORTS_DIR/executive-report.html"
        fi
    fi

else
    echo -e "${RED}Assessment failed with exit code $ASSESSMENT_EXIT${NC}"
    exit $ASSESSMENT_EXIT
fi
