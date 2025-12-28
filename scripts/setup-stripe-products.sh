#!/bin/bash

# ============================================================================
# Stripe Products Setup Script for Bitcoin Investments
# ============================================================================
# This script creates all products, prices, and payment links in Stripe
#
# Prerequisites:
#   1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
#   2. Login to Stripe CLI: stripe login
#   3. Make this script executable: chmod +x setup-stripe-products.sh
#   4. Run: ./setup-stripe-products.sh
#
# The script will output all environment variables to copy to your .env file
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Output file for environment variables
ENV_OUTPUT_FILE="stripe-env-vars.txt"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}     Bitcoin Investments - Stripe Products Setup${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo -e "${RED}Error: Stripe CLI is not installed.${NC}"
    echo "Install it from: https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Check if logged in to Stripe
if ! stripe config --list &> /dev/null; then
    echo -e "${YELLOW}You may need to login to Stripe CLI first.${NC}"
    echo "Run: stripe login"
fi

# Initialize output file
echo "# Stripe Environment Variables" > "$ENV_OUTPUT_FILE"
echo "# Generated on $(date)" >> "$ENV_OUTPUT_FILE"
echo "# Copy these to your .env.local and Cloudflare Pages environment variables" >> "$ENV_OUTPUT_FILE"
echo "" >> "$ENV_OUTPUT_FILE"

# Function to create a product and return its ID
create_product() {
    local name="$1"
    local description="$2"

    echo -e "${YELLOW}Creating product: ${name}${NC}"

    local product_id=$(stripe products create \
        --name="$name" \
        --description="$description" \
        --format=json | jq -r '.id')

    echo -e "${GREEN}  âœ“ Created product: ${product_id}${NC}"
    echo "$product_id"
}

# Function to create a recurring price
create_recurring_price() {
    local product_id="$1"
    local amount="$2"  # in cents
    local interval="$3"  # month or year
    local env_var="$4"

    echo -e "${YELLOW}  Creating ${interval}ly price: \$$(echo "scale=2; $amount/100" | bc)${NC}"

    local price_id=$(stripe prices create \
        --product="$product_id" \
        --unit-amount="$amount" \
        --currency=usd \
        --recurring[interval]="$interval" \
        --format=json | jq -r '.id')

    echo -e "${GREEN}    âœ“ Price ID: ${price_id}${NC}"
    echo "${env_var}=${price_id}" >> "$ENV_OUTPUT_FILE"
    echo "$price_id"
}

# Function to create a one-time price
create_onetime_price() {
    local product_id="$1"
    local amount="$2"  # in cents
    local env_var="$3"

    echo -e "${YELLOW}  Creating one-time price: \$$(echo "scale=2; $amount/100" | bc)${NC}"

    local price_id=$(stripe prices create \
        --product="$product_id" \
        --unit-amount="$amount" \
        --currency=usd \
        --format=json | jq -r '.id')

    echo -e "${GREEN}    âœ“ Price ID: ${price_id}${NC}"
    echo "${env_var}=${price_id}" >> "$ENV_OUTPUT_FILE"
    echo "$price_id"
}

# Function to create a payment link
create_payment_link() {
    local price_id="$1"
    local env_var="$2"

    echo -e "${YELLOW}  Creating payment link...${NC}"

    local payment_link=$(stripe payment_links create \
        --line-items[0][price]="$price_id" \
        --line-items[0][quantity]=1 \
        --format=json | jq -r '.url')

    echo -e "${GREEN}    âœ“ Payment Link: ${payment_link}${NC}"
    echo "${env_var}=${payment_link}" >> "$ENV_OUTPUT_FILE"
    echo "$payment_link"
}

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}  SECTION 1: Main Subscription Plans${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo "# Main Subscription Plans" >> "$ENV_OUTPUT_FILE"

# Premium Monthly - $9.99/month
PRODUCT_PREMIUM=$(create_product \
    "Premium Monthly" \
    "Premium subscription with ad-free experience, cloud portfolio sync, email price alerts, advanced analytics, premium market insights, and priority support.")
PRICE_MONTHLY=$(create_recurring_price "$PRODUCT_PREMIUM" 999 "month" "VITE_STRIPE_PRICE_MONTHLY")

# Premium Annual - $99.99/year
PRODUCT_ANNUAL=$(create_product \
    "Premium Annual" \
    "Premium annual subscription. Save 17% compared to monthly. Includes all premium features plus exclusive annual webinars, year-end crypto tax guide, VIP community badge, and personalized portfolio review.")
PRICE_ANNUAL=$(create_recurring_price "$PRODUCT_ANNUAL" 9999 "year" "VITE_STRIPE_PRICE_ANNUAL")

# Lifetime Premium - $299 one-time
PRODUCT_LIFETIME=$(create_product \
    "Lifetime Premium" \
    "One-time payment for lifetime access to ALL premium features. Never pay again. Includes all current and future premium features forever.")
PRICE_LIFETIME=$(create_onetime_price "$PRODUCT_LIFETIME" 29900 "VITE_STRIPE_PRICE_LIFETIME")

# Advisor Plan - $49/month
PRODUCT_ADVISOR=$(create_product \
    "Advisor Plan" \
    "For financial advisors and small teams. Up to 10 client portfolios, white-label PDF reports, client dashboard, compliance-ready exports, client email reports, custom branding, and priority phone support.")
PRICE_ADVISOR=$(create_recurring_price "$PRODUCT_ADVISOR" 4900 "month" "VITE_STRIPE_PRICE_ADVISOR")

# Enterprise Plan - $99/month
PRODUCT_ENTERPRISE=$(create_product \
    "Enterprise Plan" \
    "For wealth managers and institutions. Unlimited client portfolios, multi-user team access, fully custom white-label reports, advanced compliance features, API access, full custom branding, dedicated account manager, and SSO.")
PRICE_ENTERPRISE=$(create_recurring_price "$PRODUCT_ENTERPRISE" 9900 "month" "VITE_STRIPE_PRICE_ENTERPRISE")

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}  SECTION 2: Tax Package Plans (One-Time)${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo "" >> "$ENV_OUTPUT_FILE"
echo "# Tax Package Plans (One-Time)" >> "$ENV_OUTPUT_FILE"

# Tax Report Basic - $29.99
PRODUCT_TAX_BASIC=$(create_product \
    "Tax Report Package - Basic" \
    "Crypto tax report generation. Form 8949 generation, capital gains calculation, CSV export for major platforms, and up to 500 transactions.")
PRICE_TAX_BASIC=$(create_onetime_price "$PRODUCT_TAX_BASIC" 2999 "VITE_STRIPE_TAX_PACKAGE_BASIC")

# Tax Report Premium - $49.99
PRODUCT_TAX_PREMIUM=$(create_product \
    "Tax Report Package - Premium" \
    "Advanced crypto tax reporting. TurboTax/H&R Block integration, staking rewards breakdown, DeFi transaction categorization, NFT transaction support, audit trail documentation, and email support.")
PRICE_TAX_PREMIUM=$(create_onetime_price "$PRODUCT_TAX_PREMIUM" 4999 "VITE_STRIPE_TAX_PACKAGE_PREMIUM")

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}  SECTION 3: API Developer Tiers${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo "" >> "$ENV_OUTPUT_FILE"
echo "# API Developer Tiers" >> "$ENV_OUTPUT_FILE"

# API Starter - $19.99/month, $199.99/year
PRODUCT_API_STARTER=$(create_product \
    "API Starter Plan" \
    "Developer API access - Starter tier. 10,000 API calls/month, basic endpoints, standard rate limits.")
PRICE_API_STARTER_MONTHLY=$(create_recurring_price "$PRODUCT_API_STARTER" 1999 "month" "VITE_STRIPE_API_STARTER_MONTHLY")
PRICE_API_STARTER_YEARLY=$(create_recurring_price "$PRODUCT_API_STARTER" 19999 "year" "VITE_STRIPE_API_STARTER_YEARLY")

# API Professional - $49.99/month, $499.99/year
PRODUCT_API_PRO=$(create_product \
    "API Professional Plan" \
    "Developer API access - Professional tier. 100,000 API calls/month, all endpoints, priority rate limits, webhook support.")
PRICE_API_PRO_MONTHLY=$(create_recurring_price "$PRODUCT_API_PRO" 4999 "month" "VITE_STRIPE_API_PROFESSIONAL_MONTHLY")
PRICE_API_PRO_YEARLY=$(create_recurring_price "$PRODUCT_API_PRO" 49999 "year" "VITE_STRIPE_API_PROFESSIONAL_YEARLY")

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}  SECTION 4: Feature Add-Ons${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo "" >> "$ENV_OUTPUT_FILE"
echo "# Feature Add-Ons" >> "$ENV_OUTPUT_FILE"

# Hardware Wallet Integration - $14.99/month, $149.99/year
PRODUCT_HW=$(create_product \
    "Hardware Wallet Integration" \
    "Track cold storage assets across Ledger, Trezor, and other hardware wallets. Connect up to 5 devices, track 50 addresses per wallet, multi-chain support.")
PRICE_HW_MONTHLY=$(create_recurring_price "$PRODUCT_HW" 1499 "month" "VITE_STRIPE_HARDWARE_WALLET_MONTHLY")
PRICE_HW_YEARLY=$(create_recurring_price "$PRODUCT_HW" 14999 "year" "VITE_STRIPE_HARDWARE_WALLET_YEARLY")

# Gas Optimizer - $4.99/month, $49.99/year
PRODUCT_GAS=$(create_product \
    "Gas Fee Optimizer" \
    "Predict optimal times for Ethereum transactions. Real-time gas price updates, AI-powered price predictions, optimal timing recommendations, 50 price alerts.")
PRICE_GAS_MONTHLY=$(create_recurring_price "$PRODUCT_GAS" 499 "month" "VITE_STRIPE_GAS_OPTIMIZER_MONTHLY")
PRICE_GAS_YEARLY=$(create_recurring_price "$PRODUCT_GAS" 4999 "year" "VITE_STRIPE_GAS_OPTIMIZER_YEARLY")

# DeFi Yield Aggregator - $19.99/month, $199.99/year
PRODUCT_DEFI=$(create_product \
    "DeFi Yield Aggregator" \
    "Compare yield farming opportunities across DeFi protocols. All pools across all chains, real-time APY tracking, portfolio position tracking, yield alerts.")
PRICE_DEFI_MONTHLY=$(create_recurring_price "$PRODUCT_DEFI" 1999 "month" "VITE_STRIPE_DEFI_YIELD_MONTHLY")
PRICE_DEFI_YEARLY=$(create_recurring_price "$PRODUCT_DEFI" 19999 "year" "VITE_STRIPE_DEFI_YIELD_YEARLY")

# Retirement Calculator - $99/year
PRODUCT_RETIREMENT=$(create_product \
    "Crypto Retirement Calculator" \
    "Model crypto allocation in retirement portfolio. Monte Carlo simulations, unlimited scenarios, advanced crypto modeling, tax optimization strategies, Roth conversion analysis.")
PRICE_RETIREMENT_YEARLY=$(create_recurring_price "$PRODUCT_RETIREMENT" 9900 "year" "VITE_STRIPE_RETIREMENT_YEARLY")

# Influencer Transparency - $2.99/month, $29.99/year
PRODUCT_INFLUENCER_TRANS=$(create_product \
    "Influencer Transparency Access" \
    "See verified performance data for crypto influencers. View verified win rates and returns, compare claimed vs actual performance, access accuracy scores and trust ratings.")
PRICE_INFLUENCER_TRANS_MONTHLY=$(create_recurring_price "$PRODUCT_INFLUENCER_TRANS" 299 "month" "VITE_STRIPE_INFLUENCER_TRANSPARENCY_MONTHLY")
PRICE_INFLUENCER_TRANS_YEARLY=$(create_recurring_price "$PRODUCT_INFLUENCER_TRANS" 2999 "year" "VITE_STRIPE_INFLUENCER_TRANSPARENCY_YEARLY")

# Influencer Badge - $49/month
PRODUCT_INFLUENCER_BADGE=$(create_product \
    "Verified Influencer Badge" \
    "Get verified status and prove your track record. Verified badge on profile, increased visibility in search, trust score display, wallet verification support.")
PRICE_INFLUENCER_BADGE=$(create_recurring_price "$PRODUCT_INFLUENCER_BADGE" 4900 "month" "VITE_STRIPE_INFLUENCER_BADGE")

# NFT Portfolio - $14.99/month, $149.99/year
PRODUCT_NFT=$(create_product \
    "NFT Portfolio Premium" \
    "Advanced NFT tracking with floor price monitoring and rarity analytics. Track unlimited NFT holdings, real-time floor price monitoring, rarity analytics, multi-wallet support.")
PRICE_NFT_MONTHLY=$(create_recurring_price "$PRODUCT_NFT" 1499 "month" "VITE_STRIPE_NFT_PORTFOLIO_MONTHLY")
PRICE_NFT_YEARLY=$(create_recurring_price "$PRODUCT_NFT" 14999 "year" "VITE_STRIPE_NFT_PORTFOLIO_YEARLY")

# Copy Trading - $9.99/month
PRODUCT_COPY_TRADING=$(create_product \
    "Copy Trading Subscription" \
    "Copy successful trader portfolios automatically. Auto-copy portfolio allocations, proportional or fixed amount copying, real-time trade mirroring, performance tracking.")
PRICE_COPY_TRADING=$(create_recurring_price "$PRODUCT_COPY_TRADING" 999 "month" "VITE_STRIPE_COPY_TRADING")

# On-Chain Analytics Pro - $29.99/month, $299.99/year
PRODUCT_ONCHAIN=$(create_product \
    "On-Chain Analytics Pro" \
    "Full access to all on-chain metrics and alerts. All 20+ metrics, exchange flows analysis, miner metrics, valuation indicators (NVT, MVRV, SOPR), 365 days historical.")
PRICE_ONCHAIN_MONTHLY=$(create_recurring_price "$PRODUCT_ONCHAIN" 2999 "month" "VITE_STRIPE_ONCHAIN_PRO_MONTHLY")
PRICE_ONCHAIN_YEARLY=$(create_recurring_price "$PRODUCT_ONCHAIN" 29999 "year" "VITE_STRIPE_ONCHAIN_PRO_YEARLY")

# Multi-Exchange Portfolio - $14.99/month, $149.99/year
PRODUCT_MULTI_EXCHANGE=$(create_product \
    "Multi-Exchange Portfolio Sync" \
    "Auto-sync portfolios across Coinbase, Binance, Kraken, and more via API. Connect unlimited exchanges, automatic portfolio sync, real-time balance updates, consolidated tax reports.")
PRICE_MULTI_EXCHANGE_MONTHLY=$(create_recurring_price "$PRODUCT_MULTI_EXCHANGE" 1499 "month" "VITE_STRIPE_MULTI_EXCHANGE_MONTHLY")
PRICE_MULTI_EXCHANGE_YEARLY=$(create_recurring_price "$PRODUCT_MULTI_EXCHANGE" 14999 "year" "VITE_STRIPE_MULTI_EXCHANGE_YEARLY")

# Staking Calculator - $9.99/month, $99.99/year
PRODUCT_STAKING=$(create_product \
    "Staking Rewards Calculator" \
    "Calculate and optimize staking rewards across multiple platforms. All staking platforms, APY optimization, auto-compound projections, risk-adjusted recommendations.")
PRICE_STAKING_MONTHLY=$(create_recurring_price "$PRODUCT_STAKING" 999 "month" "VITE_STRIPE_STAKING_CALC_MONTHLY")
PRICE_STAKING_YEARLY=$(create_recurring_price "$PRODUCT_STAKING" 9999 "year" "VITE_STRIPE_STAKING_CALC_YEARLY")

# Trading Indicators - $12.99/month, $129.99/year
PRODUCT_TRADING=$(create_product \
    "Custom Trading Indicators" \
    "Premium charting with RSI, MACD, Bollinger Bands, and custom indicator creation. All technical indicators, custom indicator creation, trading signals, multi-timeframe analysis.")
PRICE_TRADING_MONTHLY=$(create_recurring_price "$PRODUCT_TRADING" 1299 "month" "VITE_STRIPE_TRADING_INDICATORS_MONTHLY")
PRICE_TRADING_YEARLY=$(create_recurring_price "$PRODUCT_TRADING" 12999 "year" "VITE_STRIPE_TRADING_INDICATORS_YEARLY")

# Whale Tracking - $19.99/month, $199.99/year
PRODUCT_WHALE=$(create_product \
    "Whale Wallet Tracking" \
    "Track and get alerts on major wallet movements. Real-time whale alerts, track unlimited wallets, custom wallet watchlists, exchange flow analysis, sentiment scoring.")
PRICE_WHALE_MONTHLY=$(create_recurring_price "$PRODUCT_WHALE" 1999 "month" "VITE_STRIPE_WHALE_TRACKING_MONTHLY")
PRICE_WHALE_YEARLY=$(create_recurring_price "$PRODUCT_WHALE" 19999 "year" "VITE_STRIPE_WHALE_TRACKING_YEARLY")

# Portfolio Rebalancing - $9.99/month, $99.99/year
PRODUCT_REBALANCE=$(create_product \
    "Portfolio Rebalancing Alerts" \
    "AI-powered alerts when portfolio drifts from target allocation. Real-time drift alerts, unlimited portfolios, AI-powered recommendations, tax-loss harvesting suggestions.")
PRICE_REBALANCE_MONTHLY=$(create_recurring_price "$PRODUCT_REBALANCE" 999 "month" "VITE_STRIPE_REBALANCING_MONTHLY")
PRICE_REBALANCE_YEARLY=$(create_recurring_price "$PRODUCT_REBALANCE" 9999 "year" "VITE_STRIPE_REBALANCING_YEARLY")

# DCA Basic - $9.99/month
PRODUCT_DCA_BASIC=$(create_product \
    "DCA Automation - Basic" \
    "Automate dollar-cost averaging purchases. 1 automated DCA schedule, daily/weekly/monthly frequency, email notifications, basic analytics.")
PRICE_DCA_BASIC=$(create_recurring_price "$PRODUCT_DCA_BASIC" 999 "month" "VITE_STRIPE_DCA_BASIC_MONTHLY")

# DCA Premium - $19.99/month
PRODUCT_DCA_PREMIUM=$(create_product \
    "DCA Automation - Premium" \
    "Advanced DCA automation. Unlimited DCA schedules, smart timing optimization, multi-asset portfolio DCA, lower fees (0.5%), priority execution, API access.")
PRICE_DCA_PREMIUM=$(create_recurring_price "$PRODUCT_DCA_PREMIUM" 1999 "month" "VITE_STRIPE_DCA_PREMIUM_MONTHLY")

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}  SECTION 5: Creating Payment Links${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo "" >> "$ENV_OUTPUT_FILE"
echo "# Payment Links (Optional - for direct purchase URLs)" >> "$ENV_OUTPUT_FILE"

# Create payment links for main products
create_payment_link "$PRICE_MONTHLY" "VITE_STRIPE_LINK_MONTHLY"
create_payment_link "$PRICE_ANNUAL" "VITE_STRIPE_LINK_ANNUAL"
create_payment_link "$PRICE_LIFETIME" "VITE_STRIPE_LINK_LIFETIME"
create_payment_link "$PRICE_ADVISOR" "VITE_STRIPE_LINK_ADVISOR"
create_payment_link "$PRICE_ENTERPRISE" "VITE_STRIPE_LINK_ENTERPRISE"
create_payment_link "$PRICE_TAX_BASIC" "VITE_STRIPE_LINK_TAX_BASIC"
create_payment_link "$PRICE_TAX_PREMIUM" "VITE_STRIPE_LINK_TAX_PREMIUM"

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${GREEN}  âœ… SETUP COMPLETE!${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "${GREEN}All products, prices, and payment links have been created successfully!${NC}"
echo ""
echo -e "${YELLOW}Environment variables have been saved to: ${ENV_OUTPUT_FILE}${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Copy the contents of ${ENV_OUTPUT_FILE} to your .env.local file"
echo "  2. Add the VITE_* variables to Cloudflare Pages (as Text type)"
echo "  3. Restart your development server"
echo ""
echo -e "${BLUE}============================================================================${NC}"

# Display the generated environment variables
echo ""
echo -e "${YELLOW}Generated Environment Variables:${NC}"
echo ""
cat "$ENV_OUTPUT_FILE"
