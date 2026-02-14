# 🔴 CRITICAL ACTIONS REQUIRED BEFORE OPEN SOURCE RELEASE

## 1. Revoke Exposed GitHub Token (IMMEDIATE)

### Token Details
- **Token**: `ghs_6pW6OHMsIWseYHKpHCZDw9XUxqmfRk3tx7YU`
- **Location**: Was in `.git/config` (now removed from file)
- **Risk**: HIGH - Full repository access
- **Status**: ⚠️ STILL ACTIVE - Must be revoked immediately

### How to Revoke

#### Option A: Via GitHub Web Interface (Recommended)
1. Go to https://github.com/settings/tokens
2. Find the token `ghs_6pW6OHMsIWseYHKpHCZDw9XUxqmfRk3tx7YU`
3. Click "Delete" or "Revoke"
4. Confirm the action

#### Option B: Via GitHub CLI
```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Authenticate
gh auth login

# List tokens (to find the token ID)
gh api /user/tokens

# Revoke the specific token
gh api -X DELETE /user/tokens/{token_id}
```

#### Option C: Via API
```bash
curl -X DELETE \
  -H "Authorization: token YOUR_PERSONAL_ACCESS_TOKEN" \
  https://api.github.com/applications/{client_id}/token \
  -d '{"access_token":"ghs_6pW6OHMsIWseYHKpHCZDw9XUxqmfRk3tx7YU"}'
```

### After Revocation

1. Generate a new token if needed:
   - Go to https://github.com/settings/tokens/new
   - Select appropriate scopes
   - Save securely (use password manager)

2. Update local git configuration:
   ```bash
   # Use SSH instead (recommended)
   git remote set-url origin git@github.com:serever-coder357/Chofesh.ai.git
   
   # Or use HTTPS with credential helper
   git config --global credential.helper store
   ```

---

## 2. Clean Git History (Recommended)

### Why Clean History?

The git history may contain:
- Previous commits with the exposed token
- Old `.env` files with secrets
- Personal data from `.manus/` directory
- Database credentials
- Other sensitive information

### Option A: Start Fresh (Recommended for Open Source)

```bash
# Create a new orphan branch (no history)
git checkout --orphan clean-main

# Add all current files
git add -A

# Create initial commit
git commit -m "Initial open source release

- Removed all personal information
- Eliminated hardcoded secrets
- Implemented privacy-first architecture
- Added comprehensive documentation
- Ready for BYOK model"

# Delete old main branch
git branch -D main

# Rename clean branch to main
git branch -m main

# Force push to remote (WARNING: This rewrites history)
git push -f origin main
```

### Option B: Use BFG Repo-Cleaner

```bash
# Install BFG Repo-Cleaner
# https://rtyley.github.io/bfg-repo-cleaner/

# Clone a fresh copy
git clone --mirror https://github.com/serever-coder357/Chofesh.ai.git

# Remove sensitive files
bfg --delete-files .env Chofesh.ai.git
bfg --delete-folders .manus Chofesh.ai.git

# Remove sensitive text patterns
echo "ghs_6pW6OHMsIWseYHKpHCZDw9XUxqmfRk3tx7YU" > passwords.txt
echo "checolin357@msn.com" >> passwords.txt
echo "cocovenecas@gmail.com" >> passwords.txt
echo "serever2003@yahoo.com" >> passwords.txt
echo "sssociety33@gmail.com" >> passwords.txt
bfg --replace-text passwords.txt Chofesh.ai.git

# Clean up
cd Chofesh.ai.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Push cleaned history
git push
```

### Option C: Filter-Branch (Manual)

```bash
# Remove specific files from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env .manus/*" \
  --prune-empty --tag-name-filter cat -- --all

# Remove sensitive data patterns
git filter-branch --force --tree-filter \
  "find . -type f -exec sed -i 's/ghs_6pW6OHMsIWseYHKpHCZDw9XUxqmfRk3tx7YU/REDACTED/g' {} +" \
  HEAD

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
git push origin --force --tags
```

---

## 3. Test Clean Installation

### Prerequisites
- Node.js 22+
- pnpm 9+
- PostgreSQL 14+

### Test Steps

```bash
# 1. Clone the repository (simulate new user)
git clone https://github.com/serever-coder357/Chofesh.ai.git test-install
cd test-install

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env with minimal required variables
# Required:
# - DATABASE_URL=postgresql://user:pass@localhost:5432/chofesh_test
# - JWT_SECRET=$(openssl rand -base64 32)
# - GROQ_API_KEY=your_groq_key_here

# 4. Install dependencies
pnpm install

# 5. Set up database
pnpm db:push

# 6. Start development server
pnpm dev

# 7. Test in browser
# - Open http://localhost:3000
# - Register a new account
# - Test chat functionality
# - Test image generation (if configured)
# - Verify no errors in console

# 8. Verify privacy settings
# - Check that audit logs are disabled
# - Check that analytics are disabled
# - Verify local storage is used
# - Test BYOK functionality

# 9. Clean up
cd ..
rm -rf test-install
```

### Checklist

- [ ] Clean installation works
- [ ] All required env vars documented
- [ ] Optional features work when configured
- [ ] No errors in console
- [ ] Audit logs disabled by default
- [ ] Analytics disabled by default
- [ ] BYOK functionality works
- [ ] Documentation is clear

---

## 4. Update Domain/Branding References

### Current State

The codebase still contains references to:
- `chofesh.ai` domain
- `@chofeshai` social media
- Specific branding elements

### Decision Required

**Option A: Keep Current Branding**
- If open sourcing under the same name
- Keep all references as-is
- Update contact emails to real addresses

