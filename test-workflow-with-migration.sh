#!/bin/bash

# Complete Workflow Test with Database Migration Check
# This script checks if migration is needed and guides you through it

BASE_URL="http://localhost:3000/api/v1"

echo "🔍 Checking if database migration is needed..."
echo ""

# Test if approved_amount column exists by trying to approve a loan
echo "Testing database schema..."

# First, create a test bank and login
BANK_LOGIN=$(curl -s -X POST "$BASE_URL/bank/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@testfinance.com",
    "password": "securePass123"
  }')

BANK_TOKEN=$(echo "$BANK_LOGIN" | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('token', ''))" 2>/dev/null)

if [ -z "$BANK_TOKEN" ]; then
    echo "❌ Cannot get bank token. Please check if server is running."
    exit 1
fi

# Try to approve a loan to check if columns exist
TEST_APPROVE=$(curl -s -X POST "$BASE_URL/bank/loan/approve" \
  -H "Authorization: Bearer $BANK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": "LOAN1001",
    "approved_amount": 140000,
    "interest_rate": 8.0,
    "tenure_seasons": 2
  }')

if echo "$TEST_APPROVE" | grep -q "approved_amount"; then
    echo "⚠️  DATABASE MIGRATION REQUIRED!"
    echo ""
    echo "Please run this SQL in Supabase SQL Editor:"
    echo "================================================"
    cat add_bank_columns_migration.sql
    echo "================================================"
    echo ""
    echo "After running the migration, run this script again:"
    echo "  ./test-workflow-with-migration.sh"
    echo ""
    exit 1
else
    echo "✅ Database schema is up to date!"
    echo ""
    echo "🚀 Running complete workflow test..."
    echo ""
    ./test-complete-workflow.sh
fi
