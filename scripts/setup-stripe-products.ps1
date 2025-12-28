# Stripe Products Setup Script for Bitcoin Investments (PowerShell)
# Run this script from the Bitcoinvestments directory

$ErrorActionPreference = "Stop"
$StripeCLI = "C:\Users\pears\Documents\stripe_1.34.0_windows_x86_64\stripe.exe"
$ENV_FILE = "stripe-env-vars.txt"

Write-Host "`n============================================================================" -ForegroundColor Blue
Write-Host "     Bitcoin Investments - Stripe Products Setup" -ForegroundColor Blue
Write-Host "============================================================================`n" -ForegroundColor Blue

if (-not (Test-Path $StripeCLI)) {
    Write-Host "Error: Stripe CLI not found at $StripeCLI" -ForegroundColor Red
    exit 1
}

# Initialize output file
"# Stripe Environment Variables`n# Generated on $(Get-Date)`n# Copy these to your .env.local and Cloudflare Pages`n" | Out-File $ENV_FILE

Write-Host "`n============================================================================" -ForegroundColor Blue
Write-Host "  SECTION 1: Main Subscription Plans" -ForegroundColor Blue
Write-Host "============================================================================`n" -ForegroundColor Blue
"`n# Main Subscription Plans" | Out-File $ENV_FILE -Append

# Premium Monthly
Write-Host "Creating product: Premium Monthly" -ForegroundColor Yellow
$prod = & $StripeCLI products create --name="Premium Monthly" --description="Premium subscription with ad-free experience, cloud portfolio sync, email price alerts, advanced analytics, premium market insights, and priority support." | ConvertFrom-Json
Write-Host "  Created product: $($prod.id)" -ForegroundColor Green

Write-Host "  Creating monthly price: `$9.99" -ForegroundColor Yellow
$price = & $StripeCLI prices create --product=$($prod.id) --unit-amount=999 --currency=usd --recurring.interval=month | ConvertFrom-Json
Write-Host "    Price ID: $($price.id)" -ForegroundColor Green
"VITE_STRIPE_PRICE_MONTHLY=$($price.id)" | Out-File $ENV_FILE -Append
$PRICE_MONTHLY = $price.id

# Premium Annual
Write-Host "`nCreating product: Premium Annual" -ForegroundColor Yellow
$prod = & $StripeCLI products create --name="Premium Annual" --description="Premium annual subscription. Save 17% compared to monthly. Includes all premium features plus exclusive annual webinars, year-end crypto tax guide, VIP community badge, and personalized portfolio review." | ConvertFrom-Json
Write-Host "  Created product: $($prod.id)" -ForegroundColor Green

Write-Host "  Creating yearly price: `$99.99" -ForegroundColor Yellow
$price = & $StripeCLI prices create --product=$($prod.id) --unit-amount=9999 --currency=usd --recurring.interval=year | ConvertFrom-Json
Write-Host "    Price ID: $($price.id)" -ForegroundColor Green
"VITE_STRIPE_PRICE_ANNUAL=$($price.id)" | Out-File $ENV_FILE -Append
$PRICE_ANNUAL = $price.id

# Lifetime Premium
Write-Host "`nCreating product: Lifetime Premium" -ForegroundColor Yellow
$prod = & $StripeCLI products create --name="Lifetime Premium" --description="One-time payment for lifetime access to ALL premium features. Never pay again. Includes all current and future premium features forever." | ConvertFrom-Json
Write-Host "  Created product: $($prod.id)" -ForegroundColor Green

Write-Host "  Creating one-time price: `$299" -ForegroundColor Yellow
$price = & $StripeCLI prices create --product=$($prod.id) --unit-amount=29900 --currency=usd | ConvertFrom-Json
Write-Host "    Price ID: $($price.id)" -ForegroundColor Green
"VITE_STRIPE_PRICE_LIFETIME=$($price.id)" | Out-File $ENV_FILE -Append
$PRICE_LIFETIME = $price.id

