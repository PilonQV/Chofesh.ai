#!/bin/bash

# =============================================================================
# Clean Installation Test Script
# =============================================================================
# This script tests a clean installation of the project to verify
# that all documentation is correct and the setup process works.
# 
# Usage:
#   ./scripts/test-clean-install.sh
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test directory
TEST_DIR="../chofesh-test-install-$(date +%Y%m%d-%H%M%S)"

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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_fail() {
    echo -e "${RED}[✗]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    local all_good=true
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js installed: $NODE_VERSION"
        
        # Check if version is 22+
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -lt 22 ]; then
            print_warning "Node.js version should be 22+, found: $NODE_VERSION"
        fi
    else
        print_fail "Node.js not found"
        all_good=false
    fi
    
    # Check pnpm
    if command -v pnpm &> /dev/null; then
        PNPM_VERSION=$(pnpm --version)
        print_success "pnpm installed: $PNPM_VERSION"
    else
        print_fail "pnpm not found"
        print_info "Install with: npm install -g pnpm"
        all_good=false
    fi
    
    # Check PostgreSQL
    if command -v psql &> /dev/null; then
        PSQL_VERSION=$(psql --version)
        print_success "PostgreSQL installed: $PSQL_VERSION"
    else
        print_warning "PostgreSQL not found (required for database)"
        print_info "Install from: https://www.postgresql.org/download/"
    fi
    
    # Check Git
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        print_success "Git installed: $GIT_VERSION"
    else
        print_fail "Git not found"
        all_good=false
    fi
    
    if [ "$all_good" = false ]; then
        print_error "Missing required prerequisites!"
        exit 1
    fi
    
    echo ""
}

# Function to clone repository
clone_repository() {
    print_step "Cloning repository..."
    
    # Get current repository URL
    REPO_URL=$(git config --get remote.origin.url)
    
    if [ -z "$REPO_URL" ]; then
        print_error "Could not determine repository URL"
        exit 1
    fi
    
    print_info "Repository: $REPO_URL"
    print_info "Test directory: $TEST_DIR"
    
    git clone "$REPO_URL" "$TEST_DIR"
    cd "$TEST_DIR"
    
    print_success "Repository cloned"
    echo ""
}

# Function to setup environment
setup_environment() {
    print_step "Setting up environment..."
    
    # Check if .env.example exists
    if [ ! -f ".env.example" ]; then
        print_fail ".env.example not found!"
        return 1
    fi
    
    print_success ".env.example found"
    
    # Copy to .env
    cp .env.example .env
    print_success "Created .env from template"
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    
    # Update .env with test values
    print_info "Configuring .env with test values..."
    
    # Use sed to update values (works on both Linux and macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chofesh_test|" .env
        sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
        sed -i '' "s|VITE_APP_URL=.*|VITE_APP_URL=http://localhost:3000|" .env
    else
        # Linux
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chofesh_test|" .env
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
        sed -i "s|VITE_APP_URL=.*|VITE_APP_URL=http://localhost:3000|" .env
    fi
    
    print_success "Environment configured"
    
    # Show what needs to be configured manually
    print_warning "Manual configuration required:"
    echo "  - Add at least one AI provider API key (e.g., GROQ_API_KEY)"
    echo "  - Update DATABASE_URL if needed"
    echo ""
    
    read -p "Press Enter to continue after configuring .env..."
    echo ""
}

# Function to install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    
    pnpm install
    
    print_success "Dependencies installed"
    echo ""
}

# Function to setup database
setup_database() {
    print_step "Setting up database..."
    
    # Check if database exists
    DB_NAME="chofesh_test"
    
    if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        print_warning "Database $DB_NAME already exists"
        read -p "Drop and recreate? (yes/no): " confirm
        
        if [ "$confirm" = "yes" ]; then
            dropdb "$DB_NAME" || true
            createdb "$DB_NAME"
            print_success "Database recreated"
        fi
    else
        createdb "$DB_NAME"
        print_success "Database created"
    fi
    
    # Run migrations
    print_info "Running database migrations..."
    pnpm db:push
    
    print_success "Database setup complete"
    echo ""
}

# Function to build project
build_project() {
    print_step "Building project..."
    
    pnpm build
    
    print_success "Build complete"
    echo ""
}

# Function to run tests
run_tests() {
    print_step "Running tests..."
    
    if pnpm test 2>&1 | tee /tmp/test-output.log; then
        print_success "Tests passed"
    else
        print_warning "Some tests failed (this may be expected)"
        print_info "Check /tmp/test-output.log for details"
    fi
    
    echo ""
}

# Function to start development server
start_dev_server() {
    print_step "Starting development server..."
    
    print_info "Server will start on http://localhost:3000"
    print_info "Press Ctrl+C to stop the server"
    print_info ""
    print_info "Test checklist:"
    echo "  [ ] Server starts without errors"
    echo "  [ ] Can access http://localhost:3000"
    echo "  [ ] Can register a new account"
    echo "  [ ] Can login"
    echo "  [ ] Can send a chat message"
    echo "  [ ] No console errors"
    echo "  [ ] Audit logs disabled by default"
    echo "  [ ] Analytics disabled by default"
    echo ""
    
    read -p "Press Enter to start the server..."
    
    pnpm dev
}

# Function to cleanup
cleanup() {
    print_step "Cleaning up..."
    
    cd ..
    
    read -p "Delete test directory? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        rm -rf "$TEST_DIR"
        print_success "Test directory deleted"
    else
        print_info "Test directory preserved at: $TEST_DIR"
    fi
}

# Main script
main() {
    echo "============================================="
    echo "  Clean Installation Test"
    echo "============================================="
    echo ""
    
    print_info "This script will test a clean installation"
    print_info "of the project in a temporary directory."
    echo ""
    
    read -p "Continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "Aborted."
        exit 0
    fi
    
    echo ""
    
    # Run test steps
    check_prerequisites
    clone_repository
    setup_environment
    install_dependencies
    
    # Optional: setup database
    read -p "Setup database? (yes/no): " setup_db
    if [ "$setup_db" = "yes" ]; then
        setup_database
    fi
    
    # Optional: build project
    read -p "Build project? (yes/no): " build
    if [ "$build" = "yes" ]; then
        build_project
    fi
    
    # Optional: run tests
    read -p "Run tests? (yes/no): " test
    if [ "$test" = "yes" ]; then
        run_tests
    fi
    
    # Optional: start dev server
    read -p "Start development server? (yes/no): " start_server
    if [ "$start_server" = "yes" ]; then
        start_dev_server
    fi
    
    echo ""
    print_success "Test complete!"
    echo ""
    
    cleanup
}

# Handle Ctrl+C
trap 'echo ""; print_warning "Interrupted"; cleanup; exit 1' INT

# Run main function
main
