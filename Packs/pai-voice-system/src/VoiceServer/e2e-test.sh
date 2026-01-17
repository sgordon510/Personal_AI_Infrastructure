#!/bin/bash
# ============================================================================
# ElevenLabs Voice Server - End-to-End Test Script
# ============================================================================
#
# This script tests the voice server endpoints when it's running.
# It requires the server to be started first (bun run server.ts)
#
# Usage:
#   ./e2e-test.sh [port]
#
# Examples:
#   ./e2e-test.sh        # Uses default port 8888
#   ./e2e-test.sh 8889   # Uses custom port
#
# ============================================================================

PORT="${1:-8888}"
BASE_URL="http://localhost:$PORT"
PASSED=0
FAILED=0
TOTAL=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=============================================="
echo "ElevenLabs Voice Server E2E Tests"
echo "=============================================="
echo "Target: $BASE_URL"
echo ""

# Function to run a test
run_test() {
    local name="$1"
    local expected_status="$2"
    local method="$3"
    local endpoint="$4"
    local data="$5"

    TOTAL=$((TOTAL + 1))

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint" 2>/dev/null)
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $name (HTTP $status_code)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $name"
        echo "  Expected: HTTP $expected_status"
        echo "  Got: HTTP $status_code"
        echo "  Body: $body"
        FAILED=$((FAILED + 1))
    fi
}

# Function to check if server is running
check_server() {
    echo "Checking if server is running..."
    curl -s "$BASE_URL/health" > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR${NC}: Server not running on $BASE_URL"
        echo ""
        echo "Please start the server first:"
        echo "  cd $(dirname "$0")"
        echo "  bun run server.ts"
        echo ""
        exit 1
    fi
    echo -e "${GREEN}Server is running${NC}"
    echo ""
}

# Run tests
check_server

echo "--- Health Check Tests ---"
run_test "Health endpoint returns 200" "200" "GET" "/health" ""

echo ""
echo "--- Notification Tests ---"
run_test "Basic notification" "200" "POST" "/notify" '{"message": "Test notification"}'
run_test "Notification with title" "200" "POST" "/notify" '{"title": "Test", "message": "Hello world"}'
run_test "Notification with voice disabled" "200" "POST" "/notify" '{"message": "Silent notification", "voice_enabled": false}'
run_test "Notification with custom voice ID" "200" "POST" "/notify" '{"message": "Custom voice", "voice_id": "21m00Tcm4TlvDq8ikWAM"}'
run_test "Notification with voice settings" "200" "POST" "/notify" '{"message": "With prosody", "voice_settings": {"stability": 0.3, "style": 0.9}}'
run_test "Notification with volume" "200" "POST" "/notify" '{"message": "Quieter", "volume": 0.5}'

echo ""
echo "--- PAI Endpoint Tests ---"
run_test "PAI notification" "200" "POST" "/pai" '{"message": "PAI test message"}'
run_test "PAI with title" "200" "POST" "/pai" '{"title": "PAI", "message": "Task completed"}'

echo ""
echo "--- Validation Tests ---"
run_test "Empty message rejected" "400" "POST" "/notify" '{"message": ""}'
run_test "Whitespace-only message rejected" "400" "POST" "/notify" '{"message": "   "}'

echo ""
echo "--- Root Endpoint ---"
run_test "Root returns info" "200" "GET" "/" ""

echo ""
echo "=============================================="
echo "Results: $PASSED passed, $FAILED failed (of $TOTAL)"
echo "=============================================="

if [ $FAILED -gt 0 ]; then
    exit 1
fi
exit 0
