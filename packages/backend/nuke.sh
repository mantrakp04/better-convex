#!/bin/bash

# Nuke script - Clears all Convex tables with progress bar
# Usage: ./nuke.sh [--prod]

# Don't use set -e due to arithmetic expression exit codes

# Colors and formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Static list of components (from convex.config.ts)
COMPONENTS=("betterAuth")

# Parse arguments
export PROD_FLAG=""
if [[ "$1" == "--prod" ]]; then
    PROD_FLAG="--prod"
    echo -e "${RED}${BOLD}⚠️  WARNING: Running in PRODUCTION mode!${NC}"
    read -p "Are you sure you want to nuke production data? (type 'yes' to confirm): " confirm
    if [[ "$confirm" != "yes" ]]; then
        echo -e "${YELLOW}Aborted.${NC}"
        exit 1
    fi
fi

# Function to draw progress bar
draw_progress() {
    local current=$1
    local total=$2
    local width=40
    local percentage=$((current * 100 / total))
    local filled=$((current * width / total))
    local empty=$((width - filled))

    printf "\r${CYAN}["
    printf "%${filled}s" | tr ' ' '█'
    printf "%${empty}s" | tr ' ' '░'
    printf "] ${percentage}%% (${current}/${total})${NC}"
}

# Function to clear a single table (exported for subshells)
clear_table() {
    local table=$1
    local component=$2
    local component_flag=""

    if [[ -n "$component" ]]; then
        component_flag="--component $component"
    fi

    # Create empty file for import
    local tmpfile=$(mktemp)

    # Run import with output suppressed, capture errors
    local output
    if output=$(bunx convex import --table "$table" --replace -y --format jsonLines $component_flag $PROD_FLAG "$tmpfile" 2>&1); then
        rm -f "$tmpfile"
        return 0
    else
        rm -f "$tmpfile"
        echo "$output"
        return 1
    fi
}
export -f clear_table

echo -e "${BOLD}${BLUE}🗑️  Convex Nuke Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Temp directory for all operations
export WORK_DIR=$(mktemp -d)

# Cleanup function (called manually at end, not via trap to avoid subshell issues)
cleanup() {
    rm -rf "$WORK_DIR"
}

# Collect all tables in parallel
echo -e "\n${YELLOW}Collecting tables...${NC}"

# Fetch main tables in background
bunx convex data $PROD_FLAG 2>/dev/null | tail -n +2 > "$WORK_DIR/main" &
MAIN_PID=$!

# Fetch component tables in parallel
declare -A COMPONENT_PIDS
for component in "${COMPONENTS[@]}"; do
    bunx convex data --component "$component" $PROD_FLAG 2>/dev/null | tail -n +2 > "$WORK_DIR/$component" &
    COMPONENT_PIDS[$component]=$!
done

# Wait for all collection to complete
wait $MAIN_PID
for component in "${COMPONENTS[@]}"; do
    wait ${COMPONENT_PIDS[$component]}
done

# Parse results
MAIN_TABLES=()
while IFS= read -r line; do
    [[ -n "$line" ]] && MAIN_TABLES+=("$line")
done < "$WORK_DIR/main"

declare -A COMPONENT_TABLES
for component in "${COMPONENTS[@]}"; do
    tables=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && tables+=("$line")
    done < "$WORK_DIR/$component"
    COMPONENT_TABLES[$component]="${tables[*]}"
done

# Calculate total
TOTAL_MAIN=${#MAIN_TABLES[@]}
TOTAL_COMPONENT=0
for component in "${COMPONENTS[@]}"; do
    read -ra tables <<< "${COMPONENT_TABLES[$component]}"
    TOTAL_COMPONENT=$((TOTAL_COMPONENT + ${#tables[@]}))
done
TOTAL=$((TOTAL_MAIN + TOTAL_COMPONENT))

if [[ $TOTAL -eq 0 ]]; then
    echo -e "${GREEN}No tables to clear.${NC}"
    cleanup
    exit 0
fi

echo -e "${CYAN}Found ${TOTAL_MAIN} main tables, ${TOTAL_COMPONENT} component tables${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Track progress
CURRENT=0
FAILED=()
PIDS=()
TASKS=()

# Function to run clear and track result (exported for subshells)
run_clear() {
    local table=$1
    local component=$2
    local idx=$3

    if clear_table "$table" "$component" > "$WORK_DIR/out_$idx" 2>&1; then
        touch "$WORK_DIR/ok_$idx"
    else
        echo "$table|$component" > "$WORK_DIR/fail_$idx"
        cat "$WORK_DIR/out_$idx" > "$WORK_DIR/err_$idx"
    fi
}
export -f run_clear

# Launch all clears in parallel
idx=0

# Main tables
for table in "${MAIN_TABLES[@]}"; do
    run_clear "$table" "" "$idx" &
    PIDS+=($!)
    TASKS+=("$table")
    ((idx++))
done

# Component tables
for component in "${COMPONENTS[@]}"; do
    read -ra tables <<< "${COMPONENT_TABLES[$component]}"
    for table in "${tables[@]}"; do
        run_clear "$table" "$component" "$idx" &
        PIDS+=($!)
        TASKS+=("$component:$table")
        ((idx++))
    done
done

# Wait and update progress
COMPLETED=0
while [[ $COMPLETED -lt $TOTAL ]]; do
    COMPLETED=0
    for i in "${!PIDS[@]}"; do
        if [[ -f "$WORK_DIR/ok_$i" ]] || [[ -f "$WORK_DIR/fail_$i" ]]; then
            ((COMPLETED++))
        fi
    done
    draw_progress $COMPLETED $TOTAL
    sleep 0.1
done

# Wait for all processes
for pid in "${PIDS[@]}"; do
    wait "$pid" 2>/dev/null || true
done

echo ""

# Check for failures
ERRORS=()
for i in "${!PIDS[@]}"; do
    if [[ -f "$WORK_DIR/fail_$i" ]]; then
        ERRORS+=("${TASKS[$i]}")
        if [[ -f "$WORK_DIR/err_$i" ]]; then
            echo -e "\n${RED}Error clearing ${TASKS[$i]}:${NC}"
            cat "$WORK_DIR/err_$i"
        fi
    fi
done

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cleanup

if [[ ${#ERRORS[@]} -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}✓ Successfully nuked all ${TOTAL} tables${NC}"
else
    echo -e "${RED}${BOLD}✗ Failed to clear ${#ERRORS[@]} tables:${NC}"
    for err in "${ERRORS[@]}"; do
        echo -e "  ${RED}- $err${NC}"
    done
    exit 1
fi
