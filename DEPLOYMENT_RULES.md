# Deployment Rules for Chofesh.ai

## Critical Rule: ONE Commit Push at a Time

**Problem:** When multiple commits are pushed to GitHub simultaneously, Render may only deploy the latest commit, skipping intermediate commits that contain critical fixes.

**Solution:** ALWAYS push commits to GitHub ONE AT A TIME.

---

## Workflow for `webdev_save_checkpoint`

The `webdev_save_checkpoint` tool automatically handles GitHub sync. However, it must follow this rule:

### ✅ CORRECT: Single Checkpoint Workflow
```bash
# Make changes
# Test changes
webdev_save_checkpoint("Feature A complete")
# Wait for GitHub sync to complete
# Make next changes
# Test next changes  
webdev_save_checkpoint("Feature B complete")
```

### ❌ INCORRECT: Multiple Checkpoints Without Sync
```bash
# Make changes A
webdev_save_checkpoint("Feature A")
# Immediately make changes B
webdev_save_checkpoint("Feature B")  # ← WRONG! Didn't wait for A to sync
# Immediately make changes C
webdev_save_checkpoint("Feature C")  # ← WRONG! B and C will batch push
```

---

## Manual Git Push Workflow

If manually pushing commits:

### ✅ CORRECT
```bash
git push user_github main
# Wait 10-30 seconds for push to complete
# Verify on GitHub web interface
# Then push next commit
git push user_github main
```

### ❌ INCORRECT
```bash
git commit -m "Fix A"
git commit -m "Fix B"
git commit -m "Fix C"
git push user_github main  # ← Pushes all 3 at once!
```

---

## Render Deployment Behavior

**How Render Works:**
1. Watches GitHub repository for new commits
2. When commits are pushed, Render triggers auto-deploy
3. **If multiple commits arrive simultaneously, Render deploys ONLY the latest commit**
4. Intermediate commits are skipped

**Example:**
```
Commits on GitHub: A → B → C → D → E
Render sees: A (deployed) → E (deployed)
Render skips: B, C, D (NEVER DEPLOYED!)
```

**Impact:**
- Critical bug fixes in commits B, C, D are NOT deployed
- Production may be broken even though code is "on GitHub"
- Debugging becomes confusing because local code ≠ deployed code

---

## Verification Checklist

After every `webdev_save_checkpoint`:

1. ✅ Check GitHub web interface
   - Go to https://github.com/serever-coder357/Chofesh.ai/commits/main
   - Verify the commit appears
   - Note the commit hash

2. ✅ Check Render dashboard
   - Go to https://dashboard.render.com
   - Select Chofesh.ai service
   - Verify "Deploy live" shows the correct commit hash
   - Wait for "Deploy succeeded" status

3. ✅ Test production site
   - Visit https://chofesh.ai
   - Test the feature that was just deployed
   - Verify it works as expected

---

## Current Status

**Last Verified Sync:**
- GitHub: `d9424d0` (Security Fix: All 6 Dependabot Vulnerabilities Resolved)
- Includes: `f8f3e67` (Critical Image Upload Bug Fix - Vision Model Selection)

**Missing from GitHub:**
- `164a083` (GitHub Actions Security Audit) - BLOCKED by workflows permission
- `503c427` (Trigger deployment) - Empty commit, not needed
- `ec9a94d` (Latest checkpoint) - Empty commit, not needed

**Render Deployment:**
- Currently deploying: `d9424d0` ✅
- Includes image upload fix: YES ✅
- Status: Working correctly ✅

---

## GitHub Actions Workflow Files

**Special Case:** Commits containing `.github/workflows/*` files require the GitHub App to have `workflows` permission.

**Current Limitation:** Manus GitHub App does NOT have `workflows` permission.

**Workaround:**
1. Create workflow files locally
2. Manually add them via GitHub web interface:
   - Go to repository on GitHub
   - Navigate to `.github/workflows/`
   - Click "Add file" → "Create new file"
   - Paste content
   - Commit directly to main branch

**Files to Add Manually:**
- `.github/workflows/security-audit.yml`
- `.github/workflows/README.md`

---

## Emergency: Force Sync All Commits

If commits are out of sync and Render is deploying the wrong version:

```bash
# 1. Check current status
cd /home/ubuntu/libre-ai
git log --oneline -10
git fetch user_github
git log --oneline user_github/main -10

# 2. Identify missing commits
git log user_github/main..main --oneline

# 3. Push each commit individually
for commit in $(git log user_github/main..main --reverse --format=%H); do
  echo "Pushing $commit..."
  git push user_github $commit:refs/heads/main
  sleep 30  # Wait for Render to start deploying
done
```

---

## Monitoring

**Set up alerts:**
1. GitHub webhook notifications
2. Render deployment notifications
3. Production error monitoring

**Check daily:**
1. GitHub commits match local commits
2. Render is deploying latest commit
3. Production site is working correctly

---

## Contact

**If sync issues occur:**
1. Check this document first
2. Verify GitHub and Render status
3. Contact Sergio with:
   - Commit hash that should be deployed
   - Current deployed commit hash
   - Screenshot of Render dashboard
   - Error messages (if any)

---

**Last Updated:** January 31, 2026  
**Maintained By:** Manus AI (CTO)  
**Project:** Chofesh.ai - LibreAI Platform