**Option B: Rebrand/Generalize**
- Replace specific branding
- Use generic placeholders
- Allow users to customize

### If Rebranding

```bash
# Find all references
grep -r "chofesh\.ai" --include="*.ts" --include="*.tsx" --include="*.md"
grep -r "@chofeshai" --include="*.ts" --include="*.tsx" --include="*.md"

# Replace domain references
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.md" \) \
  -exec sed -i 's/chofesh\.ai/your-domain.com/g' {} +

# Replace social media
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.md" \) \
  -exec sed -i 's/@chofeshai/@your-handle/g' {} +

# Update email addresses
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.md" \) \
  -exec sed -i 's/support@chofesh\.ai/support@your-domain.com/g' {} +
```

### Files to Review

1. **Client-side**
   - `client/public/manifest.json`
   - `client/public/robots.txt`
   - `client/public/sitemap.xml`
   - `client/src/pages/*.tsx`

2. **Server-side**
   - `server/_core/seoConfig.ts` (already updated)
   - `server/_core/resend.ts` (already updated)
   - `server/_core/seo-content.ts`

3. **Documentation**
   - `README.md`
   - `CONTRIBUTING.md`
   - `SECURITY.md`
   - `ROADMAP.md`

4. **Assets**
   - Logo files
   - Favicon
   - Social media images

---

## 5. Legal Review

### Considerations

1. **License**
   - Current: MIT License
   - Verify it's appropriate for your use case
   - Ensure all dependencies are compatible

2. **Trademarks**
   - Check if "Chofesh" is trademarked
   - Verify you have rights to use the name
   - Consider trademark registration

3. **Third-Party Code**
   - Review all dependencies
   - Ensure proper attribution
   - Check license compatibility

4. **Privacy Policy**
   - Update for BYOK model
   - Clarify data handling
   - GDPR compliance

5. **Terms of Service**
   - Update for open source
   - Clarify liability
   - User responsibilities

### Legal Checklist

- [ ] License file present and correct
- [ ] All dependencies have compatible licenses
- [ ] Proper attribution for third-party code
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Trademark considerations addressed
- [ ] Export compliance (if applicable)
- [ ] GDPR compliance verified

### Recommended Actions

1. **Consult a Lawyer**
   - Especially for commercial use
   - Review license terms
   - Verify compliance

2. **Update Legal Documents**
   - Privacy policy
   - Terms of service
   - Cookie policy (if applicable)

3. **Add Disclaimers**
   - No warranty
   - Use at own risk
   - Liability limitations

---

## 6. Pre-Release Checklist

### Security

- [ ] GitHub token revoked
- [ ] Git history cleaned (if needed)
- [ ] No secrets in codebase
- [ ] No personal information
- [ ] Security scan passed (`npm audit`)
- [ ] Dependencies updated

### Documentation

- [ ] README.md complete
- [ ] CONTRIBUTING.md clear
- [ ] SECURITY.md present
- [ ] .env.example comprehensive
- [ ] API documentation (if applicable)
- [ ] Deployment guide

### Testing

- [ ] Clean installation tested
- [ ] All features work
- [ ] No console errors
- [ ] Privacy settings verified
- [ ] BYOK functionality tested
- [ ] Cross-browser testing

### Legal

- [ ] License file present
- [ ] Legal review completed
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Trademark considerations

### Branding

- [ ] Domain references updated
- [ ] Contact emails updated
- [ ] Social media links updated
- [ ] Logo/branding finalized

---

## 7. Release Process

### 1. Create Release Branch

```bash
git checkout -b release/v1.0.0
```

### 2. Update Version

```bash
# Update package.json
npm version 1.0.0

# Update CHANGELOG.md
echo "## [1.0.0] - $(date +%Y-%m-%d)" >> CHANGELOG.md
echo "### Added" >> CHANGELOG.md
echo "- Initial open source release" >> CHANGELOG.md
```

### 3. Final Testing

```bash
# Run all tests
pnpm test

# Build production
pnpm build

# Test production build
pnpm start
```

### 4. Create GitHub Release

```bash
# Tag the release
git tag -a v1.0.0 -m "Initial open source release"

# Push tag
git push origin v1.0.0

# Create release on GitHub
# Go to https://github.com/serever-coder357/Chofesh.ai/releases/new
# - Tag: v1.0.0
# - Title: "v1.0.0 - Initial Open Source Release"
# - Description: See CHANGELOG.md
# - Attach build artifacts (if applicable)
```

### 5. Announce

- [ ] GitHub Discussions
- [ ] Social media
- [ ] Developer communities
- [ ] Product Hunt (if applicable)
- [ ] Hacker News (if applicable)

---

## 8. Post-Release

### Monitoring

- [ ] Watch for security issues
- [ ] Monitor GitHub issues
- [ ] Respond to community feedback
- [ ] Track usage/adoption

### Maintenance

- [ ] Regular security updates
- [ ] Dependency updates
- [ ] Bug fixes
- [ ] Feature requests

### Community

- [ ] Respond to issues promptly
- [ ] Review pull requests
- [ ] Update documentation
- [ ] Engage with users

---

## Timeline

### Immediate (Today)
1. ✅ Revoke GitHub token
2. ✅ Clean git history
3. ✅ Test clean installation

### Short-term (This Week)
4. ✅ Update branding references
5. ✅ Legal review
6. ✅ Final testing

### Release (Next Week)
7. ✅ Create release
8. ✅ Announce
9. ✅ Monitor

---

## Contact

For questions or assistance:
- **Security**: security@example.com
- **General**: support@example.com
- **GitHub**: https://github.com/serever-coder357/Chofesh.ai/issues

---

**Last Updated**: 2026-02-14  
**Status**: Awaiting critical actions before release
