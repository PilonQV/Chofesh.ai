#!/bin/bash

# =============================================================================
# Git History Cleaning Script
# =============================================================================
# This script helps clean sensitive data from git history before open source release
# 
# WARNING: This script rewrites git history. Make a backup first!
# 
# Usage:
#   ./scripts/clean-git-history.sh [option]
# 
# Options:
#   fresh    - Start with a clean history (recommended)
#   bfg      - Use BFG Repo-Cleaner (requires installation)
#   filter   - Use git filter-branch (manual method)
#   backup   - Create a backup of current repository
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to create backup
create_backup() {
    print_info "Creating backup..."
    
    BACKUP_DIR="../chofesh-backup-$(date +%Y%m%d-%H%M%S)"
    
    if [ -d "$BACKUP_DIR" ]; then
        print_error "Backup directory already exists: $BACKUP_DIR"
        exit 1
    fi
    
    cp -r . "$BACKUP_DIR"
    print_info "Backup created at: $BACKUP_DIR"
}

# Function to start fresh (recommended)
start_fresh() {
    print_warning "This will create a new branch with no history!"
    print_warning "The old main branch will be deleted."
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "Aborted."
        exit 0
    fi
    
    print_info "Creating orphan branch..."
    git checkout --orphan clean-main
    
    print_info "Adding all files..."
    git add -A
    
    print_info "Creating initial commit..."
    git commit -m "Initial open source release

- Removed all personal information
- Eliminated hardcoded secrets
- Implemented privacy-first architecture
- Added comprehensive documentation
- Ready for BYOK model

Security audit completed: $(date +%Y-%m-%d)"
    
    print_info "Deleting old main branch..."
    git branch -D main || true
    
    print_info "Renaming clean branch to main..."
    git branch -m main
    
    print_info "Done! To push to remote, run:"
    echo "  git push -f origin main"
    
    print_warning "Remember to update any branch protection rules on GitHub!"
}

# Function to use BFG Repo-Cleaner
use_bfg() {
    print_info "Checking for BFG Repo-Cleaner..."
    
    if ! command -v bfg &> /dev/null; then
        print_error "BFG Repo-Cleaner not found!"
        print_info "Install from: https://rtyley.github.io/bfg-repo-cleaner/"
        exit 1
    fi
    
    print_warning "This will rewrite git history!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "Aborted."
        exit 0
    fi
    
    # Create sensitive patterns file
    print_info "Creating sensitive patterns file..."
    cat > /tmp/sensitive-patterns.txt <<EOF
ghs_6pW6OHMsIWseYHKpHCZDw9XUxqmfRk3tx7YU
checolin357@msn.com
cocovenecas@gmail.com
serever2003@yahoo.com
sssociety33@gmail.com
cus_TkYN9jPHwAwkpx
cus_TifZVSv3Fy9P4F
cus_TiyoqSf76nnONN
EOF
    
    print_info "Running BFG to remove sensitive data..."
    
    # Remove sensitive files
    bfg --delete-files .env
    bfg --delete-folders .manus
    
    # Replace sensitive text
    bfg --replace-text /tmp/sensitive-patterns.txt
    
    print_info "Cleaning up..."
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
    
    print_info "Done! To push to remote, run:"
    echo "  git push --force"
    
    # Clean up
    rm /tmp/sensitive-patterns.txt
}

# Function to use git filter-branch
use_filter_branch() {
    print_warning "This method is slower but doesn't require additional tools."
    print_warning "This will rewrite git history!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "Aborted."
        exit 0
    fi
    
    print_info "Removing sensitive files from history..."
    
    # Remove .env files
    git filter-branch --force --index-filter \
        "git rm --cached --ignore-unmatch .env .env.* .manus/* || true" \
        --prune-empty --tag-name-filter cat -- --all
    
    print_info "Replacing sensitive text patterns..."
    
    # Replace sensitive data
    git filter-branch --force --tree-filter \
        "find . -type f -exec sed -i 's/ghs_6pW6OHMsIWseYHKpHCZDw9XUxqmfRk3tx7YU/REDACTED/g' {} + 2>/dev/null || true" \
        HEAD
    
    git filter-branch --force --tree-filter \
        "find . -type f -exec sed -i 's/checolin357@msn.com/user@example.com/g' {} + 2>/dev/null || true" \
        HEAD
    
    git filter-branch --force --tree-filter \
        "find . -type f -exec sed -i 's/cocovenecas@gmail.com/user@example.com/g' {} + 2>/dev/null || true" \
        HEAD
    
    git filter-branch --force --tree-filter \
        "find . -type f -exec sed -i 's/serever2003@yahoo.com/user@example.com/g' {} + 2>/dev/null || true" \
        HEAD
    
    git filter-branch --force --tree-filter \
        "find . -type f -exec sed -i 's/sssociety33@gmail.com/user@example.com/g' {} + 2>/dev/null || true" \
        HEAD
    
    print_info "Cleaning up..."
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
    
    print_info "Done! To push to remote, run:"
    echo "  git push origin --force --all"
    echo "  git push origin --force --tags"
}

# Main script
main() {
    print_info "Git History Cleaning Script"
    print_info "============================"
    echo ""
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not a git repository!"
        exit 1
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_error "You have uncommitted changes!"
        print_info "Please commit or stash your changes first."
        exit 1
    fi
    
    # Parse command line argument
    case "${1:-}" in
        fresh)
            create_backup
            start_fresh
            ;;
        bfg)
            create_backup
            use_bfg
            ;;
        filter)
            create_backup
            use_filter_branch
            ;;
        backup)
            create_backup
            print_info "Backup complete. No history cleaning performed."
            ;;
        *)
            echo "Usage: $0 [option]"
            echo ""
            echo "Options:"
            echo "  fresh    - Start with a clean history (recommended)"
            echo "  bfg      - Use BFG Repo-Cleaner (requires installation)"
            echo "  filter   - Use git filter-branch (manual method)"
            echo "  backup   - Create a backup only"
            echo ""
            echo "Example:"
            echo "  $0 fresh"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