# Advisor Plan
Write-Host "`nCreating product: Advisor Plan" -ForegroundColor Yellow
$prod = & $StripeCLI products create --name="Advisor Plan" --description="For financial advisors and small teams. Up to 10 client portfolios, white-label PDF reports, client dashboard, compliance-ready exports, client email reports, custom branding, and priority phone support." | ConvertFrom-Json
Write-Host "  Created product: $($prod.id)" -ForegroundColor Green

Write-Host "  Creating monthly price: `$49" -ForegroundColor Yellow
$price = & $StripeCLI prices create --product=$($prod.id) --unit-amount=4900 --currency=usd --recurring.interval=month | ConvertFrom-Json
Write-Host "    Price ID: $($price.id)" -ForegroundColor Green
"VITE_STRIPE_PRICE_ADVISOR=$($price.id)" | Out-File $ENV_FILE -Append
$PRICE_ADVISOR = $price.id

# Enterprise Plan
Write-Host "`nCreating product: Enterprise Plan" -ForegroundColor Yellow
$prod = & $StripeCLI products create --name="Enterprise Plan" --description="For wealth managers and institutions. Unlimited client portfolios, multi-user team access, fully custom white-label reports, advanced compliance features, API access, full custom branding, dedicated account manager, and SSO." | ConvertFrom-Json
Write-Host "  Created product: $($prod.id)" -ForegroundColor Green

Write-Host "  Creating monthly price: `$99" -ForegroundColor Yellow
$price = & $StripeCLI prices create --product=$($prod.id) --unit-amount=9900 --currency=usd --recurring.interval=month | ConvertFrom-Json
Write-Host "    Price ID: $($price.id)" -ForegroundColor Green
"VITE_STRIPE_PRICE_ENTERPRISE=$($price.id)" | Out-File $ENV_FILE -Append
$PRICE_ENTERPRISE = $price.id

Write-Host "`n============================================================================" -ForegroundColor Blue
Write-Host "  SECTION 2: Tax Package Plans" -ForegroundColor Blue
Write-Host "============================================================================`n" -ForegroundColor Blue
"`n# Tax Package Plans (One-Time)" | Out-File $ENV_FILE -Append

# Tax Report Basic
Write-Host "Creating product: Tax Report Package - Basic" -ForegroundColor Yellow
$prod = & $StripeCLI products create --name="Tax Report Package - Basic" --description="Crypto tax report generation. Form 8949 generation, capital gains calculation, CSV export for major platforms, and up to 500 transactions." | ConvertFrom-Json
Write-Host "  Created product: $($prod.id)" -ForegroundColor Green

Write-Host "  Creating one-time price: `$29.99" -ForegroundColor Yellow
$price = & $StripeCLI prices create --product=$($prod.id) --unit-amount=2999 --currency=usd | ConvertFrom-Json
Write-Host "    Price ID: $($price.id)" -ForegroundColor Green
"VITE_STRIPE_TAX_PACKAGE_BASIC=$($price.id)" | Out-File $ENV_FILE -Append
$PRICE_TAX_BASIC = $price.id

# Tax Report Premium
Write-Host "`nCreating product: Tax Report Package - Premium" -ForegroundColor Yellow
$prod = & $StripeCLI products create --name="Tax Report Package - Premium" --description="Advanced crypto tax reporting. TurboTax/H&R Block integration, staking rewards breakdown, DeFi transaction categorization, NFT transaction support, audit trail documentation, and email support." | ConvertFrom-Json
Write-Host "  Created product: $($prod.id)" -ForegroundColor Green

Write-Host "  Creating one-time price: `$49.99" -ForegroundColor Yellow
$price = & $StripeCLI prices create --product=$($prod.id) --unit-amount=4999 --currency=usd | ConvertFrom-Json
Write-Host "    Price ID: $($price.id)" -ForegroundColor Green
"VITE_STRIPE_TAX_PACKAGE_PREMIUM=$($price.id)" | Out-File $ENV_FILE -Append
$PRICE_TAX_PREMIUM = $price.id

Write-Host "`n============================================================================" -ForegroundColor Blue
Write-Host "  SECTION 3: Creating Payment Links for Main Products" -ForegroundColor Blue
Write-Host "============================================================================`n" -ForegroundColor Blue
"`n# Payment Links (Optional - for direct purchase URLs)" | Out-File $ENV_FILE -Append

