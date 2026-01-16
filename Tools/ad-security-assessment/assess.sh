#!/bin/bash

# AD/Azure Security Assessment Launcher
# Simple menu-driven interface for running security assessments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SKILL_DIR="$HOME/.claude/skills/ADSecurityAssessment"
DEFAULT_DATA_DIR="$HOME/assessments/data"
DEFAULT_OUTPUT_DIR="$HOME/assessments/reports"

# Banner
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  AD/Azure Security Assessment - Quick Launcher        ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo ""

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo -e "${RED}✗ Bun runtime not found${NC}"
    echo "Install Bun: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo -e "${GREEN}✓ Bun runtime found${NC}"

# Check if assessment tools exist
if [ ! -f "$SKILL_DIR/Tools/RunFullAssessment.ts" ]; then
    echo -e "${RED}✗ Assessment tools not found at $SKILL_DIR${NC}"
    echo "Ensure ADSecurityAssessment skill is installed"
    exit 1
fi

echo -e "${GREEN}✓ Assessment tools found${NC}"
echo ""

# Get organization name
read -p "Organization name: " ORG_NAME
if [ -z "$ORG_NAME" ]; then
    echo -e "${RED}✗ Organization name required${NC}"
    exit 1
fi

# Get data directory
echo ""
echo "Data directory (default: $DEFAULT_DATA_DIR):"
read -p "> " DATA_DIR
DATA_DIR="${DATA_DIR:-$DEFAULT_DATA_DIR}"

if [ ! -d "$DATA_DIR" ]; then
    echo -e "${YELLOW}⚠ Directory $DATA_DIR does not exist${NC}"
    read -p "Create it? (y/n): " CREATE_DIR
    if [ "$CREATE_DIR" = "y" ]; then
        mkdir -p "$DATA_DIR"
        echo -e "${GREEN}✓ Created $DATA_DIR${NC}"
    else
        echo -e "${RED}✗ Cancelled${NC}"
        exit 1
    fi
fi

# Get output directory
echo ""
OUTPUT_DIR="$DEFAULT_OUTPUT_DIR/$(date +%Y%m%d-%H%M%S)"
echo "Output directory (default: $OUTPUT_DIR):"
read -p "> " CUSTOM_OUTPUT
OUTPUT_DIR="${CUSTOM_OUTPUT:-$OUTPUT_DIR}"

mkdir -p "$OUTPUT_DIR"
echo -e "${GREEN}✓ Output will be saved to $OUTPUT_DIR${NC}"

# Auto-detect available data sources
echo ""
echo -e "${BLUE}Scanning for data sources...${NC}"

declare -a DATA_SOURCES=()
CMD_ARGS="--org \"$ORG_NAME\" --output \"$OUTPUT_DIR\""

# Check for AD config
if [ -f "$DATA_DIR/ad-config.json" ]; then
    echo -e "${GREEN}✓ Found: ad-config.json${NC}"
    DATA_SOURCES+=("AD Configuration")
    CMD_ARGS="$CMD_ARGS --ad-config \"$DATA_DIR/ad-config.json\""
else
    echo -e "${YELLOW}⚠ Not found: ad-config.json${NC}"
fi

# Check for AD identity data
if [ -f "$DATA_DIR/ad-identity.json" ]; then
    echo -e "${GREEN}✓ Found: ad-identity.json${NC}"
    DATA_SOURCES+=("AD Identity")
    CMD_ARGS="$CMD_ARGS --identity \"$DATA_DIR/ad-identity.json\""
else
    echo -e "${YELLOW}⚠ Not found: ad-identity.json${NC}"
fi

# Check for Azure AD data
if [ -f "$DATA_DIR/azure-ad.json" ]; then
    echo -e "${GREEN}✓ Found: azure-ad.json${NC}"
    DATA_SOURCES+=("Azure AD")
    CMD_ARGS="$CMD_ARGS --azure \"$DATA_DIR/azure-ad.json\""
else
    echo -e "${YELLOW}⚠ Not found: azure-ad.json${NC}"
fi

# Check for BloodHound directory
if [ -d "$DATA_DIR/bloodhound" ] && [ "$(ls -A $DATA_DIR/bloodhound/*.json 2>/dev/null)" ]; then
    echo -e "${GREEN}✓ Found: BloodHound data${NC}"
    DATA_SOURCES+=("BloodHound")
    CMD_ARGS="$CMD_ARGS --bloodhound \"$DATA_DIR/bloodhound/\""
else
    echo -e "${YELLOW}⚠ Not found: BloodHound data${NC}"
fi

# Check for PingCastle report
PINGCASTLE_FILE=$(find "$DATA_DIR" -name "ad_hc_*.xml" -o -name "*pingcastle*.xml" | head -n 1)
if [ -n "$PINGCASTLE_FILE" ]; then
    echo -e "${GREEN}✓ Found: PingCastle report ($PINGCASTLE_FILE)${NC}"
    DATA_SOURCES+=("PingCastle")
    CMD_ARGS="$CMD_ARGS --pingcastle \"$PINGCASTLE_FILE\""
else
    echo -e "${YELLOW}⚠ Not found: PingCastle report${NC}"
fi

# Check if any data sources were found
if [ ${#DATA_SOURCES[@]} -eq 0 ]; then
    echo ""
    echo -e "${RED}✗ No data sources found in $DATA_DIR${NC}"
    echo ""
    echo "Expected files:"
    echo "  - ad-config.json (AD configuration)"
    echo "  - ad-identity.json (Users, groups, memberships)"
    echo "  - azure-ad.json (Azure AD data)"
    echo "  - bloodhound/ (BloodHound JSON files)"
    echo "  - ad_hc_*.xml (PingCastle report)"
    echo ""
    echo "Run data collection scripts:"
    echo "  - $SKILL_DIR/Scripts/Export-ADData.ps1"
    echo "  - $SKILL_DIR/Scripts/Export-AzureADData.ps1"
    exit 1
fi

# Confirm and run
echo ""
echo -e "${BLUE}Assessment Configuration:${NC}"
echo "  Organization: $ORG_NAME"
echo "  Data sources: ${DATA_SOURCES[*]}"
echo "  Output: $OUTPUT_DIR"
echo ""

read -p "Run assessment? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo -e "${YELLOW}✗ Cancelled${NC}"
    exit 0
fi

# Run the assessment
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Running Assessment...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

eval "bun run \"$SKILL_DIR/Tools/RunFullAssessment.ts\" $CMD_ARGS"

# Check if successful
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ Assessment Complete!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo ""

    # Check if executive report was generated
    if [ -f "$OUTPUT_DIR/executive-report.html" ]; then
        echo -e "${GREEN}✓ Executive dashboard generated${NC}"
        echo "  Location: $OUTPUT_DIR/executive-report.html"
        echo ""

        # Offer to open in browser
        read -p "Open dashboard in browser? (y/n): " OPEN_BROWSER
        if [ "$OPEN_BROWSER" = "y" ]; then
            if command -v xdg-open &> /dev/null; then
                xdg-open "$OUTPUT_DIR/executive-report.html"
            elif command -v open &> /dev/null; then
                open "$OUTPUT_DIR/executive-report.html"
            else
                echo "Open manually: file://$OUTPUT_DIR/executive-report.html"
            fi
        fi
    fi

    echo ""
    echo "All reports saved to: $OUTPUT_DIR"

else
    echo ""
    echo -e "${RED}════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}✗ Assessment Failed${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Check the error messages above for details"
    exit 1
fi
