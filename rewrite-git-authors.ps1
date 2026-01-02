<#
.SYNOPSIS
    Rewrite Git history to change commit authors from Lovable/Claude to a specified author.

.DESCRIPTION
    This script rewrites Git history to replace commits from Lovable GPT Engineer or Claude
    with your own author information. Use with caution as it rewrites Git history!

.PARAMETER NewAuthorName
    The new author name to use (default: from git config)

.PARAMETER NewAuthorEmail
    The new author email to use (default: from git config)

.PARAMETER DryRun
    Show what would be changed without actually modifying history

.PARAMETER Force
    Skip confirmation prompts

.EXAMPLE
    .\rewrite-git-authors.ps1
    # Uses git config user.name and user.email

.EXAMPLE
    .\rewrite-git-authors.ps1 -NewAuthorName "DJ Pearson" -NewAuthorEmail "dj@example.com"

.EXAMPLE
    .\rewrite-git-authors.ps1 -DryRun
    # Preview changes without modifying history

.NOTES
    WARNING: This rewrites Git history! 
    - Always backup your repository first
    - Coordinate with team if repo is shared
    - Will require force push to remote
#>

param(
    [string]$NewAuthorName = "",
    [string]$NewAuthorEmail = "",
    [switch]$DryRun,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Banner
Write-Host ""
Write-ColorOutput "======================================================================" "Cyan"
Write-ColorOutput "        Git Author Rewrite Script" "Cyan"
Write-ColorOutput "        Rewrite Lovable/Claude commits to your authorship" "Cyan"
Write-ColorOutput "======================================================================" "Cyan"
Write-Host ""

# Check if we're in a git repository
$gitRoot = git rev-parse --show-toplevel 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput "Error: Not in a git repository. Please run this script from within a git repo." "Red"
    exit 1
}
Write-ColorOutput "Git repository detected: $gitRoot" "Green"

# Get current author info from git config if not provided
if ([string]::IsNullOrEmpty($NewAuthorName)) {
    $NewAuthorName = git config user.name
    if ([string]::IsNullOrEmpty($NewAuthorName)) {
        Write-ColorOutput "Error: No author name provided and git config user.name is not set" "Red"
        Write-ColorOutput "  Run: git config user.name 'Your Name'" "Yellow"
        exit 1
    }
}

if ([string]::IsNullOrEmpty($NewAuthorEmail)) {
    $NewAuthorEmail = git config user.email
    if ([string]::IsNullOrEmpty($NewAuthorEmail)) {
        Write-ColorOutput "Error: No author email provided and git config user.email is not set" "Red"
        Write-ColorOutput "  Run: git config user.email 'your.email@example.com'" "Yellow"
        exit 1
    }
}

Write-Host ""
Write-ColorOutput "New author information:" "Cyan"
Write-ColorOutput "  Name:  $NewAuthorName" "White"
Write-ColorOutput "  Email: $NewAuthorEmail" "White"
Write-Host ""

# Check for commits that match old authors
Write-ColorOutput "Scanning commit history for Lovable/Claude commits..." "Yellow"
Write-Host ""

$commitsToRewrite = @()
$allCommits = git log --all --format="%H|%an|%ae|%s" --no-merges

foreach ($commit in $allCommits) {
    if ([string]::IsNullOrEmpty($commit)) { continue }
    
    $parts = $commit -split '\|', 4
    if ($parts.Count -lt 4) { continue }
    
    $hash = $parts[0]
    $authorName = $parts[1]
    $authorEmail = $parts[2]
    $subject = $parts[3]
    
    # Check if matches Lovable/Claude patterns
    if ($authorName -match "lovable" -or $authorEmail -match "lovable" -or
        $authorName -match "claude" -or $authorEmail -match "claude" -or
        $authorName -eq "GPT Engineer" -or $authorName -eq "assistant") {
        $commitsToRewrite += @{
            Hash = $hash.Substring(0, 8)
            OldAuthor = "$authorName <$authorEmail>"
            Subject = $subject
        }
    }
}

if ($commitsToRewrite.Count -eq 0) {
    Write-ColorOutput "No Lovable/Claude commits found. Nothing to rewrite!" "Green"
    exit 0
}

Write-ColorOutput "Found $($commitsToRewrite.Count) commit(s) to rewrite:" "Yellow"
Write-Host ""
$commitsToRewrite | Select-Object -First 20 | ForEach-Object {
    Write-ColorOutput "  [$($_.Hash)] $($_.Subject)" "Gray"
    Write-ColorOutput "    Author: $($_.OldAuthor)" "DarkGray"
}

if ($commitsToRewrite.Count -gt 20) {
    Write-ColorOutput "  ... and $($commitsToRewrite.Count - 20) more" "Gray"
}

if ($DryRun) {
    Write-Host ""
    Write-ColorOutput "Dry run complete. No changes made." "Green"
    Write-ColorOutput "  Run without -DryRun to apply changes." "Yellow"
    exit 0
}

# Warning and confirmation
Write-Host ""
Write-ColorOutput "WARNING: This operation will rewrite Git history!" "Red"
Write-ColorOutput "   - Creates new commit hashes for all affected commits" "Yellow"
Write-ColorOutput "   - Requires force push if already pushed to remote" "Yellow"
Write-ColorOutput "   - May cause issues for collaborators" "Yellow"
Write-ColorOutput "   - Cannot be easily undone" "Yellow"
Write-Host ""

if (-not $Force) {
    $confirmation = Read-Host "Do you want to continue? Type 'yes' to proceed"
    if ($confirmation -ne "yes") {
        Write-Host ""
        Write-ColorOutput "Operation cancelled." "Red"
        exit 0
    }
}