# Create payment links
Write-Host "Creating payment link for Premium Monthly..." -ForegroundColor Yellow
$link = & $StripeCLI payment_links create -d "line_items[0][price]=$PRICE_MONTHLY" -d "line_items[0][quantity]=1" | ConvertFrom-Json
Write-Host "  Link: $($link.url)" -ForegroundColor Green
"VITE_STRIPE_LINK_MONTHLY=$($link.url)" | Out-File $ENV_FILE -Append

Write-Host "`nCreating payment link for Premium Annual..." -ForegroundColor Yellow
$link = & $StripeCLI payment_links create -d "line_items[0][price]=$PRICE_ANNUAL" -d "line_items[0][quantity]=1" | ConvertFrom-Json
Write-Host "  Link: $($link.url)" -ForegroundColor Green
"VITE_STRIPE_LINK_ANNUAL=$($link.url)" | Out-File $ENV_FILE -Append

Write-Host "`nCreating payment link for Lifetime Premium..." -ForegroundColor Yellow
$link = & $StripeCLI payment_links create -d "line_items[0][price]=$PRICE_LIFETIME" -d "line_items[0][quantity]=1" | ConvertFrom-Json
Write-Host "  Link: $($link.url)" -ForegroundColor Green
"VITE_STRIPE_LINK_LIFETIME=$($link.url)" | Out-File $ENV_FILE -Append

Write-Host "`nCreating payment link for Advisor Plan..." -ForegroundColor Yellow
$link = & $StripeCLI payment_links create -d "line_items[0][price]=$PRICE_ADVISOR" -d "line_items[0][quantity]=1" | ConvertFrom-Json
Write-Host "  Link: $($link.url)" -ForegroundColor Green
"VITE_STRIPE_LINK_ADVISOR=$($link.url)" | Out-File $ENV_FILE -Append

Write-Host "`nCreating payment link for Enterprise Plan..." -ForegroundColor Yellow
$link = & $StripeCLI payment_links create -d "line_items[0][price]=$PRICE_ENTERPRISE" -d "line_items[0][quantity]=1" | ConvertFrom-Json
Write-Host "  Link: $($link.url)" -ForegroundColor Green
"VITE_STRIPE_LINK_ENTERPRISE=$($link.url)" | Out-File $ENV_FILE -Append

Write-Host "`nCreating payment link for Tax Basic..." -ForegroundColor Yellow
$link = & $StripeCLI payment_links create -d "line_items[0][price]=$PRICE_TAX_BASIC" -d "line_items[0][quantity]=1" | ConvertFrom-Json
Write-Host "  Link: $($link.url)" -ForegroundColor Green
"VITE_STRIPE_LINK_TAX_BASIC=$($link.url)" | Out-File $ENV_FILE -Append

Write-Host "`nCreating payment link for Tax Premium..." -ForegroundColor Yellow
$link = & $StripeCLI payment_links create -d "line_items[0][price]=$PRICE_TAX_PREMIUM" -d "line_items[0][quantity]=1" | ConvertFrom-Json
Write-Host "  Link: $($link.url)" -ForegroundColor Green
"VITE_STRIPE_LINK_TAX_PREMIUM=$($link.url)" | Out-File $ENV_FILE -Append

Write-Host "`n============================================================================" -ForegroundColor Blue
Write-Host "  SETUP COMPLETE!" -ForegroundColor Green
Write-Host "============================================================================`n" -ForegroundColor Blue

Write-Host "All main products, prices, and payment links have been created!" -ForegroundColor Green
Write-Host "`nEnvironment variables saved to: $ENV_FILE" -ForegroundColor Yellow
Write-Host "`nNext steps:" -ForegroundColor Blue
Write-Host "  1. Copy the contents of $ENV_FILE to your .env.local file"
Write-Host "  2. Add the VITE_* variables to Cloudflare Pages (as Text type)"
Write-Host "  3. Restart your development server"
Write-Host "`nNote: This script created the core products. You can add more feature add-ons later." -ForegroundColor Cyan
Write-Host "`n============================================================================`n" -ForegroundColor Blue

Write-Host "Generated Environment Variables:" -ForegroundColor Yellow
Get-Content $ENV_FILE