# Clean up any leftover refs from previous filter-branch attempts
Write-Host ""
Write-ColorOutput "Cleaning up previous filter-branch refs and backups..." "Cyan"
git for-each-ref refs/original/ | ForEach-Object { 
    $refName = ($_ -split '\s+' | Select-Object -Last 1)
    git update-ref -d $refName 2>&1 | Out-Null
}

# Delete old backup branches
git branch | Select-String "backup-before-author-rewrite" | ForEach-Object { 
    $branchName = $_.ToString().Trim()
    git branch -D $branchName 2>&1 | Out-Null
}

# Create backup branch
$backupBranch = "backup-before-author-rewrite-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host ""
Write-ColorOutput "Creating backup branch: $backupBranch" "Cyan"
git branch $backupBranch
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput "Failed to create backup branch" "Red"
    exit 1
}
Write-ColorOutput "Backup created" "Green"

# Rewrite history
Write-Host ""
Write-ColorOutput "Rewriting commit history..." "Cyan"

$env:FILTER_BRANCH_SQUELCH_WARNING = "1"

# Build the environment filter shell script without PowerShell escaping
$shellScript = 'if [ "$GIT_AUTHOR_EMAIL" = "lovable-dev[bot]@users.noreply.github.com" ] || [ "$GIT_AUTHOR_NAME" = "lovable-dev[bot]" ] || [ "$GIT_AUTHOR_EMAIL" = "lovable-gpt-engineer[bot]@users.noreply.github.com" ] || [ "$GIT_AUTHOR_NAME" = "lovable-gpt-engineer[bot]" ] || echo "$GIT_AUTHOR_EMAIL" | grep -qi "lovable" || echo "$GIT_AUTHOR_NAME" | grep -qi "lovable" || echo "$GIT_AUTHOR_EMAIL" | grep -qi "claude" || echo "$GIT_AUTHOR_NAME" | grep -qi "claude" || [ "$GIT_AUTHOR_NAME" = "GPT Engineer" ] || [ "$GIT_AUTHOR_NAME" = "assistant" ]; then export GIT_AUTHOR_NAME="NEW_AUTHOR_NAME_PLACEHOLDER"; export GIT_AUTHOR_EMAIL="NEW_AUTHOR_EMAIL_PLACEHOLDER"; export GIT_COMMITTER_NAME="NEW_AUTHOR_NAME_PLACEHOLDER"; export GIT_COMMITTER_EMAIL="NEW_AUTHOR_EMAIL_PLACEHOLDER"; fi'

# Replace placeholders
$shellScript = $shellScript.Replace("NEW_AUTHOR_NAME_PLACEHOLDER", $NewAuthorName)
$shellScript = $shellScript.Replace("NEW_AUTHOR_EMAIL_PLACEHOLDER", $NewAuthorEmail)

# Write script to temporary file
$tempScript = Join-Path $env:TEMP "git-rewrite-filter-$(Get-Date -Format 'yyyyMMddHHmmss').sh"
[System.IO.File]::WriteAllText($tempScript, $shellScript, [System.Text.Encoding]::ASCII)

# Convert Windows path to Git Bash path format (C:\path -> /c/path)
$bashPath = $tempScript -replace '\\', '/' -replace '^([A-Z]):', '/$1'
$bashPath = $bashPath.ToLower()

try {
    # Use the temporary file with git filter-branch
    $result = & git filter-branch --env-filter ". `"$bashPath`"" --tag-name-filter cat -- --all 2>&1
    
    # Check if there were actual errors (not just "unchanged" warnings)
    $resultString = ($result | Out-String)
    $hasUnchangedWarning = $resultString -match "Ref .* is unchanged"
    $hasRealError = ($LASTEXITCODE -ne 0) -and -not $hasUnchangedWarning
    
    if ($hasRealError) {
        throw $resultString
    }
    
    if ($hasUnchangedWarning) {
        Write-Host ""
        Write-ColorOutput "No changes needed - commits already have correct authorship!" "Yellow"
        Write-ColorOutput "Note: Remote branches may still show old authors until force pushed." "Gray"
    } else {
        Write-ColorOutput "History rewrite complete!" "Green"
    }
    
} catch {
    Write-Host ""
    Write-ColorOutput "Error during rewrite: $_" "Red"
    Write-ColorOutput "  You can restore from backup branch: $backupBranch" "Yellow"
    exit 1
} finally {
    # Clean up temporary file
    if (Test-Path $tempScript) {
        Remove-Item $tempScript -Force -ErrorAction SilentlyContinue
    }
}

# Clean up refs
Write-Host ""
Write-ColorOutput "Cleaning up..." "Cyan"
git for-each-ref --format="%(refname)" refs/original/ | ForEach-Object {
    git update-ref -d $_
}
git reflog expire --expire=now --all 2>&1 | Out-Null
git gc --prune=now --aggressive 2>&1 | Out-Null

Write-Host ""
Write-ColorOutput "Complete! History has been rewritten." "Green"
Write-Host ""
Write-ColorOutput "Next steps:" "Cyan"
Write-ColorOutput "  1. Review the changes with: git log --all --oneline" "White"
Write-ColorOutput "  2. If satisfied, force push to remote: git push --force --all origin" "White"
Write-ColorOutput "  3. If needed, restore from backup: git reset --hard $backupBranch" "White"
Write-Host ""
Write-ColorOutput "Remember: All collaborators will need to re-clone or reset their repos!" "Yellow"
